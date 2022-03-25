const {tests} = require("./questionImport")
module.exports = {
    courseStructure: {
        'Math': [
            {
                'Topic_1': [
                    {
                        'Lecture_1': {
                            'visual': 'https://il.kubg.edu.ua',
                            'verbal': 'https://ij.kubg.edu.ua',
                            'audio': 'https://if.kubg.edu.ua',
                            'video': 'https://iff.kubg.edu.ua',
                        },
                        'Tests_1': tests,
                    },
                ]
            },
        ]
    },
}


