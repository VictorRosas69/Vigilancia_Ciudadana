const express = require('express');
const router = express.Router();
const {
  createReport, getReports, getReportById,
  updateReport, deleteReport, toggleLike, updateStatus,
} = require('../controllers/reportController');
const { protect, moderatorOrAdmin } = require('../middlewares/authMiddleware');
const { uploadImages } = require('../config/cloudinary');
const { validateCreateReport, validateUpdateStatus } = require('../middlewares/validateMiddleware');

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', protect, uploadImages.array('images', 5), validateCreateReport, createReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);
router.post('/:id/like', protect, toggleLike);
router.patch('/:id/status', protect, moderatorOrAdmin, validateUpdateStatus, updateStatus);

module.exports = router;