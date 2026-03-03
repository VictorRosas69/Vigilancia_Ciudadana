const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        // ─── A qué reporte pertenece ──────────────────────────────────────────────
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report',
            required: [true, 'El comentario debe pertenecer a un reporte'],
        },

        // ─── Quién comentó ────────────────────────────────────────────────────────
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El comentario debe tener un autor'],
        },

        // ─── Contenido del comentario ─────────────────────────────────────────────
        content: {
            type: String,
            required: [true, 'El contenido del comentario es obligatorio'],
            trim: true,
            minlength: [2, 'El comentario debe tener al menos 2 caracteres'],
            maxlength: [500, 'El comentario no puede superar 500 caracteres'],
        },

        // ─── Respuesta a otro comentario (comentarios anidados) ───────────────────
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },

        // ─── Imagen adjunta al comentario ─────────────────────────────────────────
        image: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' },
        },

        // ─── Reacciones ───────────────────────────────────────────────────────────
        likesCount: { type: Number, default: 0 },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],

        // ─── Estado ───────────────────────────────────────────────────────────────
        isActive: { type: Boolean, default: true },
        isEdited: { type: Boolean, default: false },
        editedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Índices para búsquedas rápidas
commentSchema.index({ report: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;