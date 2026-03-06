// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const courseController = require('../controllers/courseController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Course route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Statistics route - must come before /:id routes
router.get('/stats', authorize('admin', 'teacher'), courseController.getCourseStats);

// Teacher's courses route
router.get('/teacher-courses', authorize('teacher'), courseController.getTeacherCourses);

// Public routes (authenticated users)
router.get('/', courseController.getAllCourses);
router.get('/available', authorize('student'), courseController.getAvailableCourses);
router.get('/teacher/:teacherId', courseController.getCoursesByTeacher);
router.get('/:id/assignments', courseController.getCourseAssignments);
router.get('/:id', courseController.getCourse);

// Admin only routes
router.post('/', authorize('admin'), courseController.createCourse);
router.put('/:id', authorize('admin'), courseController.updateCourse);
router.delete('/:id', authorize('admin'), courseController.deleteCourse);
router.post('/enroll', authorize('admin', 'student'), courseController.enrollStudent);
router.post('/unenroll', authorize('admin', 'student'), courseController.unenrollStudent);

module.exports = router;