// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Notification route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.post('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.post('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;