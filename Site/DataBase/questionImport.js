const generateArrayOptions = (answer)=>{
    var outArrayOptions=[];
    answer.forEach(element => {
        outArrayOptions.push(element.childNodes[1].innerHTML.slice(12,element.childNodes[1].innerHTML.length-7));
    });
    return outArrayOptions;
};
const generateAnswerFractions = (answer)=>{
    var outArrayOptions=[];
    answer.forEach(element => {
        outArrayOptions.push(+element.getAttribute("fraction"));
    });    
    return outArrayOptions;
};
const generateQuestion = (test)=>{
    var outTest = {     
        arrayOptions: generateArrayOptions([].slice.call(test.getElementsByTagName("answer"))),
        question: `${test.childNodes[1].childNodes[1].innerHTML}. ${test.childNodes[3].childNodes[1].innerHTML.slice(12,test.childNodes[3].childNodes[1].innerHTML.length-7)}`,
        opts:{
            'type': 'regular',
            'is_anonymous': false,
            'allows_multiple_answers': test.getAttribute("type")=='multichoice'?true:false,
        },
        fractions: generateAnswerFractions([].slice.call(test.getElementsByTagName("answer"))),
        defaultgrade: test.getElementsByTagName("defaultgrade")[0].innerHTML,
        penalty: test.getElementsByTagName("penalty")[0].innerHTML,
        questionIndex: test.childNodes[1].childNodes[1].innerHTML,
    }; 
    return outTest;
};
const generateQuestions = (testArray) => {
    var outArray=[];
    for(let i=0; i< testArray.length; i++){
        if(testArray[i].getAttribute("type") != "category" && testArray[i].getAttribute("type") != "matching"){
            outArray.push(generateQuestion(testArray[i]));
        }
        
    }
    return outArray.slice(0,5);
};


export{generateQuestions};