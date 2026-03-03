// src/config/database.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Intentamos conectar con MongoDB usando la URL del .env
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Si funciona, mostramos un mensaje de éxito
    console.log(`✅ MongoDB conectado exitosamente`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Base de datos: ${conn.connection.name}`);

  } catch (error) {
    // Si falla, mostramos el error y cerramos la aplicación
    console.error(`❌ Error al conectar con MongoDB:`);
    console.error(`   ${error.message}`);
    console.error(`   Verifica tu MONGODB_URI en el archivo .env`);
    process.exit(1); // Cierra Node.js con código de error
  }
};

// Escuchamos eventos de la conexión para saber su estado
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB se desconectó inesperadamente');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB se reconectó correctamente');
});

module.exports = connectDB;





