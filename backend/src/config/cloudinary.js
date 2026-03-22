// src/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuramos Cloudinary con nuestras credenciales del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuramos dónde y cómo se guardan las IMÁGENES en Cloudinary
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vigilancia-ciudadana/images', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Formatos permitidos
    transformation: [
      { width: 1200, height: 900, crop: 'limit' }, // Máximo 1200x900px
      { quality: 'auto' }                           // Calidad automática
    ],
  },
});

// Configuramos dónde y cómo se guardan los VIDEOS en Cloudinary
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vigilancia-ciudadana/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'avi', 'mov', 'webm'],
  },
});

// Función que valida si el archivo es una imagen
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'), false);
  }
};

// Función que valida si el archivo es un video
const videoFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten videos MP4, AVI, MOV o WEBM'), false);
  }
};

// Configuración de multer para imágenes (máximo 5 imágenes, 10MB cada una)
const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB por imagen
    files: 5                     // Máximo 5 imágenes
  }
});

// Configuración de multer para videos (máximo 1 video, 100MB)
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB por video
    files: 1
  }
});

// Configuramos almacenamiento para avatares de perfil
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vigilancia-ciudadana/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ],
  },
});

// Configuración de multer para avatares (1 imagen, 5MB)
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1
  }
});

module.exports = { cloudinary, uploadImages, uploadVideo, uploadAvatar };








