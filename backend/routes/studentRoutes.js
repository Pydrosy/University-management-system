// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Student route accessed: ${req.method} ${req.url}`);
  console.log('User from auth:', req.user ? {
    id: req.user.id,
    role: req.user.role,
    studentId: req.user.student?.id
  } : 'No user');
  next();
});

// All routes require authentication
router.use(protect);

// Student routes (for logged-in student)
// IMPORTANT: Order matters - place specific routes before parameterized routes
router.get('/dashboard', authorize('student', 'admin'), studentController.getMyDashboard);
router.get('/dashboard/:id', authorize('admin'), studentController.getStudentDashboard);

router.get('/courses', authorize('student', 'admin'), studentController.getMyCourses);
router.get('/courses/:id', authorize('admin'), studentController.getStudentCourses);

router.get('/grades', authorize('student', 'admin'), studentController.getMyGrades);
router.get('/grades/:id', authorize('admin'), studentController.getStudentGrades);

router.get('/fees', authorize('student', 'admin'), studentController.getMyFees);
router.get('/fees/:id', authorize('admin'), studentController.getStudentFees);

router.get('/payments', authorize('student', 'admin'), studentController.getMyPayments);
router.get('/payments/:id', authorize('admin'), studentController.getPaymentHistory);

router.post('/pay', authorize('student'), studentController.makePayment);

router.get('/schedule', authorize('student', 'admin'), studentController.getMySchedule);
router.get('/schedule/:id', authorize('admin'), studentController.getStudentSchedule);

router.get('/assignments', authorize('student', 'admin'), studentController.getMyAssignments);
router.get('/assignments/:id', authorize('admin'), studentController.getStudentAssignments);

// Admin only routes
router.get('/', authorize('admin'), studentController.getAllStudents);
router.get('/:id', authorize('admin'), studentController.getStudent);
router.post('/', authorize('admin'), studentController.createStudent);
router.put('/:id', authorize('admin'), studentController.updateStudent);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);
router.post('/bulk-delete', authorize('admin'), studentController.bulkDeleteStudents);

module.exports = router;