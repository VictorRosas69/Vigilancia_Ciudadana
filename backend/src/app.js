// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const petitionRoutes = require('./routes/petitionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app = express();

// ─── Trust proxy (necesario en Render/Heroku para rate limiting) ──────────────
app.set('trust proxy', 1);

// ─── 1. Seguridad ────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── 2. CORS ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost',
      'capacitor://localhost',
      'ionic://localhost',
      'https://vigilancia-ciudadana.vercel.app',
      null,
    ];

    const isLocalNetwork = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);

    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin) || isLocalNetwork) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origen no permitido → ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── 3. Parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── 4. Logger ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── 5. Archivos estáticos ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── 6. Ruta raíz ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏛️ Vigilancia Ciudadana API - Operacional',
    version: '1.0.0',
    endpoints: {
      health:   '/api/health',
      auth:     '/api/auth',
      reports:  '/api/reports',
      comments: '/api/comments',
    },
  });
});

// ─── 7. Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🟢 Vigilancia Ciudadana API - Operacional',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'Conectada',
  });
});

// ─── 8. Rutas ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/petitions', petitionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// ─── 9. Errores ───────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;