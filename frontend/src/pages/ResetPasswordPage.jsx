import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiLockClosed, HiArrowLeft, HiEye, HiEyeOff, HiCheckCircle, HiShieldCheck, HiMail } from 'react-icons/hi';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const prefill = location.state || {};

  const [form, setForm] = useState({
    email:           prefill.email || '',
    code:            prefill.code  || '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.code || !form.newPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.resetPassword({
        email:       form.email,
        code:        form.code,
        newPassword: form.newPassword,
      });
      if (data.token && data.user) setAuth(data.user, data.token);
      setSuccess(true);
      toast.success('¡Contraseña restablecida!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  // Fortaleza de contraseña
  const strength = (() => {
    const p = form.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel     = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColor     = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthTextColor = ['', 'text-red-400', 'text-orange-400', 'text-yellow-500', 'text-green-500'];

  const inputBase = (state) => {
    const base = 'w-full border bg-gray-50/60 rounded-2xl px-4 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition-all text-base';
    if (state === 'error')   return `${base} border-red-300 focus:ring-red-400`;
    if (state === 'success') return `${base} border-green-300 focus:ring-green-400`;
    return `${base} border-gray-200 focus:ring-blue-500`;
  };

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 40%, #2563eb 100%)'
      }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
          <div className="absolute bottom-16 -left-20 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Ícono de éxito */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-[28px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.25) 0%, rgba(16,185,129,0.15) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(52,211,153,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}>
              <HiCheckCircle className="text-emerald-400 text-5xl" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-white text-3xl font-extrabold tracking-tight mb-2">
              ¡Todo listo!
            </h1>
            <p className="text-blue-200/70 text-sm leading-relaxed px-2">
              Tu contraseña fue restablecida correctamente. Ya iniciaste sesión automáticamente.
            </p>
          </div>

          {/* Card de confirmación */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl px-5 py-5 mb-6"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <HiShieldCheck className="text-emerald-400 text-lg" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Cuenta protegida</p>
                <p className="text-blue-200/60 text-xs mt-0.5">
                  Tu nueva contraseña está activa
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
              boxShadow: '0 6px 20px rgba(37,99,235,0.38)',
            }}
          >
            Ir al inicio
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Formulario principal ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 40%, #2563eb 100%)'
    }}>

      {/* ── Decoración de fondo ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -left-20 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      </div>

      {/* ── Branding superior ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center justify-center pt-14 pb-8 px-6"
      >
        <button
          onClick={() => navigate('/forgot-password')}
          className="absolute left-5 top-14 flex items-center gap-1.5 text-white/70 active:text-white transition-colors text-sm font-medium"
        >
          <HiArrowLeft className="text-base" />
          Volver
        </button>

        <div className="w-[60px] h-[60px] rounded-[20px] flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
          <HiLockClosed className="text-white text-2xl" />
        </div>

        <h1 className="text-white text-xl font-bold tracking-tight text-center">
          Nueva contraseña
        </h1>
        <p className="text-blue-300/70 text-sm mt-1 font-medium">
          Establece tu nueva contraseña
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
        <div className="mb-7">
          <h2 className="text-[24px] font-extrabold text-gray-900 leading-snug">
            Restablecer contraseña
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Ingresa el código recibido y crea una nueva contraseña segura.
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
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                className={`${inputBase('default')} pl-11`}
              />
            </div>
          </div>

          {/* Código */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Código de recuperación
            </label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="000000"
              maxLength={6}
              className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.4em] font-mono text-gray-900 placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
            <p className="text-[11px] text-gray-400 text-center">
              Ingresa el código de 6 dígitos que recibiste
            </p>
          </div>

          {/* Nueva contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Nueva contraseña
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                type={showPass ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className={`${inputBase('default')} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600 transition-colors"
              >
                {showPass ? <HiEyeOff className="text-[18px]" /> : <HiEye className="text-[18px]" />}
              </button>
            </div>
            {/* Fortaleza */}
            {form.newPassword.length > 0 && (
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
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Confirmar contraseña
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                className={`${inputBase(
                  form.confirmPassword
                    ? form.newPassword === form.confirmPassword ? 'success' : 'error'
                    : 'default'
                )} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600 transition-colors"
              >
                {showConfirm ? <HiEyeOff className="text-[18px]" /> : <HiEye className="text-[18px]" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-400 font-medium">Las contraseñas no coinciden</p>
            )}
            {form.confirmPassword && form.newPassword === form.confirmPassword && (
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <HiCheckCircle /> Las contraseñas coinciden
              </p>
            )}
          </div>

          {/* Botón */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-1"
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
                Restableciendo...
              </>
            ) : 'Restablecer contraseña'}
          </motion.button>
        </form>

        {/* Badge seguridad */}
        <div className="flex items-center justify-center gap-1.5 mt-7">
          <HiShieldCheck className="text-gray-300 text-sm" />
          <span className="text-[11px] text-gray-300 font-medium">Conexión segura y cifrada</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
