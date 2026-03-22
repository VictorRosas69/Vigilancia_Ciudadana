# Vigilancia Ciudadana

Plataforma cívica web que permite a los ciudadanos reportar obras públicas abandonadas o paralizadas, hacer seguimiento a las respuestas gubernamentales y participar activamente en la fiscalización colectiva mediante peticiones, comentarios y mapas interactivos.

---

## Tabla de contenidos

- [¿Para qué fue creado?](#para-qué-fue-creado)
- [Funcionalidades principales](#funcionalidades-principales)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y configuración](#instalación-y-configuración)
- [Variables de entorno](#variables-de-entorno)
- [Uso](#uso)
- [API - Endpoints](#api---endpoints)
- [Roles de usuario](#roles-de-usuario)
- [Despliegue](#despliegue)

---

## ¿Para qué fue creado?

Vigilancia Ciudadana nació como respuesta a una problemática real y frecuente: las obras públicas (carreteras, parques, andenes, redes de drenaje, alumbrado, puentes) que son iniciadas pero abandonadas o paralizadas sin explicación, afectando la calidad de vida de las comunidades.

La plataforma busca:

- **Empoderar a los ciudadanos** dándoles una herramienta sencilla para documentar y reportar irregularidades en obras públicas.
- **Centralizar la información** en un mapa interactivo donde cualquier persona puede ver qué obras están reportadas en su ciudad o barrio.
- **Facilitar la presión colectiva** mediante peticiones formales que los ciudadanos pueden firmar digitalmente y dirigir a autoridades competentes.
- **Dar trazabilidad** a los reportes, permitiendo ver el avance o estado de cada caso desde que se crea hasta que se resuelve.
- **Generar transparencia** con estadísticas públicas sobre el estado de las obras en diferentes zonas del país.

---

## Funcionalidades principales

### Reportes ciudadanos
- Creación de reportes con título, descripción, tipo de obra afectada y nivel de afectación (tráfico, inundaciones, accidentes, comercio, salud, etc.).
- Carga de imágenes y videos como evidencia.
- Geolocalización automática o manual con dirección, ciudad, barrio y departamento.
- Sistema de estados: `pendiente`, `verificado`, `en progreso`, `resuelto`, `rechazado`, `cerrado`.
- Prioridades: baja, media, alta, crítica.
- Likes y seguidores por reporte.
- Contador de vistas.

### Mapa interactivo
- Visualización de todos los reportes en un mapa con Leaflet.
- Agrupamiento de marcadores (clustering) para zonas con alta densidad de reportes.
- Mapa de calor (heatmap) para identificar zonas críticas.
- Filtrado por categoría, estado o ubicación.

### Seguimiento (Tracking)
- Los ciudadanos pueden hacer seguimiento a reportes y registrar acciones como: denuncia formal, escalamiento, presentación de evidencia, petición, etc.
- Adjuntar archivos de soporte (imágenes, videos, documentos).
- Dirigir el seguimiento a la entidad gubernamental responsable.

### Peticiones cívicas
- Creación de peticiones formales con cuerpo de documento, lista de solicitudes específicas y destinatario (entidad, cargo, ciudad).
- Firma digital de peticiones con nombre, cédula y ciudad del firmante.
- Meta de firmas configurable.
- Gestión de estado: abierta o cerrada para nuevas firmas.

### Sistema de comentarios
- Comentarios por reporte con soporte para imágenes adjuntas.
- Respuestas anidadas.
- Likes en comentarios.
- Edición de comentarios propios.

### Notificaciones en tiempo real
- Transmisión de notificaciones vía Server-Sent Events (SSE).
- Tipos: nuevo usuario, nuevo reporte, like, comentario, cambio de estado.
- Contador de notificaciones no leídas.
- Marcado individual o masivo como leído.

### Panel de administración
- Estadísticas del sistema: total de usuarios, reportes por estado, actividad reciente.
- Gestión de usuarios: activar/desactivar cuentas, cambiar roles, eliminar usuarios.
- Moderación de reportes: verificar, rechazar, cambiar estado con motivo de rechazo.
- Reportes destacados.

### Autenticación y perfiles
- Registro con validación de email y reCAPTCHA.
- Login con token JWT de 7 días de vigencia.
- Recuperación de contraseña por email (Gmail SMTP).
- Perfil editable: nombre, avatar (subido a Cloudinary), teléfono, ciudad, barrio.
- Configuración de privacidad: visibilidad de email y teléfono.
- Estadísticas personales: reportes y comentarios realizados.

### Exportación de documentos
- Exportación de peticiones en formato PDF (jsPDF) y DOCX (docx.js).

### Progressive Web App (PWA)
- Instalable en dispositivos móviles y escritorio.
- Soporte offline básico con Service Worker (Workbox).
- Experiencia nativa sin barra de navegador.

---

## Tecnologías utilizadas

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2.0 | Framework UI |
| React Router | v7 | Enrutamiento SPA |
| Vite | 7.3.1 | Bundler y servidor de desarrollo |
| TypeScript | — | Tipado estático |
| Tailwind CSS | 3.4.19 | Estilos utilitarios |
| Zustand | 5.0.11 | Estado global de autenticación |
| TanStack React Query | 5.90.21 | Fetching, caché y paginación |
| Axios | 1.13.5 | Cliente HTTP con interceptores JWT |
| Leaflet + React-Leaflet | 1.9.4 / 5.0.0 | Mapas interactivos |
| Leaflet.MarkerCluster | 1.5.3 | Agrupamiento de marcadores |
| Leaflet.heat | 0.2.0 | Mapa de calor |
| Framer Motion | 12.34.3 | Animaciones |
| React Hook Form | 7.71.2 | Manejo de formularios |
| React Hot Toast | 2.6.0 | Notificaciones UI |
| jsPDF + autotable | 4.2.0 | Exportación PDF |
| docx | 9.6.1 | Exportación Word |
| browser-image-compression | 2.0.2 | Compresión de imágenes antes de subir |
| react-google-recaptcha | 3.1.0 | Protección de formularios |
| vite-plugin-pwa | 1.2.0 | Configuración PWA |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js + Express | 5.2.1 | Servidor API REST |
| MongoDB + Mongoose | 9.2.3 | Base de datos NoSQL |
| jsonwebtoken | 9.0.3 | Autenticación JWT |
| bcryptjs | 3.0.3 | Hash de contraseñas |
| Cloudinary + Multer | 1.41.3 | Almacenamiento de archivos en la nube |
| Nodemailer | 8.0.2 | Envío de correos (Gmail SMTP) |
| Resend | 6.9.3 | Servicio alternativo de email |
| Helmet | 8.1.0 | Cabeceras HTTP de seguridad |
| express-rate-limit | 8.3.1 | Límite de peticiones por IP |
| CORS | 2.8.6 | Control de orígenes permitidos |
| express-validator | 7.3.1 | Validación de datos de entrada |
| Morgan | 1.10.1 | Logging de peticiones HTTP |

---

## Estructura del proyecto

```
vigilancia-ciudadana/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Configuración principal de Express
│   │   ├── config/
│   │   │   ├── database.js         # Conexión a MongoDB Atlas
│   │   │   ├── cloudinary.js       # Configuración Cloudinary
│   │   │   └── emailService.js     # Configuración Gmail SMTP
│   │   ├── models/
│   │   │   ├── User.js             # Esquema de usuario
│   │   │   ├── Report.js           # Esquema de reporte (con índice 2dsphere)
│   │   │   ├── Comment.js          # Esquema de comentario
│   │   │   ├── Petition.js         # Esquema de petición y firmas
│   │   │   ├── Tracking.js         # Esquema de seguimiento
│   │   │   └── Notification.js     # Esquema de notificación
│   │   ├── routes/                 # Definición de rutas
│   │   ├── controllers/            # Lógica de negocio
│   │   └── middlewares/            # Auth, validación, errores
│   ├── server.js                   # Punto de entrada del servidor
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Rutas y layout principal
│   │   ├── pages/                  # Vistas de la aplicación
│   │   ├── components/             # Componentes reutilizables
│   │   ├── services/               # Capa de comunicación con la API
│   │   ├── store/                  # Estado global (Zustand)
│   │   └── utils/                  # Funciones auxiliares
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## Instalación y configuración

### Requisitos previos
- Node.js >= 18
- Cuenta en MongoDB Atlas
- Cuenta en Cloudinary
- Cuenta de Gmail con contraseña de aplicación habilitada

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/vigilancia-ciudadana.git
cd vigilancia-ciudadana
```

### 2. Configurar el backend

```bash
cd backend
npm install
```

Crear el archivo `.env` en la carpeta `backend/` (ver sección de variables de entorno).

```bash
npm run dev
```

El servidor arrancará en `http://localhost:5000`.

### 3. Configurar el frontend

```bash
cd frontend
npm install
```

Crear el archivo `.env.local` en la carpeta `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=tu_recaptcha_site_key
```

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de entorno

### Backend (`backend/.env`)

```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nombre_db

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# reCAPTCHA
RECAPTCHA_SECRET_KEY=tu_recaptcha_secret

# Email - Gmail SMTP
GMAIL_USER=tu_correo@gmail.com
GMAIL_APP_PASSWORD=tu_contrasena_de_aplicacion

# Email - Resend (alternativo)
RESEND_API_KEY=tu_resend_api_key
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=tu_recaptcha_site_key
```

---

## Uso

### Ciudadano
1. Registrarse con nombre, email y contraseña.
2. Crear un reporte seleccionando el tipo de obra, describiendo el problema y marcando la ubicación en el mapa.
3. Adjuntar fotos o videos como evidencia.
4. Seguir el estado del reporte y recibir notificaciones ante cualquier cambio.
5. Comentar en reportes de otros ciudadanos.
6. Firmar peticiones activas.

### Moderador
- Verificar reportes pendientes.
- Actualizar el estado de los reportes.
- Rechazar reportes con motivo especificado.

### Administrador
- Acceso completo al panel de administración.
- Gestión de usuarios y roles.
- Creación y gestión de peticiones formales.
- Visualización de estadísticas globales.

---

## API - Endpoints

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| POST | `/api/auth/register` | Registro de usuario | No |
| POST | `/api/auth/login` | Inicio de sesión | No |
| GET | `/api/auth/me` | Perfil del usuario actual | JWT |
| PUT | `/api/auth/me` | Actualizar perfil | JWT |
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña | No |
| POST | `/api/auth/reset-password` | Restablecer contraseña con token | No |
| GET | `/api/reports` | Listar reportes (filtros, paginación) | No |
| GET | `/api/reports/:id` | Detalle de un reporte | No |
| POST | `/api/reports` | Crear reporte | JWT |
| PATCH | `/api/reports/:id/status` | Cambiar estado del reporte | Moderador/Admin |
| POST | `/api/reports/:id/like` | Dar/quitar like a un reporte | JWT |
| GET | `/api/comments` | Listar comentarios de un reporte | No |
| POST | `/api/comments` | Crear comentario | JWT |
| GET | `/api/petitions` | Listar peticiones | No |
| POST | `/api/petitions` | Crear petición | Admin |
| POST | `/api/petitions/:id/sign` | Firmar petición | JWT |
| GET | `/api/notifications/stream` | Stream SSE de notificaciones | JWT |
| GET | `/api/notifications` | Listar notificaciones | JWT |
| PATCH | `/api/notifications/read-all` | Marcar todas como leídas | JWT |
| POST | `/api/tracking` | Crear seguimiento a un reporte | JWT |
| GET | `/api/admin/stats` | Estadísticas del sistema | Admin |
| GET | `/api/admin/users` | Gestión de usuarios | Admin |
| GET | `/api/health` | Estado del servidor | No |

---

## Roles de usuario

| Rol | Descripción | Permisos especiales |
|---|---|---|
| `citizen` | Usuario estándar | Crear reportes, comentar, firmar peticiones |
| `moderator` | Moderador de contenido | Verificar/rechazar/actualizar estado de reportes |
| `admin` | Administrador completo | Todo lo anterior + gestión de usuarios, creación de peticiones, panel de estadísticas |

---

## Despliegue

### Frontend — Vercel
- Plataforma: [Vercel](https://vercel.com)
- URL de producción: `https://vigilancia-ciudadana.vercel.app`
- Build: `tsc -b && vite build`
- Output: `frontend/dist/`

### Backend — Render
- Plataforma: [Render](https://render.com)
- URL de producción: `https://vigilancia-ciudadana.onrender.com`
- Start command: `node server.js`

### Base de datos — MongoDB Atlas
- Servicio: [MongoDB Atlas](https://www.mongodb.com/atlas)
- Protocolo de conexión: `mongodb+srv`

### Archivos — Cloudinary
- Servicio: [Cloudinary](https://cloudinary.com)
- Almacena imágenes de reportes, avatares y archivos adjuntos en comentarios/seguimientos.

---

## Seguridad

- Contraseñas hasheadas con bcrypt.
- Tokens JWT con expiración configurable.
- Rate limiting en endpoints sensibles:
  - Login: 5 intentos cada 15 minutos.
  - Registro: 20 por hora.
  - Recuperación de contraseña: 3 por hora.
- Cabeceras HTTP de seguridad con Helmet.
- Validación de entradas con express-validator.
- Protección de formularios públicos con Google reCAPTCHA v2.
- CORS configurado explícitamente para orígenes permitidos.

---

## Licencia

Este proyecto fue desarrollado con fines cívicos y educativos.
