// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`User route accessed: ${req.method} ${req.url}`);
  console.log('User from auth:', req.user ? {
    id: req.user.id,
    role: req.user.role
  } : 'No user');
  next();
});

// All routes require authentication
router.use(protect);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update current user profile
router.put('/profile', userController.updateProfile);

// Admin only routes
router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/:id', authorize('admin'), userController.getUser);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.put('/:id/status', authorize('admin'), userController.toggleUserStatus);

module.exports = router;