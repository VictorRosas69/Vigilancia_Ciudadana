const User = require('../models/User');
const Report = require('../models/Report');

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar city role reportsCount createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const reports = await Report.find({ author: req.params.id, status: { $ne: 'rejected' } })
      .select('title status workType images location createdAt likesCount commentsCount')
      .sort({ createdAt: -1 })
      .limit(12);
    res.status(200).json({ success: true, user, reports });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile };
