// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User, Teacher, Student } = require('../models');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token received:', token ? 'Present' : 'Missing');
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ 
      success: false,
      error: 'Not authorized to access this route - No token provided' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified for user ID:', decoded.id);

    // Get user from database with teacher/student associations
    const user = await User.findByPk(decoded.id, {
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

    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (!user.isActive) {
      console.log('User account is deactivated:', user.id);
      return res.status(401).json({ 
        success: false,
        error: 'User account is deactivated' 
      });
    }

    // Attach user to request object
    req.user = user;
    console.log('Authentication successful for user:', user.email);
    console.log('User role:', user.role);
    console.log('User teacher object:', user.teacher ? 'Present' : 'Not present');
    if (user.teacher) {
      console.log('Teacher ID:', user.teacher.id);
    }
    if (user.student) {
      console.log('Student ID:', user.student.id);
    }
    next();
  } catch (error) {
    console.error('Auth error details:', error.name, error.message);
    
    let message = 'Not authorized to access this route';
    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token format';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    }
    
    return res.status(401).json({ 
      success: false,
      error: message 
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

module.exports = { protect, authorize };