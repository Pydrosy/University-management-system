// backend/controllers/gradeController.js
const { Submission, Assignment, Course, Student, User, Teacher } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get teacher's grades (all submissions for teacher's courses)
exports.getTeacherGrades = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    const { courseId, assignmentId } = req.query;

    // Get teacher's courses
    const courseWhere = { teacherId };
    if (courseId) {
      courseWhere.id = courseId;
    }

    const courses = await Course.findAll({
      where: courseWhere,
      attributes: ['id']
    });

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: {
          submissions: [],
          averageScore: 0
        }
      });
    }

    // Get assignments for these courses
    const assignmentWhere = {
      courseId: { [Op.in]: courseIds }
    };
    if (assignmentId) {
      assignmentWhere.id = assignmentId;
    }

    const assignments = await Assignment.findAll({
      where: assignmentWhere,
      attributes: ['id']
    });

    const assignmentIds = assignments.map(a => a.id);

    if (assignmentIds.length === 0) {
      return res.json({
        success: true,
        data: {
          submissions: [],
          averageScore: 0
        }
      });
    }

    // Get all submissions for these assignments
    const submissions = await Submission.findAll({
      where: {
        assignmentId: { [Op.in]: assignmentIds }
      },
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
          ],
          attributes: ['id', 'studentNumber', 'major']
        },
        {
          model: Assignment,
          as: 'assignment',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'courseName', 'courseCode']
            }
          ],
          attributes: ['id', 'title', 'maxScore', 'dueDate']
        }
      ],
      order: [['submissionDate', 'DESC']]
    });

    // Calculate average score
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== null);
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.score || 0), 0);
    const averageScore = gradedSubmissions.length > 0 
      ? ((totalScore / gradedSubmissions.length)).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        submissions,
        averageScore
      }
    });

  } catch (error) {
    console.error('Error in getTeacherGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Grade a single submission
exports.gradeSubmission = catchAsync(async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback, grade } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [
            {
              model: Course,
              as: 'course'
            }
          ]
        },
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

    if (!submission) {
      return next(new AppError('Submission not found', 404));
    }

    // Verify teacher owns this course
    const teacherId = req.user?.teacher?.id;
    if (submission.assignment?.course?.teacherId !== teacherId) {
      return next(new AppError('You are not authorized to grade this submission', 403));
    }

    // Validate score
    const maxScore = submission.assignment?.maxScore || 100;
    if (score < 0 || score > maxScore) {
      return next(new AppError(`Score must be between 0 and ${maxScore}`, 400));
    }

    await submission.update({
      score: parseFloat(score),
      feedback,
      grade,
      status: 'graded'
    });

    // Get notification helper from app
    const notificationHelper = req.app.get('notificationHelper');
    const io = req.app.get('io');
    
    // Send notification to student
    const studentUser = submission.student?.user;
    if (studentUser) {
      const courseName = submission.assignment?.course?.courseName || 'Unknown Course';
      const assignmentName = submission.assignment?.title || 'Unknown Assignment';
      
      // Create notification in database and send via socket
      await notificationHelper.sendGradePublished(
        studentUser.id,
        assignmentName,
        courseName,
        score,
        maxScore,
        submission.id
      );

      // Also emit socket event for real-time update
      if (io) {
        io.to(`user-${studentUser.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'grade',
          title: 'Grade Published',
          description: `Your assignment "${assignmentName}" in ${courseName} has been graded. Score: ${score}/${maxScore}`,
          time: new Date(),
          read: false,
          link: '/student/grades'
        });
      }
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error in gradeSubmission:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk grade submissions
exports.bulkGradeSubmissions = catchAsync(async (req, res, next) => {
  try {
    const { grades } = req.body;
    const teacherId = req.user?.teacher?.id;

    if (!Array.isArray(grades) || grades.length === 0) {
      return next(new AppError('Please provide an array of grades', 400));
    }

    const results = [];
    const errors = [];
    const notificationHelper = req.app.get('notificationHelper');
    const io = req.app.get('io');

    for (const item of grades) {
      try {
        const submission = await Submission.findByPk(item.submissionId, {
          include: [
            {
              model: Assignment,
              as: 'assignment',
              include: [
                {
                  model: Course,
                  as: 'course'
                }
              ]
            },
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

        if (!submission) {
          errors.push({ submissionId: item.submissionId, error: 'Submission not found' });
          continue;
        }

        // Verify teacher owns this course
        if (submission.assignment?.course?.teacherId !== teacherId) {
          errors.push({ submissionId: item.submissionId, error: 'Not authorized' });
          continue;
        }

        await submission.update({
          score: parseFloat(item.score),
          feedback: item.feedback,
          grade: item.grade,
          status: 'graded'
        });

        results.push(submission);

        // Send notification to student
        const studentUser = submission.student?.user;
        if (studentUser) {
          const courseName = submission.assignment?.course?.courseName || 'Unknown Course';
          const assignmentName = submission.assignment?.title || 'Unknown Assignment';
          const maxScore = submission.assignment?.maxScore || 100;
          
          // Create notification in database and send via socket
          await notificationHelper.sendGradePublished(
            studentUser.id,
            assignmentName,
            courseName,
            item.score,
            maxScore,
            submission.id
          );

          // Also emit socket event for real-time update
          if (io) {
            io.to(`user-${studentUser.id}`).emit('new-notification', {
              id: Date.now(),
              type: 'grade',
              title: 'Grade Published',
              description: `Your assignment "${assignmentName}" in ${courseName} has been graded. Score: ${item.score}/${maxScore}`,
              time: new Date(),
              read: false,
              link: '/student/grades'
            });
          }
        }
      } catch (error) {
        errors.push({ submissionId: item.submissionId, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        graded: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Error in bulkGradeSubmissions:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get course statistics for teacher
exports.getCourseStats = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;

    const courses = await Course.findAll({
      where: { teacherId },
      attributes: ['id', 'courseName', 'courseCode'],
      include: [
        {
          model: Assignment,
          as: 'assignments',
          attributes: ['id', 'title', 'maxScore'],
          include: [
            {
              model: Submission,
              as: 'submissions',
              attributes: ['id', 'score', 'status']
            }
          ]
        }
      ]
    });

    const stats = courses.map(course => {
      const totalSubmissions = course.assignments?.reduce((sum, a) => 
        sum + (a.submissions?.length || 0), 0) || 0;
      
      const gradedSubmissions = course.assignments?.reduce((sum, a) => 
        sum + (a.submissions?.filter(s => s.status === 'graded').length || 0), 0) || 0;

      const pendingSubmissions = course.assignments?.reduce((sum, a) => 
        sum + (a.submissions?.filter(s => s.status === 'submitted').length || 0), 0) || 0;

      const totalScore = course.assignments?.reduce((sum, a) => 
        sum + (a.submissions?.filter(s => s.status === 'graded')
          .reduce((sSum, s) => sSum + parseFloat(s.score || 0), 0) || 0), 0) || 0;

      const averageScore = gradedSubmissions > 0 
        ? (totalScore / gradedSubmissions).toFixed(2) 
        : 0;

      return {
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        averageScore
      };
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error in getCourseStats:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get all grades (admin) - FIXED VERSION WITH STUDENT NAMES
exports.getAllGrades = catchAsync(async (req, res, next) => {
  try {
    const { courseId, studentId, assignmentId, status, fromDate, toDate } = req.query;

    // Build where clause
    const whereClause = {};
    if (status) whereClause.status = status;
    if (assignmentId) whereClause.assignmentId = assignmentId;
    
    // Date range filter
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
    }

    const submissions = await Submission.findAll({
      where: whereClause,
      include: [
        {
          model: Assignment,
          as: 'assignment',
          required: false,
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'courseCode', 'courseName', 'department', 'credits']
            }
          ],
          attributes: ['id', 'title', 'maxScore', 'dueDate', 'type']
        },
        {
          model: Student,
          as: 'student',
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ],
          attributes: ['id', 'studentNumber', 'major']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Filter by courseId or studentId if provided
    let filteredSubmissions = submissions;
    if (courseId) {
      filteredSubmissions = filteredSubmissions.filter(s => 
        s.assignment?.course?.id == courseId
      );
    }
    if (studentId) {
      filteredSubmissions = filteredSubmissions.filter(s => 
        s.studentId == studentId
      );
    }

    // Calculate statistics
    const gradedSubmissions = filteredSubmissions.filter(s => s.status === 'graded' && s.score !== null);
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.score || 0), 0);
    const averageScore = gradedSubmissions.length > 0 
      ? (totalScore / gradedSubmissions.length).toFixed(2) 
      : 0;

    // Calculate pass rate (score >= 60% of maxScore)
    const passedCount = gradedSubmissions.filter(s => {
      const maxScore = s.assignment?.maxScore || 100;
      const percentage = (parseFloat(s.score || 0) / maxScore) * 100;
      return percentage >= 60;
    }).length;
    const passRate = gradedSubmissions.length > 0 
      ? ((passedCount / gradedSubmissions.length) * 100).toFixed(2) 
      : 0;

    const stats = {
      totalSubmissions: filteredSubmissions.length,
      gradedCount: filteredSubmissions.filter(s => s.status === 'graded').length,
      pendingCount: filteredSubmissions.filter(s => s.status === 'submitted').length,
      lateCount: filteredSubmissions.filter(s => s.status === 'late').length,
      averageScore,
      passRate
    };

    // Group by course for course statistics
    const courseMap = new Map();
    
    filteredSubmissions.forEach(sub => {
      const course = sub.assignment?.course;
      if (!course) return;
      
      const courseId = course.id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseName: course.courseName,
          courseCode: course.courseCode,
          totalSubmissions: 0,
          gradedCount: 0,
          totalScore: 0
        });
      }
      
      const courseStat = courseMap.get(courseId);
      courseStat.totalSubmissions++;
      
      if (sub.status === 'graded' && sub.score !== null) {
        courseStat.gradedCount++;
        courseStat.totalScore += parseFloat(sub.score);
      }
    });

    // Calculate averages for each course
    const courseStats = Array.from(courseMap.values()).map(course => ({
      ...course,
      averageScore: course.gradedCount > 0 ? (course.totalScore / course.gradedCount).toFixed(2) : 0,
      totalScore: undefined
    }));

    res.json({
      success: true,
      data: {
        submissions: filteredSubmissions,
        stats,
        courseStats
      }
    });

  } catch (error) {
    console.error('Error in getAllGrades:', error);
    // Return empty data instead of error
    res.json({
      success: true,
      data: {
        submissions: [],
        stats: {
          totalSubmissions: 0,
          gradedCount: 0,
          pendingCount: 0,
          lateCount: 0,
          averageScore: 0,
          passRate: 0
        },
        courseStats: []
      }
    });
  }
});

// Get grade statistics (admin) - FIXED VERSION
exports.getGradeStatistics = catchAsync(async (req, res, next) => {
  try {
    const { courseId, department } = req.query;

    // Get all graded submissions
    const submissions = await Submission.findAll({
      where: {
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
              where: department ? { department } : {},
              attributes: ['id', 'courseName', 'department', 'courseCode']
            }
          ]
        }
      ],
      // REMOVED 'grade' from attributes since it doesn't exist in the table
      attributes: ['id', 'score', 'status', 'createdAt']
    });

    // Filter by courseId if provided
    let filteredSubmissions = submissions;
    if (courseId) {
      filteredSubmissions = submissions.filter(s => 
        s.assignment?.course?.id == courseId
      );
    }

    // Calculate grade distribution based on score percentages
    const calculateGradeFromScore = (score, maxScore) => {
      if (!score || !maxScore) return null;
      const percentage = (parseFloat(score) / maxScore) * 100;
      if (percentage >= 90) return 'A';
      if (percentage >= 80) return 'B';
      if (percentage >= 70) return 'C';
      if (percentage >= 60) return 'D';
      return 'F';
    };

    // Calculate grade distribution using score-based calculation
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };

    filteredSubmissions.forEach(sub => {
      const maxScore = sub.assignment?.maxScore || 100;
      const grade = calculateGradeFromScore(sub.score, maxScore);
      if (grade && gradeDistribution.hasOwnProperty(grade)) {
        gradeDistribution[grade]++;
      }
    });

    // Monthly trend
    let monthlyTrend = [];
    try {
      monthlyTrend = await sequelize.query(`
        SELECT 
          DATE_FORMAT(created_at, '%b') as month,
          COUNT(*) as count
        FROM submissions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND status = 'graded'
        AND score IS NOT NULL
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY MIN(created_at) ASC
      `, { type: sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.error('Error fetching monthly trend:', err);
      monthlyTrend = [];
    }

    // Course performance
    const coursePerformance = [];
    const courseMap = new Map();

    filteredSubmissions.forEach(sub => {
      const course = sub.assignment?.course;
      if (!course) return;

      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, {
          courseId: course.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          totalScore: 0,
          count: 0
        });
      }

      const courseData = courseMap.get(course.id);
      if (sub.score) {
        courseData.totalScore += parseFloat(sub.score);
        courseData.count++;
      }
    });

    courseMap.forEach((value, key) => {
      coursePerformance.push({
        courseId: value.courseId,
        courseName: value.courseName,
        courseCode: value.courseCode,
        averageScore: value.count > 0 ? (value.totalScore / value.count).toFixed(2) : 0,
        submissionCount: value.count
      });
    });

    res.json({
      success: true,
      data: {
        gradeDistribution,
        monthlyTrend: monthlyTrend.map(m => ({
          month: m.month,
          count: parseInt(m.count) || 0
        })),
        coursePerformance,
        totalSubmissions: filteredSubmissions.length,
        gradedSubmissions: filteredSubmissions.length
      }
    });

  } catch (error) {
    console.error('Error in getGradeStatistics:', error);
    // Return empty data instead of error
    res.json({
      success: true,
      data: {
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        monthlyTrend: [],
        coursePerformance: [],
        totalSubmissions: 0,
        gradedSubmissions: 0
      }
    });
  }
});

// Export grades (admin)
exports.exportGrades = catchAsync(async (req, res, next) => {
  try {
    const { courseId, assignmentId } = req.query;

    const whereClause = {};
    if (assignmentId) whereClause.assignmentId = assignmentId;

    const submissions = await Submission.findAll({
      where: whereClause,
      include: [
        {
          model: Assignment,
          as: 'assignment',
          where: courseId ? { courseId } : {},
          include: [
            {
              model: Course,
              as: 'course'
            }
          ]
        },
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
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Calculate letter grade
    const calculateLetterGrade = (score, maxScore) => {
      if (!score || !maxScore) return 'N/A';
      const percentage = (score / maxScore) * 100;
      if (percentage >= 90) return 'A';
      if (percentage >= 80) return 'B';
      if (percentage >= 70) return 'C';
      if (percentage >= 60) return 'D';
      return 'F';
    };

    // Format for CSV export
    const csvData = submissions.map(sub => ({
      'Student ID': sub.student?.studentNumber || 'N/A',
      'Student Name': sub.student?.user ? 
        `${sub.student.user.firstName || ''} ${sub.student.user.lastName || ''}`.trim() || 'N/A' : 'N/A',
      'Email': sub.student?.user?.email || 'N/A',
      'Course': sub.assignment?.course?.courseName || 'N/A',
      'Assignment': sub.assignment?.title || 'N/A',
      'Score': sub.score || 'N/A',
      'Grade': calculateLetterGrade(
        parseFloat(sub.score), 
        sub.assignment?.maxScore
      ),
      'Status': sub.status || 'N/A',
      'Submission Date': sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString() : 'N/A',
      'Feedback': sub.feedback || ''
    }));

    res.json({
      success: true,
      data: csvData
    });

  } catch (error) {
    console.error('Error in exportGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk update grades (admin)
exports.bulkUpdateGrades = catchAsync(async (req, res, next) => {
  try {
    const { grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return next(new AppError('Please provide an array of grades', 400));
    }

    const results = [];
    const errors = [];

    for (const item of grades) {
      try {
        const submission = await Submission.findByPk(item.submissionId);
        if (!submission) {
          errors.push({ submissionId: item.submissionId, error: 'Submission not found' });
          continue;
        }

        await submission.update({
          score: item.score,
          feedback: item.feedback,
          status: 'graded'
        });

        results.push(submission);
      } catch (error) {
        errors.push({ submissionId: item.submissionId, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        updated: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Error in bulkUpdateGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get student grades
exports.getStudentGrades = catchAsync(async (req, res, next) => {
  try {
    const { studentId } = req.params;

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
              attributes: ['id', 'courseCode', 'courseName', 'credits']
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Calculate GPA
    let totalPoints = 0;
    let totalCredits = 0;
    const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };

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
        submissions,
        gpa,
        totalCredits
      }
    });

  } catch (error) {
    console.error('Error in getStudentGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get course grades
exports.getCourseGrades = catchAsync(async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const submissions = await Submission.findAll({
      include: [
        {
          model: Assignment,
          as: 'assignment',
          where: { courseId }
        },
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
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Error in getCourseGrades:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update individual grade
exports.updateGrade = catchAsync(async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      return next(new AppError('Submission not found', 404));
    }

    await submission.update({
      score: score !== undefined ? score : submission.score,
      feedback: feedback !== undefined ? feedback : submission.feedback
    });

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error in updateGrade:', error);
    return next(new AppError(error.message, 500));
  }
});