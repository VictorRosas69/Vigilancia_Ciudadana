import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import useAuthStore from '../../store/authStore';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

const AppLayout = () => {
  const queryClient = useQueryClient();
  const token   = useAuthStore(s => s.token);
  const isGuest = useAuthStore(s => s.isGuest);
  const location = useLocation();
  const navigate = useNavigate();

  // SSE: real-time notifications with automatic exponential-backoff reconnection
  useEffect(() => {
    if (!token) return;

    let es = null;
    let retryTimeout = null;
    let retryDelay = 2000;
    const MAX_DELAY = 60000;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
      es = new EventSource(`${base}/api/notifications/stream?token=${token}`);

      es.addEventListener('connected', () => {
        retryDelay = 2000;
      });

      es.addEventListener('notification', () => {
        queryClient.invalidateQueries({ queryKey: ['notif-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });

      es.onerror = () => {
        es.close();
        if (!destroyed) {
          retryTimeout = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
            connect();
          }, retryDelay);
        }
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Banner modo invitado */}
      {isGuest && (
        <div className="sticky top-0 z-40 flex justify-center"
          style={{ background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)' }}>
          <div className="max-w-lg w-full px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-white text-xs font-semibold">
              Modo invitado · Solo puedes ver las obras
            </span>
            <button
              onClick={() => navigate('/register')}
              className="active:scale-95 transition-transform flex-shrink-0"
              style={{
                background: '#ffffff',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '4px 14px',
              }}
            >
              Regístrate
            </button>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
