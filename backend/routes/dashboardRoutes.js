// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(protect);

// Admin dashboard
router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);

// Teacher dashboard
router.get('/teacher', authorize('teacher'), (req, res) => {
  // You can implement teacher dashboard controller
  res.json({ message: 'Teacher dashboard' });
});

// Student dashboard
router.get('/student', authorize('student'), (req, res) => {
  // Student dashboard is handled in student controller
  res.json({ message: 'Student dashboard' });
});

module.exports = router;