const xml2js = require('xml2js');
const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: "ATTR" });
const testFile = './Test_examples/testExample.xml'

var testArray;

let xml_string = fs.readFileSync(testFile, "utf8");
parser.parseString(xml_string, function(error, result) {
    if(error === null) {
        testArray = result.quiz;
      
    }
    else {
        console.log(error);
    }
});
const generateArrayOptions = (answer)=>{
    var outArrayOptions=[];
    
    answer.forEach(element => {
        outArrayOptions.push(element.text[0].slice(3,element.text[0].length-4))
    });
    return outArrayOptions;
}

const generateAnswerFractions = (answer)=>{
    var outArrayOptions=[];

    answer.forEach(element => {
        outArrayOptions.push(+element.ATTR.fraction)
    });
    
    return outArrayOptions;
}

const generateQuestion = (test)=>{
    

    var outTest = {     
            arrayOptions: generateArrayOptions(test.answer),
            question: test.questiontext[0].text[0].slice(3,test.questiontext[0].text[0].length-4),
            opts:{
                'type': 'regular',
                'is_anonymous': false,
                'allows_multiple_answers': test.ATTR.type=='multichoice'?true:false,
            },
            fractions: generateAnswerFractions(test.answer),
            defaultgrade: test.defaultgrade,
            penalty: test.penalty
    }      
    return outTest;
          
}
const generateQuestions = (testArray) => {
    var outArray=[];
    testArray = testArray.slice(2)
    testArray.forEach(element => {
        try{
            outArray.push(generateQuestion(element));
        }
        catch{}
    },);

    return outArray;
}
const tests = generateQuestions(testArray.question).slice(0,5)

module.exports={tests};