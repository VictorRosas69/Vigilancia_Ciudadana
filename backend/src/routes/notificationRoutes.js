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
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
} = require('../controllers/notificationController');

// SSE stream — usa token en query param porque EventSource no soporta headers
router.get('/stream',       protectSSE, sseStream);

// VAPID public key (pública, sin auth)
router.get('/vapid-key',    getVapidPublicKey);

router.use(protect);

router.get('/',             getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all',   markAllAsRead);
router.patch('/:id/read',   markAsRead);
router.delete('/:id',       deleteNotification);

// Web Push
router.post('/push/subscribe',   subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

module.exports = router;
