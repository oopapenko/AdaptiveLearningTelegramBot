const TelegramApi = require('node-telegram-bot-api');
const token = "2051581549:AAH-mTaHNXwjnJFL8PbHdhbK81smk3yt8xk";
const bot = new TelegramApi(token, {polling: true});
const {setDataToDb, getDataFetch} = require('./DataAccessLogic/dataBaseHandler')
const {varkOptions, timeIntervalOptions, eduTypes, commands, eduTypesPoll} = require('./Data/options');
const {courseStructure} = require('./Data/courses');
const schedule = require('node-schedule');
const {getLectureType} = require('./BusinessLogic/questionChanseCalc')

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
const sendTime = async (time, msg, text)=> {
    new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, async function () {
        const userId = msg.from.id;
        var localUserData = await getDataFetch(userId)   

        await bot.sendMessage(localUserData.chatId, text, lectureButton);
    });
}

const start = () => {
    
    bot.setMyCommands(commands)

    bot.on('message', async msg=>{

        var text = msg.text;
        const chatId = msg.chat.id;
        const userId = msg.from.id;        
        var localUserData = await getDataFetch(userId)
        if(localUserData == undefined || localUserData == null){
            text==='/start';
        }
        if(text === '/start'){
            
            if(localUserData == undefined || localUserData == null){
                const pattern = {
                    userName: msg.from.username,
                    chatId: chatId,
                    userId: userId,
                    eduType: [],
                    studyInterval: "",
                    currentStage: {
                        topic:1,
                        lecture:1,
                    },
                    loginTime: [],
                    testsMarks:[],
                    language_code: 'ua',   
                    
                }
                await setDataToDb(userId, pattern)
                localUserData = pattern
                await bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
                if(localUserData.eduType == undefined || localUserData.eduType == null || localUserData.eduType.length==0){
                    await bot.sendMessage(chatId, 'Спочатку необхідно пройти тест на тип сприймання інформації');
                    await bot.sendMessage(chatId, 'Натисніть на посилання та пройдіть тест -> https://vark-learn.com/опросник-vark-опросник-по-стратегиям-обу/')
                    text = '/edutype'
                }
            }
            bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
        }

        if(text === '/info'){  
            if(localUserData !== undefined){
                bot.sendMessage(chatId, `Ви будете отримувати повідомлення о ${localUserData.studyInterval}`)
                // bot.sendMessage(chatId, `Кількість пройдених тестів ${localUserData.testsMarks.length}, кількість отриманих балів ${(localUserData.testsMarks[0].mark).toFixed(2)}`)
                return bot.sendMessage(chatId, `Обрані типи сприймання інформації: ${localUserData.eduType}`)             
            }
            return bot.sendMessage(chatId,`Ми про вас нічого не знаємо, пройдіть реєстрацію (/start)`)
        }


        if(text === '/edutype'){
                localUserData.eduType = [];
                setDataToDb(localUserData.userId, localUserData)
                return bot.sendPoll(localUserData.chatId, 
                    eduTypesPoll.question,
                    eduTypesPoll.arrayOptions,
                    eduTypesPoll.opts)
        }

        if(text === '/taskinterval'){
            return bot.sendMessage(chatId, 'Оберіть проміжок отрмання інформації', timeIntervalOptions);
        } 

        return bot.sendMessage(chatId, "Я вас не розумію");
    })

    bot.on('poll_answer', async poll=>{
        let localUserData = await getDataFetch(poll.user.id);
        let testPath = courseStructure.Math[`Topic_${localUserData.currentStage.topic}`][`Lecture_${localUserData.currentStage.lecture}`].Test; 
        if(localUserData.eduType==undefined){   
            localUserData['eduType']=[]
            poll.option_ids.forEach(element => {
                localUserData['eduType'].push(Object.keys(eduTypes)[element])
            });
            setDataToDb(localUserData.userId, localUserData) 
            return 0;
        }
        let grade = 0;
        let sum = 0;
        let testLastItem = localUserData.testsMarks.length-1;

        if(localUserData.testsMarks[testLastItem].testAnswers==undefined)
            localUserData.testsMarks[testLastItem]["testAnswers"] = []

        
        let index=localUserData.testsMarks[testLastItem].testAnswers.length
        var testAnswer=
        {
            answerId:`${testPath[index].questionIndex}`,
            answerOptions:[poll.option_ids],
            endTime: Date.now(),
            questionMark:0,
        }

        poll.option_ids.forEach(element => {
            sum += testPath[index].fractions[element];
        });
         
        let result = ((sum/100) * +(testPath[index].defaultgrade));
        if(result > -testPath[index].penalty){
            testAnswer.questionMark += +result
        }
        else{
            testAnswer.questionMark -= +(testPath[index].penalty) 
        }

                    
        localUserData.testsMarks[testLastItem].testAnswers.push(testAnswer)   

        if(++index < testPath.length){ 
            setDataToDb(localUserData.userId, localUserData)
            return bot.sendPoll(localUserData.chatId,
                testPath[index].question,
                testPath[index].arrayOptions,
                testPath[index].opts)
        }
        
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
            grade += +(element.defaultgrade)
        });
        
        sum =0;
        localUserData.testsMarks[testLastItem].testAnswers.forEach(element =>{
            sum += element.questionMark;
        })
        bot.sendMessage(localUserData.chatId, `Кількість вірних відповідей: ${(sum).toFixed(2)} з ${grade.toFixed(0)}`)
        
        
        localUserData.testsMarks[testLastItem].mark=sum.toFixed(2);
        localUserData.testsMarks[localUserData.testsMarks.length-1].testEnd = Date.now();
        localUserData.testsMarks[testLastItem]["grade"] = grade;
        localUserData.testsMarks[testLastItem]["lectureType"]=localUserData.currentLectureType
        setDataToDb(localUserData.userId, localUserData);
        
        if(sum <= (grade/2)){
            return bot.sendMessage(localUserData.chatId, `Спробуйте лекційний матеріал іншого типу сприйняття інформації`, lectureTypesOptions);
        }
        
        return 0;
    })
    bot.on('callback_query', async msg =>{
        const data = msg.data;
        const userId = msg.from.id;      
        const chatId =msg.message.chat.id;
        var localUserData = await getDataFetch(userId)
        
        let currentLecturePath = courseStructure.Math[`Topic_${localUserData.currentStage.topic}`][`Lecture_${localUserData.currentStage.lecture}`];    
        let testPath = courseStructure.Math[`Topic_${localUserData.currentStage.topic}`][`Lecture_${localUserData.currentStage.lecture}`].Test;
        if(data === 'begintest'){
            if(localUserData.testsMarks==undefined)
                localUserData["testsMarks"] = []

            localUserData.testsMarks.push(
                {
                    testId: localUserData.testsMarks.length,
                    testStart: Date.now(),
                    testEnd:null,
                    testAnswers:[],
                    mark:"",
                    lectureType:""
                }
            )
            setDataToDb(localUserData.userId, localUserData) 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {})
            await bot.sendPoll(chatId,
                testPath[0].question,
                testPath[0].arrayOptions,
                testPath[0].opts)
        }

        if(data === 'lecture_visual'){
            localUserData.currentLectureType = "visual"
            setDataToDb(localUserData.userId, localUserData) 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {})
            return bot.sendMessage(chatId, `1Прочитайте лекцію -> ${currentLecturePath['visual']}`, testButton);            
        }

        if(data === 'lecture_audio'){
            localUserData.currentLectureType = "audio"
            setDataToDb(localUserData.userId, localUserData) 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {})
            return bot.sendMessage(chatId, `2Прочитайте лекцію -> ${currentLecturePath['audio']}`, testButton);
        }

        if(data === 'lecture_verbal'){
            localUserData.currentLectureType = "verbal"
            setDataToDb(localUserData.userId, localUserData) 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {})
            return bot.sendMessage(chatId, `3Прочитайте лекцію -> ${currentLecturePath['verbal']}`, testButton);
        }

        if(data === 'lecture_video'){
            localUserData.currentLectureType = "video"
            setDataToDb(localUserData.userId, localUserData) 
            bot.deleteMessage(localUserData.userId, msg.message.message_id, form = {})
            return bot.sendMessage(chatId, `4Прочитайте лекцію -> ${currentLecturePath['video']}`, testButton);
        }
        
        if(data === '10год'){            
            // bot.sendMessage(chatId, `Прочитайте лекцію -> ${path}`);
            localUserData.studyInterval=1/60;
            setDataToDb(userId, localUserData)
            text =`Вам надійшла нова лекція`;            
            return sendTime(localUserData.studyInterval, msg, text);
        }

        // if(data === '15год'){
        //     //const text = 'Повідолення буде відправлене через 20сек!'
        //     localUserData.studyInterval=15;
        //     setDataToDb(userId,localUserData)
        //     text =`Прочитайте лекцію -> ${lecturePath}`;            
        //     return sendTime(localUserData.studyInterval, msg, text);
        // }
        
        // if(data === '18год'){
        //     //const text = 'Повідолення буде відправлене через 30сек!'
        //     localUserData.studyInterval=18;
        //     setDataToDb(userId,localUserData)
        //     text =`Прочитайте лекцію -> ${lecturePath}`;            
        //     return sendTime(localUserData.studyInterval, msg, text);
        // }
        
        if(data === 'nextLecture'){
            const lectureType=`${getLectureType(localUserData)}`;
            
            const lecturePath = currentLecturePath[`${lectureType}`];
            // const text = 'Повідолення буде відправлене через 1сек!'
            // await sendTime((1/60), msg, text);
            // console.log(localUserData[chatId].timeInterval);
            // const messageId = msg.message.message_id;
            // return bot.deleteMessage(chatId, messageId, form = {});
            
            text =`Прочитайте лекцію -> ${lecturePath}`;
            localUserData['currentLectureType'] = lectureType;
            setDataToDb(userId, localUserData);
            return bot.sendMessage(chatId, text, testButton);
            
        }
    })
}

start();