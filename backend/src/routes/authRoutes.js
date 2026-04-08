const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword, uploadAvatarController } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadAvatar } = require('../config/cloudinary');
const {
  validateRegister, validateLogin, validateForgotPassword,
  validateResetPassword, validateChangePassword,
} = require('../middlewares/validateMiddleware');

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// En entornos no productivos, omitir rate limiting completamente.
// En producción siempre se aplica.
const skipInDev = () => process.env.NODE_ENV !== 'production';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { success: false, message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: skipInDev,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { success: false, message: 'Demasiados registros desde esta IP. Intenta en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: skipInDev,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: { success: false, message: 'Demasiadas solicitudes de recuperación. Intenta en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skip: skipInDev,
});

// ─── Rutas ────────────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarController);
router.put('/change-password', protect, validateChangePassword, changePassword);
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

module.exports = router;



