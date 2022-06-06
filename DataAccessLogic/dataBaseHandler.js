var admin = require('firebase-admin');
var serviceAccount = require('./telegrambot-a5ba3-firebase-adminsdk-v7wpk-364a262d9f.json');
var fetch = require('node-fetch');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app"
});

const { getDatabase } = require('firebase-admin/database');
const db = getDatabase();

function setDataToDb(userID, object){
  let path = db.ref(`Data/users/${userID}`);
  path.set(object);
}

function setCoursesDataToDb(object){
  let path = db.ref(`Data/courses/${courseName}`);
  path.set(object);
}

const getDataFetch= async(userID) =>{
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/users/${userID}.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  // console.log(result)
  return result;
};

const getAllUsersData = async() => {
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/users.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
};

const getAllCourses = async() => {
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
};

const getTest = async(courseName, topicNum,lectureNum)=>{
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/${topicNum-1}/lectures/${lectureNum-1}/test.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
};
const getLectures = async(courseName, topicNum)=>{
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/${topicNum-1}/lectures.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
};
const getLecture = async(courseName, topicNum,lectureNum)=>{
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/${topicNum-1}/lectures/${lectureNum-1}.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
};
const getTopicAndLectureName= async(courseName, topicNum,lectureNum)=>{
  let url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/${topicNum-1}/name.json`;
  let fet = await fetch(url);
  let topicName= await fet.json();
  url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/${topicNum-1}/lectures/${lectureNum-1}/name.json`;
  fet = await fetch(url);
  let lectureName= await fet.json();
  return {topicName, lectureName};
};
const getCourseName= async(courseName)=>{
  let url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/name.json`;
  let fet = await fetch(url);
  return await fet.json();
}
const getTopicsLength = async(courseName)=>{
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/length.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
};

module.exports={setDataToDb, setCoursesDataToDb, getDataFetch, getAllUsersData, getAllCourses, getTest, getLectures,getLecture,getTopicsLength, getTopicAndLectureName,getCourseName};





// const  getDataFromDb = async(userID)=>{
//   let path = db.ref(`Data/users/${userID}`);  
//   path.on('value', async(snapshot) => {
//     console.log("29",snapshot.val()); 
//     letData(snapshot.val());
//   }, (errorObject) => {
//     console.log('The read failed: ' + errorObject.name);
//     return null
//   })
//   console.log(answer);
// };
