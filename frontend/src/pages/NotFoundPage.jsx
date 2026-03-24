import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

const FloatingElement = ({ delay, x, y, size, emoji }) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={{ left: x, top: y, fontSize: size }}
    animate={{
      y: [0, -18, 0],
      rotate: [-5, 5, -5],
      opacity: [0.4, 0.7, 0.4],
    }}
    transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    {emoji}
  </motion.div>
);

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden" style={{
      background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
    }}>
      {/* Luces de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-16 -left-20 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 60%)' }} />
      </div>

      {/* Elementos flotantes decorativos */}
      <FloatingElement delay={0}   x="8%"  y="12%" size="28px" emoji="🏗️" />
      <FloatingElement delay={0.8} x="82%" y="18%" size="22px" emoji="🔧" />
      <FloatingElement delay={1.4} x="15%" y="72%" size="24px" emoji="🛣️" />
      <FloatingElement delay={0.4} x="75%" y="68%" size="20px" emoji="🚧" />
      <FloatingElement delay={1.8} x="50%" y="8%"  size="18px" emoji="📍" />

      {/* Número 404 con icono centrado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        <p className="text-[140px] font-extrabold leading-none select-none tracking-tighter"
          style={{ color: 'rgba(255,255,255,0.06)' }}>
          404
        </p>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-28 h-28 rounded-[32px] flex items-center justify-center text-6xl"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            🏗️
          </div>
        </motion.div>
      </motion.div>

      {/* Texto */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-white text-2xl font-extrabold tracking-tight mb-2">
          Página no encontrada
        </h1>
        <p className="text-blue-200/70 text-sm leading-relaxed max-w-xs">
          La página que buscas no existe o fue removida. Regresa al inicio para seguir explorando.
        </p>
      </motion.div>

      {/* Botones */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="w-full text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 6px 24px rgba(37,99,235,0.45)',
          }}
        >
          <HiHome className="text-lg" />
          Ir al inicio
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
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
