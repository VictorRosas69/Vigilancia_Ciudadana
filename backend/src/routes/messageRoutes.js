const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {
  sendMessage, getMyMessages, citizenReply,
  getAllMessages, replyToMessage,
  markAsRead, markAdminRead, getAdminUnreadCount,
} = require('../controllers/messageController');

router.post('/',                   protect,            sendMessage);
router.get('/mine',                protect,            getMyMessages);
router.post('/:id/citizen-reply',  protect,            citizenReply);
router.patch('/:id/read',          protect,            markAsRead);
router.get('/unread-count',        protect, adminOnly, getAdminUnreadCount);
router.get('/',                    protect, adminOnly, getAllMessages);
router.post('/:id/reply',          protect, adminOnly, replyToMessage);
router.patch('/:id/admin-read',    protect, adminOnly, markAdminRead);

module.exports = router;
