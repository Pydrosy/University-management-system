// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const { User, Student, Teacher } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Register user
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, role, ...profileData } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role
  });

  // Create role-specific profile
  if (role === 'student') {
    await Student.create({
      userId: user.id,
      studentNumber: profileData.studentNumber,
      major: profileData.major,
      enrollmentDate: profileData.enrollmentDate || new Date()
    });
  } else if (role === 'teacher') {
    await Teacher.create({
      userId: user.id,
      employeeId: profileData.employeeId,
      department: profileData.department,
      qualification: profileData.qualification,
      joiningDate: profileData.joiningDate || new Date()
    });
  }

  // Generate token
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  });
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    // Find user and include password
    const user = await User.findOne({ 
      where: { email },
      attributes: { include: ['password'] }
    });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user || !(await user.comparePassword(password))) {
      console.log('Invalid credentials for email:', email);
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated:', user.id);
      return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    console.log('Token generated for user:', user.id);

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(new AppError('Login failed', 500));
  }
});

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Teacher,
          as: 'teacher',
          required: false
        },
        {
          model: Student,
          as: 'student',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    return next(new AppError(error.message, 500));
  }
});
// Logout
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Change password
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id, {
    attributes: { include: ['password'] }
  });

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  // Generate reset token
  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  // TODO: Send email with reset token
  // await sendEmail(...);

  res.json({
    success: true,
    message: 'Password reset email sent',
    resetToken // Remove this in production
  });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next(new AppError('Invalid or expired token', 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    return next(new AppError('Invalid or expired token', 400));
  }
});