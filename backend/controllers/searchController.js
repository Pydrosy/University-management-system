// backend/controllers/searchController.js
const { User, Student, Teacher, Course, Assignment } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');

exports.search = catchAsync(async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q}%`;
    const results = [];

    // Search based on user role
    if (userRole === 'admin') {
      // Search students
      const students = await Student.findAll({
        include: [{
          model: User,
          as: 'user',
          where: {
            [Op.or]: [
              { firstName: { [Op.like]: searchTerm } },
              { lastName: { [Op.like]: searchTerm } },
              { email: { [Op.like]: searchTerm } }
            ]
          }
        }],
        limit: 5
      });

      students.forEach(s => {
        results.push({
          id: `student-${s.id}`,
          type: 'student',
          title: `${s.user.firstName} ${s.user.lastName}`,
          description: `Student ID: ${s.studentNumber}`,
          link: `/admin/students/${s.id}`
        });
      });

      // Search teachers
      const teachers = await Teacher.findAll({
        include: [{
          model: User,
          as: 'user',
          where: {
            [Op.or]: [
              { firstName: { [Op.like]: searchTerm } },
              { lastName: { [Op.like]: searchTerm } },
              { email: { [Op.like]: searchTerm } }
            ]
          }
        }],
        limit: 5
      });

      teachers.forEach(t => {
        results.push({
          id: `teacher-${t.id}`,
          type: 'teacher',
          title: `${t.user.firstName} ${t.user.lastName}`,
          description: `Department: ${t.department}`,
          link: `/admin/teachers/${t.id}`
        });
      });
    }

    // Search courses (all roles)
    const courses = await Course.findAll({
      where: {
        [Op.or]: [
          { courseName: { [Op.like]: searchTerm } },
          { courseCode: { [Op.like]: searchTerm } },
          { department: { [Op.like]: searchTerm } }
        ]
      },
      limit: 5
    });

    courses.forEach(c => {
      results.push({
        id: `course-${c.id}`,
        type: 'course',
        title: c.courseName,
        description: `${c.courseCode} - ${c.department}`,
        link: userRole === 'admin' ? `/admin/courses/${c.id}` :
              userRole === 'teacher' ? `/teacher/courses/${c.id}` :
              `/student/courses/${c.id}`
      });
    });

    // Search assignments
    const assignments = await Assignment.findAll({
      where: {
        title: { [Op.like]: searchTerm }
      },
      include: [{
        model: Course,
        as: 'course'
      }],
      limit: 5
    });

    assignments.forEach(a => {
      results.push({
        id: `assignment-${a.id}`,
        type: 'assignment',
        title: a.title,
        description: `${a.course?.courseName} - Due: ${new Date(a.dueDate).toLocaleDateString()}`,
        link: userRole === 'teacher' ? `/teacher/assignments/${a.id}` :
              `/student/assignments/${a.id}`
      });
    });

    res.json({
      success: true,
      data: results.slice(0, 10) // Limit to 10 results
    });

  } catch (error) {
    console.error('Error in search:', error);
    return next(new AppError(error.message, 500));
  }
});