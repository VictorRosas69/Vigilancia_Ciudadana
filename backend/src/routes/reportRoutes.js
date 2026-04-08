const express = require('express');
const router = express.Router();
const {
  createReport, getReports, getReportById,
  updateReport, deleteReport, toggleLike, updateStatus, subscribeToReport,
  getPublicStats, getMapReports, getNearbyReports,
} = require('../controllers/reportController');
const { createComment, getCommentsByReport } = require('../controllers/commentController');
const { protect, moderatorOrAdmin, protectSSE } = require('../middlewares/authMiddleware');
const { uploadImages } = require('../config/cloudinary');
const { validateCreateReport, validateUpdateStatus } = require('../middlewares/validateMiddleware');

router.get('/stats', getPublicStats);
router.get('/map', getMapReports);
router.get('/nearby', getNearbyReports);
router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', protect, uploadImages.array('images', 5), validateCreateReport, createReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);
router.post('/:id/like', protect, toggleLike);
router.patch('/:id/status', protect, moderatorOrAdmin, validateUpdateStatus, updateStatus);
router.get('/:id/events', protectSSE, subscribeToReport);

// Comentarios anidados bajo reporte
router.post('/:id/comments', protect, (req, res, next) => {
  req.body.reportId = req.params.id;
  createComment(req, res, next);
});
router.get('/:id/comments', (req, res, next) => {
  req.params.reportId = req.params.id;
  getCommentsByReport(req, res, next);
});

module.exports = router;