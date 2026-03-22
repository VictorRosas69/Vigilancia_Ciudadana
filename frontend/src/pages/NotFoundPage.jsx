import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{
      background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
    }}>
      {/* Luces de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-16 -left-20 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* Número 404 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        <p className="text-[120px] font-extrabold leading-none select-none"
          style={{ color: 'rgba(255,255,255,0.08)' }}>
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
            🏗️
          </div>
        </div>
      </motion.div>

      {/* Texto */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-white text-2xl font-extrabold tracking-tight mb-2">
          Página no encontrada
        </h1>
        <p className="text-blue-200/70 text-sm leading-relaxed max-w-xs">
          La página que buscas no existe o fue movida. Vuelve al inicio para seguir explorando reportes.
        </p>
      </motion.div>

      {/* Botones */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="w-full text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
          }}
        >
          <HiHome className="text-lg" />
          Ir al inicio
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'white',
          }}
        >
          <HiArrowLeft className="text-base" />
          Volver atrás
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
