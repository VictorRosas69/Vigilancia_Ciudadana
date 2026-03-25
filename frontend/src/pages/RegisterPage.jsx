import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser, HiLocationMarker, HiShieldCheck, HiCamera } from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import Button from '../components/common/Button';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const ALLOWED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'hotmail.co',
  'outlook.com', 'outlook.es',
  'live.com', 'live.es',
  'yahoo.com', 'yahoo.es', 'yahoo.co',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'tutanota.com',
  'msn.com',
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const recaptchaRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', city: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthTextColor = ['', 'text-red-400', 'text-orange-400', 'text-yellow-500', 'text-green-500'];

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Ingresa tu nombre completo';
    if (!form.email) {
      newErrors.email = 'El email es obligatorio';
    } else {
      const domain = form.email.split('@')[1]?.toLowerCase();
      if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
        newErrors.email = 'Usa un correo real (Gmail, Hotmail, Outlook, Yahoo, etc.)';
      }
    }
    if (!form.password || form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!captchaToken) newErrors.captcha = 'Por favor completa el reCAPTCHA';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...userData } = form;
      const data = await authService.register({ ...userData, captchaToken });
      // Si hay avatar seleccionado, subirlo con el token recién obtenido
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          const { default: api } = await import('../services/api');
          const avatarRes = await api.post('/auth/me/avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${data.token}`,
            },
          });
          data.user = avatarRes.data.user;
        } catch {
          // Avatar falla silenciosamente, la cuenta ya fue creada
        }
      }
      setAuth(data.user, data.token);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear la cuenta';
      toast.error(message);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = (hasError) =>
    `w-full border bg-gray-50/60 rounded-2xl px-4 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition-all text-base ${
      hasError
        ? 'border-red-300 focus:ring-red-400'
        : 'border-gray-200 focus:ring-blue-500'
    }`;

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 40%, #2563eb 100%)'
    }}>

      {/* ── Decoración de fondo ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      </div>

      {/* ── Branding superior ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center justify-center pt-14 pb-8 px-6"
      >
        <div className="w-[60px] h-[60px] rounded-[20px] flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="text-white text-xl font-bold tracking-tight text-center">
          Vigilancia Ciudadana
        </h1>
        <p className="text-blue-300/70 text-sm mt-1 font-medium">
          Plataforma de reporte ciudadano
        </p>
      </motion.div>

      {/* ── Tarjeta del formulario ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
        className="relative z-10 flex-1 bg-white rounded-t-[32px] px-6 pt-7 pb-12"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="mb-6">
          <h2 className="text-[24px] font-extrabold text-gray-900 leading-snug">Crear cuenta</h2>
          <p className="text-gray-400 text-sm mt-1">Únete a la comunidad ciudadana</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Foto de perfil (opcional) ── */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 group"
              style={{
                background: avatarPreview ? undefined : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px dashed #bfdbfe',
                boxShadow: avatarPreview ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <HiCamera className="text-blue-400 text-3xl" />
                  <span className="text-[10px] text-blue-400 font-semibold text-center leading-tight px-1">
                    Foto de perfil
                  </span>
                </div>
              )}
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <HiCamera className="text-white text-2xl" />
              </div>
            </motion.button>
            <p className="text-[11px] text-gray-400 font-medium">
              {avatarPreview ? (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  className="text-red-400 font-semibold"
                >
                  Eliminar foto
                </button>
              ) : 'Opcional · toca para agregar'}
            </p>
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Nombre completo
            </label>
            <div className="relative">
              <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                className={`${inputBase(errors.name)} pl-11`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 font-medium">⚠ {errors.name}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Correo electrónico
            </label>
            <div className="relative">
              <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className={`${inputBase(errors.email)} pl-11`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-medium">⚠ {errors.email}</p>}
          </div>

          {/* Ciudad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Ciudad <span className="text-gray-300 normal-case font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                name="city"
                type="text"
                placeholder="Tu ciudad"
                value={form.city}
                onChange={handleChange}
                className={`${inputBase(false)} pl-11`}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Contraseña
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputBase(errors.password)} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600 transition-colors"
              >
                {showPassword ? <HiEyeOff className="text-[18px]" /> : <HiEye className="text-[18px]" />}
              </button>
            </div>
            {/* Barra de fortaleza */}
            {form.password.length > 0 && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-100'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${strengthTextColor[strength]}`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-500 font-medium">⚠ {errors.password}</p>}
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Confirmar contraseña
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputBase(errors.confirmPassword)} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600 transition-colors"
              >
                {showConfirm ? <HiEyeOff className="text-[18px]" /> : <HiEye className="text-[18px]" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">⚠ {errors.confirmPassword}</p>}
          </div>

          {/* reCAPTCHA */}
          <div className="rounded-2xl overflow-hidden flex items-center justify-center py-2"
            style={{ background: 'var(--page-bg)', border: '1px solid var(--border)' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              hl="es"
            />
          </div>
          {errors.captcha && <p className="text-xs text-red-500 font-medium -mt-2">⚠ {errors.captcha}</p>}

          {/* Botón */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: loading
                ? '#93c5fd'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(37,99,235,0.38)',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando cuenta...
              </>
            ) : 'Crear cuenta'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium px-1">o</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <p className="text-center text-gray-400 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 font-bold">
            Inicia sesión
          </Link>
        </p>

        {/* Badge seguridad */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <HiShieldCheck className="text-gray-300 text-sm" />
          <span className="text-[11px] text-gray-300 font-medium">Conexión segura y cifrada</span>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
