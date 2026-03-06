// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const gradeController = require('../controllers/gradeController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Grade route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Teacher routes
router.get('/teacher', authorize('teacher'), gradeController.getTeacherGrades);
router.post('/submission/:submissionId', authorize('teacher'), gradeController.gradeSubmission);
router.post('/bulk', authorize('teacher'), gradeController.bulkGradeSubmissions);
router.get('/course-stats', authorize('teacher'), gradeController.getCourseStats);

// Admin routes
router.get('/admin/all', authorize('admin'), gradeController.getAllGrades);
router.get('/admin/statistics', authorize('admin'), gradeController.getGradeStatistics);
router.get('/admin/export', authorize('admin'), gradeController.exportGrades);
router.put('/admin/bulk-update', authorize('admin'), gradeController.bulkUpdateGrades);

// Student routes
router.get('/student/:studentId', authorize('admin', 'student'), gradeController.getStudentGrades);

// Course routes
router.get('/course/:courseId', authorize('admin', 'teacher'), gradeController.getCourseGrades);

// Individual grade management
router.put('/:submissionId', authorize('admin', 'teacher'), gradeController.updateGrade);

module.exports = router;