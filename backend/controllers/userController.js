// backend/controllers/userController.js
const { User, Student, Teacher, Course, Enrollment, Submission, Payment } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

// Get current user profile
exports.getProfile = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;

    console.log('Fetching profile for user ID:', userId);

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Student,
          as: 'student',
          required: false
        },
        {
          model: Teacher,
          as: 'teacher',
          required: false
        }
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Format response based on role
    let profileData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      profilePicture: user.profilePicture,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Add role-specific data
    if (user.role === 'student' && user.student) {
      // Get enrolled courses count
      const enrolledCourses = await Enrollment.count({
        where: { 
          studentId: user.student.id, 
          status: 'enrolled' 
        }
      });

      // Get completed assignments count
      const completedAssignments = await Submission.count({
        where: { 
          studentId: user.student.id, 
          status: 'graded' 
        }
      });

      // Get total payments
      const totalPayments = await Payment.sum('amount', {
        where: { 
          studentId: user.student.id,
          status: 'completed'
        }
      });

      profileData.student = {
        id: user.student.id,
        studentNumber: user.student.studentNumber,
        major: user.student.major,
        enrollmentDate: user.student.enrollmentDate,
        currentSemester: user.student.currentSemester,
        gpa: user.student.gpa,
        guardianId: user.student.guardianId
      };
      
      profileData.enrolledCourses = enrolledCourses || 0;
      profileData.completedAssignments = completedAssignments || 0;
      profileData.totalPayments = totalPayments || 0;
    }

    if (user.role === 'teacher' && user.teacher) {
      profileData.teacher = {
        id: user.teacher.id,
        employeeId: user.teacher.employeeId,
        department: user.teacher.department,
        qualification: user.teacher.qualification,
        specialization: user.teacher.specialization,
        joiningDate: user.teacher.joiningDate
      };
    }

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error in getProfile:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update current user profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, address, dateOfBirth } = req.body;

    console.log('Updating profile for user ID:', userId);

    const user = await User.findByPk(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update user fields
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    await user.update(updateData);

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error in updateProfile:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Student,
          as: 'student',
          required: false
        },
        {
          model: Teacher,
          as: 'teacher',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get single user
exports.getUser = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Student,
          as: 'student',
          required: false
        },
        {
          model: Teacher,
          as: 'teacher',
          required: false
        }
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getUser:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update user (admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.update(req.body);

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete user (admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return next(new AppError(error.message, 500));
  }
});

// Toggle user status (activate/deactivate)
exports.toggleUserStatus = catchAsync(async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await user.update({ isActive });

    res.json({
      success: true,
      data: { 
        id: user.id,
        isActive: user.isActive 
      }
    });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    return next(new AppError(error.message, 500));
  }
});