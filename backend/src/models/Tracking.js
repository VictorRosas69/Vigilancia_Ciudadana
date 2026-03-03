const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema(
    {
        // ─── Reporte al que se hace seguimiento ───────────────────────────────────
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report',
            required: true,
        },

        // ─── Ciudadano que hace el seguimiento ────────────────────────────────────
        citizen: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ─── Tipo de acción de veeduría ───────────────────────────────────────────
        actionType: {
            type: String,
            required: true,
            enum: [
                'follow',           // Seguimiento simple
                'complaint',        // Queja formal
                'petition',         // Derecho de petición
                'escalation',       // Escalamiento a autoridad
                'update',           // Actualización de estado
                'evidence',         // Nueva evidencia aportada
            ],
        },

        // ─── Descripción de la acción ─────────────────────────────────────────────
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'La descripción no puede superar 1000 caracteres'],
            default: '',
        },

        // ─── Evidencia adicional ──────────────────────────────────────────────────
        attachments: [{
            url: String,
            publicId: String,
            type: { type: String, enum: ['image', 'video', 'document'] },
        }],

        // ─── Estado de la acción ──────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['active', 'resolved', 'cancelled'],
            default: 'active',
        },

        // ─── Autoridad a la que se dirige (si aplica) ─────────────────────────────
        targetAuthority: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

trackingSchema.index({ report: 1, citizen: 1 });

const Tracking = mongoose.model('Tracking', trackingSchema);
module.exports = Tracking;