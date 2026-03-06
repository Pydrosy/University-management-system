// backend/controllers/studentController.js
const { User, Student, Course, Enrollment, Assignment, Submission, Payment, Schedule } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// Get current student's dashboard (no ID needed - uses logged-in user)
exports.getMyDashboard = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    console.log('Getting my dashboard for student ID:', studentId);
    console.log('User from auth:', req.user ? {
      id: req.user.id,
      role: req.user.role,
      studentId: req.user.student?.id
    } : 'No user');

    if (!studentId) {
      return next(new AppError('Student profile not found. Please ensure you are logged in as a student.', 404));
    }
    
    // Reuse the existing getStudentDashboard function
    req.params.id = studentId;
    return exports.getStudentDashboard(req, res, next);
  } catch (error) {
    console.error('Error in getMyDashboard:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get current student's courses
exports.getMyCourses = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    if (!studentId) {
      return next(new AppError('Student profile not found', 404));
    }
    
    req.params.id = studentId;
    return exports.getStudentCourses(req, res, next);
  } catch (error) {
    console.error('Error in getMyCourses:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get current student's grades
exports.getMyGrades = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    if (!studentId) {
      return next(new AppError('Student profile not found', 404));
    }
    
    req.params.id = studentId;
    return exports.getStudentGrades(req, res, next);
  } catch (error) {
    console.error('Error in getMyGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get current student's fees
exports.getMyFees = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    if (!studentId) {
      return next(new AppError('Student profile not found', 404));
    }
    
    req.params.id = studentId;
    return exports.getStudentFees(req, res, next);
  } catch (error) {
    console.error('Error in getMyFees:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get current student's payments
exports.getMyPayments = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    if (!studentId) {
      return next(new AppError('Student profile not found', 404));
    }
    
    req.params.id = studentId;
    return exports.getPaymentHistory(req, res, next);
  } catch (error) {
    console.error('Error in getMyPayments:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get current student's schedule
exports.getMySchedule = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    if (!studentId) {
      return next(new AppError('Student profile not found', 404));
    }
    
    req.params.id = studentId;
    return exports.getStudentSchedule(req, res, next);
  } catch (error) {
    console.error('Error in getMySchedule:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get current student's assignments
exports.getMyAssignments = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    
    if (!studentId) {
      return next(new AppError('Student profile not found', 404));
    }
    
    req.params.id = studentId;
    return exports.getStudentAssignments(req, res, next);
  } catch (error) {
    console.error('Error in getMyAssignments:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student dashboard data (by ID - for admin)
exports.getStudentDashboard = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    console.log('Getting dashboard for student ID:', studentId);

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    // Get student details
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    // Get enrolled courses count
    const enrolledCourses = await Enrollment.count({
      where: { 
        studentId, 
        status: 'enrolled' 
      }
    });

    // Get completed courses count
    const completedCourses = await Enrollment.count({
      where: { 
        studentId, 
        status: 'completed' 
      }
    });

    // Get pending assignments
    const pendingAssignments = await Submission.count({
      where: { 
        studentId, 
        status: 'submitted' 
      }
    });

    // Get upcoming assignments (due in next 7 days)
    const upcomingAssignments = await Submission.findAll({
      where: {
        studentId,
        status: 'submitted'
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          where: {
            dueDate: {
              [Op.gte]: new Date(),
              [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          },
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['courseName']
            }
          ]
        }
      ],
      limit: 5,
      order: [[{ model: Assignment, as: 'assignment' }, 'dueDate', 'ASC']]
    });

    // Format upcoming assignments
    const formattedUpcomingAssignments = upcomingAssignments.map(sub => ({
      id: sub.assignment?.id,
      title: sub.assignment?.title,
      courseName: sub.assignment?.course?.courseName,
      dueDate: sub.assignment?.dueDate,
      status: sub.status
    }));

    // Get recent grades
    const recentGrades = await Submission.findAll({
      where: {
        studentId,
        status: 'graded',
        score: { [Op.ne]: null }
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['courseName']
            }
          ]
        }
      ],
      limit: 5,
      order: [['updatedAt', 'DESC']]
    });

    // Format recent grades
    const formattedRecentGrades = recentGrades.map(sub => ({
      id: sub.id,
      assignmentName: sub.assignment?.title,
      courseName: sub.assignment?.course?.courseName,
      score: sub.score,
      grade: sub.grade,
      feedback: sub.feedback
    }));

    // Get today's schedule
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = daysOfWeek[new Date().getDay()];
    
    const studentCourses = await Enrollment.findAll({
      where: { 
        studentId,
        status: 'enrolled'
      },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: Schedule,
              as: 'schedules',
              where: { dayOfWeek: today },
              required: false
            }
          ]
        }
      ]
    });

    const todaySchedule = [];
    studentCourses.forEach(enrollment => {
      if (enrollment.course?.schedules) {
        enrollment.course.schedules.forEach(schedule => {
          todaySchedule.push({
            id: schedule.id,
            courseName: enrollment.course.courseName,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            classroom: schedule.classroom
          });
        });
      }
    });

    // Get fee reminders
    const feeReminders = await Payment.findAll({
      where: {
        studentId,
        status: 'pending',
        dueDate: {
          [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Due within 30 days
        }
      },
      order: [['dueDate', 'ASC']],
      limit: 5
    });

    // Calculate fees due
    const feesDue = feeReminders.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);

    // Calculate credits earned
    const completedEnrollments = await Enrollment.findAll({
      where: { 
        studentId,
        status: 'completed'
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['credits']
        }
      ]
    });

    const creditsEarned = completedEnrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0);

    // Calculate attendance rate (mock data for now)
    const attendanceRate = 85; // This should be calculated from actual attendance data

    res.json({
      success: true,
      data: {
        enrolledCourses,
        completedCourses,
        pendingAssignments,
        currentGPA: student.gpa || 0,
        feesDue,
        creditsEarned,
        attendanceRate,
        upcomingAssignments: formattedUpcomingAssignments,
        recentGrades: formattedRecentGrades,
        todaySchedule: todaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        feeReminders
      }
    });

  } catch (error) {
    console.error('Error in getStudentDashboard:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student courses
exports.getStudentCourses = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    const enrollments = await Enrollment.findAll({
      where: { 
        studentId,
        status: 'enrolled'
      },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: Schedule,
              as: 'schedules'
            },
            {
              model: Assignment,
              as: 'assignments',
              where: { status: 'published' },
              required: false
            }
          ]
        }
      ]
    });

    const courses = await Promise.all(enrollments.map(async (e) => ({
      id: e.course.id,
      courseCode: e.course.courseCode,
      courseName: e.course.courseName,
      description: e.course.description,
      credits: e.course.credits,
      department: e.course.department,
      semester: e.course.semester,
      schedules: e.course.schedules || [],
      assignments: e.course.assignments?.map(a => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        maxScore: a.maxScore
      })) || [],
      progress: await calculateCourseProgress(e.course, studentId)
    })));

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Error in getStudentCourses:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student grades
exports.getStudentGrades = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    const submissions = await Submission.findAll({
      where: { 
        studentId,
        status: 'graded'
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'courseName', 'courseCode', 'credits']
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Group by course
    const gradesByCourse = {};
    submissions.forEach(sub => {
      const courseId = sub.assignment?.course?.id;
      if (!courseId) return;
      
      if (!gradesByCourse[courseId]) {
        gradesByCourse[courseId] = {
          courseId,
          courseName: sub.assignment.course.courseName,
          courseCode: sub.assignment.course.courseCode,
          credits: sub.assignment.course.credits,
          assignments: []
        };
      }
      
      gradesByCourse[courseId].assignments.push({
        id: sub.id,
        assignmentId: sub.assignmentId,
        assignmentName: sub.assignment.title,
        score: sub.score,
        grade: sub.grade,
        feedback: sub.feedback,
        submittedAt: sub.submissionDate,
        gradedAt: sub.updatedAt
      });
    });

    // Calculate GPA
    const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
    let totalPoints = 0;
    let totalCredits = 0;

    submissions.forEach(sub => {
      if (sub.grade && sub.assignment?.course?.credits) {
        totalPoints += (gradePoints[sub.grade] || 0) * sub.assignment.course.credits;
        totalCredits += sub.assignment.course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        gpa,
        totalCredits,
        courses: Object.values(gradesByCourse),
        allGrades: submissions
      }
    });

  } catch (error) {
    console.error('Error in getStudentGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student fees
exports.getStudentFees = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    const dueFees = await Payment.findAll({
      where: {
        studentId,
        status: 'pending'
      },
      order: [['dueDate', 'ASC']]
    });

    const totalDue = dueFees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalDue,
        dueFees
      }
    });

  } catch (error) {
    console.error('Error in getStudentFees:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get payment history
exports.getPaymentHistory = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    const payments = await Payment.findAll({
      where: {
        studentId,
        status: 'completed'
      },
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    return next(new AppError(error.message, 500));
  }
});

// Make payment
exports.makePayment = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    const { feeId, amount, paymentMethod } = req.body;

    if (!studentId) {
      return next(new AppError('Student ID not found', 404));
    }

    const payment = await Payment.findByPk(feeId, {
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
    });

    if (!payment || payment.studentId !== studentId) {
      return next(new AppError('Payment record not found', 404));
    }

    if (payment.status === 'completed') {
      return next(new AppError('Payment already completed', 400));
    }

    payment.status = 'completed';
    payment.paymentDate = new Date();
    payment.transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    payment.paymentMethod = paymentMethod;
    await payment.save();

    // Get io instance
    const io = req.app.get('io');
    const notificationController = require('./notificationController');

    // Get student details
    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }]
    });

    // Find all admin users
    const admins = await User.findAll({ where: { role: 'admin' } });

    // Send notifications to admins
    for (const admin of admins) {
      await notificationController.createNotification(
        admin.id,
        'payment',
        'Payment Received',
        `${student?.user?.firstName} ${student?.user?.lastName} made a payment of $${amount}.`,
        '/admin/fees',
        { paymentId: payment.id, studentId, amount }
      );
      
      if (io) {
        io.to(`user-${admin.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'payment',
          title: 'Payment Received',
          description: `Payment of $${amount} received from ${student?.user?.firstName} ${student?.user?.lastName}.`,
          time: new Date(),
          read: false,
          link: '/admin/fees'
        });
      }
    }

    // Send notification to student
    await notificationController.createNotification(
      studentId,
      'payment',
      'Payment Successful',
      `Your payment of $${amount} has been processed successfully.`,
      '/student/fees',
      { paymentId: payment.id, amount }
    );

    if (io) {
      io.to(`user-${studentId}`).emit('new-notification', {
        id: Date.now(),
        type: 'payment',
        title: 'Payment Successful',
        description: `Your payment of $${amount} has been processed.`,
        time: new Date(),
        read: false,
        link: '/student/fees'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error in makePayment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student schedule
exports.getStudentSchedule = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    const enrollments = await Enrollment.findAll({
      where: { 
        studentId,
        status: 'enrolled'
      },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: Schedule,
              as: 'schedules'
            }
          ]
        }
      ]
    });

    const schedule = [];
    enrollments.forEach(enrollment => {
      if (enrollment.course?.schedules) {
        enrollment.course.schedules.forEach(s => {
          schedule.push({
            id: s.id,
            courseId: enrollment.course.id,
            courseName: enrollment.course.courseName,
            courseCode: enrollment.course.courseCode,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            classroom: s.classroom
          });
        });
      }
    });

    // Group by day
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleByDay = daysOfWeek.reduce((acc, day) => {
      acc[day] = schedule.filter(s => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        schedule,
        scheduleByDay
      }
    });

  } catch (error) {
    console.error('Error in getStudentSchedule:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student assignments
exports.getStudentAssignments = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return next(new AppError('Student ID not provided', 400));
    }

    const enrollments = await Enrollment.findAll({
      where: { 
        studentId,
        status: 'enrolled'
      },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: Assignment,
              as: 'assignments',
              where: { status: 'published' },
              required: false
            }
          ]
        }
      ]
    });

    const assignments = [];
    const pendingAssignments = [];
    const submittedAssignments = [];

    for (const enrollment of enrollments) {
      if (enrollment.course?.assignments) {
        for (const assignment of enrollment.course.assignments) {
          const submission = await Submission.findOne({
            where: {
              assignmentId: assignment.id,
              studentId
            }
          });

          const assignmentData = {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            courseId: enrollment.course.id,
            courseName: enrollment.course.courseName,
            courseCode: enrollment.course.courseCode,
            dueDate: assignment.dueDate,
            maxScore: assignment.maxScore,
            instructions: assignment.instructions,
            status: submission ? submission.status : 'pending',
            submission: submission ? {
              id: submission.id,
              submissionDate: submission.submissionDate,
              score: submission.score,
              feedback: submission.feedback,
              status: submission.status
            } : null
          };

          assignments.push(assignmentData);

          if (!submission) {
            pendingAssignments.push(assignmentData);
          } else {
            submittedAssignments.push(assignmentData);
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        assignments,
        pending: pendingAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        submitted: submittedAssignments.sort((a, b) => new Date(b.submission.submissionDate) - new Date(a.submission.submissionDate))
      }
    });

  } catch (error) {
    console.error('Error in getStudentAssignments:', error);
    return next(new AppError(error.message, 500));
  }
});

// Helper function to calculate course progress
async function calculateCourseProgress(course, studentId) {
  try {
    const assignments = await Assignment.findAll({
      where: { courseId: course.id }
    });

    if (assignments.length === 0) return 0;

    const submissions = await Submission.findAll({
      where: {
        studentId,
        assignmentId: {
          [Op.in]: assignments.map(a => a.id)
        }
      }
    });

    const gradedCount = submissions.filter(s => s.status === 'graded').length;
    return Math.round((gradedCount / assignments.length) * 100);
  } catch (error) {
    console.error('Error calculating course progress:', error);
    return 0;
  }
}

// Get all students (admin only)
exports.getAllStudents = catchAsync(async (req, res, next) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'profilePicture', 'isActive']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get single student
exports.getStudent = catchAsync(async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'profilePicture', 'dateOfBirth', 'isActive']
        },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'courseCode', 'courseName', 'credits', 'department']
            }
          ]
        },
        {
          model: Payment,
          as: 'payments',
          required: false
        }
      ]
    });

    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error in getStudent:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create student (admin only) with notification to admins
exports.createStudent = catchAsync(async (req, res, next) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      studentNumber, 
      major, 
      phone, 
      address, 
      dateOfBirth, 
      enrollmentDate,
      currentSemester,
      status 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Check if student number already exists
    const existingStudent = await Student.findOne({ where: { studentNumber } });
    if (existingStudent) {
      return next(new AppError('Student number already exists', 400));
    }

    // Hash password
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10) 
      : await bcrypt.hash('student123', 10);

    // Create user first
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      address: address || null,
      dateOfBirth: dateOfBirth || null,
      role: 'student',
      isActive: status === 'active'
    });

    // Create student profile
    const student = await Student.create({
      userId: user.id,
      studentNumber,
      major: major || null,
      enrollmentDate: enrollmentDate || new Date(),
      currentSemester: currentSemester || 1,
      gpa: 0.00
    });

    // Fetch the created student with user details
    const createdStudent = await Student.findByPk(student.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'dateOfBirth', 'isActive']
        }
      ]
    });

    // Send notifications to all admins
    const io = req.app.get('io');
    const notificationController = require('./notificationController');
    
    // Find all admin users
    const admins = await User.findAll({ where: { role: 'admin' } });

    for (const admin of admins) {
      await notificationController.createNotification(
        admin.id,
        'student',
        'New Student Registered',
        `${firstName} ${lastName} (${studentNumber}) has registered as a new student.`,
        '/admin/students',
        { studentId: student.id }
      );
      
      if (io) {
        io.to(`user-${admin.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'student',
          title: 'New Student Registered',
          description: `${firstName} ${lastName} has registered.`,
          time: new Date(),
          read: false,
          link: '/admin/students'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: createdStudent
    });
  } catch (error) {
    console.error('Error in createStudent:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Email or Student number already exists', 400));
    }
    
    return next(new AppError(error.message, 500));
  }
});

// Update student
exports.updateStudent = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      dateOfBirth, 
      major, 
      studentNumber, 
      currentSemester,
      status 
    } = req.body;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    // Check if email is being changed and if it's already taken by another user
    if (email && student.user && email !== student.user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: student.user.id }
        } 
      });
      
      if (existingUser) {
        return next(new AppError('Email is already in use by another user', 400));
      }
    }

    // Check if student number is being changed and if it's already taken
    if (studentNumber && studentNumber !== student.studentNumber) {
      const existingStudent = await Student.findOne({ 
        where: { 
          studentNumber,
          id: { [Op.ne]: student.id }
        } 
      });
      
      if (existingStudent) {
        return next(new AppError('Student number already exists', 400));
      }
    }

    // Update user information
    if (student.user) {
      const userUpdateData = {};
      if (firstName) userUpdateData.firstName = firstName;
      if (lastName) userUpdateData.lastName = lastName;
      if (email) userUpdateData.email = email;
      if (phone !== undefined) userUpdateData.phone = phone;
      if (address !== undefined) userUpdateData.address = address;
      if (dateOfBirth !== undefined) userUpdateData.dateOfBirth = dateOfBirth;
      if (status !== undefined) userUpdateData.isActive = status === 'active';
      
      if (Object.keys(userUpdateData).length > 0) {
        await student.user.update(userUpdateData);
      }
    }

    // Update student information
    const studentUpdateData = {};
    if (studentNumber) studentUpdateData.studentNumber = studentNumber;
    if (major !== undefined) studentUpdateData.major = major;
    if (currentSemester) studentUpdateData.currentSemester = currentSemester;
    
    if (Object.keys(studentUpdateData).length > 0) {
      await student.update(studentUpdateData);
    }

    // Fetch updated student
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'dateOfBirth', 'isActive']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error in updateStudent:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Email or Student number already exists', 400));
    }
    
    return next(new AppError(error.message, 500));
  }
});

// Delete student
exports.deleteStudent = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    // Check if student has enrollments
    const enrollmentCount = await Enrollment.count({ where: { studentId: id } });
    if (enrollmentCount > 0) {
      return next(new AppError('Cannot delete student with active enrollments. Please unenroll first.', 400));
    }

    // Check if student has payments
    const paymentCount = await Payment.count({ where: { studentId: id } });
    if (paymentCount > 0) {
      return next(new AppError('Cannot delete student with payment history.', 400));
    }

    // Delete user first (will cascade to student due to foreign key)
    if (student.user) {
      await student.user.destroy();
    } else {
      await student.destroy();
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk delete students
exports.bulkDeleteStudents = catchAsync(async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide an array of student IDs', 400));
    }

    // Check if any students have enrollments
    const studentsWithEnrollments = await Enrollment.count({
      where: {
        studentId: {
          [Op.in]: ids
        }
      }
    });

    if (studentsWithEnrollments > 0) {
      return next(new AppError('Cannot delete students with active enrollments. Please unenroll first.', 400));
    }

    // Check if any students have payments
    const studentsWithPayments = await Payment.count({
      where: {
        studentId: {
          [Op.in]: ids
        }
      }
    });

    if (studentsWithPayments > 0) {
      return next(new AppError('Cannot delete students with payment history.', 400));
    }

    // Get all students to delete their users
    const students = await Student.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });

    // Delete users (will cascade to students)
    for (const student of students) {
      if (student.user) {
        await student.user.destroy();
      }
    }

    res.json({
      success: true,
      message: `${ids.length} students deleted successfully`
    });
  } catch (error) {
    console.error('Error in bulkDeleteStudents:', error);
    return next(new AppError(error.message, 500));
  }
});