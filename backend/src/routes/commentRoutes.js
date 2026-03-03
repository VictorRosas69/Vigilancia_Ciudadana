const express = require('express');
const router = express.Router();
const { createComment, getCommentsByReport, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createComment);
router.get('/:reportId', getCommentsByReport);
router.delete('/:id', protect, deleteComment);

module.exports = router;