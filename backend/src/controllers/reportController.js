const Report = require('../models/Report');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const { createNotification } = require('./notificationController');

// ─── CREAR REPORTE ────────────────────────────────────────────────────────────
const createReport = async (req, res, next) => {
  try {
    const { title, description, workType, priority } = req.body;

    // multer puede dejar los campos como 'location[city]' (plano) o como req.body.location.city (objeto)
    const loc = req.body.location || {};
    const location = {
      type: 'Point',
      city: req.body['location[city]'] || loc.city || '',
      neighborhood: req.body['location[neighborhood]'] || loc.neighborhood || '',
      address: req.body['location[address]'] || loc.address || '',
      coordinates: [0, 0],
    };
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    if (lat && lng) {
      location.coordinates = [lng, lat];
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    const report = await Report.create({
      title,
      description,
      workType,
      priority: priority || 'medium',
      location,
      images,
      author: req.user.id,
      statusHistory: [{ status: 'pending', changedAt: new Date(), changedBy: req.user.id }],
    });

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { reportsCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: '¡Reporte creado exitosamente!',
      report,
    });

    // Notificar a todos los admins del nuevo reporte
    const reportAuthorName = req.user.name;
    const reportId = report._id;
    const reportTitle = report.title;
    const fromUserId = req.user.id;

    User.find({ role: 'admin', isActive: { $ne: false } }, '_id')
      .lean()
      .then(admins => {
        console.log(`🔔 Notificando a ${admins.length} admin(s) sobre nuevo reporte: "${reportTitle}"`);
        admins.forEach(admin =>
          createNotification({
            recipient:    admin._id,
            type:         'new_report',
            title:        'Nuevo reporte publicado',
            message:      `${reportAuthorName} publicó: "${reportTitle}"`,
            reportId:     reportId,
            fromUser:     fromUserId,
            fromUserName: reportAuthorName,
          })
        );
      })
      .catch(err => console.error('Error buscando admins para notificación de reporte:', err.message));
  } catch (error) {
    console.error('Error en createReport:', error.message);
    next(error);
  }
};

// ─── OBTENER TODOS LOS REPORTES ───────────────────────────────────────────────
const getReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      workType,
      priority,
      city,
      search,
      author,
      sort = '-createdAt',
    } = req.query;

    const filter = { isActive: { $ne: false } };
    if (status) filter.status = status;
    if (workType) filter.workType = workType;
    if (priority) filter.priority = priority;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (author) filter.author = author;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(filter)
      .populate('author', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENER UN REPORTE ───────────────────────────────────────────────────────
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('author', 'name avatar city')
      .populate('verifiedBy', 'name avatar')
      .populate('statusHistory.changedBy', 'name avatar role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    await Report.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// ─── ACTUALIZAR REPORTE ───────────────────────────────────────────────────────
const updateReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    const isAuthor = report.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const prevStatus = report.status;
    const updated = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, report: updated });

    // Notificar al autor si el estado cambió (y quien actualizó no es el propio autor)
    if (req.body.status && req.body.status !== prevStatus) {
      const STATUS_LABELS = {
        pending:    'Pendiente',
        verified:   'Verificado',
        inProgress: 'En progreso',
        resolved:   'Resuelto ✅',
        rejected:   'Rechazado',
      };
      const newLabel = STATUS_LABELS[req.body.status] || req.body.status;
      const authorId = report.author.toString();
      if (authorId !== req.user.id) {
        createNotification({
          recipient:    authorId,
          type:         'status_change',
          title:        'Estado de tu reporte actualizado',
          message:      `Tu reporte "${report.title}" ahora está: ${newLabel}`,
          reportId:     report._id,
          fromUser:     req.user.id,
          fromUserName: req.user.name,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// ─── ELIMINAR REPORTE ─────────────────────────────────────────────────────────
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    const isAuthor = report.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    await Report.findByIdAndUpdate(req.params.id, { isActive: false });
    await User.findByIdAndUpdate(report.author, { $inc: { reportsCount: -1 } });

    // Eliminar imágenes de Cloudinary (fire-and-forget, no bloquea la respuesta)
    if (report.images && report.images.length > 0) {
      const publicIds = report.images
        .map(img => img.publicId)
        .filter(Boolean);
      if (publicIds.length > 0) {
        cloudinary.api.delete_resources(publicIds)
          .catch(err => console.error('Error eliminando imágenes de Cloudinary:', err.message));
      }
    }

    res.status(200).json({ success: true, message: 'Reporte eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE LIKE ──────────────────────────────────────────────────────────────
const toggleLike = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    const userId = req.user.id;
    const alreadyLiked = report.likes.includes(userId);

    if (alreadyLiked) {
      report.likes.pull(userId);
      report.likesCount = Math.max(0, report.likesCount - 1);
    } else {
      report.likes.push(userId);
      report.likesCount += 1;
    }

    await report.save();

    // Notificar al autor solo cuando se añade like (no al quitarlo), y no al propio autor
    if (!alreadyLiked && report.author.toString() !== userId) {
      createNotification({
        recipient:    report.author,
        type:         'like',
        title:        '¡Le gustó tu reporte!',
        message:      `A ${req.user.name} le importó tu reporte "${report.title}"`,
        reportId:     report._id,
        fromUser:     userId,
        fromUserName: req.user.name,
      });
    }

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likesCount: report.likesCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const validStatuses = ['pending', 'verified', 'inProgress', 'resolved', 'rejected', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const update = {
      status,
      $push: { statusHistory: { status, changedAt: new Date(), changedBy: req.user.id } },
      ...(status === 'verified' && { verifiedBy: req.user.id, verifiedAt: new Date() }),
      ...(status === 'rejected' && rejectionReason && { rejectionReason }),
    };

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('author', '_id name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Estado actualizado', report });

    // Notificar al autor del reporte sobre el cambio de estado (si no es el mismo admin)
    if (report.author && report.author._id.toString() !== req.user.id) {
      const STATUS_LABELS = {
        verified:   'verificado ✓',
        inProgress: 'en progreso 🔧',
        resolved:   'resuelto ✅',
        rejected:   'rechazado ✗',
        closed:     'cerrado',
        pending:    'pendiente',
      };
      createNotification({
        recipient:    report.author._id,
        type:         'status_change',
        title:        'Estado de tu reporte actualizado',
        message:      `Tu reporte "${report.title}" fue marcado como ${STATUS_LABELS[status] || status}.`,
        reportId:     report._id,
        fromUser:     req.user.id,
        fromUserName: req.user.name,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  toggleLike,
  updateStatus,
};