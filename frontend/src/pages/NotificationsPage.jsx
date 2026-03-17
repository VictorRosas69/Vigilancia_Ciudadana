import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HiBell, HiCheckCircle, HiChat, HiHeart, HiUserAdd, HiDocumentAdd, HiTrash, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

// ─── Configuración visual por tipo ────────────────────────────────────────────
const TYPE_CONFIG = {
  new_user:      { icon: HiUserAdd,      bg: 'bg-violet-50',  color: 'text-violet-500', dot: 'bg-violet-400' },
  new_report:    { icon: HiDocumentAdd,  bg: 'bg-blue-50',    color: 'text-blue-500',   dot: 'bg-blue-400'   },
  like:          { icon: HiHeart,        bg: 'bg-red-50',     color: 'text-red-500',    dot: 'bg-red-400'    },
  comment:       { icon: HiChat,         bg: 'bg-indigo-50',  color: 'text-indigo-500', dot: 'bg-indigo-400' },
  status_change: { icon: HiCheckCircle,  bg: 'bg-green-50',   color: 'text-green-500',  dot: 'bg-green-400'  },
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

// ─── Tarjeta de notificación ──────────────────────────────────────────────────
const NotifCard = ({ notif, index, onRead, onDelete }) => {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.status_change;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.read) onRead(notif._id);
    if (notif.reportId) navigate(`/reports/${notif.reportId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.04 }}
      onClick={handleClick}
      className={`bg-white rounded-2xl border p-4 flex gap-3 cursor-pointer active:bg-gray-50 transition-colors ${
        !notif.read ? 'border-indigo-100 shadow-sm shadow-indigo-50' : 'border-gray-100'
      }`}
    >
      {/* Icono */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`text-xl ${cfg.color}`} />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-bold text-gray-800 truncate">{notif.title}</p>
          {!notif.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Eliminar */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif._id); }}
        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 self-start"
      >
        <HiTrash className="text-sm" />
      </button>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    refetchInterval: 30000,
    staleTime: 0, // siempre refrescar al entrar a la página
  });

  const notifications = data?.notifications || [];
  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

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
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute top-4 right-10 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="text-white text-xl font-extrabold">Notificaciones</h1>
            <p className="text-blue-200 text-sm mt-0.5">
              {isLoading
                ? 'Cargando...'
                : unread.length > 0
                  ? `${unread.length} sin leer`
                  : 'Todo al día ✓'}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-xl font-semibold backdrop-blur active:scale-95 transition-transform disabled:opacity-60"
            >
              <HiCheck className="text-sm" />
              Marcar todas
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-1">

        {/* Skeleton */}
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse mb-2" />
        ))}

        {/* Sin leer */}
        {!isLoading && unread.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
              Sin leer · {unread.length}
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {unread.map((n, i) => (
                  <NotifCard
                    key={n._id}
                    notif={n}
                    index={i}
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
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
              Anteriores
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {read.map((n, i) => (
                  <NotifCard
                    key={n._id}
                    notif={n}
                    index={i}
                    onRead={id => readMutation.mutate(id)}
                    onDelete={id => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Error de API */}
        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2.5 mb-2">
            <span className="text-red-400 text-sm mt-0.5">⚠️</span>
            <p className="text-xs text-red-600 leading-relaxed">
              No se pudieron cargar las notificaciones. Verifica que el servidor esté corriendo y recarga la página.
            </p>
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4"
            >
              <HiBell className="text-blue-400 text-4xl" />
            </motion.div>
            <h3 className="text-base font-bold text-gray-700">Sin notificaciones</h3>
            <p className="text-gray-400 text-sm mt-1 text-center px-10">
              Te avisaremos cuando haya novedades en tus reportes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
