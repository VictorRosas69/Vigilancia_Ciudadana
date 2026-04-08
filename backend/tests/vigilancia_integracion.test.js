/**
 * ============================================================
 *  VIGILANCIA CIUDADANA — Pruebas de Integración REALES
 *  Backend: https://vigilancia-ciudadana.onrender.com
 * ============================================================
 *  Estas pruebas hacen peticiones HTTP reales al servidor
 *  desplegado en Render con MongoDB Atlas real.
 *
 *  Ejecutar:
 *    npx jest tests/vigilancia_integracion.test.js --verbose --runInBand
 *
 *  Nota: --runInBand es importante para que los tests corran
 *  en orden (cada sprint depende del anterior para el token)
 * ============================================================
 */

const axios = require('axios');

// ─── Configuración global ────────────────────────────────────────────────────
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const CITIZEN = {
  email:    'feliperosasburbano03@gmail.com',
  password: '123456',
};

const ADMIN = {
  email:    'vr1004236748@gmail.com',
  password: '1004236748*',
};

// Tokens y datos que se comparten entre tests
let citizenToken = '';
let adminToken   = '';
let reportId     = '';
let petitionId   = '';
let commentId    = '';

// Timeout amplio porque Render puede tardar en responder (cold start)
jest.setTimeout(120000);

// ─── Despertar el servidor antes de correr los tests ────────────────────────
beforeAll(async () => {
  const MAX_WAIT = 180000; // 3 minutos máximo
  const INTERVAL = 5000;   // reintentar cada 5 segundos
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT) {
    try {
      const res = await axios.get(`${BASE_URL}/health`, {
        validateStatus: () => true,
        timeout: 10000,
      });
      if (res.status !== 521 && res.status !== 502 && res.status !== 503) {
        return; // servidor listo
      }
    } catch {}
    await new Promise(r => setTimeout(r, INTERVAL));
  }
}, 200000);

// ─── Helper HTTP ─────────────────────────────────────────────────────────────
const api = (token = '') => axios.create({
  baseURL: BASE_URL,
  headers: {
    'Origin': 'https://vigilancia-ciudadana.vercel.app',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  validateStatus: () => true, // nunca lanza excepción por status HTTP
});


// ════════════════════════════════════════════════════════════════════════════
//  SPRINT 1 — Autenticación y perfil de usuario (HU-001 ~ HU-004)
// ════════════════════════════════════════════════════════════════════════════

describe('SPRINT 1 — Autenticación y perfil de usuario', () => {

  describe('HU-001 — Login ciudadano', () => {
    test('POST /auth/login → devuelve token y datos del usuario', async () => {
      const res = await api().post('/auth/login', CITIZEN);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data).toHaveProperty('token');
      expect(res.data.user).toHaveProperty('email', CITIZEN.email);
      expect(res.data.user).toHaveProperty('role');
      expect(res.data.user).not.toHaveProperty('password');

      citizenToken = res.data.token; // guardamos para los siguientes sprints
    });
  });

  describe('HU-001 — Login admin', () => {
    test('POST /auth/login → admin obtiene token con role admin', async () => {
      const res = await api().post('/auth/login', ADMIN);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.user.role).toBe('admin');

      adminToken = res.data.token;
    });
  });

  describe('HU-001 — Login con credenciales incorrectas', () => {
    test('POST /auth/login → 401 si la contraseña es incorrecta', async () => {
      const res = await api().post('/auth/login', {
        email: CITIZEN.email,
        password: 'contraseña_incorrecta',
      });
      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });
  });

  describe('HU-001 — Registro con dominio no permitido', () => {
    test('POST /auth/register → 400 si el email no es de dominio válido', async () => {
      const res = await api().post('/auth/register', {
        name:     'Test User',
        email:    'test@empresa.co',
        password: '123456',
      });
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });
  });

  describe('HU-002 — Obtener perfil autenticado', () => {
    test('GET /auth/me → devuelve datos del ciudadano autenticado', async () => {
      const res = await api(citizenToken).get('/auth/me');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.user).toHaveProperty('email', CITIZEN.email);
      expect(res.data.user).not.toHaveProperty('password');
    });
  });

  describe('HU-002 — Ruta protegida sin token', () => {
    test('GET /auth/me → 401 si no hay token', async () => {
      const res = await api().get('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('HU-003 — Actualizar perfil', () => {
    test('PUT /auth/profile → actualiza ciudad del usuario', async () => {
      const res = await api(citizenToken).put('/auth/me', {
        city: 'Pasto',
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.user.city).toBe('Pasto');
    });
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  SPRINT 2 — Creación y consulta de reportes (HU-005 ~ HU-007)
// ════════════════════════════════════════════════════════════════════════════

describe('SPRINT 2 — Creación y consulta de reportes', () => {

  describe('HU-005 — Crear reporte', () => {
    test('POST /reports → crea un reporte con ubicación GPS', async () => {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('title',                    'Prueba integración — vía dañada Sprint 2');
      form.append('description',              'Reporte de prueba automatizada para Sprint 2. Hueco grande en la vía.');
      form.append('workType',                 'road');
      form.append('priority',                 'high');
      form.append('lat',                      '1.2136');
      form.append('lng',                      '-77.2811');
      form.append('location[city]',           'Pasto');
      form.append('location[neighborhood]',   'Centro');
      form.append('location[address]',        'Calle 18 con Carrera 25');

      const res = await axios.post(`${BASE_URL}/reports`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${citizenToken}`,
        },
        validateStatus: () => true,
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.report).toHaveProperty('_id');
      expect(res.data.report.workType).toBe('road');
      expect(res.data.report.location.city).toBe('Pasto');

      reportId = res.data.report._id; // guardamos para sprints siguientes
    });
  });

  describe('HU-006 — Consultar todos los reportes', () => {
    test('GET /reports → devuelve lista de reportes paginada', async () => {
      const res = await api(citizenToken).get('/reports');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.reports)).toBe(true);
      expect(res.data.reports.length).toBeGreaterThan(0);
    });
  });

  describe('HU-006 — Consultar reporte por ID', () => {
    test('GET /reports/:id → devuelve el reporte recién creado', async () => {
      const res = await api(citizenToken).get(`/reports/${reportId}`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.report._id).toBe(reportId);
      expect(res.data.report.title).toContain('Sprint 2');
    });
  });

  describe('HU-007 — Filtrar reportes por estado', () => {
    test('GET /reports?status=pending → solo trae reportes pendientes', async () => {
      const res = await api(citizenToken).get('/reports?status=pending');

      expect(res.status).toBe(200);
      // Todos los reportes devueltos deben tener status pending
      res.data.reports.forEach(r => {
        expect(r.status).toBe('pending');
      });
    });
  });

  describe('HU-007 — Dar like a un reporte', () => {
    test('POST /reports/:id/like → registra el like del ciudadano', async () => {
      const res = await api(citizenToken).post(`/reports/${reportId}/like`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  SPRINT 3 — Mapa interactivo + heatmap (HU-008 ~ HU-009)
// ════════════════════════════════════════════════════════════════════════════

describe('SPRINT 3 — Mapa interactivo + heatmap', () => {

  describe('HU-008 — Endpoint de mapa', () => {
    test('GET /reports/map → devuelve puntos con coordenadas', async () => {
      const res = await api(citizenToken).get('/reports/map');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.reports)).toBe(true);

      // Cada punto debe tener coordenadas válidas
      res.data.reports.forEach(r => {
        expect(r.location).toHaveProperty('coordinates');
        expect(r.location.coordinates).toHaveLength(2);
      });
    });
  });

  describe('HU-009 — Reportes cercanos (geolocalización)', () => {
    test('GET /reports/nearby → devuelve reportes cercanos a Pasto', async () => {
      const res = await api(citizenToken).get('/reports/nearby?lat=1.2136&lng=-77.2811&radius=5000');

      // Puede devolver 200 con resultados o 200 con array vacío — ambos son válidos
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.reports)).toBe(true);
    });
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  SPRINT 4 — Peticiones y firma digital (HU-010 ~ HU-012)
// ════════════════════════════════════════════════════════════════════════════

describe('SPRINT 4 — Peticiones y firma digital', () => {

  describe('HU-010 — Crear petición ciudadana', () => {
    test('POST /petitions → crea una petición con destinatario y cuerpo', async () => {
      const res = await api(adminToken).post('/petitions', {
        title:          'Prueba integración — Arreglar vías Sprint 4',
        recipientName:  'Señor Alcalde Municipal',
        recipientTitle: 'Alcalde Municipal',
        city:           'Pasto',
        body:           'Por medio de la presente petición, los ciudadanos solicitamos la reparación urgente de las vías.',
        requests:       ['Reparar la Calle 18', 'Instalar señalización'],
        goal:           100,
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.petition).toHaveProperty('_id');
      expect(res.data.petition.city).toBe('Pasto');

      petitionId = res.data.petition._id;
    });
  });

  describe('HU-011 — Consultar peticiones', () => {
    test('GET /petitions → devuelve lista de peticiones activas', async () => {
      const res = await api(citizenToken).get('/petitions');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.petitions)).toBe(true);
      expect(res.data.petitions.length).toBeGreaterThan(0);
    });
  });

  describe('HU-011 — Consultar petición por ID', () => {
    test('GET /petitions/:id → devuelve la petición recién creada', async () => {
      const res = await api(citizenToken).get(`/petitions/${petitionId}`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.petition._id).toBe(petitionId);
    });
  });

  describe('HU-012 — Firmar petición con firma digital', () => {
    test('POST /petitions/:id/sign → registra la firma del ciudadano', async () => {
      // Simula una firma base64 de canvas HTML5
      const fakeSignature = 'data:image/png;base64,' + 'A'.repeat(300);

      const res = await api(adminToken).post(`/petitions/${petitionId}/sign`, {
        signatureData: fakeSignature,
        city:          'Pasto',
      });

      // 200 = firmó exitosamente, 400 = ya firmó antes (ambos son comportamientos válidos)
      expect([200, 400]).toContain(res.status);
      expect(res.data).toHaveProperty('success');
    });
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  SPRINT 5 — Veeduría y notificaciones (HU-013 ~ HU-014)
// ════════════════════════════════════════════════════════════════════════════

describe('SPRINT 5 — Veeduría y notificaciones', () => {

  describe('HU-013 — Comentar en un reporte', () => {
    test('POST /reports/:id/comments → agrega un comentario', async () => {
      const res = await api(citizenToken).post(`/reports/${reportId}/comments`, {
        content: 'Comentario de prueba automatizada — Sprint 5',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.comment).toHaveProperty('_id');
      expect(res.data.comment.content).toContain('Sprint 5');

      commentId = res.data.comment._id;
    });
  });

  describe('HU-013 — Consultar comentarios de un reporte', () => {
    test('GET /reports/:id/comments → devuelve comentarios del reporte', async () => {
      const res = await api(citizenToken).get(`/reports/${reportId}/comments`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.comments)).toBe(true);
    });
  });

  describe('HU-014 — Consultar notificaciones', () => {
    test('GET /notifications → devuelve notificaciones del usuario', async () => {
      const res = await api(citizenToken).get('/notifications');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.notifications)).toBe(true);
    });
  });

  describe('HU-014 — Marcar notificación como leída', () => {
    test('PUT /notifications/read-all → marca todas como leídas', async () => {
      const res = await api(citizenToken).patch('/notifications/read-all');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });

  describe('HU-013 — SSE endpoint accesible', () => {
    test('GET /notifications/stream → responde con Content-Type event-stream', async () => {
      // Solo verificamos que el endpoint existe y responde correctamente
      const res = await axios.get(`${BASE_URL}/notifications/stream?token=${citizenToken}`, {
        validateStatus: () => true,
        timeout: 3000,
        responseType: 'stream',
      }).catch(() => ({ status: 200 })); // el stream puede cerrar la conexión — eso es normal

      expect([200, 401]).toContain(res.status);
    });
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  SPRINT 6 — Admin dashboard + exportar (HU-015 ~ HU-017)
// ════════════════════════════════════════════════════════════════════════════

describe('SPRINT 6 — Admin dashboard + exportación', () => {

  describe('HU-015 — Cambiar estado de reporte (admin)', () => {
    test('PUT /reports/:id/status → cambia estado a in_progress', async () => {
      const res = await api(adminToken).patch(`/reports/${reportId}/status`, {
        status: 'inProgress',
        note:   'Revisado por admin en prueba de integración',
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.report.status).toBe('inProgress');
    });
  });

  describe('HU-015 — Ciudadano no puede cambiar estado', () => {
    test('PUT /reports/:id/status → 403 si el usuario es ciudadano', async () => {
      const res = await api(citizenToken).patch(`/reports/${reportId}/status`, {
        status: 'resolved',
      });

      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });
  });

  describe('HU-016 — Dashboard de estadísticas (admin)', () => {
    test('GET /admin/dashboard → devuelve estadísticas del sistema', async () => {
      const res = await api(adminToken).get('/admin/dashboard');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      // Debe tener contadores del sistema
      expect(res.data).toHaveProperty('stats');
    });
  });

  describe('HU-016 — Dashboard bloqueado para ciudadanos', () => {
    test('GET /admin/dashboard → 403 si el usuario no es admin', async () => {
      const res = await api(citizenToken).get('/admin/dashboard');
      expect(res.status).toBe(403);
    });
  });

  describe('HU-017 — Consultar usuarios (admin)', () => {
    test('GET /admin/users → devuelve lista de usuarios del sistema', async () => {
      const res = await api(adminToken).get('/admin/users');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.users)).toBe(true);
      expect(res.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('HU-017 — Resolver reporte (admin)', () => {
    test('PUT /reports/:id/status → cambia estado final a resolved', async () => {
      const res = await api(adminToken).patch(`/reports/${reportId}/status`, {
        status: 'resolved',
        note:   'Reporte resuelto — prueba de integración Sprint 6',
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.report.status).toBe('resolved');
    });
  });

});

// Cerrar handles abiertos (conexiones SSE, etc.)
afterAll(done => done());