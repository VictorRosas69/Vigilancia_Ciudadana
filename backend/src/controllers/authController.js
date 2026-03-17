const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notificationController');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../config/emailService');

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'hotmail.co',
  'outlook.com', 'outlook.es',
  'live.com', 'live.es',
  'yahoo.com', 'yahoo.es', 'yahoo.co',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'tutanota.com',
  'msn.com',
];

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      city: user.city,
      reportsCount: user.reportsCount,
    },
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, city, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son obligatorios',
      });
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: 'Usa un correo real (Gmail, Hotmail, Outlook, Yahoo, iCloud, etc.)',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cuenta con ese email',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      city: city || '',
      phone: phone || '',
    });

    sendTokenResponse(user, 201, res, '¡Cuenta creada exitosamente!');

    // Email de bienvenida (fire-and-forget, no bloquea la respuesta)
    sendWelcomeEmail({ to: user.email, userName: user.name })
      .catch(err => console.error('Error enviando email de bienvenida:', err.message));

    // Notificar a todos los admins del nuevo registro
    // $ne: false captura documentos con isActive:true Y documentos sin el campo
    User.find({ role: 'admin', isActive: { $ne: false } }, '_id')
      .lean()
      .then(admins => {
        console.log(`🔔 Notificando a ${admins.length} admin(s) sobre nuevo usuario: ${user.name}`);
        admins.forEach(admin =>
          createNotification({
            recipient:    admin._id,
            type:         'new_user',
            title:        'Nuevo ciudadano registrado',
            message:      `${user.name} se ha unido a Vigilancia Ciudadana.`,
            fromUser:     user._id,
            fromUserName: user.name,
          })
        );
      })
      .catch(err => console.error('Error buscando admins:', err.message));
  } catch (error) {
    console.error('Error en register:', error.message);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada',
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Sesión iniciada correctamente');
  } catch (error) {
    console.error('Error en login:', error.message);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'city', 'neighborhood'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Ambas contraseñas son obligatorias',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isCorrect = await user.comparePassword(currentPassword);

    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta',
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Contraseña actualizada correctamente');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es obligatorio' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Respuesta genérica para no revelar si el email existe
      return res.status(200).json({
        success: true,
        message: 'Si ese email está registrado, recibirás el código de recuperación.',
      });
    }

    // Generar token de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = resetHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutos
    await user.save({ validateBeforeSave: false });

    // Enviar el código por email
    let emailSent = false;
    try {
      await sendPasswordResetEmail({
        to:        user.email,
        userName:  user.name,
        resetCode,
      });
      emailSent = true;
      console.log('📧 Código de recuperación enviado');
    } catch (emailErr) {
      console.error('Error enviando email de recuperación:', emailErr.message);
      // En producción, si el email falla se cancela el proceso
      if (process.env.NODE_ENV === 'production') {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({
          success: false,
          message: 'No se pudo enviar el email. Intenta de nuevo en unos minutos.',
        });
      }
      // En desarrollo, continuamos y devolvemos el código directamente
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? 'Código enviado a tu correo electrónico.'
        : 'Email no disponible en desarrollo. Usa el código que aparece en pantalla.',
      // En desarrollo devolvemos el código directamente (email puede no estar configurado)
      ...(process.env.NODE_ENV !== 'production' && { resetCode }),
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, código y nueva contraseña son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const resetHash = crypto.createHash('sha256').update(code.trim()).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: resetHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado. Solicita uno nuevo.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, '¡Contraseña restablecida correctamente!');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };