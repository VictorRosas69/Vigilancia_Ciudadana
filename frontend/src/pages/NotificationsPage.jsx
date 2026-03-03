import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiBell, HiCheckCircle, HiExclamation, HiInformationCircle } from 'react-icons/hi';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'status',
    title: 'Reporte actualizado',
    message: 'Tu reporte "Hueco en la vía" fue verificado por un moderador',
    time: 'hace 2 horas',
    read: false,
    icon: '✅',
    color: 'bg-green-50 border-green-200',
  },
  {
    id: 2,
    type: 'comment',
    title: 'Nuevo comentario',
    message: 'Alguien comentó en tu reporte "Alumbrado fallando"',
    time: 'hace 5 horas',
    read: false,
    icon: '💬',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    id: 3,
    type: 'like',
    title: 'Me importa',
    message: '3 personas marcaron tu reporte como importante',
    time: 'hace 1 día',
    read: true,
    icon: '❤️',
    color: 'bg-red-50 border-red-200',
  },
  {
    id: 4,
    type: 'resolved',
    title: '¡Reporte resuelto!',
    message: 'Tu reporte "Drenaje tapado" fue marcado como resuelto',
    time: 'hace 3 días',
    read: true,
    icon: '🎉',
    color: 'bg-yellow-50 border-yellow-200',
  },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">🔔 Notificaciones</h1>
            <p className="text-blue-200 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-xl font-medium">
              Marcar todas
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {MOCK_NOTIFICATIONS.map((notif, index) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-2xl border p-4 flex gap-3 cursor-pointer ${
              !notif.read ? 'border-blue-200 shadow-sm' : 'border-gray-100'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${notif.color}`}>
              {notif.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-800">{notif.title}</p>
                {!notif.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1.5">{notif.time}</p>
            </div>
          </motion.div>
        ))}

        {/* Estado vacío */}
        {MOCK_NOTIFICATIONS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-6xl mb-4">🔔</span>
            <h3 className="text-lg font-semibold text-gray-700">Sin notificaciones</h3>
            <p className="text-gray-400 text-sm mt-1">Te avisaremos cuando haya novedades</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;