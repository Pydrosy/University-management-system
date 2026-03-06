// backend/routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.use(protect);
router.get('/', searchController.search);

module.exports = router;