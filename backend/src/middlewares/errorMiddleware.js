// src/middlewares/errorMiddleware.js

// ─── Middleware: Ruta no encontrada (404) ────────────────────────────────────
// Se activa cuando alguien intenta acceder a una URL que no existe
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error); // Pasa el error al siguiente middleware (errorHandler)
};

// ─── Middleware: Manejador global de errores ─────────────────────────────────
// Captura TODOS los errores de la aplicación y devuelve una respuesta uniforme
const errorHandler = (err, req, res, next) => {
  // A veces Express dice que todo está bien (200) pero hay un error
  // En ese caso lo cambiamos a 500 (Error interno del servidor)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Error especial de MongoDB: ID con formato inválido
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Recurso no encontrado';
  }

  // Error de MongoDB: valor duplicado (ej: email ya registrado)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `El ${field} ya está registrado`;
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // Solo en desarrollo mostramos el detalle del error para depurar
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };





