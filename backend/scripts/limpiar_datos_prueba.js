/**
 * Script para eliminar datos de prueba creados por los tests de integración
 * Ejecutar: node scripts/limpiar_datos_prueba.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const Report   = require('../src/models/Report');
const Comment  = require('../src/models/Comment');
const Petition = require('../src/models/Petition');

const limpiar = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB\n');

  // Reportes de prueba
  const reportes = await Report.deleteMany({
    title: { $regex: 'Prueba integración', $options: 'i' }
  });
  console.log(`🗑️  Reportes eliminados:  ${reportes.deletedCount}`);

  // Comentarios de prueba
  const comentarios = await Comment.deleteMany({
    content: { $regex: 'prueba automatizada', $options: 'i' }
  });
  console.log(`🗑️  Comentarios eliminados: ${comentarios.deletedCount}`);

  // Peticiones de prueba
  const peticiones = await Petition.deleteMany({
    title: { $regex: 'Prueba integración', $options: 'i' }
  });
  console.log(`🗑️  Peticiones eliminadas: ${peticiones.deletedCount}`);

  console.log('\n✅ Limpieza completada. La base de datos solo tiene datos reales.');
  await mongoose.disconnect();
};

limpiar().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
