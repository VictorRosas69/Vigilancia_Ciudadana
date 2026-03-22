import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
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
      background: 'linear-gradient(160deg, #1e40af 0%, #2563eb 40%, #3b82f6 100%)'
    }}>

      {/* ── Sección superior ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center justify-center pt-20 pb-12 px-6 overflow-hidden"
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute top-8 right-6 w-24 h-24 bg-white/8 rounded-full" />
        <div className="absolute -bottom-4 -left-8 w-32 h-32 bg-white/5 rounded-full" />

        {/* Icono shield */}
        <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="text-white text-3xl font-extrabold z-10 text-center tracking-tight">
          Vigilancia Ciudadana
        </h1>
        <p className="text-blue-200 text-sm mt-2 z-10 font-medium">
          Reporta obras abandonadas en tu ciudad
        </p>
      </motion.div>

      {/* ── Formulario ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-12 shadow-2xl"
      >
        <h2 className="text-2xl font-extrabold text-gray-900">Bienvenido 👋</h2>
        <p className="text-gray-400 text-sm mt-1 mb-7">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <HiMail className="text-blue-500 text-base" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 pl-14 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <HiLockClosed className="text-blue-500 text-base" />
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 pl-14 pr-14 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <HiEyeOff className="text-base" /> : <HiEye className="text-base" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-blue-600 text-xs font-semibold hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center py-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              hl="es"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            style={{
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(37, 99, 235, 0.4)',
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

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
