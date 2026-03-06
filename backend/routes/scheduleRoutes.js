// backend/routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const scheduleController = require('../controllers/scheduleController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Schedule route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', scheduleController.getAllSchedules);
router.get('/day/:day', scheduleController.getSchedulesByDay);
router.get('/course/:courseId', scheduleController.getSchedulesByCourse);
router.get('/teacher/:teacherId', scheduleController.getSchedulesByTeacher);
router.get('/check-availability', scheduleController.checkAvailability);
router.get('/:id', scheduleController.getSchedule);

// Admin only routes
router.post('/', authorize('admin'), scheduleController.createSchedule);
router.put('/:id', authorize('admin'), scheduleController.updateSchedule);
router.delete('/:id', authorize('admin'), scheduleController.deleteSchedule);
router.post('/bulk-delete', authorize('admin'), scheduleController.bulkDeleteSchedules);

module.exports = router;