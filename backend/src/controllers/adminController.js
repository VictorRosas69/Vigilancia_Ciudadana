const User = require('../models/User');
const Report = require('../models/Report');
const Comment = require('../models/Comment');

// ─── ESTADÍSTICAS GENERALES ───────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
      totalComments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Report.countDocuments({ isActive: { $ne: false } }),
      Report.countDocuments({ isActive: { $ne: false }, status: 'pending' }),
      Report.countDocuments({ isActive: { $ne: false }, status: 'inProgress' }),
      Report.countDocuments({ isActive: { $ne: false }, status: 'resolved' }),
      Report.countDocuments({ isActive: { $ne: false }, status: 'rejected' }),
      Comment.countDocuments({ isActive: { $ne: false } }),
    ]);

    // Últimos 6 meses de registros
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const reportsPerMonth = await Report.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, isActive: { $ne: false } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        reports: {
          total: totalReports,
          pending: pendingReports,
          inProgress: inProgressReports,
          resolved: resolvedReports,
          rejected: rejectedReports,
        },
        comments: { total: totalComments },
        reportsPerMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LISTAR USUARIOS ──────────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
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

// ─── ACTIVAR / DESACTIVAR USUARIO ─────────────────────────────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'No puedes desactivar a otro administrador' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: user.isActive ? 'Usuario activado' : 'Usuario desactivado',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CAMBIAR ROL DE USUARIO ───────────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['citizen', 'moderator', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Rol actualizado', user });
  } catch (error) {
    next(error);
  }
};

// ─── ELIMINAR USUARIO ─────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'No puedes eliminar a otro administrador' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUsers, toggleUserStatus, updateUserRole, deleteUser };
