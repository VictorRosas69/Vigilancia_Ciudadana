import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-6">

      {/* Número 404 decorativo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-4"
      >
        <p className="text-[120px] font-extrabold text-blue-100 leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border border-blue-100 flex items-center justify-center text-5xl">
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
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
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
        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 active:scale-98 transition-transform"
        >
          <HiHome className="text-base" />
          Ir al inicio
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full bg-white border border-gray-200 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
        >
          <HiArrowLeft className="text-base" />
          Volver atrás
        </button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
