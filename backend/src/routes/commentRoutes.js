const express = require('express');
const router = express.Router();
const { createComment, getCommentsByReport, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const { validateCreateComment } = require('../middlewares/validateMiddleware');

router.post('/', protect, validateCreateComment, createComment);
router.get('/:reportId', getCommentsByReport);
router.delete('/:id', protect, deleteComment);

module.exports = router;