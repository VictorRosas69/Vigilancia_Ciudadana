// server.js
// Este es el primer archivo que se ejecuta cuando iniciamos el servidor

// Cargamos las variables del archivo .env ANTES de todo lo demás
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// ─── Función principal: conectar BD y arrancar servidor ──────────────────────
const startServer = async () => {
    console.log('\n🚀 Iniciando Vigilancia Ciudadana API...\n');

    // Primero conectamos a MongoDB
    await connectDB();

    // Luego iniciamos el servidor HTTP
    const server = app.listen(PORT, () => {
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║   🏛️   VIGILANCIA CIUDADANA API      ║');
        console.log('╠══════════════════════════════════════╣');
        console.log(`║  ✅ Servidor:  http://localhost:${PORT}  ║`);
        console.log(`║  🔍 Health:   /api/health             ║`);
        console.log(`║  🌍 Entorno:  ${process.env.NODE_ENV.padEnd(22)} ║`);
        console.log('╚══════════════════════════════════════╝\n');
    });

    // ─── Manejo de cierre limpio del servidor ──────────────────────────────────
    // Cuando alguien presiona Ctrl+C en la terminal
    process.on('SIGTERM', () => {
        console.log('\n⚠️  Señal SIGTERM recibida. Cerrando servidor...');
        server.close(() => {
            console.log('✅ Servidor cerrado limpiamente');
            process.exit(0);
        });
    });

    // Si hay un error no capturado en el código
    process.on('unhandledRejection', (err) => {
        console.error(`\n❌ Error no manejado: ${err.message}`);
        server.close(() => {
            console.log('🛑 Servidor cerrado por error');
            process.exit(1);
        });
    });
};

// Iniciamos todo
startServer();





