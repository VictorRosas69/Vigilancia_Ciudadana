import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BottomNav from './BottomNav';
import useAuthStore from '../../store/authStore';

const AppLayout = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore(s => s.token);

  // ── SSE: notificaciones en tiempo real con reconexión automática ───────────
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
        retryDelay = 2000; // reset backoff al conectar exitosamente
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
      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
