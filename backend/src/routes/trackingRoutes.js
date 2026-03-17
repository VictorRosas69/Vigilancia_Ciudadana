// src/routes/trackingRoutes.js
const express = require('express');
const router = express.Router();
const { createTracking, getTrackingByReport, getMyTrackings, deleteTracking } = require('../controllers/trackingController');
const { protect } = require('../middlewares/authMiddleware');
const { validateCreateTracking } = require('../middlewares/validateMiddleware');

router.post('/', protect, validateCreateTracking, createTracking);
router.get('/me', protect, getMyTrackings);
router.get('/:reportId', getTrackingByReport);
router.delete('/:id', protect, deleteTracking);

module.exports = router;
