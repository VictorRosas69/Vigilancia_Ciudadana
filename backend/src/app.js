// src/app.js
// Este archivo configura Express con todos sus middlewares y rutas

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Importamos los middlewares de error
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app = express();

// ─── 1. Seguridad básica con Helmet ──────────────────────────────────────────
// Helmet agrega automáticamente varios encabezados HTTP de seguridad
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Permite cargar imágenes desde Cloudinary
}));

// ─── 2. CORS: quién puede hablar con nuestra API ──────────────────────────────
// CORS es una medida de seguridad del navegador
// Solo los orígenes listados aquí podrán hacer peticiones a nuestra API
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL,     // URL del frontend en producción
            'http://localhost:5173',       // Vite en desarrollo
            'http://localhost:3000',       // Por si usas otro puerto
            'capacitor://localhost',       // App Android con Capacitor
            'ionic://localhost',           // Compatibilidad con Ionic
            'http://localhost',            // Localhost sin puerto
            null                           // Permite peticiones directas (Postman, Thunder Client)
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origen no permitido → ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── 3. Parsers: interpretar el cuerpo de las peticiones ─────────────────────
app.use(express.json({ limit: '50mb' }));           // Para peticiones con JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Para formularios HTML

// ─── 4. Logger: ver en consola cada petición que llega ───────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    // Morgan muestra: GET /api/health 200 5.123 ms - 89
}

// ─── 5. Archivos estáticos ────────────────────────────────────────────────────
// Si alguien hace GET /uploads/imagen.jpg, la sirve desde la carpeta uploads/
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── 6. Ruta de verificación (Health Check) ──────────────────────────────────
// Sirve para saber si el servidor está corriendo correctamente
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🟢 Vigilancia Ciudadana API - Operacional',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'Conectada'
    });
});

// ─── 7. Rutas de la API ───────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);

// ─── 8. Manejo de errores (SIEMPRE AL FINAL) ─────────────────────────────────
app.use(notFound);    // Captura rutas que no existen → 404
app.use(errorHandler); // Captura todos los errores → respuesta JSON uniforme

module.exports = app;


















