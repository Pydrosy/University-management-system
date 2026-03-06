// backend/controllers/assignmentController.js
const { Assignment, Submission, Course, Student, User, Teacher, Enrollment } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

// Get teacher's assignments
exports.getTeacherAssignments = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;
    const { courseId } = req.query;

    console.log('Getting assignments for teacher ID:', teacherId);

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    // Get teacher's courses
    const courseWhere = { teacherId };
    if (courseId) {
      courseWhere.id = courseId;
    }

    const courses = await Course.findAll({
      where: courseWhere,
      attributes: ['id', 'courseName', 'courseCode', 'enrolledStudents']
    });

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get assignments for these courses
    const assignments = await Assignment.findAll({
      where: {
        courseId: { [Op.in]: courseIds }
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'courseName', 'courseCode', 'enrolledStudents']
        },
        {
          model: Submission,
          as: 'submissions',
          attributes: ['id', 'studentId', 'status', 'score'],
          required: false
        }
      ],
      order: [['dueDate', 'DESC']]
    });

    // Enhance assignments with submission counts
    const enhancedAssignments = assignments.map(assignment => {
      const assignmentJson = assignment.toJSON();
      assignmentJson.submissionCount = assignment.submissions?.length || 0;
      assignmentJson.gradedCount = assignment.submissions?.filter(s => s.status === 'graded').length || 0;
      return assignmentJson;
    });

    res.json({
      success: true,
      data: enhancedAssignments
    });

  } catch (error) {
    console.error('Error in getTeacherAssignments:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get all assignments for a course
exports.getCourseAssignments = catchAsync(async (req, res, next) => {
  try {
    const assignments = await Assignment.findAll({
      where: { 
        courseId: req.params.courseId,
        status: 'published'
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'courseName', 'courseCode']
        }
      ],
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

// Get single assignment
exports.getAssignment = catchAsync(async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
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
          ]
        },
        {
          model: Submission,
          as: 'submissions',
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
          ],
          required: false
        }
      ]
    });

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    // Check if student is enrolled in this course
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        where: {
          studentId: req.user.student?.id,
          courseId: assignment.courseId
        }
      });

      if (!enrollment) {
        return next(new AppError('You are not enrolled in this course', 403));
      }
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error in getAssignment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create assignment
// backend/controllers/assignmentController.js - Add notification for new assignments

// Create assignment
exports.createAssignment = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;
    const { courseId, title, description, type, maxScore, dueDate, instructions } = req.body;
    const file = req.file;

    console.log('Creating assignment with data:', { courseId, title, type, maxScore, dueDate });

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    // Check if course belongs to teacher
    const course = await Course.findOne({
      where: { id: courseId, teacherId },
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          where: { status: 'enrolled' },
          include: [
            {
              model: Student,
              as: 'student',
              include: [
                {
                  model: User,
                  as: 'user'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!course) {
      return next(new AppError('Course not found or unauthorized', 404));
    }

    const assignment = await Assignment.create({
      courseId,
      title,
      description,
      type: type || 'assignment',
      maxScore: maxScore || 100,
      dueDate,
      instructions,
      fileUrl: file ? file.path : null,
      status: 'published'
    });

    // Send notifications to all enrolled students
    const notificationController = require('./notificationController');
    const io = req.app.get('io');

    if (course.enrollments && course.enrollments.length > 0) {
      for (const enrollment of course.enrollments) {
        const student = enrollment.student;
        if (student && student.user) {
          await notificationController.createNotification(
            student.user.id,
            'assignment',
            'New Assignment Posted',
            `New assignment "${title}" has been posted in ${course.courseName}`,
            '/student/assignments',
            {
              assignmentId: assignment.id,
              courseId: course.id,
              dueDate
            }
          );

          // Emit socket event
          if (io) {
            io.to(`user-${student.user.id}`).emit('new-notification', {
              id: Date.now(),
              type: 'assignment',
              title: 'New Assignment Posted',
              description: `New assignment "${title}" in ${course.courseName}`,
              time: new Date(),
              read: false,
              link: '/student/assignments'
            });
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error in createAssignment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update assignment
exports.updateAssignment = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, maxScore, dueDate, instructions, status } = req.body;

    const assignment = await Assignment.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    // Verify teacher owns this course
    const teacherId = req.user?.teacher?.id;
    if (assignment.course?.teacherId !== teacherId) {
      return next(new AppError('You are not authorized to update this assignment', 403));
    }

    await assignment.update({
      title: title || assignment.title,
      description: description !== undefined ? description : assignment.description,
      type: type || assignment.type,
      maxScore: maxScore || assignment.maxScore,
      dueDate: dueDate || assignment.dueDate,
      instructions: instructions !== undefined ? instructions : assignment.instructions,
      status: status || assignment.status
    });

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error in updateAssignment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete assignment
exports.deleteAssignment = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    // Verify teacher owns this course
    const teacherId = req.user?.teacher?.id;
    if (assignment.course?.teacherId !== teacherId) {
      return next(new AppError('You are not authorized to delete this assignment', 403));
    }

    // Check if there are submissions
    const submissionCount = await Submission.count({ where: { assignmentId: id } });
    if (submissionCount > 0) {
      return next(new AppError('Cannot delete assignment with existing submissions', 400));
    }

    await assignment.destroy();

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteAssignment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get assignment submissions
exports.getAssignmentSubmissions = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const submissions = await Submission.findAll({
      where: { assignmentId: id },
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
      ],
      order: [['submissionDate', 'DESC']]
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error in getAssignmentSubmissions:', error);
    return next(new AppError(error.message, 500));
  }
});

// Submit assignment (for students)
exports.submitAssignment = catchAsync(async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const studentId = req.user.student?.id;
    const { submissionText } = req.body;
    const file = req.file;

    if (!studentId) {
      return next(new AppError('Student ID not found', 404));
    }

    // Check if assignment exists and is open
    const assignment = await Assignment.findByPk(assignmentId, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    if (assignment.status !== 'published') {
      return next(new AppError('Assignment is not open for submissions', 400));
    }

    // Check if student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      where: {
        studentId,
        courseId: assignment.courseId
      }
    });

    if (!enrollment) {
      return next(new AppError('You are not enrolled in this course', 403));
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      where: { assignmentId, studentId }
    });

    if (existingSubmission) {
      return next(new AppError('You have already submitted this assignment', 400));
    }

    const submission = await Submission.create({
      assignmentId,
      studentId,
      submissionText,
      fileUrl: file ? file.path : null,
      submissionDate: new Date(),
      status: new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted'
    });

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student's submissions
exports.getMySubmissions = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user.student?.id;

    if (!studentId) {
      return next(new AppError('Student ID not found', 404));
    }

    const submissions = await Submission.findAll({
      where: { studentId },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'courseName', 'courseCode']
            }
          ]
        }
      ],
      order: [['submissionDate', 'DESC']]
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error in getMySubmissions:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student's assignments (for a specific course)
exports.getStudentAssignments = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user.student?.id;
    const { courseId } = req.params;

    if (!studentId) {
      return next(new AppError('Student ID not found', 404));
    }

    // Get all assignments for the course
    const assignments = await Assignment.findAll({
      where: {
        courseId,
        status: 'published'
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'courseName', 'courseCode']
        },
        {
          model: Submission,
          as: 'submissions',
          where: { studentId },
          required: false
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    // Add submission status to each assignment
    const enhancedAssignments = assignments.map(assignment => {
      const assignmentJson = assignment.toJSON();
      assignmentJson.submitted = assignment.submissions && assignment.submissions.length > 0;
      assignmentJson.submission = assignment.submissions?.[0] || null;
      return assignmentJson;
    });

    res.json({
      success: true,
      data: enhancedAssignments
    });
  } catch (error) {
    console.error('Error in getStudentAssignments:', error);
    return next(new AppError(error.message, 500));
  }
});