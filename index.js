const TelegramApi = require('node-telegram-bot-api');
const token = "2051581549:AAH-mTaHNXwjnJFL8PbHdhbK81smk3yt8xk";
const bot = new TelegramApi(token, {polling: true});
const {setDataToDb, getDataFetch, getAllUsersData} = require('./DataAccessLogic/dataBaseHandler');
const {varkOptions, timeIntervalOptions, eduTypes, commands, eduTypesPoll} = require('./Data/options');
const {courseStructure} = require('./Data/courses');
const schedule = require('node-schedule');
const {getLectureType} = require('./BusinessLogic/questionChanseCalc');

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
    
    Object.values(usersData).forEach(user => {
        if(user.studyTime === undefined){
           bot.sendMessage(user.chatId, 'Оберіть проміжок отрмання інформації', timeIntervalOptions);
        }
        else{
            let text =`Вам надійшла нова лекція`;
            sendTime(user.studyTime.preferedInterval, user.userId, text);
        }        
    });
};

createTasks();


const start = () => {
    bot.setMyCommands(commands);

    bot.on('message', async msg=>{

        var text = msg.text;
        const chatId = msg.chat.id;
        const userId = msg.from.id;        
        var localUserData = await getDataFetch(userId);
        if(localUserData == undefined || localUserData == null){
            text='/start';
        }
        if(text === '/start'){
            
            if(localUserData == undefined || localUserData == null){
                const pattern = {
                    userName: msg.from.username,
                    chatId: chatId,
                    userId: userId,
                    eduType: [],
                    studyTime:{
                        firstEncounter:"",
                        recentActivities: [],
                        preferedInterval: "",
                    },
                    currentStage: {
                        topic:1,
                        lecture:1,
                    },
                    loginTime: [],
                    testsMarks:[],
                    language_code: 'ua',
                    
                };
                await setDataToDb(userId, pattern);
                localUserData = pattern;
                await bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
                if(localUserData.eduType == undefined || localUserData.eduType == null || localUserData.eduType.length==0){
                    await bot.sendMessage(chatId, 'Спочатку необхідно пройти тест на тип сприймання інформації');
                    await bot.sendMessage(chatId, 'Натисніть на посилання та пройдіть тест -> https://vark-learn.com/опросник-vark-опросник-по-стратегиям-обу/');
                    text = '/edutype';
                }
            }
            return bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
        }

        if(text === '/info'){  
            if(localUserData !== undefined){
                bot.sendMessage(chatId, `Ви будете отримувати повідомлення о ${localUserData.studyInterval}`);
                // bot.sendMessage(chatId, `Кількість пройдених тестів ${localUserData.testsMarks.length}, кількість отриманих балів ${(localUserData.testsMarks[0].mark).toFixed(2)}`)
                return bot.sendMessage(chatId, `Обрані типи сприймання інформації: ${localUserData.eduType}`);          
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
        let testPath = courseStructure.Math[`Topic_${localUserData.currentStage.topic}`][`Lecture_${localUserData.currentStage.lecture}`].Test; 
        if(localUserData.eduType==undefined){   //edu type set
            localUserData.eduType=[];
            poll.option_ids.forEach(element => {
                localUserData.eduType.push(Object.keys(eduTypes)[element]);
            });            
            setDataToDb(localUserData.userId, localUserData);
            bot.sendMessage(localUserData.chatId, "Тип сприйняття інформації успішно змінено");
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
        bot.sendMessage(localUserData.chatId, `Кількість вірних відповідей: ${(sum).toFixed(2)} з ${grade.toFixed(0)}`);
        
        
        localUserData.testsMarks[testLastItem].mark=sum.toFixed(2);
        localUserData.testsMarks[localUserData.testsMarks.length-1].testEnd = Date.now();
        localUserData.testsMarks[testLastItem].grade = grade;
        localUserData.testsMarks[testLastItem].lectureType=localUserData.currentLectureType;
        
        
        if(sum <= (grade/2)){
            

            setDataToDb(localUserData.userId, localUserData);  
            return bot.sendMessage(localUserData.chatId, `Спробуйте лекційний матеріал іншого типу сприйняття інформації`, lectureTypesOptions);
        }

        if(localUserData.currentStage.lecture < Object.keys(courseStructure.Math[`Topic_${localUserData.currentStage.topic}`]).length){
            localUserData.currentStage.lecture++;
        }
        else if(localUserData.currentStage.topic < Object.keys(courseStructure.Math).length){
            localUserData.currentStage.topic++;
            localUserData.currentStage.lecture=1;
        }
        setDataToDb(localUserData.userId, localUserData);        
        return 0;
    });
    bot.on('callback_query', async msg =>{
        const data = msg.data;
        const userId = msg.from.id;      
        const chatId =msg.message.chat.id;
        var localUserData = await getDataFetch(userId);
        
        let currentLecturePath = courseStructure.Math[`Topic_${localUserData.currentStage.topic}`][`Lecture_${localUserData.currentStage.lecture}`];    
        let testPath = courseStructure.Math[`Topic_${localUserData.currentStage.topic}`][`Lecture_${localUserData.currentStage.lecture}`].Test;
        if(data === 'begintest'){
            if(localUserData.testsMarks==undefined)
                localUserData.testsMarks = [];
            if(localUserData.testsMarks[localUserData.testsMarks.length-1].testEnd === undefined ){
                return bot.sendMessage(chatId,"Спочатку пройдіть відкритий тест");
            }
            localUserData.testsMarks.push(
                {
                    testId: localUserData.testsMarks.length,
                    testStart: Date.now(),
                    testEnd:null,
                    testAnswers:[],
                    mark:"",
                    lectureType:""
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
            return bot.sendMessage(chatId, `1Прочитайте лекцію -> ${currentLecturePath.visual}`, testButton);
        }

        if(data === 'lecture_audio'){
            localUserData.currentLectureType = "audio";
            setDataToDb(localUserData.userId, localUserData);
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `2Прочитайте лекцію -> ${currentLecturePath.audio}`, testButton);
        }

        if(data === 'lecture_verbal'){
            localUserData.currentLectureType = "verbal";
            setDataToDb(localUserData.userId, localUserData) ;
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `3Прочитайте лекцію -> ${currentLecturePath.verbal}`, testButton);
        }

        if(data === 'lecture_video'){
            localUserData.currentLectureType = "video";
            setDataToDb(localUserData.userId, localUserData); 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            return bot.sendMessage(chatId, `4Прочитайте лекцію -> ${currentLecturePath.video}`, testButton);
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
    
        if(data === 'nextLecture'){
            
            const lectureType=`${getLectureType(localUserData)}`;
            
            const lecturePath = currentLecturePath[`${lectureType}`];
            // const text = 'Повідолення буде відправлене через 1сек!'
            // await sendTime((1/60), msg, text);
            // console.log(localUserData[chatId].timeInterval);
            // const messageId = msg.message.message_id;
            // return bot.deleteMessage(chatId, messageId, form = {});
            
            text =`Прочитайте лекцію -> ${lecturePath}`;
            localUserData.currentLectureType = lectureType;
            setDataToDb(userId, localUserData);
            bot.sendMessage(chatId, text,testButton);
            
            return bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {});
            
        }
    });
};

start();