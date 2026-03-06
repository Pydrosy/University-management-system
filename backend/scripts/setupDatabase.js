// // scripts/setupDatabase.js
// const sequelize = require('../config/database');
// const models = require('../models');
// const bcrypt = require('bcryptjs');

// async function setupDatabase() {
//   try {
//     console.log('🔄 Starting database setup...');

//     // First, disable foreign key checks to allow dropping tables in any order
//     await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
//     console.log('🔓 Foreign key checks disabled');

//     // Sync all models with database (force: true will drop existing tables)
//     await sequelize.sync({ force: true });
//     console.log('✅ Database tables recreated successfully');

//     // Re-enable foreign key checks
//     await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
//     console.log('🔒 Foreign key checks enabled');

//     // Hash passwords
//     const saltRounds = 10;
//     const adminPassword = await bcrypt.hash('admin123', saltRounds);
//     const teacherPassword = await bcrypt.hash('teacher123', saltRounds);
//     const studentPassword = await bcrypt.hash('student123', saltRounds);

//     console.log('🔐 Passwords hashed successfully');

//     // Create admin user
//     const admin = await models.User.create({
//       email: 'admin@school.com',
//       password: adminPassword,
//       firstName: 'Admin',
//       lastName: 'User',
//       role: 'admin',
//       phone: '123-456-7890',
//       address: '123 Admin Street',
//       dateOfBirth: '1980-01-01',
//       isActive: true
//     });
//     console.log('✅ Admin user created');

//     // Create teacher user
//     const teacherUser = await models.User.create({
//       email: 'teacher@school.com',
//       password: teacherPassword,
//       firstName: 'John',
//       lastName: 'Doe',
//       role: 'teacher',
//       phone: '234-567-8901',
//       address: '456 Teacher Avenue',
//       dateOfBirth: '1985-05-15',
//       isActive: true
//     });

//     const teacher = await models.Teacher.create({
//       userId: teacherUser.id,
//       employeeId: 'TCH001',
//       department: 'Computer Science',
//       qualification: 'PhD in Computer Science',
//       specialization: 'Artificial Intelligence',
//       joiningDate: '2020-08-15'
//     });
//     console.log('✅ Teacher created');

//     // Create second teacher for more data
//     const teacherUser2 = await models.User.create({
//       email: 'teacher2@school.com',
//       password: teacherPassword,
//       firstName: 'Sarah',
//       lastName: 'Johnson',
//       role: 'teacher',
//       phone: '456-789-0123',
//       address: '789 Faculty Lane',
//       dateOfBirth: '1982-11-30',
//       isActive: true
//     });

//     const teacher2 = await models.Teacher.create({
//       userId: teacherUser2.id,
//       employeeId: 'TCH002',
//       department: 'Mathematics',
//       qualification: 'MSc in Mathematics',
//       specialization: 'Calculus',
//       joiningDate: '2019-09-01'
//     });
//     console.log('✅ Second teacher created');

//     // Create student user
//     const studentUser = await models.User.create({
//       email: 'student@school.com',
//       password: studentPassword,
//       firstName: 'Jane',
//       lastName: 'Smith',
//       role: 'student',
//       phone: '345-678-9012',
//       address: '789 Student Road',
//       dateOfBirth: '2001-03-20',
//       isActive: true
//     });

//     const student = await models.Student.create({
//       userId: studentUser.id,
//       studentNumber: 'STU001',
//       major: 'Computer Science',
//       enrollmentDate: '2022-09-01',
//       currentSemester: 3,
//       gpa: 3.8
//     });
//     console.log('✅ Student created');

//     // Create second student
//     const studentUser2 = await models.User.create({
//       email: 'student2@school.com',
//       password: studentPassword,
//       firstName: 'Bob',
//       lastName: 'Wilson',
//       role: 'student',
//       phone: '567-890-1234',
//       address: '321 College Ave',
//       dateOfBirth: '2002-07-15',
//       isActive: true
//     });

//     const student2 = await models.Student.create({
//       userId: studentUser2.id,
//       studentNumber: 'STU002',
//       major: 'Mathematics',
//       enrollmentDate: '2022-09-01',
//       currentSemester: 3,
//       gpa: 3.5
//     });
//     console.log('✅ Second student created');

//     // Create courses
//     const course1 = await models.Course.create({
//       courseCode: 'CS101',
//       courseName: 'Introduction to Computer Science',
//       description: 'Fundamental concepts of programming and computer science.',
//       credits: 3,
//       department: 'Computer Science',
//       teacherId: teacher.id,
//       semester: 1,
//       maxStudents: 30,
//       enrolledStudents: 25,
//       status: 'active',
//       startDate: '2024-01-15',
//       endDate: '2024-05-15'
//     });

//     const course2 = await models.Course.create({
//       courseCode: 'MATH201',
//       courseName: 'Calculus I',
//       description: 'Limits, derivatives, and integrals.',
//       credits: 4,
//       department: 'Mathematics',
//       teacherId: teacher2.id,
//       semester: 1,
//       maxStudents: 35,
//       enrolledStudents: 32,
//       status: 'active',
//       startDate: '2024-01-15',
//       endDate: '2024-05-15'
//     });

//     const course3 = await models.Course.create({
//       courseCode: 'CS201',
//       courseName: 'Data Structures',
//       description: 'Advanced data structures and algorithms.',
//       credits: 3,
//       department: 'Computer Science',
//       teacherId: teacher.id,
//       semester: 2,
//       maxStudents: 25,
//       enrolledStudents: 20,
//       status: 'active',
//       startDate: '2024-01-15',
//       endDate: '2024-05-15'
//     });
//     console.log('✅ Courses created');

//     // Enroll students in courses
//     await models.Enrollment.create({
//       studentId: student.id,
//       courseId: course1.id,
//       status: 'enrolled'
//     });

//     await models.Enrollment.create({
//       studentId: student.id,
//       courseId: course2.id,
//       status: 'enrolled'
//     });

//     await models.Enrollment.create({
//       studentId: student2.id,
//       courseId: course2.id,
//       status: 'enrolled'
//     });

//     await models.Enrollment.create({
//       studentId: student2.id,
//       courseId: course3.id,
//       status: 'enrolled'
//     });
//     console.log('✅ Students enrolled in courses');

//     // Create assignments
//     const assignment1 = await models.Assignment.create({
//       courseId: course1.id,
//       title: 'Programming Assignment 1',
//       description: 'Create a simple calculator in Python',
//       type: 'assignment',
//       maxScore: 100,
//       dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       instructions: 'Submit your Python file with proper documentation.',
//       status: 'published'
//     });

//     const assignment2 = await models.Assignment.create({
//       courseId: course1.id,
//       title: 'Programming Assignment 2',
//       description: 'Build a todo list application',
//       type: 'assignment',
//       maxScore: 100,
//       dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
//       instructions: 'Use HTML, CSS, and JavaScript.',
//       status: 'published'
//     });

//     const assignment3 = await models.Assignment.create({
//       courseId: course2.id,
//       title: 'Calculus Quiz 1',
//       description: 'Derivatives and limits',
//       type: 'quiz',
//       maxScore: 50,
//       dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
//       status: 'published'
//     });

//     const assignment4 = await models.Assignment.create({
//       courseId: course2.id,
//       title: 'Calculus Midterm',
//       description: 'Comprehensive midterm examination',
//       type: 'exam',
//       maxScore: 100,
//       dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
//       instructions: 'Covers all topics from first half of semester.',
//       status: 'published'
//     });
//     console.log('✅ Assignments created');

//     // Create submissions
//     await models.Submission.create({
//       assignmentId: assignment1.id,
//       studentId: student.id,
//       submissionText: 'This is my submission for Programming Assignment 1',
//       submissionDate: new Date(),
//       status: 'submitted'
//     });

//     await models.Submission.create({
//       assignmentId: assignment3.id,
//       studentId: student.id,
//       submissionText: 'My answers for the calculus quiz',
//       submissionDate: new Date(),
//       status: 'submitted'
//     });

//     await models.Submission.create({
//       assignmentId: assignment3.id,
//       studentId: student2.id,
//       submissionText: 'Calculus quiz answers',
//       submissionDate: new Date(),
//       status: 'submitted'
//     });

//     // Create some graded submissions
//     await models.Submission.create({
//       assignmentId: assignment1.id,
//       studentId: student2.id,
//       submissionText: 'My calculator program',
//       submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       score: 92,
//       feedback: 'Excellent work!',
//       status: 'graded'
//     });
//     console.log('✅ Submissions created');

//     // Create schedule
//     await models.Schedule.create({
//       courseId: course1.id,
//       dayOfWeek: 'Monday',
//       startTime: '09:00',
//       endTime: '10:30',
//       classroom: 'Room 101',
//       academicYear: '2023-2024',
//       semester: 'Fall'
//     });

//     await models.Schedule.create({
//       courseId: course1.id,
//       dayOfWeek: 'Wednesday',
//       startTime: '09:00',
//       endTime: '10:30',
//       classroom: 'Room 101',
//       academicYear: '2023-2024',
//       semester: 'Fall'
//     });

//     await models.Schedule.create({
//       courseId: course2.id,
//       dayOfWeek: 'Tuesday',
//       startTime: '11:00',
//       endTime: '12:30',
//       classroom: 'Room 202',
//       academicYear: '2023-2024',
//       semester: 'Fall'
//     });

//     await models.Schedule.create({
//       courseId: course2.id,
//       dayOfWeek: 'Thursday',
//       startTime: '11:00',
//       endTime: '12:30',
//       classroom: 'Room 202',
//       academicYear: '2023-2024',
//       semester: 'Fall'
//     });

//     await models.Schedule.create({
//       courseId: course3.id,
//       dayOfWeek: 'Friday',
//       startTime: '14:00',
//       endTime: '15:30',
//       classroom: 'Lab 301',
//       academicYear: '2023-2024',
//       semester: 'Fall'
//     });
//     console.log('✅ Schedule created');

//     // Create announcements
//     await models.Announcement.create({
//       title: 'Welcome to Spring Semester',
//       content: 'Welcome all students to the Spring 2024 semester. We hope you have a great learning experience.',
//       type: 'news',
//       targetAudience: ['all'],
//       startDate: '2024-01-01',
//       endDate: '2024-01-31',
//       createdBy: admin.id,
//       isActive: true
//     });

//     await models.Announcement.create({
//       title: 'Parent-Teacher Conference',
//       content: 'Annual parent-teacher conference will be held on February 10th. Please schedule your slots.',
//       type: 'event',
//       targetAudience: ['teachers', 'parents'],
//       startDate: '2024-02-01',
//       endDate: '2024-02-11',
//       createdBy: admin.id,
//       isActive: true
//     });

//     await models.Announcement.create({
//       title: 'Holiday Notice',
//       content: 'University will be closed on January 26th for Republic Day.',
//       type: 'urgent',
//       targetAudience: ['all'],
//       startDate: '2024-01-25',
//       endDate: '2024-01-27',
//       createdBy: admin.id,
//       isActive: true
//     });
//     console.log('✅ Announcements created');

//     // Create payment records
//     await models.Payment.create({
//       studentId: student.id,
//       amount: 5000.00,
//       paymentType: 'tuition',
//       dueDate: '2024-02-01',
//       status: 'pending',
//       description: 'Spring Semester Tuition Fee'
//     });

//     await models.Payment.create({
//       studentId: student.id,
//       amount: 5000.00,
//       paymentType: 'tuition',
//       dueDate: '2024-02-01',
//       status: 'completed',
//       paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       transactionId: 'TXN' + Date.now(),
//       description: 'Spring Semester Tuition Fee (Paid)'
//     });

//     await models.Payment.create({
//       studentId: student2.id,
//       amount: 2500.00,
//       paymentType: 'library',
//       dueDate: '2024-03-01',
//       status: 'pending',
//       description: 'Library Fee'
//     });
//     console.log('✅ Payment records created');

//     console.log('\n🎉 Database setup completed successfully!');
//     console.log('\n📝 Demo Credentials:');
//     console.log('   Admin:   admin@school.com / admin123');
//     console.log('   Teacher: teacher@school.com / teacher123');
//     console.log('   Teacher2: teacher2@school.com / teacher123');
//     console.log('   Student:  student@school.com / student123');
//     console.log('   Student2: student2@school.com / student123');
    
//     console.log('\n📊 Sample Data Summary:');
//     console.log(`   - Users: 6 (1 admin, 2 teachers, 3 students)`);
//     console.log(`   - Courses: 3`);
//     console.log(`   - Assignments: 4`);
//     console.log(`   - Submissions: 4`);
//     console.log(`   - Schedule entries: 5`);
//     console.log(`   - Announcements: 3`);
//     console.log(`   - Payments: 3`);
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error setting up database:', error);
    
//     // Try to re-enable foreign key checks even if there's an error
//     try {
//       await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
//     } catch (e) {
//       // Ignore
//     }
    
//     process.exit(1);
//   }
// }

// setupDatabase();
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  // Add ping timeout and interval for better connection handling
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io accessible to routes
app.set('io', io);

// Import database connection with retry logic
const sequelize = require('./config/database');
const { waitForDatabase } = require('./config/dbHelper');

// Import models
require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Import helpers
const NotificationHelper = require('./utils/notificationHelper');
const AdminNotificationHelper = require('./utils/adminNotificationHelper');

// Initialize notification helpers
const notificationHelper = new NotificationHelper(io);
const adminNotificationHelper = new AdminNotificationHelper(io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin for uploads
}));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    error: 'Too many requests from this IP, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Set notification helpers in app
app.set('notificationHelper', notificationHelper);
app.set('adminNotificationHelper', adminNotificationHelper);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user-${userId}`);
    }
  });

  // Join course room
  socket.on('join-course', (courseId) => {
    if (courseId) {
      socket.join(`course-${courseId}`);
      console.log(`Socket ${socket.id} joined course-${courseId}`);
    }
  });

  // Leave course room
  socket.on('leave-course', (courseId) => {
    if (courseId) {
      socket.leave(`course-${courseId}`);
      console.log(`Socket ${socket.id} left course-${courseId}`);
    }
  });

  // Send notification
  socket.on('send-notification', (data) => {
    if (data.userId) {
      io.to(`user-${data.userId}`).emit('new-notification', data);
    } else {
      io.emit('new-notification', data);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(`course-${data.courseId}`).emit('user-typing', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log detailed error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      statusCode,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: `Route ${req.originalUrl} not found` 
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Wait for database to be ready (important for Docker)
    console.log('⏳ Waiting for database connection...');
    const dbReady = await waitForDatabase();
    
    if (!dbReady) {
      throw new Error('Database connection failed after multiple retries');
    }

    // Authenticate database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);

    // Sync database based on environment
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Syncing database (development mode)...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced successfully');
    } else if (process.env.NODE_ENV === 'test') {
      console.log('🔄 Syncing database (test mode)...');
      await sequelize.sync({ force: true });
      console.log('✅ Database synced successfully');
    } else {
      // Production - don't auto-sync, just check connection
      console.log('✅ Database connection verified (production mode)');
    }

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 Server started successfully!');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`   API URL: http://localhost:${PORT}/api`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // In Docker, we might want to retry instead of exit
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Retrying in 5 seconds...');
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🔄 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    sequelize.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing database connection:', err);
      process.exit(1);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n🔄 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    sequelize.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing database connection:', err);
      process.exit(1);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Gracefully shutdown
  server.close(() => {
    sequelize.close().then(() => {
      process.exit(1);
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server, io };