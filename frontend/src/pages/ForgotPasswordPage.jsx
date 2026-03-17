import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiMail, HiArrowLeft, HiShieldCheck } from 'react-icons/hi';
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
      // En desarrollo el backend retorna el código directamente
      if (data.resetCode) setDevCode(data.resetCode);
      toast.success('¡Código generado!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col">

      {/* Decoración */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute top-1/3 -left-16 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-10 w-40 h-40 bg-indigo-500/20 rounded-full" />
      </div>

      {/* Header */}
      <div className="relative px-5 pt-12 pb-4">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <HiArrowLeft className="text-base" />
          Volver al login
        </button>
      </div>

      {/* Contenido */}
      <div className="relative flex-1 flex flex-col justify-center px-5 pb-10">

        {!sent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Ícono */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center border border-white/20">
                <HiMail className="text-white text-4xl" />
              </div>
            </div>

            {/* Títulos */}
            <div className="text-center mb-8">
              <h1 className="text-white text-2xl font-extrabold mb-2">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-blue-100 text-sm leading-relaxed px-4">
                Ingresa tu email y te enviaremos un código para restablecer tu contraseña.
              </p>
            </div>

            {/* Formulario */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/20">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Email registrado
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <HiMail className="text-blue-500 text-base" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      autoComplete="email"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar código de recuperación'
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                ¿Recuerdas tu contraseña?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </motion.div>

        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Ícono éxito */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-400/20 backdrop-blur rounded-3xl flex items-center justify-center border border-green-300/30">
                <HiShieldCheck className="text-green-300 text-4xl" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-white text-2xl font-extrabold mb-2">
                ¡Código generado!
              </h1>
              <p className="text-blue-100 text-sm leading-relaxed px-4">
                Usa el siguiente código para restablecer tu contraseña. Válido por <span className="font-bold text-white">15 minutos</span>.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/20 flex flex-col gap-4">

              {/* Código visible (solo en desarrollo — en producción llega al email) */}
              {devCode ? (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-2">
                    Tu código de recuperación
                  </p>
                  <p className="text-3xl font-extrabold text-blue-700 tracking-[0.3em]">
                    {devCode}
                  </p>
                  <p className="text-[11px] text-blue-400 mt-2">
                    En producción este código llegaría a tu email
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                  <p className="text-sm text-green-700 font-semibold">
                    Revisa tu bandeja de entrada
                  </p>
                  <p className="text-[11px] text-green-500 mt-1">
                    Ingresa el código de 6 dígitos que enviamos a <span className="font-bold">{email}</span>
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate('/reset-password', { state: { email, code: devCode } })}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-98 transition-all"
              >
                Continuar para cambiar contraseña
              </button>

              <button
                onClick={() => { setSent(false); setDevCode(''); }}
                className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm active:scale-98 transition-all"
              >
                Usar otro email
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
