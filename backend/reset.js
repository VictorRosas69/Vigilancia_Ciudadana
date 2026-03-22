/**
 * RESET SCRIPT - Limpia la base de datos y crea solo el admin
 * Ejecutar con: node reset.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Report = require('./src/models/Report');
const Comment = require('./src/models/Comment');

async function reset() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado\n');

    // Limpiar todas las colecciones
    await User.deleteMany({});
    await Report.deleteMany({});
    await Comment.deleteMany({});

    // Intentar limpiar colecciones opcionales si existen
    try { const Notification = require('./src/models/Notification'); await Notification.deleteMany({}); } catch {}
    try { const Petition = require('./src/models/Petition'); await Petition.deleteMany({}); } catch {}

    console.log('🗑️  Base de datos limpia\n');

    // Crear solo el admin
    await User.create({
      name: 'Administrador',
      email: 'vr1004236748@gmail.com',
      password: '1004236748*',
      role: 'admin',
      city: 'Pasto',
      isActive: true,
      isVerified: true,
      reportsCount: 0,
    });

    console.log('✅ Admin creado:');
    console.log('   Email:    vr1004236748@gmail.com');
    console.log('   Password: 1004236748*');
    console.log('\n¡Listo! La app está lista para datos reales.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

reset();
