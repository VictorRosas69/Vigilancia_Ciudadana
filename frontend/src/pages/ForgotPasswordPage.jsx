import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiMail, HiArrowLeft, HiShieldCheck, HiCheckCircle, HiLockClosed } from 'react-icons/hi';
import authService from '../services/authService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Ingresa tu email');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      setSent(true);
      if (data.resetCode) setDevCode(data.resetCode);
      toast.success('¡Código generado!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al enviar el código');
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
        {/* Botón volver */}
        <button
          onClick={() => navigate('/login')}
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
          Recuperar contraseña
        </h1>
        <p className="text-blue-300/70 text-sm mt-1 font-medium text-center px-4">
          {sent ? 'Revisa el código recibido' : 'Te enviaremos un código de acceso'}
        </p>
      </motion.div>

      {/* ── Tarjeta ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
        className="relative z-10 flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-12"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
      >
        <AnimatePresence mode="wait">

          {/* ── Estado: formulario ── */}
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-7">
                <h2 className="text-[24px] font-extrabold text-gray-900 leading-snug">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Ingresa tu email y te enviaremos un código para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      autoComplete="email"
                      className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl pl-11 pr-4 py-3.5 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
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
                      Enviando...
                    </>
                  ) : 'Enviar código de recuperación'}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-medium px-1">o</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <p className="text-center text-gray-400 text-sm">
                ¿Recuerdas tu contraseña?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 font-bold"
                >
                  Inicia sesión
                </button>
              </p>

              <div className="flex items-center justify-center gap-1.5 mt-6">
                <HiShieldCheck className="text-gray-300 text-sm" />
                <span className="text-[11px] text-gray-300 font-medium">Conexión segura y cifrada</span>
              </div>
            </motion.div>

          ) : (

            /* ── Estado: código enviado ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-7">
                <h2 className="text-[24px] font-extrabold text-gray-900 leading-snug">
                  Código generado
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Usa el código a continuación para restablecer tu contraseña.
                </p>
              </div>

              {/* Email enviado a */}
              <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3.5 mb-5">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HiMail className="text-blue-500 text-lg" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Enviado a</p>
                  <p className="text-sm font-semibold text-blue-700 truncate">{email}</p>
                </div>
              </div>

              {/* Código (solo en desarrollo) */}
              {devCode && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Tu código de recuperación
                  </p>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl py-5 flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-[0.3em] font-mono">
                      {devCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    En producción este código llega a tu email
                  </p>
                </div>
              )}

              {/* Válido */}
              <div className="flex items-center gap-2 bg-green-50 rounded-2xl px-4 py-3 mb-5">
                <HiCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                <p className="text-sm text-green-700 font-semibold">
                  Válido por <span className="font-extrabold">15 minutos</span>
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/reset-password', { state: { email, code: devCode } })}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all mb-3"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
                  boxShadow: '0 6px 20px rgba(37,99,235,0.38)',
                }}
              >
                Continuar y cambiar contraseña
              </motion.button>

              <button
                onClick={() => { setSent(false); setDevCode(''); }}
                className="w-full py-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 font-semibold text-sm transition-all active:bg-gray-100"
              >
                Usar otro email
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-6">
                <HiShieldCheck className="text-gray-300 text-sm" />
                <span className="text-[11px] text-gray-300 font-medium">Conexión segura y cifrada</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
