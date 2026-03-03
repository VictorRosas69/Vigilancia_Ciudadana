import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'El email es obligatorio';
    if (!form.password) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.email || !form.password) {
    toast.error('Completa todos los campos');
    return;
  }
  setLoading(true);
  try {
    const data = await authService.login(form);
    console.log('Respuesta login:', data); // Para debug
    if (data.token && data.user) {
      setAuth(data.user, data.token);
      toast.success('¡Bienvenido! 👋');
      navigate('/');
    } else {
      toast.error('Respuesta inesperada del servidor');
    }
  } catch (error) {
    console.error('Error login:', error);
    const message = error.response?.data?.message || 'Error al iniciar sesión';
    toast.error(message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center pt-16 pb-8 px-6"
      >
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-4xl">🏛️</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Vigilancia</h1>
        <p className="text-blue-200 text-lg">Ciudadana</p>
        <p className="text-blue-300 text-sm mt-2 text-center">
          Reporta obras abandonadas en tu comunidad
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Iniciar sesión</h2>
        <p className="text-gray-500 text-sm mb-6">Ingresa tus datos para continuar</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            icon={<HiMail />}
            required
          />
          <div className="relative">
            <Input
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              icon={<HiLockClosed />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[42px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
            </button>
          </div>

          <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;