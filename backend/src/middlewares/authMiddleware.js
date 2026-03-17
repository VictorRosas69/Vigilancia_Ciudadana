// src/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect: Verifica que el usuario esté autenticado ──────────────────────
// Úsalo en cualquier ruta que requiera que el usuario haya iniciado sesión
const protect = async (req, res, next) => {
  let token;

  // Los tokens se envían en el encabezado Authorization: "Bearer TOKEN_AQUI"
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Extraemos solo el token (quitamos la palabra "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verificamos que el token sea válido y no haya expirado
      // jwt.verify lanza un error si el token es inválido
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscamos al usuario en la base de datos
      // .select('-password') significa: tráeme todo EXCEPTO la contraseña
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'El usuario de este token ya no existe'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tu cuenta ha sido desactivada. Contacta al administrador'
        });
      }

      next(); // Todo bien, continúa a la siguiente función

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado. Por favor inicia sesión nuevamente'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Debes iniciar sesión primero'
    });
  }
};

// ─── adminOnly: Solo administradores ────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
};

// ─── moderatorOrAdmin: Moderadores o administradores ────────────────────────
const moderatorOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'moderator'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de moderador o administrador'
    });
  }
};

// ─── protectSSE: Para Server-Sent Events (token en query param) ──────────────
const protectSSE = async (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) return res.status(401).end();
    next();
  } catch {
    return res.status(401).end();
  }
};

module.exports = { protect, adminOnly, moderatorOrAdmin, protectSSE };





