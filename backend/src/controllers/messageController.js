const Message = require('../models/Message');
const User    = require('../models/User');
const { createNotification } = require('./notificationController');

// ─── Notificar a todos los admins ─────────────────────────────────────────────
const notifyAdmins = async ({ type, title, message, fromUser, fromUserName, messageId }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(admin =>
      createNotification({
        recipient:    admin._id,
        type,
        title,
        message,
        fromUser,
        fromUserName,
        reportId: messageId || null,
      })
    ));
  } catch { /* no bloquear el flujo principal */ }
};

// ─── CIUDADANO: enviar nuevo mensaje ─────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Asunto y mensaje son obligatorios' });
    }
    const msg = await Message.create({ from: req.user.id, subject: subject.trim(), body: body.trim() });
    await msg.populate('from', 'name avatar');

    // Notificar a todos los admins
    notifyAdmins({
      type:         'new_message',
      title:        '💬 Nuevo mensaje',
      message:      `${req.user.name}: "${subject.trim()}"`,
      fromUser:     req.user.id,
      fromUserName: req.user.name,
    });

    res.status(201).json({ success: true, message: 'Mensaje enviado', data: msg });
  } catch (error) { next(error); }
};

// ─── CIUDADANO: obtener mis mensajes ──────────────────────────────────────────
const getMyMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ from: req.user.id })
      .populate('from', 'name avatar')
      .populate('replies.from', 'name avatar role')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) { next(error); }
};

// ─── CIUDADANO: responder en su propio hilo ───────────────────────────────────
const citizenReply = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'El mensaje es obligatorio' });

    // Solo puede responder el dueño del hilo
    const msg = await Message.findOne({ _id: req.params.id, from: req.user.id });
    if (!msg) return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });

    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { from: req.user.id, body: body.trim(), isAdmin: false } },
        adminRead: false,
      },
      { new: true }
    ).populate('from', 'name avatar').populate('replies.from', 'name avatar role');

    // Notificar a los admins de la respuesta
    notifyAdmins({
      type:         'new_message',
      title:        '💬 Respuesta de ciudadano',
      message:      `${req.user.name} respondió: "${body.trim().slice(0, 60)}${body.length > 60 ? '...' : ''}"`,
      fromUser:     req.user.id,
      fromUserName: req.user.name,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
};

// ─── ADMIN: obtener todos los mensajes ────────────────────────────────────────
const getAllMessages = async (req, res, next) => {
  try {
    const messages = await Message.find()
      .populate('from', 'name avatar email city')
      .populate('replies.from', 'name avatar role')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) { next(error); }
};

// ─── ADMIN: responder un mensaje ──────────────────────────────────────────────
const replyToMessage = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'La respuesta es obligatoria' });

    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { from: req.user.id, body: body.trim(), isAdmin: true } },
        adminRead: true,
        read: false,
      },
      { new: true }
    ).populate('from', 'name avatar email').populate('replies.from', 'name avatar role');

    if (!msg) return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });

    // Notificar al ciudadano
    createNotification({
      recipient:    msg.from._id,
      type:         'message_reply',
      title:        '💬 El administrador te respondió',
      message:      `"${body.trim().slice(0, 80)}${body.length > 80 ? '...' : ''}"`,
      fromUser:     req.user.id,
      fromUserName: req.user.name,
    }).catch(() => {});

    res.status(200).json({ success: true, data: msg });
  } catch (error) { next(error); }
};

// ─── CIUDADANO: marcar como leído ─────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    await Message.findOneAndUpdate({ _id: req.params.id, from: req.user.id }, { read: true });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

// ─── ADMIN: marcar como leído ─────────────────────────────────────────────────
const markAdminRead = async (req, res, next) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { adminRead: true });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

// ─── ADMIN: contador de no leídos ─────────────────────────────────────────────
const getAdminUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ adminRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) { next(error); }
};

module.exports = {
  sendMessage, getMyMessages, citizenReply,
  getAllMessages, replyToMessage,
  markAsRead, markAdminRead, getAdminUnreadCount,
};
