const nodemailer = require('nodemailer');

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Plantilla HTML base ──────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:20px 20px 0 0;padding:32px 32px 28px;text-align:center;">
          <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-block;line-height:56px;margin-bottom:16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style="color:white;font-size:20px;font-weight:800;margin:0;">Vigilancia Ciudadana</h1>
          <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;">Reporta obras abandonadas en tu comunidad</p>
        </td></tr>

        <!-- Contenido -->
        <tr><td style="background:white;padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Este es un mensaje automático, no respondas a este correo.<br/>
            &copy; ${new Date().getFullYear()} Vigilancia Ciudadana
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Email: recuperación de contraseña ────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, userName, resetCode }) => {
  const transporter = getTransporter();

  const content = `
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">Recupera tu contraseña</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Hola <strong style="color:#111827;">${userName}</strong>, recibimos una solicitud para restablecer
      la contraseña de tu cuenta. Usa el código de abajo:
    </p>

    <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
      <p style="color:#3b82f6;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">
        Código de recuperación
      </p>
      <p style="color:#1d4ed8;font-size:40px;font-weight:900;letter-spacing:10px;margin:0;font-family:monospace;">
        ${resetCode}
      </p>
      <p style="color:#93c5fd;font-size:12px;margin:12px 0 0;">
        Válido por <strong>15 minutos</strong>
      </p>
    </div>

    <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="color:#92400e;font-size:13px;margin:0;">
        ⚠️ Si no solicitaste este código, ignora este correo. Tu contraseña no cambiará.
      </p>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
      Ingresa este código en la app para crear tu nueva contraseña.
    </p>`;

  await transporter.sendMail({
    from: `"Vigilancia Ciudadana" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${resetCode} es tu código de recuperación`,
    html: baseTemplate(content),
  });
};

// ─── Email: bienvenida ────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, userName }) => {
  const transporter = getTransporter();

  const content = `
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">¡Bienvenido, ${userName}! 🎉</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Tu cuenta ha sido creada exitosamente. Ahora puedes reportar obras abandonadas
      y contribuir a mejorar tu comunidad.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="color:#166534;font-size:13px;margin:0;font-weight:600;">
        ✅ Tu cuenta está activa y lista para usar.
      </p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
      Accede desde tu navegador o instala la app para empezar.
    </p>`;

  await transporter.sendMail({
    from: `"Vigilancia Ciudadana" <${process.env.GMAIL_USER}>`,
    to,
    subject: '¡Bienvenido a Vigilancia Ciudadana!',
    html: baseTemplate(content),
  });
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
