
const calculateBasicChances = (userData)=>{
    var lectureMarks={};
    let lectureTypes=[
        'visual',
        'audio',
        'verbal',
        'video']
    lectureTypes.forEach(element => {
            lectureMarks[`${element}`]=10;
    });
    if(userData.testsMarks==undefined||userData.testsMarks.length<=5){
        return lectureMarks;
    }
    var countLecture = {};   
    lectureTypes.forEach(element => {
        countLecture[`${element}`] = 0;
    }); 
    userData.testsMarks.forEach(testResult => {
        countLecture[`${testResult.lectureType}`]++;
        lectureMarks[`${testResult.lectureType}`]+=testResult.mark/testResult.grade*100    
    });
    lectureTypes.forEach(element => {
        lectureMarks[`${element}`]/=countLecture[`${element}`]==0?1:countLecture[`${element}`]
    });
    return lectureMarks;
    
};

const calculateExtendedChances = (userData)=>{
    let lectureTypes=[
        'visual',
        'audio',
        'verbal',
        'video']
    var chances = calculateBasicChances(userData)
    userData.eduType.forEach(element=>{
        chances[`${element}`] +=50;
    })    
    var sum =0;
    lectureTypes.forEach(element => {
        sum+=chances[`${element}`]
    });
    var coef=sum/100;
    lectureTypes.forEach(element => {
        chances[`${element}`]/=coef;
    });    
    return chances
}

const getLectureType = (userData) => {
    let lectureTypes=[
        'visual',
        'audio',
        'verbal',
        'video']
    var chances = calculateExtendedChances(userData);
    const rand = Math.random() * 100;
    var temp=0;
    for (var i = 0; i<=lectureTypes.length;i++){
        temp+=chances[`${lectureTypes[i]}`]         
        if(temp>=rand){
            return lectureTypes[i];
        }
    }
}


module.exports={getLectureType};