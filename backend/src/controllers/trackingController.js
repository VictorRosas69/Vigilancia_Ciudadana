// src/controllers/trackingController.js
const Tracking = require('../models/Tracking');
const Report = require('../models/Report');

// ─── CREAR ACCIÓN DE VEEDURÍA ─────────────────────────────────────────────────
const createTracking = async (req, res, next) => {
  try {
    const { reportId, actionType, description, targetAuthority } = req.body;

    const report = await Report.findById(reportId);
    if (!report || report.isActive === false) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    const tracking = await Tracking.create({
      report: reportId,
      citizen: req.user.id,
      actionType,
      description: description || '',
      targetAuthority: targetAuthority || '',
    });

    await tracking.populate('citizen', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Acción de veeduría registrada',
      tracking,
    });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENER ACCIONES DE UN REPORTE ───────────────────────────────────────────
const getTrackingByReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = { report: reportId, status: { $ne: 'cancelled' } };

    const trackings = await Tracking.find(filter)
      .populate('citizen', 'name avatar city')
      .sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Tracking.countDocuments(filter);

    res.status(200).json({
      success: true,
      trackings,
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

// ─── OBTENER MIS ACCIONES ─────────────────────────────────────────────────────
const getMyTrackings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const filter = { citizen: req.user.id };

    const trackings = await Tracking.find(filter)
      .populate('report', 'title status location')
      .sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Tracking.countDocuments(filter);

    res.status(200).json({
      success: true,
      trackings,
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

// ─── CANCELAR ACCIÓN ──────────────────────────────────────────────────────────
const deleteTracking = async (req, res, next) => {
  try {
    const tracking = await Tracking.findById(req.params.id);

    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Acción no encontrada' });
    }

    const isOwner = tracking.citizen.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    await Tracking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });

    res.status(200).json({ success: true, message: 'Acción cancelada' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTracking, getTrackingByReport, getMyTrackings, deleteTracking };
