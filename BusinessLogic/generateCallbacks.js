const courseCallback = (course, courseId)=>{
    return [{
                text: course.name,
                callback_data: `course_${courseId}`
    }];
};
const generateCourses=(courses)=>{
    const coursesButtons = {reply_markup: {
        inline_keyboard: []
    }}; 
    let coursesId=Object.keys(courses);
    coursesId.forEach(courseId => {
        coursesButtons.reply_markup.inline_keyboard.push(courseCallback(courses[courseId],courseId));
    });
    return coursesButtons;
};
module.exports={generateCourses};