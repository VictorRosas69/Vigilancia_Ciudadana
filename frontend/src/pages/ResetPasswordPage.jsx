import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiLockClosed, HiArrowLeft, HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  // Datos pre-llenados desde ForgotPasswordPage
  const prefill = location.state || {};

  const [form, setForm] = useState({
    email: prefill.email || '',
    code: prefill.code || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
        email: form.email,
        code: form.code,
        newPassword: form.newPassword,
      });
      // El backend devuelve token + user → iniciar sesión automáticamente
      if (data.token && data.user) {
        setAuth(data.user, data.token);
      }
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
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex flex-col items-center justify-center px-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center border border-white/30">
              <HiCheckCircle className="text-white text-5xl" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-extrabold mb-2">¡Listo!</h1>
          <p className="text-green-100 text-sm leading-relaxed mb-8 px-4">
            Tu contraseña fue restablecida correctamente. Ya iniciaste sesión.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-green-600 px-8 py-4 rounded-2xl font-extrabold text-sm shadow-lg active:scale-98 transition-transform"
          >
            Ir al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col">

      {/* Decoración */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute top-1/3 -left-16 w-48 h-48 bg-white/5 rounded-full" />
      </div>

      {/* Header */}
      <div className="relative px-5 pt-12 pb-4">
        <button
          onClick={() => navigate('/forgot-password')}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <HiArrowLeft className="text-base" />
          Volver
        </button>
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-5 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Ícono */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center border border-white/20">
              <HiLockClosed className="text-white text-4xl" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-white text-2xl font-extrabold mb-2">Nueva contraseña</h1>
            <p className="text-blue-100 text-sm px-4">
              Ingresa el código recibido y establece tu nueva contraseña.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/20">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Código */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Código de recuperación
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Ej: 482931"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-lg text-center font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <HiLockClosed className="text-blue-500 text-base" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
                  </button>
                </div>
                {/* Indicador de fortaleza */}
                {form.newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-orange-400' : strength === 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {strengthLabel[strength]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <HiLockClosed className="text-blue-500 text-base" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la contraseña"
                    className={`w-full bg-gray-50 border rounded-2xl pl-14 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                      form.confirmPassword && form.newPassword !== form.confirmPassword
                        ? 'border-red-300 focus:ring-red-400'
                        : form.confirmPassword && form.newPassword === form.confirmPassword
                        ? 'border-green-300 focus:ring-green-400'
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
                  </button>
                </div>
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1 font-medium">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  'Restablecer contraseña'
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
