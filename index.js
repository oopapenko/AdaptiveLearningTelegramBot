const TelegramApi = require('node-telegram-bot-api');
const token = "2051581549:AAH-mTaHNXwjnJFL8PbHdhbK81smk3yt8xk";
const bot = new TelegramApi(token, {polling: true});
const {setDataToDb, getDataFetch} = require('./DataAccessLogic/dataBaseHandler')
const {varkOptions, timeIntervalOptions, eduTypes, commands} = require('./Data/options');
const {courseStructure} = require('./Data/courses');
const schedule = require('node-schedule');
const {getLectureType} = require('./BusinessLogic/questionChanseCalc')


const testPath = courseStructure.Math[0]['Topic_1'][0].Tests_1;
const testButton = {reply_markup: {
    inline_keyboard: [
        [{
            text: 'Почати тестування',
            callback_data: 'begintest'
        }]
    ]
}}; 
const setEduType = async (type, localUserData) => {
    if(localUserData["eduType"]==undefined){
        localUserData["eduType"]=[]
    }
    if(localUserData != undefined || localUserData != null){
        localUserData["eduType"].push(`${type}`)
        setDataToDb(localUserData.userId, localUserData)            
        await bot.sendMessage(localUserData.chatId, `Обрано ${eduTypes[`${type}`]} тип срийняття.`);
        if(localUserData.studyInterval!=""){
            return 0;
        }
        else{
            return bot.sendMessage(localUserData.chatId, 'Також необхідно одразу обрати проміжок отримання навчальних матеріалів та завдань', timeIntervalOptions);
        }
    }
}
//new schedule.scheduleJob({rule: `0 0 ${time} * * *` }, async function ()
//new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, async function ()
const sendTime = async (time, msg, text)=> {
    new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, async function () {
        const userId = msg.from.id;
        var localUserData = await getDataFetch(userId)   

        await bot.sendMessage(localUserData.chatId, text, testButton);
    });
}

const start = () => {
    
    bot.setMyCommands(commands)

    bot.on('message', async msg=>{

        var text = msg.text;
        const chatId = msg.chat.id;
        const userId = msg.from.id;        
        var localUserData = await getDataFetch(userId)
         
        if(text === '/start'){
            
            if(localUserData == undefined || localUserData == null){
                const pattern = {
                    userName: msg.from.username,
                    chatId: chatId,
                    userId: userId,
                    eduType: [],
                    studyInterval: "",
                    currentStage: "",
                    loginTime: [],
                    testsMarks:[],
                    language_code: 'ua',   
                }
                await setDataToDb(userId, pattern)
                localUserData = pattern
                await bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
                console.log(localUserData.eduType)
                if(localUserData.eduType == undefined || localUserData.eduType == null || localUserData.eduType.length==0){
                    await bot.sendMessage(chatId, 'Спочатку необхідно пройти тест на тип сприймання інформації');
                    await bot.sendMessage(chatId, 'Натисніть на посилання та пройдіть тест -> https://vark-learn.com/опросник-vark-опросник-по-стратегиям-обу/')
                    await bot.sendMessage(chatId, 'Оберіть рекомендований тип сприйняття', varkOptions);
                    return 0;
                }
            }
            return bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
        }

        if(text === '/info'){  
            if(localUserData !== undefined){
                bot.sendMessage(chatId, `Ви будете отримувати повідомлення о ${localUserData.studyInterval}`)
                // bot.sendMessage(chatId, `Кількість пройдених тестів ${localUserData.testsMarks.length}, кількість отриманих балів ${(localUserData.testsMarks[0].mark).toFixed(2)}`)
                return bot.sendMessage(chatId, `Обрані типи сприймання інформації: ${eduTypes[`${localUserData.eduType}`]}`)             
            }
            return bot.sendMessage(chatId,`Ми про вас нічого не знаємо, пройдіть реєстрацію (/start)`)
        }


        if(text === '/edutype'){
            return await bot.sendMessage(chatId, 'Зміна типу сприйняття', varkOptions);
        }

        if(text === '/taskinterval'){
            return bot.sendMessage(chatId, 'Оберіть проміжок отрмання інформації', timeIntervalOptions);
        } 

        return bot.sendMessage(chatId, "Я вас не розумію");
    })

    bot.on('poll_answer', async poll=>{
        let grade = 0;
        let sum = 0;
        let localUserData = await getDataFetch(poll.user.id); 
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
        console.log(localUserData)

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
        let filtered = asArray.filter(([key, value]) => key  !== `${localUserData.eduType}`);
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
        
        if(sum <= (grade/2)){
           bot.sendMessage(localUserData.chatId, `Спробуйте лекційний матеріал іншого типу сприйняття інформації`, lectureTypesOptions);
        }
        localUserData.testsMarks[testLastItem].mark=sum.toFixed(2);
        localUserData.testsMarks[localUserData.testsMarks.length-1].testEnd = Date.now();
        localUserData.testsMarks[testLastItem]["grade"] = grade;
        setDataToDb(localUserData.userId, localUserData);
        return 0;
    })
    bot.on('callback_query', async msg =>{        
        const data = msg.data;
        const userId = msg.from.id;      
        const chatId =msg.message.chat.id;
        var localUserData = await getDataFetch(userId)
        
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
            await bot.sendPoll(chatId,
                testPath[0].question,
                testPath[0].arrayOptions,
                testPath[0].opts)
        }

        if(data === 'visual'){
            return setEduType(data, localUserData);
        }

        if(data === 'audio'){
            return setEduType(data, localUserData);
        }

        if(data === 'verbal'){
            return setEduType(data, localUserData);
        }

        if(data === 'video'){
            return setEduType(data, localUserData);
        }

        if(data === 'lecture_visual'){
            localUserData.testsMarks[localUserData.testsMarks.length-1]["lectureType"] = "visual"
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `1Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['visual']}`, testButton);
        }

        if(data === 'lecture_audio'){
            localUserData.testsMarks[localUserData.testsMarks.length-1]["lectureType"] = "audio"
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `2Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['audio']}`, testButton);
        }

        if(data === 'lecture_verbal'){
            localUserData.testsMarks[localUserData.testsMarks.length-1]["lectureType"] = "verbal"
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `3Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['verbal']}`, testButton);
        }

        if(data === 'lecture_video'){
            localUserData.testsMarks[localUserData.testsMarks.length-1]["lectureType"] = "video"
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `4Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['video']}`, testButton);
        }
        
        if(data === '10год'){
            const lectureType=`${getLectureType(localUserData)}`
            const lecturePath = courseStructure.Math[0]['Topic_1'][0]['Lecture_1'][`${localUserData.eduType != undefined ? localUserData.eduType : lectureType}`];
            // const text = 'Повідолення буде відправлене через 1сек!'
            // await sendTime((1/60), msg, text);
            // console.log(localUserData[chatId].timeInterval);
            // const messageId = msg.message.message_id;
            // return bot.deleteMessage(chatId, messageId, form = {});
            localUserData.studyInterval=1/60;            
            text =`Прочитайте лекцію -> ${lecturePath}`;
            if(localUserData.testsMarks== null){
                localUserData.testsMarks = [] 
            }
            localUserData.testsMarks[localUserData.testsMarks.length]["lectureType"] = lectureType
            setDataToDb(userId, localUserData)
            // bot.sendMessage(chatId, `Прочитайте лекцію -> ${path}`);
            await sendTime(localUserData.studyInterval, msg, text);
            return 0;            
        }

        if(data === '15год'){
            //const text = 'Повідолення буде відправлене через 20сек!'
            localUserData.studyInterval=15;
            setDataToDb(userId,localUserData)
            text =`Прочитайте лекцію -> ${lecturePath}`;            
            return sendTime(localUserData.studyInterval, msg, text);
        }
        
        if(data === '18год'){
            //const text = 'Повідолення буде відправлене через 30сек!'
            localUserData.studyInterval=18;
            setDataToDb(userId,localUserData)
            text =`Прочитайте лекцію -> ${lecturePath}`;            
            return sendTime(localUserData.studyInterval, msg, text);
        }        
    })
}

start();