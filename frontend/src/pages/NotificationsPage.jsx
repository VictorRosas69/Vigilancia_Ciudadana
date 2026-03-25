import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HiBell, HiCheckCircle, HiChat, HiHeart, HiUserAdd, HiDocumentAdd, HiTrash, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import usePushNotifications from '../hooks/usePushNotifications';

const TYPE_CONFIG = {
  new_user:      { icon: HiUserAdd,     bg: 'bg-violet-100', color: 'text-violet-600', dot: 'bg-violet-400' },
  new_report:    { icon: HiDocumentAdd, bg: 'bg-blue-100',   color: 'text-blue-600',   dot: 'bg-blue-400'   },
  like:          { icon: HiHeart,       bg: 'bg-red-100',    color: 'text-red-500',    dot: 'bg-red-400'    },
  comment:       { icon: HiChat,        bg: 'bg-indigo-100', color: 'text-indigo-600', dot: 'bg-indigo-400' },
  status_change: { icon: HiCheckCircle, bg: 'bg-green-100',  color: 'text-green-600',  dot: 'bg-green-400'  },
  message_reply: { icon: HiChat,        bg: 'bg-violet-100', color: 'text-violet-600', dot: 'bg-violet-400' },
  new_message:   { icon: HiChat,        bg: 'bg-blue-100',   color: 'text-blue-600',   dot: 'bg-blue-400'   },
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days} día${days !== 1 ? 's' : ''}`;
  return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const NotifCard = ({ notif, index, onRead, onDelete }) => {
  const navigate = useNavigate();
  const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.status_change;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.read) onRead(notif._id);
    if (notif.type === 'message_reply') navigate('/messages');
    else if (notif.type === 'new_message') navigate('/admin/messages');
    else if (notif.reportId) navigate(`/reports/${notif.reportId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.04 }}
      onClick={handleClick}
      className="bg-white rounded-3xl p-4 flex gap-3.5 cursor-pointer active:scale-[0.99] transition-all"
      style={{
        boxShadow: notif.read
          ? '0 1px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)'
          : '0 2px 16px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.1)',
      }}
    >
      {/* Ícono */}
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`text-xl ${cfg.color}`} />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-bold text-gray-900 leading-snug">{notif.title}</p>
          {!notif.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${cfg.dot}`} />}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Eliminar */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif._id); }}
        className="p-1.5 text-gray-300 active:text-red-400 rounded-xl transition-colors flex-shrink-0 self-start"
      >
        <HiTrash className="text-base" />
      </button>
    </motion.div>
  );
};

// ─── Banner de activar push notifications ────────────────────────────────────
const PushBanner = () => {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!supported) return null;
  if (permission === 'denied') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-1 rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(37,99,235,0.12), 0 0 0 1px rgba(37,99,235,0.08)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white">
        {/* Ícono */}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: subscribed ? 'linear-gradient(135deg, #059669,#047857)' : 'linear-gradient(135deg, #3b82f6,#1d4ed8)' }}>
          <span className="text-lg">{subscribed ? '🔔' : '🔕'}</span>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {subscribed ? 'Notificaciones activas' : 'Activar notificaciones push'}
          </p>
          <p className="text-xs text-gray-400 leading-tight mt-0.5">
            {subscribed
              ? 'Te avisamos cuando cambia el estado de tus reportes'
              : 'Recibe alertas aunque la app esté cerrada'}
          </p>
        </div>

        {/* Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          onClick={subscribed ? unsubscribe : subscribe}
          className="flex-shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
          style={{
            background: subscribed
              ? 'rgba(5,150,105,0.1)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: subscribed ? '#059669' : 'white',
          }}
        >
          {loading ? '...' : subscribed ? 'Desactivar' : 'Activar'}
        </motion.button>
      </div>
    </motion.div>
  );
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const notifications = data?.notifications || [];
  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n =>  n.read);

  const readMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      toast.success('Todas marcadas como leídas');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--page-bg)' }}>

      {/* ── Header ── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-8 -left-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">Notificaciones</h1>
              <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
                {isLoading ? 'Cargando...' : unread.length > 0 ? `${unread.length} sin leer` : 'Todo al día'}
              </p>
            </div>
            {unread.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-2xl transition-all disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
              >
                <HiCheck className="text-sm" />
                Marcar todas
              </motion.button>
            )}
          </div>
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: 'var(--page-bg)' }} />
      </div>

      {/* ── Contenido ── */}
      <div className="-mt-1 flex flex-col gap-3">

        {/* Banner push */}
        <PushBanner />

        <div className="px-4 flex flex-col gap-3">

        {/* Skeletons */}
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl h-20 animate-pulse"
            style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }} />
        ))}

        {/* Sin leer */}
        {!isLoading && unread.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2.5">
              Sin leer · {unread.length}
            </p>
            <div className="flex flex-col gap-2.5">
              <AnimatePresence>
                {unread.map((n, i) => (
                  <NotifCard key={n._id} notif={n} index={i}
                    onRead={id => readMutation.mutate(id)}
                    onDelete={id => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Leídas */}
        {!isLoading && read.length > 0 && (
          <div className={unread.length > 0 ? 'mt-2' : ''}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2.5">
              Anteriores
            </p>
            <div className="flex flex-col gap-2.5">
              <AnimatePresence>
                {read.map((n, i) => (
                  <NotifCard key={n._id} notif={n} index={i}
                    onRead={id => readMutation.mutate(id)}
                    onDelete={id => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 flex items-start gap-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <p className="text-sm text-red-600 leading-relaxed">
              No se pudieron cargar las notificaciones. Verifica tu conexión y recarga.
            </p>
          </div>
        )}

        {/* Vacío */}
        {!isLoading && !isError && notifications.length === 0 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center justify-center py-20 text-center px-6"
  >
    {/* Floating icon */}
    <div className="relative mb-6">
      <div className="w-28 h-28 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', boxShadow: '0 20px 60px rgba(37,99,235,0.35)' }}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HiBell className="text-white text-5xl" />
        </motion.div>
      </div>
      {/* Decorative rings */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-3xl border-2 border-blue-400"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute inset-0 rounded-3xl border border-blue-300"
      />
    </div>
    <h3 className="text-lg font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>Sin notificaciones</h3>
    <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: 'var(--text-2)' }}>
      Cuando alguien reaccione a tus reportes o cambie su estado, te avisaremos aquí
    </p>
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="mt-5 flex items-center gap-2 text-xs font-semibold text-blue-500"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
      Monitoreando en tiempo real
    </motion.div>
  </motion.div>
)}
        </div>{/* end inner px-4 div */}
      </div>
    </div>
  );
};

export default NotificationsPage;
