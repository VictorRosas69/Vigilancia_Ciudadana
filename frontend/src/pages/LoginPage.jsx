import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiShieldCheck } from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const recaptchaRef = useRef(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Completa todos los campos');
      return;
    }
    if (!captchaToken) {
      toast.error('Por favor completa el reCAPTCHA');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login({ ...form, captchaToken });
      if (data.token && data.user) {
        setAuth(data.user, data.token);
        toast.success('¡Bienvenido!');
        navigate('/');
      } else {
        toast.error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="absolute bottom-1/3 right-0 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* ── Sección superior / branding ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center justify-center pt-16 pb-10 px-6"
      >
        {/* Logo */}
        <div className="w-[68px] h-[68px] rounded-[22px] flex items-center justify-center mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="text-white text-[22px] font-bold tracking-tight text-center">
          Vigilancia Ciudadana
        </h1>
        <p className="text-blue-300/70 text-sm mt-1.5 font-medium">
          Plataforma de reporte ciudadano
        </p>
      </motion.div>

      {/* ── Tarjeta del formulario ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
        className="relative z-10 flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-12"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
      >

        {/* Encabezado del formulario */}
        <div className="mb-7">
          <h2 className="text-[24px] font-extrabold text-gray-900 leading-snug">
            Bienvenido de vuelta
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
                className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3.5 pl-11 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-base"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Contraseña
              </label>
              <Link
                to="/forgot-password"
                className="text-blue-600 text-xs font-semibold"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3.5 pl-11 pr-12 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600 transition-colors"
              >
                {showPassword
                  ? <HiEyeOff className="text-[18px]" />
                  : <HiEye className="text-[18px]" />}
              </button>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="rounded-2xl overflow-hidden flex items-center justify-center py-2"
            style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              hl="es"
            />
          </div>

          {/* Botón submit */}
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
                Ingresando...
              </>
            ) : 'Iniciar sesión'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium px-1">o</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Registro */}
        <p className="text-center text-gray-400 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 font-bold">
            Regístrate gratis
          </Link>
        </p>

        {/* Badge seguridad */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <HiShieldCheck className="text-gray-300 text-sm" />
          <span className="text-[11px] text-gray-300 font-medium">Conexión segura y cifrada</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
