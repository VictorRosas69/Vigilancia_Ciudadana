import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiWifi, HiRefresh, HiExclamation } from 'react-icons/hi';

// ─── Hook reutilizable de estado de conexión ─────────────────────────────────
export const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline  = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return online;
};

// ─── Banner flotante — sin internet (aparece en cualquier página) ─────────────
export const OfflineBanner = () => {
  const online = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setVisible(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Mostrar "Conexión restaurada" por 2 s y luego ocultar
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pt-safe"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold mx-4"
        style={{
          background: online
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <HiWifi className="text-base flex-shrink-0" />
        <span>{online ? '¡Conexión restaurada!' : 'Sin conexión a internet'}</span>
      </div>
    </motion.div>
  );
};

// ─── Pantalla completa de error ───────────────────────────────────────────────
const ErrorScreen = ({ type = 'server', onRetry, message }) => {
  const online = useOnlineStatus();
  const isOffline = type === 'offline' || !online;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center px-8 py-20 text-center"
    >
      {/* Ícono */}
      <div
        className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: isOffline
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        }}
      >
        <span className="text-6xl">{isOffline ? '📡' : '⚠️'}</span>
      </div>

      {/* Título */}
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">
        {isOffline ? 'Sin conexión' : 'Algo salió mal'}
      </h2>

      {/* Descripción */}
      <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-[260px]">
        {message || (isOffline
          ? 'Verifica tu conexión a internet e inténtalo de nuevo.'
          : 'No pudimos cargar la información. El servidor puede estar temporalmente inaccesible.'
        )}
      </p>

      {/* Botón reintentar */}
      {onRetry && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onRetry}
          className="flex items-center gap-2 text-white font-bold text-sm px-7 py-3.5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 6px 20px rgba(37,99,235,0.38)',
          }}
        >
          <HiRefresh className="text-base" />
          Reintentar
        </motion.button>
      )}
    </motion.div>
  );
};

export default ErrorScreen;
