import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { HiMail, HiLockClosed, HiUser, HiLocationMarker } from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';


const RECAPTCHA_SITE_KEY = '6LceanQsAAAAAIXrgumAKNTRxsOOcoDGTnqmv4cE';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const recaptchaRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', city: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCaptcha = (token) => {
    setCaptchaToken(token);
    if (errors.captcha) setErrors(prev => ({ ...prev, captcha: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Ingresa tu nombre completo';
    if (!form.email) newErrors.email = 'El email es obligatorio';
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
      const data = await authService.register({
        ...userData,
        captchaToken, // Enviamos el token al backend para verificar
      });
      setAuth(data.user, data.token);
      toast.success('¡Cuenta creada exitosamente! 🎉');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear la cuenta';
      toast.error(message);
      // Resetear el captcha si hay error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center pt-12 pb-6 px-6"
      >
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
          <span className="text-3xl">🏛️</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
        <p className="text-blue-200 text-sm mt-1">Únete a la comunidad</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nombre completo" name="name" placeholder="Tu nombre"
            value={form.name} onChange={handleChange} error={errors.name}
            icon={<HiUser />} required />

          <Input label="Correo electrónico" name="email" type="email"
            placeholder="tu@email.com" value={form.email} onChange={handleChange}
            error={errors.email} icon={<HiMail />} required />

          <Input label="Ciudad" name="city" placeholder="Tu ciudad"
            value={form.city} onChange={handleChange} icon={<HiLocationMarker />} />

          <Input label="Contraseña" name="password" type="password"
            placeholder="Mínimo 6 caracteres" value={form.password}
            onChange={handleChange} error={errors.password}
            icon={<HiLockClosed />} required />

          <Input label="Confirmar contraseña" name="confirmPassword" type="password"
            placeholder="Repite tu contraseña" value={form.confirmPassword}
            onChange={handleChange} error={errors.confirmPassword}
            icon={<HiLockClosed />} required />

          {/* ─── reCAPTCHA ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-1">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptcha}
              onExpired={() => setCaptchaToken(null)}
              hl="es"
            />
            {errors.captcha && (
              <p className="text-xs text-red-500">⚠️ {errors.captcha}</p>
            )}
          </div>

          <Button type="submit" variant="primary" fullWidth
            loading={loading} disabled={!captchaToken} className="mt-2">
            Crear cuenta
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;