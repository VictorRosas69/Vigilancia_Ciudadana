import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiMap, HiPlus, HiBell, HiUser, HiChartBar } from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/',              icon: HiHome,      label: 'Inicio' },
  { to: '/map',           icon: HiMap,       label: 'Mapa' },
  { to: '/stats',         icon: HiChartBar,  label: 'Stats' },
  { to: '/notifications', icon: HiBell,      label: 'Alertas' },
  { to: '/profile',       icon: HiUser,      label: 'Perfil' },
];

const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-nav z-50">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto relative">

        {/* Inicio */}
        <NavLink to="/" end className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            isActive ? 'text-blue-600' : 'text-gray-400'
          }`
        }>
          {({ isActive }) => (
            <>
              <HiHome className="text-2xl" />
              <span className="text-xs font-medium">Inicio</span>
              {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
            </>
          )}
        </NavLink>

        {/* Mapa */}
        <NavLink to="/map" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            isActive ? 'text-blue-600' : 'text-gray-400'
          }`
        }>
          {({ isActive }) => (
            <>
              <HiMap className="text-2xl" />
              <span className="text-xs font-medium">Mapa</span>
              {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
            </>
          )}
        </NavLink>

        {/* Botón central Reportar */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/create-report')}
          className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-button -mt-4"
        >
          <HiPlus className="text-white text-2xl" />
        </motion.button>

        {/* Stats */}
        <NavLink to="/stats" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            isActive ? 'text-blue-600' : 'text-gray-400'
          }`
        }>
          {({ isActive }) => (
            <>
              <HiChartBar className="text-2xl" />
              <span className="text-xs font-medium">Stats</span>
              {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
            </>
          )}
        </NavLink>

        {/* Perfil */}
        <NavLink to="/profile" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            isActive ? 'text-blue-600' : 'text-gray-400'
          }`
        }>
          {({ isActive }) => (
            <>
              <HiUser className="text-2xl" />
              <span className="text-xs font-medium">Perfil</span>
              {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
            </>
          )}
        </NavLink>

      </div>
    </div>
  );
};

export default BottomNav;