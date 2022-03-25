var admin = require("firebase-admin");
var serviceAccount = require('./telegrambot-a5ba3-firebase-adminsdk-v7wpk-364a262d9f.json');
var fetch = require('node-fetch');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app"
});

const { getDatabase } = require('firebase-admin/database');

function letData(data){
  answer = data;
  console.log(`From let data` ,answer);
}


const db = getDatabase();
const path = db.ref(`Data/users`);

function setDataToDb(userID, object){
  let path = db.ref(`Data/users/${userID}`);
  path.set(object);
}

var answer;

const getDataFetch= async(userID) =>{
  const url = `https://telegrambot-a5ba3-default-rtdb.europe-west1.firebasedatabase.app/Data/users/${userID}.json`;
  const fet = await fetch(url);
  const result= await fet.json();
  // console.log(result)
  return result
}

module.exports={setDataToDb,getDataFetch};





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
