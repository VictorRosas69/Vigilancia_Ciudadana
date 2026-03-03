const Report = require('../models/Report');
const User = require('../models/User');

// ─── CREAR REPORTE ────────────────────────────────────────────────────────────
const createReport = async (req, res, next) => {
  try {
    const { title, description, workType, priority } = req.body;

    const location = {
      type: 'Point',
      city: req.body['location[city]'] || '',
      neighborhood: req.body['location[neighborhood]'] || '',
      address: req.body['location[address]'] || '',
      coordinates: [0, 0],
    };

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    if (lat && lng) {
      location.coordinates = [lng, lat];
      console.log('✅ Coordenadas guardadas:', [lng, lat]);
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
    });

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { reportsCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: '¡Reporte creado exitosamente!',
      report,
    });
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
      sort = '-createdAt',
    } = req.query;

    const filter = { isActive: { $ne: false } };
    if (status) filter.status = status;
    if (workType) filter.workType = workType;
    if (priority) filter.priority = priority;
    if (city) filter['location.city'] = new RegExp(city, 'i');
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
      .populate('verifiedBy', 'name');

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

    const updated = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, report: updated });
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
    await User.findByIdAndUpdate(req.user.id, { $inc: { reportsCount: -1 } });

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
      ...(status === 'verified' && { verifiedBy: req.user.id, verifiedAt: new Date() }),
      ...(status === 'rejected' && rejectionReason && { rejectionReason }),
    };

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Estado actualizado', report });
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