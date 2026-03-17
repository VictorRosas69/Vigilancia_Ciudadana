// src/middlewares/validateMiddleware.js
const { validationResult, body, param } = require('express-validator');

// ─── Runner: ejecuta las validaciones y retorna 400 si hay errores ────────────
const validate = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    await validation.run(req);
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const validateRegister = validate([
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 80 }).withMessage('La ciudad no puede superar 80 caracteres'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),
]);

const validateLogin = validate([
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido'),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
]);

const validateForgotPassword = validate([
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido'),
]);

const validateResetPassword = validate([
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido'),
  body('code')
    .trim()
    .notEmpty().withMessage('El código es obligatorio')
    .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
    .isNumeric().withMessage('El código debe ser numérico'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
]);

const validateChangePassword = validate([
  body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
]);

// ─── Reports ──────────────────────────────────────────────────────────────────
const VALID_WORK_TYPES = ['road', 'sidewalk', 'park', 'building', 'drainage', 'lighting', 'bridge', 'water', 'other'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['pending', 'verified', 'inProgress', 'resolved', 'rejected', 'closed'];

const validateCreateReport = validate([
  body('title')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ min: 5, max: 120 }).withMessage('El título debe tener entre 5 y 120 caracteres'),
  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ min: 10, max: 2000 }).withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
  body('workType')
    .notEmpty().withMessage('El tipo de obra es obligatorio')
    .isIn(VALID_WORK_TYPES).withMessage(`Tipo de obra inválido. Valores permitidos: ${VALID_WORK_TYPES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES).withMessage(`Prioridad inválida. Valores permitidos: ${VALID_PRIORITIES.join(', ')}`),
]);

const validateUpdateStatus = validate([
  body('status')
    .notEmpty().withMessage('El estado es obligatorio')
    .isIn(VALID_STATUSES).withMessage(`Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`),
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty().withMessage('El motivo de rechazo es obligatorio cuando se rechaza un reporte')
    .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres'),
]);

// ─── Comments ─────────────────────────────────────────────────────────────────
const validateCreateComment = validate([
  body('reportId')
    .notEmpty().withMessage('El ID del reporte es obligatorio')
    .isMongoId().withMessage('ID de reporte inválido'),
  body('content')
    .trim()
    .notEmpty().withMessage('El comentario no puede estar vacío')
    .isLength({ min: 2, max: 1000 }).withMessage('El comentario debe tener entre 2 y 1000 caracteres'),
  body('parentComment')
    .optional()
    .isMongoId().withMessage('ID de comentario padre inválido'),
]);

// ─── Tracking ─────────────────────────────────────────────────────────────────
const VALID_ACTION_TYPES = ['follow', 'complaint', 'petition', 'escalation', 'update', 'evidence'];

const validateCreateTracking = validate([
  body('reportId')
    .notEmpty().withMessage('El ID del reporte es obligatorio')
    .isMongoId().withMessage('ID de reporte inválido'),
  body('actionType')
    .notEmpty().withMessage('El tipo de acción es obligatorio')
    .isIn(VALID_ACTION_TYPES).withMessage(`Tipo de acción inválido. Valores: ${VALID_ACTION_TYPES.join(', ')}`),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede superar 1000 caracteres'),
  body('targetAuthority')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La autoridad no puede superar 200 caracteres'),
]);

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateCreateReport,
  validateUpdateStatus,
  validateCreateComment,
  validateCreateTracking,
};
