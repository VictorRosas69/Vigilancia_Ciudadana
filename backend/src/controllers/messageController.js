const Message = require('../models/Message');

const sendMessage = async (req, res, next) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Asunto y mensaje son obligatorios' });
    }
    const message = await Message.create({ from: req.user.id, subject: subject.trim(), body: body.trim() });
    await message.populate('from', 'name avatar');
    res.status(201).json({ success: true, message: 'Mensaje enviado', data: message });
  } catch (error) { next(error); }
};

const getMyMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ from: req.user.id })
      .populate('from', 'name avatar')
      .populate('replies.from', 'name avatar role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) { next(error); }
};

const getAllMessages = async (req, res, next) => {
  try {
    const messages = await Message.find()
      .populate('from', 'name avatar email city')
      .populate('replies.from', 'name avatar role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) { next(error); }
};

const replyToMessage = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ success: false, message: 'La respuesta es obligatoria' });
    }
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { from: req.user.id, body: body.trim(), isAdmin: true } },
        adminRead: true,
        read: false,
      },
      { new: true }
    ).populate('from', 'name avatar email').populate('replies.from', 'name avatar role');
    if (!message) return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
    res.status(200).json({ success: true, data: message });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    await Message.findOneAndUpdate({ _id: req.params.id, from: req.user.id }, { read: true });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

const markAdminRead = async (req, res, next) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { adminRead: true });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

const getAdminUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ adminRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) { next(error); }
};

module.exports = { sendMessage, getMyMessages, getAllMessages, replyToMessage, markAsRead, markAdminRead, getAdminUnreadCount };
