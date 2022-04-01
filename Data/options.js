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
                    text: '10 година',
                    callback_data: '10год'
                }],
                [{
                    text: '15 година',
                    callback_data: '15год'
                }],
                [{
                    text: '18 година',
                    callback_data: '18год'
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
}