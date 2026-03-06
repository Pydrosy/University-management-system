// backend/models/index.js
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Payment = require('./Payment');
const Announcement = require('./Announcement');
const Schedule = require('./Schedule');
const Notification = require('./Notification');


// User associations
User.hasOne(Student, { foreignKey: 'userId', as: 'student' }); // Note: as: 'student' (lowercase)
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacher' }); // Note: as: 'teacher' (lowercase)
User.hasMany(Announcement, { foreignKey: 'createdBy', as: 'announcements' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


// Student associations
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Note: as: 'user' (lowercase)
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Student.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions' });
Student.hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });

// Teacher associations
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Note: as: 'user' (lowercase)
Teacher.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });

// Course associations
Course.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' }); // Note: as: 'teacher' (lowercase)
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Course.hasMany(Assignment, { foreignKey: 'courseId', as: 'assignments' });
Course.hasMany(Schedule, { foreignKey: 'courseId', as: 'schedules' });

// Enrollment associations
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' }); // Note: as: 'student' (lowercase)
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' }); // Note: as: 'course' (lowercase)

// Assignment associations
Assignment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' }); // Note: as: 'course' (lowercase)
Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions' });

// Submission associations
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' }); // Note: as: 'assignment' (lowercase)
Submission.belongsTo(Student, { foreignKey: 'studentId', as: 'student' }); // Note: as: 'student' (lowercase)

// Payment associations
Payment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' }); // Note: as: 'student' (lowercase)

// Announcement associations
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' }); // Note: as: 'creator' (lowercase)

// Schedule associations
Schedule.belongsTo(Course, { foreignKey: 'courseId', as: 'course' }); // Note: as: 'course' (lowercase)

module.exports = {
  User,
  Student,
  Teacher,
  Course,
  Enrollment,
  Assignment,
  Submission,
  Payment,
  Announcement,
  Schedule,
  Notification
};