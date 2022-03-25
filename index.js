const TelegramApi = require('node-telegram-bot-api');
const token = "2051581549:AAH-mTaHNXwjnJFL8PbHdhbK81smk3yt8xk";
const bot = new TelegramApi(token, {polling: true});
const {setDataToDb, getDataFetch} = require('./DataAccessLogic/dataBaseHandler')
const {varkOptions, timeIntervalOptions, eduTypes, commands} = require('./Data/options');
const {courseStructure} = require('./Data/courses');
const schedule = require('node-schedule');



const testPath = courseStructure.Math[0]['Topic_1'][0].Tests_1;
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
        localUserData.testsMarks[0].testsRemaining= testPath.length;             
        localUserData.testsMarks[0].correctAnswers=0;
        
        await bot.sendMessage(localUserData.chatId, text, testButton);
    });
}

const start = () => {
    
    bot.setMyCommands(commands)



    bot.on('poll_answer', async poll=>{
        let grade = 0;
        let sum = 0;
        let localUserData = await getDataFetch(poll.user.id); 
        let index = localUserData.testsMarks[0].testsRemaining;

        console.log(localUserData)

        poll.option_ids.forEach(element => {
            sum += testPath[index].fractions[element];
        });
        
        let result = ((sum/100) * +(testPath[index].defaultgrade));
        if(result > -testPath[index].penalty){
            localUserData.testsMarks[0].correctAnswers += +result
        }
        else{
            localUserData.testsMarks[0].correctAnswers -= +(testPath[index].penalty) 
        }
           

        if(localUserData.testsMarks[0].testsRemaining>0){ 
            index = localUserData.testsMarks[0].testsRemaining-=1;
            setDataToDb(localUserData.userId, localUserData)            
            return bot.sendPoll(localUserData.chatId, 
                testPath[index].question, 
                testPath[index].arrayOptions, 
                testPath[index].opts)
        }  
        else{
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
            bot.sendMessage(localUserData.chatId, `Кількість вірних відповідей: ${(localUserData.testsMarks[0].correctAnswers).toFixed(2)} з ${grade.toFixed(0)}`)
            if(localUserData.testsMarks[0].correctAnswers <= (testPath.length/2)){
                bot.sendMessage(localUserData.chatId, `Спробуйте лекційний матеріал іншого типу сприйняття інформації`, lectureTypesOptions)
            }
        }      
        setDataToDb(localUserData.userId, localUserData) 
        return 0;
    })

    bot.on('message', async msg=>{

        var text = msg.text;
        const chatId = msg.chat.id;
        const userId = msg.from.id;        
        var localUserData = await getDataFetch(userId)
        if(localUserData==undefined || localUserData==null)
            text = '/start'
                
        if(text === '/start'){
            
            if(localUserData == undefined || localUserData == null){
                const pattern = {
                    userName: msg.from.username,
                    chatId: chatId,
                    userId: userId,
                    eduType: "none",
                    studyInterval: "",
                    currentStage: "",
                    loginTime: [],
                    testsMarks:[
                        {correctAnswers:0,
                        interval: 0,
                        testsRemaining:0}
                    ],
                    language_code: 'ua',   
                }
                await setDataToDb(userId, pattern)
                localUserData = pattern
                await bot.sendMessage(chatId, 'Ласкаво просимо до телеграм-боту адаптивного навчання');
                console.log(localUserData.eduType)
                if(localUserData.eduType == "none"){
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
                bot.sendMessage(chatId, `Кількість пройдених тестів ${localUserData.testsMarks.length}, кількість отриманих балів ${(localUserData.testsMarks[0].correctAnswers).toFixed(2)}`)
                return bot.sendMessage(chatId, `Обраний тип сприймання інформації: ${eduTypes[`${localUserData.eduType}`]}`)             
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

    bot.on('callback_query', async msg =>{        
        const data = msg.data;
        const userId = msg.from.id;      
        const chatId =msg.message.chat.id;
        var localUserData = await getDataFetch(userId)
        if(data === 'begintest'){
            const index = --localUserData.testsMarks[0].testsRemaining;
            setDataToDb(userId,localUserData)
            await bot.sendPoll(chatId,
                testPath[index].question,
                testPath[index].arrayOptions,
                testPath[index].opts)
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
            localUserData.testsMarks[0].testsRemaining= testPath.length;             
            localUserData.testsMarks[0].correctAnswers=0;
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `1Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['visual']}`, testButton);
            
        }
        if(data === 'lecture_audio'){
            localUserData.testsMarks[0].testsRemaining= testPath.length;             
            localUserData.testsMarks[0].correctAnswers=0;
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `2Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['audio']}`, testButton);
            
        }
        if(data === 'lecture_verbal'){
            localUserData.testsMarks[0].testsRemaining= testPath.length;             
            localUserData.testsMarks[0].correctAnswers=0;
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `3Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['verbal']}`, testButton);
            
        }
        if(data === 'lecture_video'){
            localUserData.testsMarks[0].testsRemaining= testPath.length;             
            localUserData.testsMarks[0].correctAnswers=0;
            setDataToDb(localUserData.userId, localUserData) 
            return bot.sendMessage(chatId, `4Прочитайте лекцію -> ${courseStructure.Math[0]['Topic_1'][0]['Lecture_1']['video']}`, testButton);
        }       
        const lecturePath = courseStructure.Math[0]['Topic_1'][0]['Lecture_1'][`${localUserData.eduType}`];
        if(data === '10год'){
            // const text = 'Повідолення буде відправлене через 1сек!'
            // await sendTime((1/60), msg, text);
            // console.log(localUserData[chatId].timeInterval);
            // const messageId = msg.message.message_id;
            // return bot.deleteMessage(chatId, messageId, form = {});
            localUserData.studyInterval=1/60;
            setDataToDb(userId,localUserData)
            text =`Прочитайте лекцію -> ${lecturePath}`;
            localUserData.testsMarks[0].testsRemaining = testPath.length;             
            localUserData.testsMarks[0].correctAnswers=0;
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