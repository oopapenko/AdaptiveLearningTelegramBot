import {getUserData, getAllUsersData, getAllCourses, writeUserData, writeLectureType, writeLectureName,
    writeTopicName, addTopic, addLecture, removeTopic, removeLecture, swapTopics,checkLength, checkTopicLength, 
    updateUserTopic, updateUserLecture, addCourse, removeCourse, updateCourseName, getTestResultsByUserId, addTest} from "./DataBase/dataBase.js";
import {generateQuestions} from "./DataBase/questionImport.js";
var content = document.getElementById("mainContent");

var userData,coursesData,currentObject,currentCourse,coursesNames,parser,xmlDoc;

const showUsersTable =async function () {
    document.getElementById('coursesR').checked = false;
    document.getElementById('usersR').checked = true;
    content.innerHTML ='';
    userData = await getAllUsersData();
    coursesData = await getAllCourses();
    coursesNames = Object.keys(coursesData);
    let usersIds = Object.keys(userData);
    if(currentCourse == undefined || currentCourse == null){
        currentCourse = coursesNames[0];
    }
    let courseSelector = await chooseCourse(coursesData, coursesNames,currentCourse);
    let theadItems=["Ім'я кристувача", "Поточна тема", "Поточна лекція", "Результати"];
// Будування таблиці

    let table = document.createElement("table");
    let thead = document.createElement("thead");
    let tr = document.createElement('tr');
    theadItems.forEach(item => {
        let td = document.createElement('td');
        td.innerHTML=item;
        tr.appendChild(td);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody=document.createElement("tbody");
    for(let i=0; i< usersIds.length;i++){
        if(userData[`${usersIds[i]}`].currentStage.currentCourse!=currentCourse){
            continue;
        }
        let tr = document.createElement('tr');
        let td = document.createElement("td");
        td.innerHTML = userData[`${usersIds[i]}`].userName;
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(generateTopicSelect(currentCourse, userData[usersIds[i]].currentStage.topic, usersIds[i]));
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(generateLectureSelect(currentCourse, userData[`${usersIds[i]}`].currentStage.topic-1), userData[`${usersIds[i]}`].currentStage.lecture-1);
        tr.appendChild(td);
        
        td = document.createElement("td");
        td.innerHTML="Переглянути"; 
        td.className="UserButton";
        td.setAttribute("UserId", usersIds[i]);
        td.addEventListener("click", getResultsForUser, false);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    table.className="UsersTable";
    content.appendChild(table);
    content.insertBefore(courseSelector,table);
};

async function getResultsForUser(e){
    let testMarks = await getTestResultsByUserId(e.target.getAttribute("userId"));
    let mainContent = document.getElementById("mainContent");
    mainContent.innerHTML="";
    let span = document.createElement("span");
    mainContent.appendChild(span);
    span.innerHTML="Повернутися назад";

    span.addEventListener("click", showUsersTable);
    let table = document.createElement("table");
    table.className="TestsTable";
    let titles = ["Назва теми", "Назва лекції","Тип лекції", "Оцінка", "Час початку", "Затрачено часу"];
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let td;
    titles.forEach(title => {
        td = document.createElement("td");
        td.innerHTML = title;
        tr.appendChild(td);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement("tbody");
    testMarks.forEach(test => {
        tr = document.createElement("tr");
        td = document.createElement("td");
        td.innerHTML = test.topicName;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = test.lectureName;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = translateType(test.lectureType);
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = `${test.mark}/${test.grade}`;
        tr.appendChild(td);

        let dateStart = new Date(test.testStart);
        var options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
          };
        td = document.createElement("td");
        td.innerHTML = dateStart.toLocaleString("ru",options);
        tr.appendChild(td);
        
        let dateEnd = new Date(test.testEnd);
              
        td = document.createElement("td"); 
        td.innerHTML = calculateTime(dateStart,dateEnd);
        tr.appendChild(td);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    mainContent.appendChild(table);
}

function calculateTime(dateStart, dateEnd){
    let delta=dateEnd-dateStart;  
    if(delta>=1000*60*60)
        return `${(delta/1000/60/60).toFixed(0)}:${(delta/1000/60%60).toFixed(0)}:${(delta/1000%60).toFixed(0)}`;
    else if(delta>=1000*60)
        return `${(delta/1000/60).toFixed(0)}:${(delta/1000%60).toFixed(0)}`;
    return (delta/1000).toFixed(0);
}

function generateTopicSelect(courseName, selectedId, userID){
    let select = document.createElement("select");
    let option;
    for(let j = 0;j<coursesData[`${courseName}`].topics.length;j++){
        option=document.createElement("option");
        if(j==selectedId-1)
            option.selected=true;
        option.value=j;
        option.innerHTML=coursesData[`${courseName}`].topics[j].name;
        select.setAttribute("userId",userID);
        select.setAttribute("name","topic");
        select.appendChild(option);
    }
    select.addEventListener("change",changeUserTopic, false);
    return select;
}

function changeUserTopic(e){
    let topicId = e.target.value;
    let userId = e.target.getAttribute("userId");
    userData = updateUserTopic(userData,userId, topicId);
    e.target.parentElement.nextSibling.replaceChild(generateLectureSelect(currentCourse, topicId, 0, userId), e.target.parentElement.nextSibling.firstChild);
}
function generateLectureSelect(courseName, topicId, selectedId ,userId){
    let select = document.createElement("select");
    let option;
    for(let j = 0;j<coursesData[`${courseName}`].topics[topicId].lectures.length;j++){
        option=document.createElement("option");
        if(j==selectedId)
            option.selected=true;
        option.value=j;
        option.innerHTML=coursesData[`${courseName}`].topics[topicId].lectures[j].name;
        select.appendChild(option);
    }
    select.setAttribute("userId",userId);
    select.setAttribute("name","lecture");
    select.addEventListener("change", changeUserLecture. false);
    return select;
}
function changeUserLecture(e){
    let lectureId = e.target.value;
    let userId = e.target.getAttribute("userId");
    userData = updateUserLecture(userData,userId, lectureId);
}

// Таблиця курсів

const showCoursesTable =async function(){
    let buttonBack = document.createElement("span");
    content.innerHTML ='';
    document.getElementById('usersR').checked = false;
    document.getElementById('coursesR').checked = true;
    coursesData = await getAllCourses();
    let coursesNames = Object.keys(coursesData);
    if(currentCourse == undefined || currentCourse == null){
        currentCourse = coursesNames[0];
    } 
    let options = await chooseCourse(coursesData, coursesNames,currentCourse);

    let data = coursesData[`${currentCourse}`].topics;

// Будування таблиці

    let generalTable = document.createElement("table");
    for(let i=0; i< data.length;i++){
        let tr = document.createElement('tr');
        let td = document.createElement("td");
        let tdUnfoldButton = document.createElement('td');
        let tdEditButton = document.createElement('td');
        let tdRemoveButton = document.createElement('td');


        td.innerHTML = `<input disabled value="${data[i].name}" type="text"/>`;
        tr.appendChild(td);

        tdUnfoldButton.innerHTML = `Розгорнути`;
        tdUnfoldButton.addEventListener('click',unfoldTopic, false);

        tdEditButton.innerHTML = `Редагувати`;
        tdEditButton.addEventListener('click',editTopic, false);

        tdRemoveButton.innerHTML = `Видалити`;
        tdRemoveButton.addEventListener('click',deleteTopic, false);

        tr.appendChild(tdUnfoldButton);
        tr.appendChild(tdEditButton);
        tr.appendChild(tdRemoveButton);

        tr.setAttribute('name', i);
        tr.addEventListener('click', chooseObject, false);
        generalTable.appendChild(tr);
    }
    let addTr = document.createElement('tr');
    let addButton = document.createElement('span');
    let upButton = document.createElement('span');
    let downButton = document.createElement('span');
    let newCourseButton = document.createElement('span');
    let deleteSelectedCourseButton = document.createElement('span');
    let renameSelectedCourseButton = document.createElement('span');

    addButton.className = "TopButtons";

    generalTable.className="CoursesTable";
    buttonBack.className="TopButtons";
    upButton.className="TopButtons";
    downButton.className="TopButtons";

    buttonBack.innerHTML = "Згорнути все";
    buttonBack.addEventListener('click',showCoursesTable, false);

    addButton.innerHTML = "Додати тему";
    addButton.addEventListener('click',addNewTopic, false);

    upButton.innerHTML = "Тему вверх";
    upButton.addEventListener('click',topicUp, false);

    downButton.innerHTML = "Тему вниз";
    downButton.addEventListener('click',topicDown, false);

    newCourseButton.innerHTML = `Додати курс`;
    newCourseButton.addEventListener('click',newCourse, false);

    deleteSelectedCourseButton.innerHTML = `Видалити поточний курс`;
    deleteSelectedCourseButton.addEventListener('click',deleteCourse, false);

    renameSelectedCourseButton.innerHTML = `Змінити назву поточного курсу`;
    renameSelectedCourseButton.addEventListener('click',renameCourse, false);

    content.appendChild(generalTable);
    content.insertBefore(options, generalTable);
    let selectCourse = document.getElementsByClassName('CourseSelect')[0];
    selectCourse.appendChild(newCourseButton);
    selectCourse.appendChild(deleteSelectedCourseButton);
    selectCourse.appendChild(renameSelectedCourseButton);
    content.insertBefore(buttonBack, generalTable);
    content.insertBefore(addButton, generalTable);
    content.insertBefore(upButton, generalTable);
    content.insertBefore(downButton, generalTable);

    content.appendChild(addTr);

};

const deployTopic = async function (topicElement) {
    topicElement.removeEventListener('click', unfoldTopic, false);
    document.getElementById('usersR').checked = false;
    document.getElementById('coursesR').checked = true;
    let coursesNames = Object.keys(coursesData);
    let topicIndex = topicElement.parentElement.rowIndex;
    let topicTable = document.getElementsByClassName('CoursesTable')[0];
    let topicStructure = coursesData[`${currentCourse}`].topics[topicElement.parentElement.getAttribute('name')];
    for(let i=0; i< topicStructure.lectures.length;i++){
        let tr = topicTable.insertRow(topicIndex+i+1);
        let td = document.createElement('td');
        let tdButtons = document.createElement('td');
        let tdEditButton = document.createElement('td');
        let tdRemoveButton = document.createElement('td');
        td.innerHTML =`<input disabled value="${topicStructure.lectures[i].name}" type="text"/>`;
        tr.appendChild(td);

        tdButtons.innerHTML = `Розгорнути`;
        tdButtons.addEventListener("click",unfoldLecture,false);

        tdEditButton.innerHTML = `Редагувати`;
        tdEditButton.addEventListener('click',editLectureName, false);

        tdRemoveButton.innerHTML = `Видалити`;
        tdRemoveButton.addEventListener('click',deleteLecture, false);

        tr.appendChild(tdButtons);
        tr.appendChild(tdEditButton);
        tr.appendChild(tdRemoveButton);
        tr.setAttribute('class', 'LectureRow');
        tr.setAttribute('name', `${topicElement.parentElement.getAttribute('name')}_${i}`);
    }
    topicElement.remove();
};

const deployLecture = function (lectureElement) {
    lectureElement.removeEventListener('click', unfoldLecture, false);
    let lectureIndex = lectureElement.parentElement.rowIndex;
    let lectureTable = document.getElementsByClassName('CoursesTable')[0];
    let indexes = lectureElement.parentElement.getAttribute('name').split("_");
    let lectureStructure = coursesData[`${currentCourse}`].topics[indexes[0]].lectures[indexes[1]];

    let typesKeys = Object.keys(lectureStructure.types);

    for(let i=0; i< typesKeys.length+1;i++){
        if(i == typesKeys.length){
            let tr = lectureTable.insertRow(lectureIndex+i+1);
            let td = document.createElement('td');
            let testCheck = document.createElement('td');
            let importTestButton = document.createElement('td');
            importTestButton.innerHTML = `<input type="file" id="fileInput${lectureElement.parentElement.getAttribute('name')}"></input>`;
            td.innerHTML = "Завантажити новий файл тестів:";
            testCheck.innerHTML = `<span>${lectureStructure.test == undefined ? "Тест відсутній" : "Тест наявний"}</span>`;
            testCheck.firstChild.setAttribute("id",`testChecker${indexes[0]}_${indexes[1]}`);
            tr.appendChild(td);
            tr.appendChild(importTestButton);
            tr.appendChild(testCheck);
            let testButton = document.getElementById(`fileInput${lectureElement.parentElement.getAttribute('name')}`);
            testButton.addEventListener("change",handleFiles,false);
            tr.setAttribute('class', 'LectureFile');
        }
        else{
            let tr = lectureTable.insertRow(lectureIndex+i+1);
            let td = document.createElement('td');
            let tdType = document.createElement('td');
            let tdEditButton = document.createElement('td');
            td.innerHTML = `${translateType(typesKeys[i])} : `;
            tdType.innerHTML = `<input disabled value="${lectureStructure.types[`${typesKeys[i]}`]}" type="text"/>`;

            tdEditButton.innerHTML = `Редагувати`;
            tdEditButton.setAttribute("name", `${lectureElement.parentElement.getAttribute('name')}_${typesKeys[i]}`);
            tdEditButton.addEventListener('click',editLectureType, false);

            tr.appendChild(td);
            tr.appendChild(tdType);
            tr.appendChild(tdEditButton);
            tr.setAttribute('class', 'LectureTypes');
        }
    }
    
    
    lectureElement.remove();

};

function unfoldTopic(e) {
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row = target.parentElement;
    let tdAddlecture = document.createElement('td');
    tdAddlecture.innerHTML = `Додати лекцію`;
    tdAddlecture.addEventListener('click',addNewLecture, false);
    row.appendChild(tdAddlecture);
    deployTopic(target);
}

function unfoldLecture(e) {
    e = e || window.event;
    let target = e.target || e.srcElement;
    deployLecture(target);
}

function translateType(name){
    let types = {
        audio:"Звукова ",
        visual:"Візуальна ",
        verbal:"Вербальна ",
        video:"Кінестетична ",
    };
    return types[`${name}`];
}


// Слухачі подій


function editTopic(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    row.firstChild.firstChild.removeAttribute("disabled");
    target.innerHTML = "Зберегти";
    target.removeEventListener("click", editTopic,false);
    target.addEventListener("click", saveTopic,false);
}

function saveTopic(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    row.firstChild.firstChild.setAttribute("disabled","");
    target.removeEventListener("click",saveTopic,false);
    target.innerHTML = "Редагувати";
    target.addEventListener("click", editTopic,false);
    writeTopicName(row.getAttribute("name"),row.firstChild.firstChild.value,currentCourse);
}

function editLectureName(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    row.firstChild.firstChild.removeAttribute("disabled");
    target.innerHTML = "Зберегти";
    target.removeEventListener("click", editLectureName,false);
    target.addEventListener("click", saveLectureName,false);
}

function saveLectureName(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    row.firstChild.firstChild.setAttribute("disabled","");
    target.removeEventListener("click",saveLectureName,false);
    target.innerHTML = "Редагувати";
    target.addEventListener("click", editLectureName,false);
    let indexes = row.getAttribute('name').split("_");
    writeLectureName(indexes[0],indexes[1],row.firstChild.firstChild.value, currentCourse);
}

function editLectureType(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement.children;
    row.item(1).firstChild.removeAttribute("disabled");
    target.innerHTML = "Зберегти";
    target.removeEventListener("click", editLectureType,false);
    target.addEventListener("click", saveLectureType,false);
}

function saveLectureType(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement.children;
    row.item(1).firstChild.setAttribute("disabled","");
    target.removeEventListener("click",saveLectureType,false);
    target.innerHTML = "Редагувати";
    target.addEventListener("click", editLectureType,false);
    let indexes = target.getAttribute('name').split("_");
    writeLectureType(indexes[0],indexes[1],indexes[2], row.item(1).firstChild.value, currentCourse);
}

function addNewTopic(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let topicTable = document.getElementsByClassName('CoursesTable')[0];
    let tr = topicTable.insertRow(-1);
    let td = document.createElement('td');
    let tdButtons = document.createElement('td');
    let tdEditButton = document.createElement('td');
    let tdRemoveButton = document.createElement('td');
    td.innerHTML =`<input value="Введіть назву нової теми" type="text"/>`;
    tr.appendChild(td);

    tdButtons.innerHTML = `Розгорнути`;
    tdButtons.addEventListener("click",unfoldTopic,false);

    tdEditButton.innerHTML = `Зберегти`;
    tdEditButton.addEventListener('click',saveTopic, false);

    tdRemoveButton.innerHTML = `Видалити`;
    tdRemoveButton.addEventListener('click',deleteTopic, false);

    tr.appendChild(td);
    tr.appendChild(tdButtons);
    tr.appendChild(tdEditButton);
    tr.appendChild(tdRemoveButton);

    coursesData = addTopic(coursesData,"Нова тема", currentCourse);

    tr.setAttribute('name', coursesData[`${currentCourse}`].length-1);
    tr.addEventListener('click', chooseObject, false);
    topicTable.appendChild(tr);
}

function addNewLecture(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    let rowName = row.getAttribute('name');
    let tr =document.createElement('tr');
    let td = document.createElement('td');
    let tdButtons = document.createElement('td');
    let tdEditButton = document.createElement('td');
    let tdRemoveButton = document.createElement('td');
    td.innerHTML =`<input value="Нова лекція" type="text"/>`;
    tr.appendChild(td);

    tdButtons.innerHTML = `Розгорнути`;
    tdButtons.addEventListener("click",unfoldLecture,false);

    tdEditButton.innerHTML = `Зберегти`;
    tdEditButton.addEventListener('click',saveLectureName, false);

    tdRemoveButton.innerHTML = `Видалити`;
    tdRemoveButton.addEventListener('click',deleteLecture, false);

    tr.appendChild(td);
    tr.appendChild(tdButtons);
    tr.appendChild(tdEditButton);
    tr.appendChild(tdRemoveButton);
    coursesData = addLecture(coursesData,"Нова лекція",+rowName, currentCourse);
    tr.setAttribute('name',`${rowName}_${coursesData[`${currentCourse}`].topics[+rowName].lectures.length-1}`);
    tr.className = "LectureRow";
    let lastLecture = document.getElementsByName(`${rowName}_${coursesData[`${currentCourse}`].topics[+rowName].lectures.length-2}`)[0];
    insertAfter(tr,lastLecture);
}

async function deleteTopic(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    let rowName = row.getAttribute('name');
    if(await checkLength(currentCourse)){
        coursesData = removeTopic(coursesData,rowName, currentCourse);
    window.setTimeout(showCoursesTable,1000);
    }
    else
        alert("Неможливо видалити останню тему в курсі!");
}

async function deleteLecture(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let row=target.parentElement;
    let rowName = row.getAttribute('name');
    let indexes = rowName.split("_");
    if(await checkTopicLength(indexes[0],currentCourse)){
        coursesData = removeLecture(coursesData,indexes[0],indexes[1], currentCourse);
    window.setTimeout(showCoursesTable,1000);
    }
    else
        alert("Неможливо видалити останню лекцію в темі!");
}

function chooseObject(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    let name;
    try{
        name = target.parentElement.parentElement.getAttribute('name');
    }
    catch(e){

    }
    if(name != null && name != undefined){
        if(currentObject != undefined || currentObject != null){
            currentObject.classList.remove("selected");
        }
        if(name.includes("_") != true){
            console.log(currentObject);
            currentObject = target.parentElement.parentElement;
            target.parentElement.parentElement.className += "selected";
        }
    }
}

function topicUp(){
    let topicIndex = currentObject.getAttribute('name');
    if(topicIndex == 0){
        alert('Тема знаходить на першому місці.');
    }
    else{
        coursesData = swapTopics(coursesData,topicIndex,topicIndex-1, currentCourse);
        window.setTimeout(showCoursesTable,200);
    }
}

function topicDown(){
    let topicIndex = currentObject.getAttribute('name');
    if((+topicIndex) >= coursesData[`${currentCourse}`].length-1){
        alert('Тема знаходить на останньому місці.');
    }
    else{
        coursesData = swapTopics(coursesData,topicIndex,(+topicIndex)+1, currentCourse);
        window.setTimeout(showCoursesTable,200);
    }
}

async function chooseCourse(coursesData,coursesNames, selected){
    let selectDiv = document.createElement('div');
    let select = document.createElement("select");
    for(let i=0; i<coursesNames.length;i++){
        let option = document.createElement("option");
        option.value=coursesNames[i];
        option.innerHTML=coursesData[`${coursesNames[i]}`].name;

        if(option.value == selected){
            option.selected=true;
        }
        select.appendChild(option);
    }
    select.addEventListener("change",changeTableCourse, false);
    selectDiv.appendChild(select);
    selectDiv.className="CourseSelect";
    return selectDiv;
}

function changeTableCourse(e){
    e = e || window.event;
    let target = e.target || e.srcElement;
    currentCourse =target.value;
    if(document.getElementById('coursesR').checked == true){
        window.setTimeout(showCoursesTable,200);
    }
    else
        window.setTimeout(showUsersTable,200);
}

function newCourse(){
    let name = prompt("Введіть назву нового курсу");
    console.log(name);
    if(name != undefined && name != null && name != ""){
        currentCourse = addCourse(name);
        window.setTimeout(showCoursesTable,500);
    }
    else
        alert("Incorrect course name!");
}

function deleteCourse(){
    let answer = confirm("Ви впевнені що хочете видалити саме цей вибраний курс?");
    let id = document.getElementsByTagName("select")[0].value;
    if(answer == true){
        removeCourse(id);
        currentCourse = null;
        window.setTimeout(showCoursesTable,500);
    }
}

function renameCourse(){
    let answer = prompt("Введіть нову назву поточного курсу");
    let id = document.getElementsByTagName("select")[0].value;
    if(answer != undefined && answer != null && answer != ""){
        updateCourseName(id,answer);
        window.setTimeout(showCoursesTable,400);
    }
}


let usersInput = document.getElementById("users");
let coursesInput = document.getElementById("courses");

usersInput.addEventListener("click",showUsersTable, false);
coursesInput.addEventListener("click",showCoursesTable, false);

//document.getElementById("missionComplete").addEventListener("click",missionComplete,false);
function missionComplete() {
    document.body.className="narkomaniya";
    let audio = document.getElementById("audio");
    let travel = document.getElementById("traveler");
    let bounce = document.getElementById("bouncer");
    travel.className="traveler";
    bounce.className="bouncer";
    audio.playbackRate = 1;
    audio.volume = 0.6;
    audio.loop = true;
    audio.play();
  }

//Функції обробки файлів


parser = new DOMParser();
function handleFiles(e) {
    e = e || window.event;
    let target = e.target || e.srcElement;
    let indexes = (target.getAttribute("id").slice(9, target.getAttribute("id").length)).split("_");
    const fileList = this.files;
    const reader = new FileReader();
    reader.readAsText(fileList[0]);
    reader.addEventListener("load", () => {
        xmlDoc = parser.parseFromString(reader.result,"text/xml");
        let result = xmlDoc.getElementsByTagName("quiz")[0];      
        let arr = [].slice.call(result.getElementsByTagName("question"));
        let test = generateQuestions(arr);
        addTest(currentCourse,indexes[0],indexes[1],test);
      }, false);
    let checker = document.getElementById(`testChecker${indexes[0]}_${indexes[1]}`);
    checker.innerHTML = "Тест наявний";
}


// Функції підтримки

  function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}