const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ─── Información básica ───────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede superar 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true, // No puede haber dos usuarios con el mismo email
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingresa un email válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // NUNCA se devuelve en consultas por defecto
    },

    // ─── Rol del usuario ──────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['citizen', 'moderator', 'admin'],
      default: 'citizen', // Todo usuario nuevo es ciudadano
    },

    // ─── Foto de perfil ───────────────────────────────────────────────────────
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }, // ID en Cloudinary para poder borrarla
    },

    // ─── Información de contacto ──────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    neighborhood: {
      type: String,
      trim: true,
      default: '',
    },

    // ─── Estado de la cuenta ──────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true, // La cuenta está activa por defecto
    },
    isVerified: {
      type: Boolean,
      default: false, // El email no está verificado aún
    },

    // ─── Estadísticas del usuario ─────────────────────────────────────────────
    reportsCount: {
      type: Number,
      default: 0, // Cuántos reportes ha creado
    },
    commentsCount: {
      type: Number,
      default: 0, // Cuántos comentarios ha hecho
    },

    // ─── Configuración de privacidad ──────────────────────────────────────────
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
    },

    // ─── Token para recuperar contraseña ─────────────────────────────────────
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ─── Último acceso ────────────────────────────────────────────────────────
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// ─── MIDDLEWARE: Encriptar contraseña antes de guardar ────────────────────────
// Se ejecuta automáticamente antes de cada .save()
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// ─── MÉTODO: Comparar contraseña al hacer login ───────────────────────────────
// Se llama así: await user.comparePassword('contraseña_ingresada')
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── MÉTODO: Ocultar datos sensibles al convertir a JSON ─────────────────────
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User;





