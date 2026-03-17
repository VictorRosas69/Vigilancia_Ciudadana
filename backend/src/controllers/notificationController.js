const Notification = require('../models/Notification');

// ─── SSE — registro de clientes activos Map<userId, Set<res>> ─────────────────
const sseClients = new Map();

// Envía un evento SSE a todos los clientes del usuario (si está conectado)
const pushSSE = (userId, event, data) => {
  const id = userId.toString();
  const bucket = sseClients.get(id);
  if (!bucket || bucket.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  bucket.forEach(res => {
    try { res.write(payload); } catch { /* cliente ya desconectado */ }
  });
};

// ─── STREAM SSE ───────────────────────────────────────────────────────────────
const sseStream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // desactivar buffer en nginx/vercel
  res.flushHeaders();

  const userId = req.user.id.toString();
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId).add(res);

  // Confirmar conexión
  res.write('event: connected\ndata: {}\n\n');

  // Heartbeat cada 25 s para mantener la conexión viva
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.get(userId)?.delete(res);
  });
};

// ─── HELPER — crear notificación sin lanzar error al caller ──────────────────
const createNotification = async ({ recipient, type, title, message, reportId = null, fromUser = null, fromUserName = '' }) => {
  try {
    const notif = await Notification.create({ recipient, type, title, message, reportId, fromUser, fromUserName });
    // Push en tiempo real al destinatario si tiene conexión SSE abierta
    pushSSE(recipient, 'notification', { _id: notif._id, type, title, message });
  } catch (err) {
    console.error('⚠️  Error creando notificación:', err.message);
  }
};

// ─── OBTENER NOTIFICACIONES DEL USUARIO ──────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort('-createdAt')
      .limit(60);

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

// ─── CONTEO DE NO LEÍDAS ─────────────────────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

// ─── MARCAR UNA COMO LEÍDA ───────────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─── MARCAR TODAS COMO LEÍDAS ────────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─── ELIMINAR UNA NOTIFICACIÓN ───────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNotification,
  sseStream,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
