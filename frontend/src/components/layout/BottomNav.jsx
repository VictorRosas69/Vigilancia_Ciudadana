import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiHome, HiMap, HiPlus, HiUser, HiPencilAlt } from 'react-icons/hi';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import notificationService from '../../services/notificationService';
import useAuthStore from '../../store/authStore';
import haptic from '../../utils/haptic';

const NAV_ITEMS = [
  { to: '/',          icon: HiHome,      label: 'Inicio',     end: true  },
  { to: '/map',       icon: HiMap,       label: 'Mapa',       end: false },
  null, // FAB central
  { to: '/petitions', icon: HiPencilAlt, label: 'Peticiones', end: false },
  { to: '/profile',   icon: HiUser,      label: 'Perfil',     end: false, badge: true },
];

const BottomNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = useAuthStore(s => s.token);
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef(null);
  const showTimer = useRef(null);

  const { data } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
    enabled: !!token,
  });
  const unreadCount = data?.count || 0;
  const isMapPage = location.pathname === '/map';

  // Auto-hide when the user interacts with the Leaflet map
  useEffect(() => {
    if (!isMapPage) { setVisible(true); return; }

    const onTouchStart = (e) => {
      // Only hide if touching inside the actual map tiles (not overlays)
      if (!e.target.closest('.leaflet-tile-pane') &&
          !e.target.closest('.leaflet-marker-pane') &&
          !e.target.closest('.leaflet-overlay-pane') &&
          !e.target.closest('.leaflet-container > .leaflet-map-pane')) return;

      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 80);
    };

    const onTouchEnd = () => {
      clearTimeout(hideTimer.current);
      showTimer.current = setTimeout(() => setVisible(true), 1800);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend',   onTouchEnd);
      clearTimeout(hideTimer.current);
      clearTimeout(showTimer.current);
    };
  }, [isMapPage]);

  const isActive = (item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="bottom-nav"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320, mass: 0.8 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {/* Pill container */}
          <div
            className="pointer-events-auto flex items-center gap-1 px-2 py-2"
            style={{
              borderRadius: 32,
              background: 'rgba(10, 10, 14, 0.82)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: [
                '0 20px 60px rgba(0,0,0,0.45)',
                '0 8px 24px rgba(0,0,0,0.3)',
                '0 2px 8px rgba(0,0,0,0.2)',
                'inset 0 1px 0 rgba(255,255,255,0.07)',
              ].join(', '),
            }}
          >
            {NAV_ITEMS.map((item) => {
              // ── FAB central ──────────────────────────────────────────────
              if (!item) {
                return (
                  <motion.button
                    key="fab"
                    whileTap={{ scale: 0.84 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => { haptic.medium(); navigate('/create-report'); }}
                    className="w-12 h-12 flex items-center justify-center mx-0.5 flex-shrink-0"
                    style={{
                      borderRadius: 20,
                      background: 'linear-gradient(145deg, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)',
                      boxShadow: '0 4px 20px rgba(37,99,235,0.55), 0 0 0 1px rgba(96,165,250,0.25)',
                    }}
                  >
                    <HiPlus className="text-white text-[22px]" />
                  </motion.button>
                );
              }

              // ── Nav item ─────────────────────────────────────────────────
              const Icon   = item.icon;
              const active = isActive(item);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => haptic.light()}
                  className="relative flex items-center justify-center"
                  style={{ outline: 'none' }}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                    className="relative flex items-center overflow-hidden"
                    style={{
                      borderRadius: 22,
                      height: 44,
                      paddingLeft: active ? 14 : 12,
                      paddingRight: active ? 14 : 12,
                      minWidth: 44,
                    }}
                  >
                    {/* Sliding active background */}
                    {active && (
                      <motion.div
                        layoutId="tab-pill"
                        className="absolute inset-0"
                        style={{
                          borderRadius: 22,
                          background: 'rgba(59,130,246,0.18)',
                          border: '1px solid rgba(59,130,246,0.28)',
                        }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      />
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <motion.div
                        animate={{ scale: active ? 1.1 : 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        <Icon
                          style={{
                            fontSize: 20,
                            color: active ? '#93c5fd' : 'rgba(156,163,175,0.8)',
                            filter: active ? 'drop-shadow(0 0 6px rgba(96,165,250,0.5))' : 'none',
                            transition: 'color 0.2s, filter 0.2s',
                          }}
                        />
                      </motion.div>

                      {/* Badge */}
                      {item.badge && unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
                          style={{ boxShadow: '0 0 0 1.5px rgba(10,10,14,0.8)' }}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </div>

                    {/* Animated label */}
                    <motion.span
                      animate={{
                        maxWidth: active ? 64 : 0,
                        opacity:  active ? 1  : 0,
                        marginLeft: active ? 7 : 0,
                      }}
                      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="relative z-10 text-[13px] font-bold whitespace-nowrap overflow-hidden"
                      style={{ color: '#93c5fd' }}
                    >
                      {item.label}
                    </motion.span>
                  </motion.div>
                </NavLink>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
