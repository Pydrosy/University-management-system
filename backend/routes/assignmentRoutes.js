// backend/routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');
const upload = require('../middleware/upload');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Assignment route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Teacher routes
router.get('/teacher', authorize('teacher'), assignmentController.getTeacherAssignments);
router.get('/teacher/:id', authorize('teacher'), assignmentController.getAssignment);
router.post('/', authorize('teacher'), upload.single('assignment'), assignmentController.createAssignment);
router.put('/:id', authorize('teacher'), assignmentController.updateAssignment);
router.delete('/:id', authorize('teacher'), assignmentController.deleteAssignment);
router.get('/:id/submissions', authorize('teacher'), assignmentController.getAssignmentSubmissions);

// Student routes
router.get('/student/:studentId', authorize('student'), assignmentController.getStudentAssignments);
router.post('/:id/submit', authorize('student'), upload.single('submission'), assignmentController.submitAssignment);
router.get('/my-submissions', authorize('student'), assignmentController.getMySubmissions);

// Common routes
router.get('/course/:courseId', assignmentController.getCourseAssignments);
router.get('/:id', assignmentController.getAssignment);

module.exports = router;