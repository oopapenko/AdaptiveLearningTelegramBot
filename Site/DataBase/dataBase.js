import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getDatabase ,ref,set, update } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFlF0AEChiiIGRvjwtQhneFf73zJBOsoA",
  authDomain: "telegrambot-a5ba3.firebaseapp.com",
  databaseURL: "https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "telegrambot-a5ba3",
  storageBucket: "telegrambot-a5ba3.appspot.com",
  messagingSenderId: "481713589346",
  appId: "1:481713589346:web:22a17817ee056c93da953b",
  measurementId: "G-J0Z8YY0H3B"
};

const app = initializeApp(firebaseConfig);

function writeUserData(userId, name, email) {
  const db = getDatabase();
  set(ref(db, 'Data/users/' + userId), {
    username: name,
    email: email
  });
}

function addCourse(courseName){
  const db = getDatabase();
  let course={
    length:1,
    name:courseName,
    topics:
    [{
      name:"Нова тема",
      lectures:
      [{
        name:"Нова лекція",
        types:{
          audio:"https://",
          verbal:"https://",
          video:"https://",
          visual:"https://"
        }
      }]
    }]
  };
  let courseId=Date.now();
  set(ref(db, `Data/courses/${courseId}`), course);
  return courseId;
}

function addTopic(courseStructure,topicName,courseName) {
  const db = getDatabase();
  let topic = {
    name:topicName,
    lectures:
    [{
      name:"Нова лекція",
      types:
      {
        audio:"https://",
        verbal:"https://",
        video:"https://",
        visual:"https://"
      }
    }]
  };
  set(ref(db, `Data/courses/${courseName}/topics/${courseStructure[`${courseName}`].topics.length}`), {
    name:topic.name,
    lectures:topic.lectures
  });
  const updates = {};
  updates[`Data/courses/${courseName}/length`] = courseStructure[`${courseName}`].length+1;
  update(ref(db), updates);
  courseStructure[`${courseName}`].topics.push(topic);
  courseStructure[`${courseName}`][`length`] += 1;
  return courseStructure;
}

function addLecture(courseStructure,lectureName,topicId, courseName) {
  const db = getDatabase();
  var lecture={
    name:lectureName,
    types:{
      audio:"https://",
      verbal:"https://",
      video:"https://",
      visual:"https://"
    }
  };
  set(ref(db, `Data/courses/${courseName}/topics/${topicId}/lectures/${courseStructure[`${courseName}`].topics[topicId].lectures.length}`), {
    name:lecture.name,
    types:lecture.types
  });
  courseStructure[`${courseName}`].topics[topicId].lectures.push(lecture);
  return courseStructure;
}

function addTest(courseId, topicId, lectureId, test){
  const db = getDatabase();  
  set(ref(db, `Data/courses/${courseId}/topics/${topicId}/lectures/${lectureId}/test`), test);  
}

function writeLectureType( topicId, lectureId, lectureType,value, courseName) {
  const db = getDatabase();
  const updates = {};
  updates[`Data/courses/${courseName}/topics/${topicId}/lectures/${lectureId}/types/${lectureType}`] = value;
  update(ref(db), updates);
}

function writeLectureName( topicId, lectureId,value, courseName) {
  const db = getDatabase();
  const updates = {};
  updates[`Data/courses/${courseName}/topics/${topicId}/lectures/${lectureId}/name`] = value;
  update(ref(db), updates);
}

function writeTopicName( topicId,value, courseName) {
  const db = getDatabase();
  const updates = {};
  updates[`Data/courses/${courseName}/topics/${topicId}/name`] = value;
  update(ref(db), updates);
}

function removeCourse(courseId) {
  const db = getDatabase();  
  set(ref(db, `Data/courses/${courseId}`), null);  
}

function removeTopic(courseStructure,topicId, courseName) {
  const db = getDatabase();
  courseStructure[`${courseName}`].topics.splice(topicId,1);
  set(ref(db, `Data/courses/${courseName}/topics`), courseStructure[`${courseName}`].topics);  
  const updates = {};
  updates[`Data/courses/${courseName}/length`] = courseStructure[`${courseName}`].length-1;
  update(ref(db), updates);
  courseStructure[`${courseName}`][`length`] -= 1;
  return courseStructure;
}

function removeLecture(courseStructure,topicId, lectureId, courseName) {
  const db = getDatabase();
  courseStructure[`${courseName}`].topics[topicId].lectures.splice(lectureId,1);
  set(ref(db, `Data/courses/${courseName}/topics/${topicId}/lectures`), courseStructure[`${courseName}`].topics[topicId].lectures);  
  return courseStructure;
}

function swapTopics(courseStructure,topicId, topicId2, courseName) {
  const db = getDatabase();
  courseStructure[`${courseName}`].topics[topicId] = [courseStructure[`${courseName}`].topics[topicId2], courseStructure[`${courseName}`].topics[topicId2] = courseStructure[`${courseName}`].topics[topicId]][0];
  set(ref(db, `Data/courses/${courseName}/topics/`), courseStructure[`${courseName}`].topics);  
  return courseStructure;
}

function swapLectures(courseStructure,topicId, lectureId, lectureId2, courseName) {
  const db = getDatabase();
  courseStructure[`${courseName}`].topics[topicId].lectures[lectureId] = [courseStructure[`${courseName}`].topics[topicId].lectures[lectureId], courseStructure[`${courseName}`].topics[topicId].lectures[lectureId2] = courseStructure.topics[topicId].lectures[lectureId]][0];
  set(ref(db, `Data/courses/${courseName}/topics/${topicId}/lectures`), courseStructure[`${courseName}`].topics[topicId].lectures);  
  return courseStructure;
}

function updateCourseName(courseId, newName){
  const db = getDatabase();
  const updates = {};
  updates[`Data/courses/${courseId}/name/`] = newName;  
  update(ref(db), updates);
}

function updateUserTopic(userData, userId, topicId ) {
  const db = getDatabase();
  const updates = {};
  updates[`Data/users/${userId}/currentStage/topic`] = +topicId+1;
  updates[`Data/users/${userId}/currentStage/lecture`] = 1;
  update(ref(db), updates);
  userData[userId].currentStage.topic = +topicId+1;
  userData[userId].currentStage.lecture = 1;
  return userData;
}

function updateUserLecture(userData, userId, lectureId ) {
  const db = getDatabase();
  const updates = {};
  updates[`Data/users/${userId}/currentStage/lecture`] = +lectureId+1;
  update(ref(db), updates);
  userData[userId].currentStage.lecture = +lectureId+1;
  return userData;
}

async function checkLength (courseName){
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/length.json`;
  const fet = await fetch(url);
  const result= await fet.json(); 
  if(result>1){
    return true;
  }
  return false;
}

async function getTestResultsByUserId (userId){
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/users/${userId}/testsMarks.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  return result;
}

async function checkTopicLength (topicId, courseName){
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/courses/${courseName}/topics/${topicId}/lectures.json`;
  const fet = await fetch(url);
  const result= await fet.json(); 
  if(result.length>1){
    return true;
  }
  return false;
}

const getUserData= async(userID) =>{
    const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/users/${userID}.json`;
    const fet = await fetch(url);
    const result= await fet.json();
    //console.log(result);
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




export{getUserData,getAllUsersData,getAllCourses,writeUserData,writeLectureType,writeLectureName,writeTopicName, 
  addTopic, addLecture, removeTopic, removeLecture, swapTopics, checkLength, checkTopicLength, updateUserTopic, 
  updateUserLecture, addCourse, removeCourse, updateCourseName,getTestResultsByUserId,addTest};