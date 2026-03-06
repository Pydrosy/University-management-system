// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Payment route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', paymentController.getAllPayments);
router.get('/stats', authorize('admin'), paymentController.getPaymentStats);
router.get('/student/:studentId', authorize('admin', 'student'), paymentController.getStudentFeeSummary);
router.get('/:id', paymentController.getPaymentById);

// Admin only routes
router.post('/', authorize('admin'), paymentController.createPayment);
router.put('/:id', authorize('admin'), paymentController.updatePayment);
router.put('/:id/status', authorize('admin'), paymentController.updatePaymentStatus);
router.delete('/:id', authorize('admin'), paymentController.deletePayment);
router.post('/bulk-delete', authorize('admin'), paymentController.bulkDeletePayments);

module.exports = router;