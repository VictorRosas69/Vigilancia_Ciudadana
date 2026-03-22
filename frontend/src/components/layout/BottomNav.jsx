import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiMap, HiPlus, HiUser, HiPencilAlt } from 'react-icons/hi';
import { useQuery } from '@tanstack/react-query';
import notificationService from '../../services/notificationService';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/',          icon: HiHome,      label: 'Inicio',     end: true  },
  { to: '/map',       icon: HiMap,       label: 'Mapa',       end: false },
  null, // FAB central
  { to: '/petitions', icon: HiPencilAlt, label: 'Peticiones', end: false },
  { to: '/profile',   icon: HiUser,      label: 'Perfil',     end: false, badge: true },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);

  // Conteo de notificaciones no leídas — refetch cada 30 s
  const { data } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
    enabled: !!token,
  });
  const unreadCount = data?.count || 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-lg px-4 pb-2 pt-1">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl flex items-center justify-around px-2 py-1"
          style={{ boxShadow: '0 -2px 24px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.12)' }}>

          {NAV_ITEMS.map((item) => {
            if (!item) {
              return (
                <motion.button
                  key="create"
                  whileTap={{ scale: 0.88 }}
                  onClick={() => navigate('/create-report')}
                  className="relative -top-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
                  }}
                >
                  <HiPlus className="text-white text-2xl" />
                </motion.button>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="flex-1">
                {({ isActive }) => (
                  <div className="flex flex-col items-center gap-0.5 py-2 relative">
                    <div className={`p-1.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-blue-50' : ''}`}>
                      <Icon className={`text-xl transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />

                      {/* Badge de notificaciones no leídas */}
                      {item.badge && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
                      />
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
