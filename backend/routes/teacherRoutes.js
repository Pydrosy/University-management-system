// backend/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');
const assignmentController = require('../controllers/assignmentController');
const upload = require('../middleware/upload');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Teacher route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Teacher routes
router.get('/dashboard/:id?', authorize('teacher', 'admin'), teacherController.getTeacherDashboard);
router.get('/courses', authorize('teacher'), teacherController.getTeacherCourses);
router.get('/students', authorize('teacher'), teacherController.getTeacherStudents);
router.get('/submissions/pending', authorize('teacher'), teacherController.getPendingSubmissions);
router.post('/grade', authorize('teacher'), teacherController.gradeSubmission);

// New route to get teacher by user ID
router.get('/user/:userId', authorize('teacher', 'admin'), teacherController.getTeacherByUserId);

// Assignment routes - using upload.assignment for single file
router.post('/assignments', authorize('teacher'), upload.assignment, assignmentController.createAssignment);
router.get('/assignments', authorize('teacher'), assignmentController.getTeacherAssignments);
router.get('/assignments/:id', authorize('teacher'), assignmentController.getAssignment);
router.put('/assignments/:id', authorize('teacher'), assignmentController.updateAssignment);
router.delete('/assignments/:id', authorize('teacher'), assignmentController.deleteAssignment);
router.get('/assignments/:id/submissions', authorize('teacher'), assignmentController.getAssignmentSubmissions);

// Admin only routes
router.get('/', authorize('admin'), teacherController.getAllTeachers);
router.get('/:id', authorize('admin'), teacherController.getTeacher);
router.post('/', authorize('admin'), teacherController.createTeacher);
router.put('/:id', authorize('admin'), teacherController.updateTeacher);
router.patch('/:id/toggle-status', authorize('admin'), teacherController.toggleTeacherStatus);
router.delete('/:id', authorize('admin'), teacherController.deleteTeacher);
router.post('/bulk-delete', authorize('admin'), teacherController.bulkDeleteTeachers);

module.exports = router;