const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        // ─── Información básica del reporte ───────────────────────────────────────
        title: {
            type: String,
            required: [true, 'El título del reporte es obligatorio'],
            trim: true,
            minlength: [5, 'El título debe tener al menos 5 caracteres'],
            maxlength: [100, 'El título no puede superar 100 caracteres'],
        },
        description: {
            type: String,
            required: [true, 'La descripción es obligatoria'],
            trim: true,
            minlength: [5, 'La descripción debe tener al menos 5 caracteres'],
            maxlength: [2000, 'La descripción no puede superar 2000 caracteres'],
        },

        // ─── Tipo de obra y afectaciones ──────────────────────────────────────────
        workType: {
            type: String,
            required: [true, 'El tipo de obra es obligatorio'],
            enum: [
                'road',
                'sidewalk',
                'park',
                'building',
                'drainage',
                'lighting',
                'bridge',
                'water',
                'other',
            ],
        },
        affectations: [{
            type: String,
            enum: [
                'traffic',
                'flooding',
                'accidents',
                'noise',
                'dust',
                'pedestrians',
                'commerce',
                'health',
                'other',
            ],
        }],

        // ─── Evidencia multimedia ─────────────────────────────────────────────────
        images: [{
            url: { type: String, required: true },
            publicId: { type: String },
            caption: { type: String, default: '' },
        }],
        videos: [{
            url: { type: String },
            publicId: { type: String },
            thumbnail: { type: String, default: '' },
        }],

        // ─── Ubicación geográfica ─────────────────────────────────────────────────
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
            address: {
                type: String,
                trim: true,
                default: '',
            },
            city: { type: String, trim: true, default: '' },
            neighborhood: { type: String, trim: true, default: '' },
            department: { type: String, trim: true, default: '' },
        },

        // ─── Estado del reporte ───────────────────────────────────────────────────
        status: {
            type: String,
            enum: [
                'pending',
                'verified',
                'inProgress',
                'resolved',
                'rejected',
                'closed',
            ],
            default: 'pending',
        },

        // ─── Prioridad ────────────────────────────────────────────────────────────
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },

        // ─── Quién creó el reporte ────────────────────────────────────────────────
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ─── Quién lo verificó (si aplica) ───────────────────────────────────────
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        verifiedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: '',
        },

        // ─── Interacciones ────────────────────────────────────────────────────────
        commentsCount: { type: Number, default: 0 },
        likesCount: { type: Number, default: 0 },
        viewsCount: { type: Number, default: 0 },

        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],

        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],

        // ─── Historial de estados ─────────────────────────────────────────────────
        statusHistory: [{
            status: {
                type: String,
                enum: ['pending', 'verified', 'inProgress', 'resolved', 'rejected', 'closed'],
            },
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            note: { type: String, default: '' },
        }],

        // ─── Visibilidad ──────────────────────────────────────────────────────────
        isActive: { type: Boolean, default: true },
        isPublic: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// ─── ÍNDICES ──────────────────────────────────────────────────────────────────
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ author: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ workType: 1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;