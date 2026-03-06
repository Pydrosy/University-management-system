// backend/controllers/courseController.js
const { Course, Teacher, Enrollment, Student, Assignment, Submission, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all courses
exports.getAllCourses = catchAsync(async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: Teacher,
          as: 'teacher',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get single course
exports.getCourse = catchAsync(async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Teacher,
          as: 'teacher',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            {
              model: Student,
              as: 'student',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['firstName', 'lastName', 'email']
                }
              ]
            }
          ]
        },
        {
          model: Assignment,
          as: 'assignments',
          where: { status: 'published' },
          required: false,
          include: [
            {
              model: Submission,
              as: 'submissions'
            }
          ]
        }
      ]
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error in getCourse:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get course statistics
exports.getCourseStats = catchAsync(async (req, res, next) => {
  try {
    // Get teacher ID from user object
    const teacherId = req.user?.teacher?.id;

    console.log('Getting stats for teacher ID:', teacherId);

    if (!teacherId) {
      // If teacher ID not found, try to find it
      const teacher = await Teacher.findOne({ where: { userId: req.user.id } });
      if (!teacher) {
        return res.json({
          success: true,
          data: {
            totalCourses: 0,
            totalStudents: 0,
            activeAssignments: 0,
            pendingGrading: 0
          }
        });
      }
      
      // Get courses for this teacher
      const courses = await Course.findAll({
        where: { teacherId: teacher.id },
        attributes: ['id']
      });

      const courseIds = courses.map(c => c.id);

      let totalStudents = 0;
      let activeAssignments = 0;
      let pendingGrading = 0;

      if (courseIds.length > 0) {
        // Get total students across all courses
        totalStudents = await Enrollment.count({
          where: {
            courseId: { [Op.in]: courseIds },
            status: 'enrolled'
          },
          distinct: true,
          col: 'studentId'
        });

        // Get active assignments
        activeAssignments = await Assignment.count({
          where: {
            courseId: { [Op.in]: courseIds },
            dueDate: { [Op.gt]: new Date() },
            status: 'published'
          }
        });

        // Get pending grading
        pendingGrading = await Submission.count({
          where: {
            status: 'submitted',
            assignmentId: {
              [Op.in]: sequelize.literal(`(SELECT id FROM assignments WHERE course_id IN (${courseIds.join(',')}))`)
            }
          }
        });
      }

      return res.json({
        success: true,
        data: {
          totalCourses: courses.length,
          totalStudents,
          activeAssignments,
          pendingGrading
        }
      });
    }

    // If teacher ID exists, proceed normally
    const courses = await Course.findAll({
      where: { teacherId },
      attributes: ['id']
    });

    const courseIds = courses.map(c => c.id);

    let totalStudents = 0;
    let activeAssignments = 0;
    let pendingGrading = 0;

    if (courseIds.length > 0) {
      // Get total students across all courses
      totalStudents = await Enrollment.count({
        where: {
          courseId: { [Op.in]: courseIds },
          status: 'enrolled'
        },
        distinct: true,
        col: 'studentId'
      });

      // Get active assignments
      activeAssignments = await Assignment.count({
        where: {
          courseId: { [Op.in]: courseIds },
          dueDate: { [Op.gt]: new Date() },
          status: 'published'
        }
      });

      // Get pending grading
      pendingGrading = await Submission.count({
        where: {
          status: 'submitted',
          assignmentId: {
            [Op.in]: sequelize.literal(`(SELECT id FROM assignments WHERE course_id IN (${courseIds.join(',')}))`)
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents,
        activeAssignments,
        pendingGrading
      }
    });
  } catch (error) {
    console.error('Error in getCourseStats:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get teacher's courses
exports.getTeacherCourses = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    const courses = await Course.findAll({
      where: { teacherId },
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['studentId'],
          include: [
            {
              model: Student,
              as: 'student',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['firstName', 'lastName']
                }
              ]
            }
          ]
        },
        {
          model: Assignment,
          as: 'assignments',
          include: [
            {
              model: Submission,
              as: 'submissions'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Enhance courses with additional stats
    const enhancedCourses = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      
      // Get enrolled students count
      courseJson.enrolledStudents = course.enrollments?.length || 0;
      
      // Get pending grading count
      let pendingGrading = 0;
      if (course.assignments) {
        const assignmentIds = course.assignments.map(a => a.id);
        if (assignmentIds.length > 0) {
          pendingGrading = await Submission.count({
            where: {
              assignmentId: { [Op.in]: assignmentIds },
              status: 'submitted'
            }
          });
        }
      }
      courseJson.pendingGrading = pendingGrading;
      
      // Calculate average grade
      let totalScore = 0;
      let gradedCount = 0;
      if (course.assignments) {
        course.assignments.forEach(assignment => {
          if (assignment.submissions) {
            assignment.submissions.forEach(sub => {
              if (sub.status === 'graded' && sub.score) {
                totalScore += parseFloat(sub.score);
                gradedCount++;
              }
            });
          }
        });
      }
      courseJson.averageGrade = gradedCount > 0 ? (totalScore / gradedCount).toFixed(2) : 'N/A';
      
      return courseJson;
    }));

    res.json({
      success: true,
      data: enhancedCourses
    });
  } catch (error) {
    console.error('Error in getTeacherCourses:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create course (admin only)
exports.createCourse = catchAsync(async (req, res, next) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error in createCourse:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update course
exports.updateCourse = catchAsync(async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    await course.update(req.body);

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error in updateCourse:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete course
exports.deleteCourse = catchAsync(async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Check if there are enrolled students
    const enrolledCount = await Enrollment.count({ where: { courseId: course.id } });
    if (enrolledCount > 0) {
      return next(new AppError('Cannot delete course with enrolled students', 400));
    }

    await course.destroy();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    return next(new AppError(error.message, 500));
  }
});

// Enroll student in course
exports.enrollStudent = catchAsync(async (req, res, next) => {
  try {
    const { courseId, studentId } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Check if course is active
    if (course.status !== 'active') {
      return next(new AppError('Course is not active for enrollment', 400));
    }

    // Check if course has capacity
    if (course.enrolledStudents >= course.maxStudents) {
      return next(new AppError('Course is full', 400));
    }

    // Check if student exists
    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }]
    });
    
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { courseId, studentId }
    });

    if (existingEnrollment) {
      return next(new AppError('Student already enrolled in this course', 400));
    }

    const enrollment = await Enrollment.create({
      courseId,
      studentId,
      enrollmentDate: new Date(),
      status: 'enrolled'
    });

    // Update enrolled count
    await course.increment('enrolledStudents');

    // Send notifications to admins about new enrollment
    const io = req.app.get('io');
    const notificationController = require('./notificationController');

    // Find all admin users
    const admins = await User.findAll({ where: { role: 'admin' } });

    for (const admin of admins) {
      await notificationController.createNotification(
        admin.id,
        'enrollment',
        'New Course Enrollment',
        `${student.user?.firstName} ${student.user?.lastName} enrolled in ${course.courseName}.`,
        '/admin/students',
        { enrollmentId: enrollment.id, studentId, courseId }
      );
      
      if (io) {
        io.to(`user-${admin.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'enrollment',
          title: 'New Enrollment',
          description: `${student.user?.firstName} ${student.user?.lastName} enrolled in ${course.courseName}.`,
          time: new Date(),
          read: false,
          link: '/admin/students'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Error in enrollStudent:', error);
    return next(new AppError(error.message, 500));
  }
});

// Unenroll student from course
exports.unenrollStudent = catchAsync(async (req, res, next) => {
  try {
    const { courseId, studentId } = req.body;

    const enrollment = await Enrollment.findOne({
      where: { courseId, studentId }
    });

    if (!enrollment) {
      return next(new AppError('Enrollment not found', 404));
    }

    await enrollment.destroy();

    // Decrease enrolled count
    await Course.decrement('enrolledStudents', { where: { id: courseId } });

    res.json({
      success: true,
      message: 'Student unenrolled successfully'
    });
  } catch (error) {
    console.error('Error in unenrollStudent:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get course assignments
exports.getCourseAssignments = catchAsync(async (req, res, next) => {
  try {
    const assignments = await Assignment.findAll({
      where: { 
        courseId: req.params.id,
        status: 'published'
      },
      order: [['dueDate', 'ASC']]
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error in getCourseAssignments:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get available courses for enrollment
exports.getAvailableCourses = catchAsync(async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      where: {
        status: 'active',
        enrolledStudents: {
          [Op.lt]: sequelize.col('maxStudents')
        }
      },
      include: [
        {
          model: Teacher,
          as: 'teacher',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error in getAvailableCourses:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get courses by teacher
exports.getCoursesByTeacher = catchAsync(async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const courses = await Course.findAll({
      where: { teacherId },
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['studentId']
        }
      ]
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error in getCoursesByTeacher:', error);
    return next(new AppError(error.message, 500));
  }
});