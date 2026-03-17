const mongoose = require('mongoose');

const petitionSchema = new mongoose.Schema(
  {
    // ─── Información del documento ────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [150, 'El título no puede superar 150 caracteres'],
    },

    // Destinatario
    recipientName: {
      type: String,
      default: 'Señor Alcalde Municipal',
      trim: true,
    },
    recipientTitle: {
      type: String,
      default: 'Alcalde Municipal',
      trim: true,
    },
    city: {
      type: String,
      default: 'Pasto',
      trim: true,
    },

    // Cuerpo de la petición (texto formal)
    body: {
      type: String,
      required: [true, 'El cuerpo de la petición es obligatorio'],
      trim: true,
    },

    // Petitorio (lista de lo que se solicita)
    requests: [
      {
        type: String,
        trim: true,
      },
    ],

    // ─── Estado ───────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    isOpen: {
      type: Boolean,
      default: true, // Si está abierta para recibir firmas
    },

    // ─── Creador ──────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─── Firmas ───────────────────────────────────────────────────────────────
    signatures: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name:           { type: String, required: true },
        cedula:         { type: String, default: '' }, // Número de cédula del firmante
        city:           { type: String, default: '' },
        signedAt:       { type: Date, default: Date.now },
        signatureImage: { type: String, default: '' }, // base64 PNG de la firma manuscrita
      },
    ],

    signaturesCount: {
      type: Number,
      default: 0,
    },

    // Meta
    goal: {
      type: Number,
      default: 100, // Meta de firmas
    },
  },
  {
    timestamps: true,
  }
);

const Petition = mongoose.model('Petition', petitionSchema);
module.exports = Petition;
