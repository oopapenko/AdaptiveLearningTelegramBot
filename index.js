const TelegramApi = require('node-telegram-bot-api');
const token = "2051581549:AAH-mTaHNXwjnJFL8PbHdhbK81smk3yt8xk";
const bot = new TelegramApi(token, {polling: true});
const {setDataToDb, getDataFetch, getAllUsersData,setCoursesDataToDb,getAllCourses,getTest,getLectures,getTopicsLength,
getLecture, getTopicAndLectureName, getCourseName} = require('./DataAccessLogic/dataBaseHandler');
const {varkOptions, timeIntervalOptions, eduTypes, commands, eduTypesPoll} = require('./Data/options');
const {generateCourses} = require('./BusinessLogic/generateCallbacks');
// const {courseStructure} = require('./Data/courses');
// setCoursesDataToDb(courseStructure);
const schedule = require('node-schedule');
const {getLectureType} = require('./BusinessLogic/questionChanseCalc');
//const courses = require('./Data/courses');
var coursesData;
// const {calculateTime} = require('./BusinessLogic/timeCalculation');

const lectureButton = {reply_markup: {
    inline_keyboard: [
        [{
            text: 'Отримати лекцію',
            callback_data: 'nextLecture'
        }]
    ]
}}; 
const testButton = {reply_markup: {
    inline_keyboard: [
        [{
            text: 'Почати тестування',
            callback_data: 'begintest'
        }]
    ]
}}; 
//new schedule.scheduleJob({rule: `0 0 ${time} * * *` }, async function ()
//new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, async function ()
const sendTime = async (time, userId, text)=> {    
    new schedule.scheduleJob({rule: `0 0 ${time} * * 1-5` }, async function (){
        var localUserData = await getDataFetch(userId);
        await bot.sendMessage(localUserData.chatId, text, lectureButton);
    });
};
const debugSendTime = async (time, msg, text)=> {
    new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, async function () {
        const userId = msg.from.id;
        var localUserData = await getDataFetch(userId);
        await bot.sendMessage(localUserData.chatId, text, lectureButton);
    });
};

const  createTasks = async() => {
    var usersData = await getAllUsersData();
    if(usersData!=null&&usersData!=undefined){
        Object.values(usersData).forEach(user => {
            if(user.studyTime === undefined){
               bot.sendMessage(user.chatId, 'Оберіть проміжок отрмання інформації', timeIntervalOptions);
            }
            else{
                let text =`Вам надійшла нова лекція`;
                sendTime(user.studyTime.preferedInterval, user.userId, text);
            }        
        });
    }    
};

createTasks();

const start = async () => {
    bot.setMyCommands(commands);
    bot.on('message', async msg=>{

        var text = msg.text;
        const chatId = msg.chat.id;
        const userId = msg.from.id;        
        var localUserData = await getDataFetch(userId);        
        if(localUserData == undefined || localUserData == null){
            text='/start';
        }
        if(localUserData != null&&localUserData.userName== undefined){
            localUserData.userName = text;
            setDataToDb(userId, localUserData);
            coursesData = await getAllCourses();
            await bot.sendMessage(chatId, "Ваше ім'я та прізвище встановлене");
            await bot.sendMessage(chatId, "Тепер оберіть ваш курс",generateCourses(coursesData));
            return 0;
        }
        if(text === '/start'){
            await bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
            if(localUserData == undefined || localUserData == null){
                const pattern = {
                    chatId: chatId,
                    userId: userId,
                    eduType: [],
                    studyTime:{
                        firstEncounter:"",
                        recentActivities: [],
                        preferedInterval: "",
                    },
                    currentStage: {
                        currentCourse:"",
                        topic:1,
                        lecture:1,
                    },
                    loginTime: [],
                    testsMarks:[],
                    language_code: 'ua',
                    
                };            
                setDataToDb(userId, pattern);
                localUserData = pattern; 
                await bot.sendMessage(chatId,"Тепер введіть ваше ПІБ");
                return 0;
            }
            else 
                return 0;
        }

        if(text === '/info'){  
            if(localUserData !== undefined){
                let stage = await getTopicAndLectureName(localUserData.currentStage.currentCourse,localUserData.currentStage.topic,localUserData.currentStage.lecture);
                let types = [];
                localUserData.eduType.forEach(element => {
                    types.push(eduTypes[element]);
                });
                return bot.sendMessage(chatId, `
                Ім'я користувача: ${localUserData.userName} \n\nОбрані типи сприймання інформації: ${types} \n\nВи будете отримувати повідомлення о ${localUserData.studyTime.preferedInterval}:00 \n\nПоточний курс: ${await getCourseName(localUserData.currentStage.currentCourse)} \n\nПоточна тема : ${stage.topicName} \n\nПоточна лекція: ${stage.lectureName} \n\n`
                );
            }
            return bot.sendMessage(chatId,`Ми про вас нічого не знаємо, пройдіть реєстрацію (/start)`);
        }

        if(text === '/edutype'){
                localUserData.eduType = [];
                setDataToDb(localUserData.userId, localUserData);
                return bot.sendPoll(localUserData.chatId, 
                    eduTypesPoll.question,
                    eduTypesPoll.arrayOptions,
                    eduTypesPoll.opts);
        }

        if(text === '/taskinterval'){
            return bot.sendMessage(chatId, 'Оберіть проміжок отрмання інформації', timeIntervalOptions);
        } 

        return bot.sendMessage(chatId, "Я вас не розумію");
    });

    bot.on('poll_answer', async poll=>{
        
        let localUserData = await getDataFetch(poll.user.id);
        // await bot.stopPoll(localUserData.chatId, localUserData.lastPoolId);
        let testPath = await getTest(localUserData.currentStage.currentCourse,localUserData.currentStage.topic,localUserData.currentStage.lecture); 
        if(localUserData.eduType==undefined){   //edu type set
            localUserData.eduType=[];
            poll.option_ids.forEach(element => {
                localUserData.eduType.push(Object.keys(eduTypes)[element]);
            });
            setDataToDb(localUserData.userId, localUserData);
            await bot.sendMessage(localUserData.chatId, "Тип сприйняття інформації успішно змінено");
            if(localUserData.studyTime.preferedInterval==""){
                return bot.sendMessage(localUserData.chatId, 'Ви вперше почали використовувати нашого чат-бота, тому потрібно також обрати бажаний час отримання навчального матеріалу.', timeIntervalOptions);
            }            
            return 0;
        }
        let grade = 0;
        let sum = 0;
        let testLastItem = localUserData.testsMarks.length-1;

        if(localUserData.testsMarks[testLastItem].testAnswers==undefined)
            localUserData.testsMarks[testLastItem].testAnswers = [];
        
        let index=localUserData.testsMarks[testLastItem].testAnswers.length;
        var testAnswer=
        {
            answerId:`${testPath[index].questionIndex}`,
            answerOptions:[poll.option_ids],
            endTime: Date.now(),
            questionMark:0,
        };

        poll.option_ids.forEach(element => {
            sum += testPath[index].fractions[element];
        });
         
        let result = ((sum/100) * +(testPath[index].defaultgrade));
        if(result > -testPath[index].penalty){
            testAnswer.questionMark += +result;
        }
        else{
            testAnswer.questionMark -= +(testPath[index].penalty);
        }
                    
        localUserData.testsMarks[testLastItem].testAnswers.push(testAnswer); 

        if(++index < testPath.length){ 
            bot.deleteMessage(localUserData.chatId,localUserData.lastPoolId);
            var message = await bot.sendPoll(localUserData.chatId,
                testPath[index].question,
                testPath[index].arrayOptions,
                testPath[index].opts);
            localUserData.lastPoolId = message.message_id;
            setDataToDb(localUserData.userId, localUserData);
            return 0;
        }
        bot.deleteMessage(localUserData.chatId,localUserData.lastPoolId);
        let buffer = eduTypes;
        let asArray = Object.entries(buffer);
        let filtered = asArray.filter(([key, value]) => key  !== `${localUserData.currentLectureType}`);
        let lectureTypesOptions = {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: `${filtered[0][1]}`,
                        callback_data: `lecture_${filtered[0][0]}`
                    }],
                    [{
                        text: `${filtered[1][1]}`,
                        callback_data: `lecture_${filtered[1][0]}`
                    }],
                    [{
                        text: `${filtered[2][1]}`,
                        callback_data: `lecture_${filtered[2][0]}`
                    }]
            ]
            }
        };
        testPath.forEach(element => {
            grade += +(element.defaultgrade);
        });
        
        sum =0;
        localUserData.testsMarks[testLastItem].testAnswers.forEach(element =>{
            sum += element.questionMark;
        });
        await bot.sendMessage(localUserData.chatId, `Кількість вірних відповідей: ${(sum).toFixed(2)} з ${grade.toFixed(0)}`);        
        
        localUserData.testsMarks[testLastItem].mark=sum.toFixed(2);
        localUserData.testsMarks[localUserData.testsMarks.length-1].testEnd = Date.now();
        localUserData.testsMarks[testLastItem].grade = grade;
        localUserData.testsMarks[testLastItem].lectureType=localUserData.currentLectureType;        
        
        if(sum <= (grade/2)){  
            setDataToDb(localUserData.userId, localUserData);  
            return bot.sendMessage(localUserData.chatId, `Спробуйте лекційний матеріал іншого типу сприйняття інформації`, lectureTypesOptions);
        }

        if(localUserData.currentStage.lecture < await getLectures(localUserData.currentStage.currentCourse,localUserData.currentStage.topic).length){
            localUserData.currentStage.lecture++;
        }
        else if(localUserData.currentStage.topic < await getTopicsLength(localUserData.currentStage.currentCourse)){
            localUserData.currentStage.topic++;
            localUserData.currentStage.lecture=1;
        }
        setDataToDb(localUserData.userId, localUserData);        
        return 0;
    });
    bot.on('callback_query', async msg =>{
        let data = msg.data;
        const userId = msg.from.id;      
        const chatId =msg.message.chat.id;
        var localUserData = await getDataFetch(userId);
        coursesData = await getAllCourses();
        let currentLecturePath = await getLecture(localUserData.currentStage.currentCourse,localUserData.currentStage.topic,localUserData.currentStage.lecture);

        let testPath = await getTest(localUserData.currentStage.currentCourse,localUserData.currentStage.topic,localUserData.currentStage.lecture);
        if(data === 'begintest'){
            if(localUserData.testsMarks==undefined)
                localUserData.testsMarks = [];
            if(localUserData.testsMarks.lenght>0 && localUserData.testsMarks[localUserData.testsMarks.length-1].testEnd === undefined ){
                return bot.sendMessage(chatId,"Спочатку пройдіть відкритий тест");
            }
            let testName = await getTopicAndLectureName(localUserData.currentStage.currentCourse,localUserData.currentStage.topic,localUserData.currentStage.lecture);
            localUserData.testsMarks.push(
                {
                    testId: localUserData.testsMarks.length,
                    testStart: Date.now(),
                    testEnd:null,
                    testAnswers:[],
                    mark:"",
                    lectureType:"",
                    lectureName:testName.lectureName,
                    topicName:testName.topicName,
                }
            );
            bot.editMessageReplyMarkup(
                {inline_keyboard: []},
                {
                    chat_id: chatId, 
                    message_id: msg.message.message_id
                }
            );
            var message = await bot.sendPoll(chatId,
                testPath[0].question,
                testPath[0].arrayOptions,
                testPath[0].opts);
            localUserData.lastPoolId = message.message_id;
            setDataToDb(localUserData.userId, localUserData);
            return 0;
        }

        if(data === 'lecture_visual'){
            localUserData.currentLectureType = "visual";
            setDataToDb(localUserData.userId, localUserData) ;
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `1Прочитайте лекцію -> ${currentLecturePath.types.visual}`, testButton);
        }

        if(data === 'lecture_audio'){
            localUserData.currentLectureType = "audio";
            setDataToDb(localUserData.userId, localUserData);
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `2Прочитайте лекцію -> ${currentLecturePath.types.audio}`, testButton);
        }

        if(data === 'lecture_verbal'){
            localUserData.currentLectureType = "verbal";
            setDataToDb(localUserData.userId, localUserData) ;
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `3Прочитайте лекцію -> ${currentLecturePath.types.verbal}`, testButton);
        }

        if(data === 'lecture_video'){
            localUserData.currentLectureType = "video";
            setDataToDb(localUserData.userId, localUserData); 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `4Прочитайте лекцію -> ${currentLecturePath.types.video}`, testButton);
        }
        
        if(data === '8-10'){
            localUserData.studyTime.preferedInterval=8;       
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});     
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            sendTime(localUserData.studyInterval, msg, text);
            return bot.sendMessage(localUserData.chatId,"Часовий проміжок успішно встановлено");
        }
        if(data === '10-12'){         
            localUserData.studyTime.preferedInterval=10;
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {}); 
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            sendTime(localUserData.studyInterval, msg, text);
            return bot.sendMessage(localUserData.chatId,"Часовий проміжок успішно встановлено");
        }
        if(data === '12-14'){         
            localUserData.studyTime.preferedInterval=12;
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {}); 
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            sendTime(localUserData.studyInterval, msg, text);
            return bot.sendMessage(localUserData.chatId,"Часовий проміжок успішно встановлено");
        }
        if(data === '14-16'){
            localUserData.studyTime.preferedInterval=14;
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {}); 
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            sendTime(localUserData.studyInterval, msg, text);
            return bot.sendMessage(localUserData.chatId,"Часовий проміжок успішно встановлено");
        }
        if(data === '16-18'){         
            localUserData.studyTime.preferedInterval=16;
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {}); 
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            sendTime(localUserData.studyInterval, msg, text);
            return bot.sendMessage(localUserData.chatId,"Часовий проміжок успішно встановлено");
        }
        if(data === '18-20'){
            localUserData.studyTime.preferedInterval=18;
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {}); 
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            sendTime(localUserData.studyInterval, msg, text);
            return bot.sendMessage(localUserData.chatId,"Часовий проміжок успішно встановлено");
        }        
        if(data === 'debug'){
            await bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {}); 
            setDataToDb(userId, localUserData);
            text =`Вам надійшла нова лекція`;
            debugSendTime(1/60, msg, text);
        }
        if(data === 'nextLecture'){
            const lectureType=`${getLectureType(localUserData)}`;
            const lecturePath = currentLecturePath.types[`${lectureType}`];
            text =`Прочитайте лекцію -> ${lecturePath}`;
            localUserData.currentLectureType = lectureType;
            setDataToDb(userId, localUserData);
            bot.sendMessage(chatId, text,testButton);
            return bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
        }
        data = data.split("_");
        if(data[0] === 'course'){
            coursesData = await getAllCourses();
            localUserData.currentStage.currentCourse=data[1];
            setDataToDb(userId, localUserData);
            bot.sendMessage(chatId, `Ви вибрали курс: ${coursesData[data[1]].name}`);
            if(localUserData.eduType == undefined || localUserData.eduType == null || localUserData.eduType.length==0){
                await bot.sendMessage(chatId, 'Необхідно пройти тест на тип сприймання інформації');
                await bot.sendMessage(chatId, 'Натисніть на посилання та пройдіть тест -> https://vark-learn.com/опросник-vark-опросник-по-стратегиям-обу/');
                localUserData.eduType = [];
                setDataToDb(localUserData.userId, localUserData);
                return bot.sendPoll(localUserData.chatId, 
                    eduTypesPoll.question,
                    eduTypesPoll.arrayOptions,
                    eduTypesPoll.opts);
            }
            else
                return 0;
        }
    });
};

start();