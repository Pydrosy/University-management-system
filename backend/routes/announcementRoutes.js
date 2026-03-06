// backend/routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const announcementController = require('../controllers/announcementController');
const upload = require('../middleware/upload');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Announcement route accessed: ${req.method} ${req.url}`);
  next();
});

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', announcementController.getAllAnnouncements);
router.get('/active', announcementController.getActiveAnnouncements);
router.get('/urgent', announcementController.getUrgentAnnouncements);
router.get('/audience/:audience', announcementController.getAnnouncementsByAudience);
router.get('/stats', authorize('admin'), announcementController.getAnnouncementStats);
router.get('/:id', announcementController.getAnnouncement);

// Admin and teacher routes - using upload.media for multiple files
router.post('/', 
  authorize('admin', 'teacher'), 
  upload.media, // Use upload.media for multiple files
  announcementController.createAnnouncement
);

router.put('/:id', 
  authorize('admin', 'teacher'), 
  upload.media, 
  announcementController.updateAnnouncement
);

router.delete('/:id', authorize('admin', 'teacher'), announcementController.deleteAnnouncement);

// Admin only routes
router.post('/bulk-delete', authorize('admin'), announcementController.bulkDeleteAnnouncements);

module.exports = router;