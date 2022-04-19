module.exports = {
    commands:[
        {command:'/start', description: 'Запуск телеграм каналу'},
        {command:'/info', description:'Відкрити вікно з інформацією'},
        {command:'/edutype', description:'Змінити тип сприймання інформації'},
        {command:'/taskinterval', description:'Змінити часовий інтервал'},              
    ],
    varkOptions: {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Візуальний канал',
                    callback_data: 'visual'
                }],
                [{
                    text: 'Аудіальний канал',
                    callback_data: 'audio'
                }],
                [{
                    text: 'Вербальний канал',
                    callback_data: 'verbal'
                }],
                [{
                    text: 'Кінестетичний канал',
                    callback_data: 'video'
                }]
            ]
        }
    },
    timeIntervalOptions: {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '8:00 - 10:00',
                    callback_data: '8-10'
                }],
                [{
                    text: '10:00 - 12:00',
                    callback_data: '10-12'
                }],
                [{
                    text: '12:00 - 14:00',
                    callback_data: '12-14'
                }],
                [{
                    text: '14:00 - 16:00',
                    callback_data: '14-16'
                }],
                [{
                    text: '16:00 - 18:00',
                    callback_data: '16-18'
                }],
                [{
                    text: '18:00 - 20:00',
                    callback_data: '18-20'
                }],
                [{
                    text: 'Отримати зараз',
                    callback_data: 'debug'
                }]
            ]
        }
    }, 
    nextLectureOptions: {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Наступна лекція',
                    callback_data: 'nextLecture'
                }]
            ]
        }
    },
    // eduTypes: {
    //     'visual' : 'візуальний',
    //     'audio' : 'аудіальний',
    //     'verbal' : 'вербальний',
    //     'video' : 'кінестетичний',
    // },
    eduTypes:{
        'visual': 'візуальний',
        'audio': 'аудіальний',
        'verbal': 'вербальний',
        'video': 'кінестетичний'
    },
    eduTypesPoll:{     
        arrayOptions:[
            'візуальний',
            'аудіальний',
            'вербальний',
            'кінестетичний'
        ],
        question: "Виберіть бажані типи сприняття зі списку:",
        opts:{
            'type': 'regular',
            'is_anonymous': false,
            'allows_multiple_answers': true,
        },
}  
};