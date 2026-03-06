// backend/controllers/teacherController.js
const { User, Teacher, Course, Assignment, Submission, Student, Enrollment } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all teachers
const getAllTeachers = catchAsync(async (req, res, next) => {
  try {
    const teachers = await Teacher.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'profilePicture', 'isActive', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response to ensure consistent field names
    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      employeeId: teacher.employeeId,
      department: teacher.department,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      joiningDate: teacher.joiningDate,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      userId: teacher.userId,
      user: teacher.user ? {
        id: teacher.user.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        phone: teacher.user.phone,
        address: teacher.user.address,
        profilePicture: teacher.user.profilePicture,
        isActive: teacher.user.isActive,
        createdAt: teacher.user.createdAt
      } : null,
      // Add convenience fields for frontend
      firstName: teacher.user?.firstName,
      lastName: teacher.user?.lastName,
      email: teacher.user?.email,
      phone: teacher.user?.phone,
      address: teacher.user?.address,
      isActive: teacher.user?.isActive || false
    }));

    res.json({
      success: true,
      count: formattedTeachers.length,
      data: formattedTeachers
    });
  } catch (error) {
    console.error('Error in getAllTeachers:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get single teacher
const getTeacher = catchAsync(async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'profilePicture', 'isActive', 'createdAt']
        },
        {
          model: Course,
          as: 'courses',
          include: [
            {
              model: Enrollment,
              as: 'enrollments',
              include: [{
                model: Student,
                as: 'student',
                include: [{
                  model: User,
                  as: 'user',
                  attributes: ['firstName', 'lastName', 'email']
                }]
              }]
            },
            {
              model: Assignment,
              as: 'assignments'
            }
          ]
        }
      ]
    });

    if (!teacher) {
      return next(new AppError('Teacher not found', 404));
    }

    // Format the response
    const formattedTeacher = {
      id: teacher.id,
      employeeId: teacher.employeeId,
      department: teacher.department,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      joiningDate: teacher.joiningDate,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      userId: teacher.userId,
      user: teacher.user ? {
        id: teacher.user.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        phone: teacher.user.phone,
        address: teacher.user.address,
        profilePicture: teacher.user.profilePicture,
        isActive: teacher.user.isActive,
        createdAt: teacher.user.createdAt
      } : null,
      courses: teacher.courses || [],
      firstName: teacher.user?.firstName,
      lastName: teacher.user?.lastName,
      email: teacher.user?.email,
      phone: teacher.user?.phone,
      address: teacher.user?.address,
      isActive: teacher.user?.isActive || false
    };

    res.json({
      success: true,
      data: formattedTeacher
    });
  } catch (error) {
    console.error('Error in getTeacher:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get teacher by user ID
const getTeacherByUserId = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.params;

    console.log('Getting teacher for user ID:', userId);

    const teacher = await Teacher.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'profilePicture', 'isActive']
        }
      ]
    });

    if (!teacher) {
      return next(new AppError('Teacher not found for this user', 404));
    }

    // Format the response
    const formattedTeacher = {
      id: teacher.id,
      employeeId: teacher.employeeId,
      department: teacher.department,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      joiningDate: teacher.joiningDate,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      userId: teacher.userId,
      user: teacher.user ? {
        id: teacher.user.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        phone: teacher.user.phone,
        address: teacher.user.address,
        profilePicture: teacher.user.profilePicture,
        isActive: teacher.user.isActive
      } : null,
      firstName: teacher.user?.firstName,
      lastName: teacher.user?.lastName,
      email: teacher.user?.email,
      isActive: teacher.user?.isActive || false
    };

    res.json({
      success: true,
      data: formattedTeacher
    });
  } catch (error) {
    console.error('Error in getTeacherByUserId:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create teacher
const createTeacher = catchAsync(async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, employeeId, department, qualification, specialization, phone, address, joiningDate, isActive } = req.body;

    console.log('Creating teacher with data:', { 
      firstName, lastName, email, employeeId, department, 
      qualification, specialization, phone, address, joiningDate, isActive 
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !employeeId || !department || !qualification || !specialization) {
      return next(new AppError('All required fields must be provided', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Check if employee ID already exists
    const existingTeacher = await Teacher.findOne({ where: { employeeId } });
    if (existingTeacher) {
      return next(new AppError('Employee ID already exists', 400));
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('default123', 10);

    // Create user first
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      address: address || null,
      role: 'teacher',
      isActive: isActive !== undefined ? isActive : true
    });

    // Create teacher profile
    const teacher = await Teacher.create({
      userId: user.id,
      employeeId,
      department,
      qualification,
      specialization,
      joiningDate: joiningDate || new Date()
    });

    // Fetch the created teacher with user details
    const createdTeacher = await Teacher.findByPk(teacher.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'role', 'isActive']
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
        'teacher',
        'New Teacher Added',
        `${firstName} ${lastName} (${employeeId}) has been added as a teacher.`,
        '/admin/teachers',
        { teacherId: teacher.id }
      );
      
      if (io) {
        io.to(`user-${admin.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'teacher',
          title: 'New Teacher Added',
          description: `${firstName} ${lastName} has been added.`,
          time: new Date(),
          read: false,
          link: '/admin/teachers'
        });
      }
    }

    // Format response
    const formattedTeacher = {
      id: createdTeacher.id,
      employeeId: createdTeacher.employeeId,
      department: createdTeacher.department,
      qualification: createdTeacher.qualification,
      specialization: createdTeacher.specialization,
      joiningDate: createdTeacher.joiningDate,
      userId: createdTeacher.userId,
      user: createdTeacher.user,
      firstName: createdTeacher.user?.firstName,
      lastName: createdTeacher.user?.lastName,
      email: createdTeacher.user?.email,
      phone: createdTeacher.user?.phone,
      address: createdTeacher.user?.address,
      isActive: createdTeacher.user?.isActive || false
    };

    res.status(201).json({
      success: true,
      data: formattedTeacher
    });
  } catch (error) {
    console.error('Error in createTeacher:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Email or Employee ID already exists', 400));
    }
    
    if (error.name === 'SequelizeValidationError') {
      return next(new AppError('Invalid data provided', 400));
    }
    
    return next(new AppError(error.message, 500));
  }
});

// Update teacher
const updateTeacher = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, address, department, qualification, specialization, isActive, employeeId } = req.body;

    console.log('Updating teacher ID:', id, 'with data:', { 
      firstName, lastName, email, employeeId, department, 
      qualification, specialization, phone, address, isActive 
    });

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!teacher) {
      return next(new AppError('Teacher not found', 404));
    }

    // Check if email is being changed and if it's already taken by another user
    if (email && teacher.user && email !== teacher.user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: teacher.user.id }
        } 
      });
      
      if (existingUser) {
        return next(new AppError('Email is already in use by another user', 400));
      }
    }

    // Check if employee ID is being changed and if it's already taken
    if (employeeId && employeeId !== teacher.employeeId) {
      const existingTeacher = await Teacher.findOne({ 
        where: { 
          employeeId,
          id: { [Op.ne]: teacher.id }
        } 
      });
      
      if (existingTeacher) {
        return next(new AppError('Employee ID already exists', 400));
      }
    }

    // Update user information
    if (teacher.user) {
      const userUpdateData = {};
      if (firstName) userUpdateData.firstName = firstName;
      if (lastName) userUpdateData.lastName = lastName;
      if (email) userUpdateData.email = email;
      if (phone !== undefined) userUpdateData.phone = phone;
      if (address !== undefined) userUpdateData.address = address;
      if (isActive !== undefined) userUpdateData.isActive = isActive;
      
      if (Object.keys(userUpdateData).length > 0) {
        await teacher.user.update(userUpdateData);
      }
    }

    // Update teacher information
    const teacherUpdateData = {};
    if (employeeId) teacherUpdateData.employeeId = employeeId;
    if (department) teacherUpdateData.department = department;
    if (qualification) teacherUpdateData.qualification = qualification;
    if (specialization) teacherUpdateData.specialization = specialization;
    
    if (Object.keys(teacherUpdateData).length > 0) {
      await teacher.update(teacherUpdateData);
    }

    // Fetch updated teacher
    const updatedTeacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'role', 'isActive']
        }
      ]
    });

    // Format response
    const formattedTeacher = {
      id: updatedTeacher.id,
      employeeId: updatedTeacher.employeeId,
      department: updatedTeacher.department,
      qualification: updatedTeacher.qualification,
      specialization: updatedTeacher.specialization,
      joiningDate: updatedTeacher.joiningDate,
      userId: updatedTeacher.userId,
      user: updatedTeacher.user,
      firstName: updatedTeacher.user?.firstName,
      lastName: updatedTeacher.user?.lastName,
      email: updatedTeacher.user?.email,
      phone: updatedTeacher.user?.phone,
      address: updatedTeacher.user?.address,
      isActive: updatedTeacher.user?.isActive || false
    };

    res.json({
      success: true,
      data: formattedTeacher
    });
  } catch (error) {
    console.error('Error in updateTeacher:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Email or Employee ID already exists', 400));
    }
    
    return next(new AppError(error.message, 500));
  }
});

// Delete teacher
const deleteTeacher = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!teacher) {
      return next(new AppError('Teacher not found', 404));
    }

    // Check if teacher has courses
    const courseCount = await Course.count({ where: { teacherId: id } });
    if (courseCount > 0) {
      return next(new AppError('Cannot delete teacher with assigned courses. Please reassign courses first.', 400));
    }

    // Delete user first (will cascade to teacher due to foreign key)
    if (teacher.user) {
      await teacher.user.destroy();
    } else {
      await teacher.destroy();
    }

    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTeacher:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk delete teachers
const bulkDeleteTeachers = catchAsync(async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide an array of teacher IDs', 400));
    }

    // Check if any teachers have courses
    const teachersWithCourses = await Course.count({
      where: {
        teacherId: {
          [Op.in]: ids
        }
      }
    });

    if (teachersWithCourses > 0) {
      return next(new AppError('Cannot delete teachers with assigned courses. Please reassign courses first.', 400));
    }

    // Get all teachers to delete their users
    const teachers = await Teacher.findAll({
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

    // Delete users (will cascade to teachers)
    for (const teacher of teachers) {
      if (teacher.user) {
        await teacher.user.destroy();
      }
    }

    res.json({
      success: true,
      message: `${ids.length} teachers deleted successfully`
    });
  } catch (error) {
    console.error('Error in bulkDeleteTeachers:', error);
    return next(new AppError(error.message, 500));
  }
});

// Toggle teacher status
const toggleTeacherStatus = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });

    if (!teacher) {
      return next(new AppError('Teacher not found', 404));
    }

    if (!teacher.user) {
      return next(new AppError('User account not found', 404));
    }

    await teacher.user.update({ isActive });

    res.json({
      success: true,
      data: {
        id: teacher.id,
        isActive: teacher.user.isActive
      }
    });
  } catch (error) {
    console.error('Error in toggleTeacherStatus:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get teacher dashboard
const getTeacherDashboard = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.params.id || req.user?.teacher?.id;

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    // Get teacher's courses
    const teacherCourses = await Course.findAll({
      where: { teacherId },
      attributes: ['id', 'courseName', 'courseCode']
    });

    const courseIds = teacherCourses.map(c => c.id);

    let totalStudents = 0;
    let pendingGrading = 0;
    let activeAssignments = 0;
    let recentSubmissions = [];
    let upcomingAssignments = [];

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

      // Get pending grading
      pendingGrading = await Submission.count({
        where: {
          status: 'submitted',
          assignmentId: {
            [Op.in]: sequelize.literal(`(SELECT id FROM assignments WHERE course_id IN (${courseIds.join(',')}))`)
          }
        }
      });

      // Get active assignments
      activeAssignments = await Assignment.count({
        where: {
          courseId: { [Op.in]: courseIds },
          dueDate: { [Op.gt]: new Date() },
          status: 'published'
        }
      });

      // Recent submissions needing grading
      recentSubmissions = await Submission.findAll({
        where: {
          status: 'submitted',
          assignmentId: {
            [Op.in]: sequelize.literal(`(SELECT id FROM assignments WHERE course_id IN (${courseIds.join(',')}))`)
          }
        },
        limit: 5,
        order: [['submissionDate', 'DESC']],
        include: [
          {
            model: Student,
            as: 'student',
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: Assignment,
            as: 'assignment',
            attributes: ['title', 'courseId']
          }
        ]
      });

      // Upcoming assignments
      upcomingAssignments = await Assignment.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          dueDate: { [Op.gt]: new Date() },
          status: 'published'
        },
        limit: 5,
        order: [['dueDate', 'ASC']],
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['courseName', 'courseCode']
          }
        ]
      });
    }

    // Students overview
    const studentsOverview = await Course.findAll({
      where: { teacherId },
      attributes: ['id', 'courseName', 'courseCode'],
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['studentId'],
          include: [{
            model: Student,
            as: 'student',
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        teachingCourses: teacherCourses.length,
        totalStudents,
        pendingGrading,
        activeAssignments,
        studentsOverview: studentsOverview.map(course => ({
          id: course.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          enrolledStudents: course.enrollments?.length || 0
        })),
        recentSubmissions,
        upcomingAssignments,
        teacherCourses
      }
    });
  } catch (error) {
    console.error('Error in getTeacherDashboard:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get teacher's courses
const getTeacherCourses = catchAsync(async (req, res, next) => {
  try {
    // Get teacher ID from the user object
    const teacherId = req.user?.teacher?.id;

    console.log('Getting courses for teacher ID:', teacherId);
    console.log('User object:', req.user);

    if (!teacherId) {
      // If teacher ID not found in user object, try to find it from the database
      const teacher = await Teacher.findOne({ where: { userId: req.user.id } });
      if (!teacher) {
        return next(new AppError('Teacher profile not found', 404));
      }
      // Attach teacher to req.user for future use
      req.user.teacher = teacher;
      
      const courses = await Course.findAll({
        where: { teacherId: teacher.id },
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

      return res.json({
        success: true,
        data: enhancedCourses
      });
    }

    // If teacher ID exists, proceed normally
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

// Get teacher's students
const getTeacherStudents = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    // Get all course IDs for this teacher
    const courses = await Course.findAll({
      where: { teacherId },
      attributes: ['id']
    });
    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get all students enrolled in these courses
    const enrollments = await Enrollment.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
        status: 'enrolled'
      },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture']
            }
          ]
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'courseName', 'courseCode']
        }
      ]
    });

    // Group students by course
    const studentsByCourse = {};
    enrollments.forEach(enrollment => {
      const courseId = enrollment.courseId;
      if (!studentsByCourse[courseId]) {
        studentsByCourse[courseId] = {
          course: enrollment.course,
          students: []
        };
      }
      if (enrollment.student) {
        studentsByCourse[courseId].students.push(enrollment.student);
      }
    });

    res.json({
      success: true,
      data: Object.values(studentsByCourse)
    });
  } catch (error) {
    console.error('Error in getTeacherStudents:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get pending submissions
const getPendingSubmissions = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    // Get all course IDs for this teacher
    const courses = await Course.findAll({
      where: { teacherId },
      attributes: ['id']
    });
    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get all assignments for these courses
    const assignments = await Assignment.findAll({
      where: {
        courseId: { [Op.in]: courseIds }
      },
      attributes: ['id', 'title', 'courseId']
    });
    const assignmentIds = assignments.map(a => a.id);

    if (assignmentIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get pending submissions
    const submissions = await Submission.findAll({
      where: {
        assignmentId: { [Op.in]: assignmentIds },
        status: 'submitted'
      },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'maxScore', 'courseId'],
          include: [{
            model: Course,
            as: 'course',
            attributes: ['courseName', 'courseCode']
          }]
        },
        {
          model: Student,
          as: 'student',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }
      ],
      order: [['submissionDate', 'ASC']]
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error in getPendingSubmissions:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create assignment
const createAssignment = catchAsync(async (req, res, next) => {
  try {
    const teacherId = req.user?.teacher?.id;
    const { courseId, title, description, type, maxScore, dueDate, instructions } = req.body;

    if (!teacherId) {
      return next(new AppError('Teacher ID not found', 404));
    }

    // Check if course belongs to teacher
    const course = await Course.findOne({
      where: { id: courseId, teacherId }
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
      status: 'published'
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error in createAssignment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Grade submission
const gradeSubmission = catchAsync(async (req, res, next) => {
  try {
    const { submissionId, score, feedback, grade } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [{
            model: Course,
            as: 'course'
          }]
        },
        {
          model: Student,
          as: 'student',
          include: [{
            model: User,
            as: 'user'
          }]
        }
      ]
    });

    if (!submission) {
      return next(new AppError('Submission not found', 404));
    }

    // Validate score against maxScore
    const maxScore = submission.assignment?.maxScore || 100;
    if (score !== undefined && score !== null) {
      if (score < 0 || score > maxScore) {
        return next(new AppError(`Score must be between 0 and ${maxScore}`, 400));
      }
    }

    await submission.update({
      score: score !== undefined ? score : submission.score,
      grade: grade || submission.grade,
      feedback: feedback !== undefined ? feedback : submission.feedback,
      status: 'graded'
    });

    // Send notification to student
    const io = req.app.get('io');
    const notificationController = require('./notificationController');
    const studentUser = submission.student?.user;
    
    if (studentUser) {
      const courseName = submission.assignment?.course?.courseName || 'Unknown Course';
      const assignmentName = submission.assignment?.title || 'Unknown Assignment';
      
      await notificationController.createNotification(
        studentUser.id,
        'grade',
        'Grade Published',
        `Your assignment "${assignmentName}" in ${courseName} has been graded. Score: ${score}/${maxScore}`,
        '/student/grades',
        {
          submissionId: submission.id,
          assignmentId: submission.assignmentId,
          courseId: submission.assignment?.course?.id,
          score,
          maxScore,
          grade
        }
      );

      if (io) {
        io.to(`user-${studentUser.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'grade',
          title: 'Grade Published',
          description: `Your assignment "${assignmentName}" has been graded.`,
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

// Export all functions
module.exports = {
  getAllTeachers,
  getTeacher,
  getTeacherByUserId,  // Added this function
  createTeacher,
  updateTeacher,
  deleteTeacher,
  bulkDeleteTeachers,
  toggleTeacherStatus,
  getTeacherDashboard,
  getTeacherCourses,
  getTeacherStudents,
  getPendingSubmissions,
  createAssignment,
  gradeSubmission
};