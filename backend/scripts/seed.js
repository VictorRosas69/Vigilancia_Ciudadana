/**
 * SEED SCRIPT - Datos de prueba para Vigilancia Ciudadana
 * Ejecutar con: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Importar modelos
const User = require('./src/models/User');
const Report = require('./src/models/Report');

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // ─── Limpiar datos anteriores ──────────────────────────────────────────────
    await User.deleteMany({});
    await Report.deleteMany({});
    console.log('🗑️  Datos anteriores eliminados\n');

    // ─── Crear usuarios ────────────────────────────────────────────────────────
    // El middleware pre('save') del modelo User se encarga del hasheo automático

    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@vigilancia.com',
      password: 'Admin1234',
      role: 'admin',
      city: 'Pasto',
      neighborhood: 'Centro',
      phone: '3001234567',
      isActive: true,
      isVerified: true,
      reportsCount: 0,
    });

    const ciudadano1 = await User.create({
      name: 'Carlos Muñoz',
      email: 'carlos@example.com',
      password: 'Ciudadano123',
      role: 'citizen',
      city: 'Pasto',
      neighborhood: 'Lorenzo',
      phone: '3109876543',
      isActive: true,
      isVerified: true,
      reportsCount: 2,
    });

    const ciudadano2 = await User.create({
      name: 'María Narváez',
      email: 'maria@example.com',
      password: 'Ciudadano123',
      role: 'citizen',
      city: 'Pasto',
      neighborhood: 'Obrero',
      phone: '3154567890',
      isActive: true,
      isVerified: true,
      reportsCount: 1,
    });

    console.log('👤 Usuarios creados:');
    console.log(`   Admin    → email: admin@vigilancia.com  | pass: Admin1234`);
    console.log(`   Ciudadano 1 → email: carlos@example.com   | pass: Ciudadano123`);
    console.log(`   Ciudadano 2 → email: maria@example.com    | pass: Ciudadano123\n`);

    // ─── Crear reportes ────────────────────────────────────────────────────────
    const reports = await Report.insertMany([
      {
        title: 'Hueco grande en la Calle 18 con Carrera 26',
        description:
          'Existe un hueco de aproximadamente 1 metro de diámetro en plena vía principal que afecta el tráfico vehicular y representa un peligro para motociclistas y ciclistas. Llevan más de 3 semanas sin reparar.',
        workType: 'road',
        affectations: ['traffic', 'accidents'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
            publicId: 'seed_report_1_img1',
            caption: 'Vista del hueco desde la acera',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2811, 1.2136], // [longitud, latitud] Pasto centro
          address: 'Calle 18 # 26-15, Barrio Centro',
          city: 'Pasto',
          neighborhood: 'Centro',
          department: 'Nariño',
        },
        status: 'verified',
        priority: 'high',
        author: ciudadano1._id,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
        likesCount: 12,
        viewsCount: 45,
        commentsCount: 3,
      },
      {
        title: 'Andén destruido frente a la Plaza del Carnaval',
        description:
          'El andén peatonal frente a la Plaza del Carnaval se encuentra completamente deteriorado, con baldosas levantadas y huecos que dificultan el paso de peatones, especialmente adultos mayores y personas con movilidad reducida.',
        workType: 'sidewalk',
        affectations: ['pedestrians', 'accidents'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'seed_report_2_img1',
            caption: 'Andén deteriorado',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2753, 1.2152],
          address: 'Carrera 24 # 19-20, Plaza del Carnaval',
          city: 'Pasto',
          neighborhood: 'Lorenzo',
          department: 'Nariño',
        },
        status: 'inProgress',
        priority: 'medium',
        author: ciudadano1._id,
        likesCount: 8,
        viewsCount: 30,
        commentsCount: 1,
      },
      {
        title: 'Poste de alumbrado público apagado en el Barrio Obrero',
        description:
          'Hay 4 postes de luz consecutivos apagados en la Carrera 28 entre Calles 15 y 17. La zona queda completamente oscura de noche, generando inseguridad para los residentes y comerciantes del sector.',
        workType: 'lighting',
        affectations: ['other', 'accidents'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
            publicId: 'seed_report_3_img1',
            caption: 'Postes sin luz en la noche',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2890, 1.2075],
          address: 'Carrera 28 # 15-40, Barrio Obrero',
          city: 'Pasto',
          neighborhood: 'Obrero',
          department: 'Nariño',
        },
        status: 'pending',
        priority: 'critical',
        author: ciudadano2._id,
        likesCount: 20,
        viewsCount: 60,
        commentsCount: 5,
      },
      {
        title: 'Derrumbe de talud en la Avenida Panamericana',
        description:
          'Un talud se derrumbó parcialmente sobre la Avenida Panamericana a la altura del sector El Ejido, reduciendo los carriles a uno solo. El material acumulado representa un riesgo de nuevos derrumbes con las lluvias.',
        workType: 'road',
        affectations: ['traffic', 'accidents', 'flooding'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
            publicId: 'seed_report_4_img1',
            caption: 'Talud derrumbado sobre la vía',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2950, 1.2200],
          address: 'Avenida Panamericana, sector El Ejido',
          city: 'Pasto',
          neighborhood: 'El Ejido',
          department: 'Nariño',
        },
        status: 'verified',
        priority: 'critical',
        author: ciudadano2._id,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
        likesCount: 35,
        viewsCount: 120,
        commentsCount: 8,
      },
      {
        title: 'Parque infantil con juegos dañados en Ciudad Jardín',
        description:
          'Los juegos del parque infantil del barrio Ciudad Jardín se encuentran en mal estado: el tobogán tiene bordes cortantes, los columpios están rotos y la cancha está inundada. Representa un peligro para los niños del sector.',
        workType: 'park',
        affectations: ['pedestrians', 'accidents'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=800',
            publicId: 'seed_report_5_img1',
            caption: 'Juegos deteriorados del parque',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2680, 1.2090],
          address: 'Calle 22 # 34-10, Barrio Ciudad Jardín',
          city: 'Pasto',
          neighborhood: 'Ciudad Jardín',
          department: 'Nariño',
        },
        status: 'pending',
        priority: 'medium',
        author: ciudadano1._id,
        likesCount: 14,
        viewsCount: 38,
        commentsCount: 2,
      },
      {
        title: 'Alcantarilla colapsada genera inundación en Barrio Santander',
        description:
          'La alcantarilla ubicada en la Calle 12 con Carrera 22 está completamente obstruida y colapsada. Con cada lluvia el agua se acumula inundando las viviendas del sector y generando malos olores permanentes.',
        workType: 'drainage',
        affectations: ['flooding', 'health', 'pedestrians'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1547683905-f686c993aae4?w=800',
            publicId: 'seed_report_6_img1',
            caption: 'Inundación por alcantarilla bloqueada',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2830, 1.2050],
          address: 'Calle 12 # 22-05, Barrio Santander',
          city: 'Pasto',
          neighborhood: 'Santander',
          department: 'Nariño',
        },
        status: 'inProgress',
        priority: 'high',
        author: ciudadano2._id,
        likesCount: 28,
        viewsCount: 85,
        commentsCount: 6,
      },
      {
        title: 'Puente peatonal con barandas sueltas en el sector La Minga',
        description:
          'Las barandas del puente peatonal sobre la quebrada Miraflores en el sector La Minga están completamente sueltas y oxidadas. Varios tornillos han caído y la estructura se mueve al caminar sobre ella, poniendo en riesgo a los peatones.',
        workType: 'bridge',
        affectations: ['pedestrians', 'accidents'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
            publicId: 'seed_report_7_img1',
            caption: 'Barandas oxidadas del puente peatonal',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2720, 1.2180],
          address: 'Puente peatonal Miraflores, sector La Minga',
          city: 'Pasto',
          neighborhood: 'La Minga',
          department: 'Nariño',
        },
        status: 'resolved',
        priority: 'high',
        author: ciudadano1._id,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
        likesCount: 18,
        viewsCount: 55,
        commentsCount: 4,
      },
      {
        title: 'Tubería de agua potable rota en el Barrio Alfonso López',
        description:
          'Hay una tubería de agua potable rota en la Carrera 30 # 10-20 que lleva más de una semana botando agua. Además de desperdiciar el recurso hídrico, ha ablandado el pavimento creando un hundimiento en la vía.',
        workType: 'water',
        affectations: ['traffic', 'flooding', 'other'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1584463699057-a0e9e9e41b9e?w=800',
            publicId: 'seed_report_8_img1',
            caption: 'Fuga de agua en la vía',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [-77.2870, 1.2110],
          address: 'Carrera 30 # 10-20, Barrio Alfonso López',
          city: 'Pasto',
          neighborhood: 'Alfonso López',
          department: 'Nariño',
        },
        status: 'pending',
        priority: 'high',
        author: ciudadano2._id,
        likesCount: 22,
        viewsCount: 70,
        commentsCount: 3,
      },
    ]);

    console.log('📋 Reportes creados:');
    reports.forEach((r, i) => {
      console.log(`   Reporte ${i + 1}: "${r.title}" → status: ${r.status}`);
    });

    console.log('\n✅ Seed completado exitosamente!');
    console.log('─────────────────────────────────────────');
    console.log('CREDENCIALES ADMIN:');
    console.log('  Email:    admin@vigilancia.com');
    console.log('  Password: Admin1234');
    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error en seed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
    process.exit(0);
  }
}

seed();
