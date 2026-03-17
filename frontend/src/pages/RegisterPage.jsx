import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser, HiLocationMarker } from 'react-icons/hi';
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

  // Fortaleza de contraseña
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
      setAuth(data.user, data.token);
      toast.success('¡Cuenta creada exitosamente! 🎉');
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

  const inputClass = (hasError) =>
    `w-full border rounded-2xl px-4 py-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
      hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 flex flex-col">

      {/* ── Sección azul superior ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center justify-center pt-14 pb-8 px-6 overflow-hidden"
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute top-6 right-4 w-24 h-24 bg-white/10 rounded-full" />

        {/* Ícono escudo */}
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-5 shadow-lg z-10">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white z-10">Vigilancia Ciudadana</h1>
        <p className="text-blue-200 text-base mt-1 z-10">Reporta obras abandonadas</p>
      </motion.div>

      {/* ── Sección blanca del formulario ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-gray-900">Crear cuenta 🎉</h2>
        <p className="text-gray-400 text-sm mt-0.5 mb-6">Únete a la comunidad</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                <HiUser />
              </span>
              <input
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={handleChange}
                className={`${inputClass(errors.name)} pl-11`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">⚠️ {errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                <HiMail />
              </span>
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                className={`${inputClass(errors.email)} pl-11`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">⚠️ {errors.email}</p>}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Ciudad
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                <HiLocationMarker />
              </span>
              <input
                name="city"
                type="text"
                placeholder="Tu ciudad"
                value={form.city}
                onChange={handleChange}
                className={`${inputClass(false)} pl-11`}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                <HiLockClosed />
              </span>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                className={`${inputClass(errors.password)} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
              </button>
            </div>
            {/* Indicador de fortaleza */}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${strengthTextColor[strength]}`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-500 mt-1">⚠️ {errors.password}</p>}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                <HiLockClosed />
              </span>
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`${inputClass(errors.confirmPassword)} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">⚠️ {errors.confirmPassword}</p>}
          </div>

          {/* reCAPTCHA */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center py-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              hl="es"
            />
          </div>
          {errors.captcha && <p className="text-xs text-red-500 -mt-3">⚠️ {errors.captcha}</p>}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!captchaToken}
            className="!py-4 !rounded-2xl !text-base"
          >
            Crear cuenta
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
