const express = require('express');
const router = express.Router();
const { protect, protectSSE } = require('../middlewares/authMiddleware');
const {
  sseStream,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

// SSE stream — usa token en query param porque EventSource no soporta headers
router.get('/stream',       protectSSE, sseStream);

router.use(protect);

router.get('/',             getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all',   markAllAsRead);
router.patch('/:id/read',   markAsRead);
router.delete('/:id',       deleteNotification);

module.exports = router;
