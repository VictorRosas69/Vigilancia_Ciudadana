const Comment = require('../models/Comment');
const Report = require('../models/Report');
const { createNotification } = require('./notificationController');

// ─── CREAR COMENTARIO ─────────────────────────────────────────────────────────
const createComment = async (req, res, next) => {
  try {
    const { reportId, content, parentComment } = req.body;

    if (!content || content.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El comentario debe tener al menos 2 caracteres',
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    const comment = await Comment.create({
      report: reportId,
      author: req.user.id,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    await comment.populate('author', 'name avatar');

    await Report.findByIdAndUpdate(reportId, { $inc: { commentsCount: 1 } });

    // Notificar al autor del reporte si el comentador es diferente
    if (report.author.toString() !== req.user.id) {
      const preview = content.trim().length > 60
        ? content.trim().substring(0, 60) + '...'
        : content.trim();
      createNotification({
        recipient:    report.author,
        type:         'comment',
        title:        'Nuevo comentario en tu reporte',
        message:      `${req.user.name} comentó: "${preview}"`,
        reportId:     report._id,
        fromUser:     req.user.id,
        fromUserName: req.user.name,
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENER COMENTARIOS ──────────────────────────────────────────────────────
const getCommentsByReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
      report: reportId,
      parentComment: null,
      isActive: { $ne: false },
    })
      .populate('author', 'name avatar')
      .sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

// ─── ELIMINAR COMENTARIO ──────────────────────────────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
    }

    const isAuthor = comment.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    await Comment.findByIdAndUpdate(req.params.id, { isActive: false });
    await Report.findByIdAndUpdate(comment.report, { $inc: { commentsCount: -1 } });

    res.status(200).json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, getCommentsByReport, deleteComment };