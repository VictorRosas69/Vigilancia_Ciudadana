import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { HiSearch, HiBell, HiFire, HiAdjustments } from 'react-icons/hi';
import reportService from '../services/reportService';
import notificationService from '../services/notificationService';
import useAuthStore from '../store/authStore';
import ReportCard from '../components/ui/ReportCard';
import ReportCardSkeleton from '../components/ui/ReportCardSkeleton';

const PAGE_SIZE = 10;

const FILTERS = [
  {
    label: 'Todos',
    value: '',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadow: '0 4px 14px rgba(37,99,235,0.4)',
    dot: null,
  },
  {
    label: 'Pendientes',
    value: 'pending',
    gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
    shadow: '0 4px 14px rgba(234,88,12,0.35)',
    dot: 'bg-orange-400',
  },
  {
    label: 'En progreso',
    value: 'inProgress',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    shadow: '0 4px 14px rgba(124,58,237,0.35)',
    dot: 'bg-violet-500',
  },
  {
    label: 'Resueltos',
    value: 'resolved',
    gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    shadow: '0 4px 14px rgba(5,150,105,0.35)',
    dot: 'bg-green-500',
  },
];

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-green-500 to-green-700',
  'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];
const getAvatarGradient = (name = '') =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 12) return { text: 'Buenos días',   emoji: '☀️' };
  if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
  return                              { text: 'Buenas noches', emoji: '🌙' };
};

const HomePage = () => {
  const navigate      = useNavigate();
  const { user }      = useAuthStore();
  const token         = useAuthStore(s => s.token);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const sentinelRef = useRef(null);

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn:  notificationService.getUnreadCount,
    enabled:  !!token,
  });
  const unreadCount = notifData?.count || 0;

  const {
    data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch,
  } = useInfiniteQuery({
    queryKey: ['reports', statusFilter, search],
    queryFn: ({ pageParam = 1 }) => reportService.getAll({
      page: pageParam, limit: PAGE_SIZE,
      ...(statusFilter && { status: statusFilter }),
      ...(search       && { search }),
    }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination || {};
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const reports      = data?.pages.flatMap(p => p.reports) || [];
  const totalReports = data?.pages[0]?.pagination?.total ?? reports.length;
  const greeting     = getGreeting();
  const firstName    = user?.name?.split(' ')[0] || 'Usuario';
  const avatarGradient = getAvatarGradient(user?.name);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleIntersection = useCallback((entries) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
      fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersection, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  const activeFilter = FILTERS.find(f => f.value === statusFilter) || FILTERS[0];

  return (
    <div className="min-h-screen bg-gray-50/80 pb-32">

      {/* ══════════════════════════════════════════
          HEADER — gradiente azul premium
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        {/* Luces de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-8 -left-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
          <div className="absolute bottom-4 right-1/3 w-28 h-28 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-6">

          {/* Fila: avatar + nombre + campana */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3.5">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                <span className="text-white text-lg font-extrabold">
                  {firstName[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-blue-200/70 text-xs font-medium">
                  {greeting.emoji} {greeting.text}
                </p>
                <h1 className="text-white text-xl font-extrabold leading-tight tracking-tight">
                  {firstName}
                </h1>
              </div>
            </div>

            {/* Campana */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <HiBell className="text-white text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Barra de búsqueda */}
          <form onSubmit={handleSearch} className="relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10" />
            <input
              type="text"
              placeholder="Buscar reportes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white rounded-2xl pl-11 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-base"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
            />
          </form>
        </div>

        {/* Curva de transición al contenido */}
        <div className="h-7 bg-gray-50/80 rounded-t-[32px]" />
      </div>

      {/* ══════════════════════════════════════════
          FILTROS
      ══════════════════════════════════════════ */}
      <div className="px-5 pb-3 flex gap-2.5 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.92 }}
              onClick={() => setStatusFilter(f.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200"
              style={isActive
                ? { background: f.gradient, boxShadow: f.shadow, color: 'white' }
                : { background: 'white', color: '#6b7280', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }
            >
              {f.dot && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white/70' : f.dot}`} />
              )}
              {f.label}
            </motion.button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          LISTA DE REPORTES
      ══════════════════════════════════════════ */}
      <div className="px-5 flex flex-col gap-4">

        {/* Contador + botón limpiar */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: activeFilter.gradient }}>
                <HiFire className="text-white text-sm" />
              </div>
              <p className="text-gray-900 font-bold text-sm">
                {totalReports} reporte{totalReports !== 1 ? 's' : ''}
                {statusFilter && (
                  <span className="font-normal text-gray-400"> · {activeFilter.label}</span>
                )}
              </p>
            </div>
            {statusFilter && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter('')}
                className="text-blue-600 text-xs font-semibold bg-blue-50 px-3 py-1.5 rounded-full"
              >
                Ver todos
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Skeletons carga inicial */}
        {isLoading && [0, 1, 2].map(i => <ReportCardSkeleton key={i} />)}

        {/* Tarjetas */}
        <AnimatePresence>
          {reports.map((report, index) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 5) * 0.05, duration: 0.28 }}
            >
              <ReportCard report={report} onRefetch={refetch} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Sin resultados */}
        {!isLoading && reports.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
              <span className="text-5xl">🏗️</span>
            </div>
            <h3 className="text-base font-extrabold text-gray-800">Sin reportes</h3>
            <p className="text-gray-400 text-sm mt-1.5 mb-7 max-w-[200px] leading-relaxed">
              Sé el primero en reportar una obra abandonada en tu comunidad
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create-report')}
              className="text-white font-bold text-sm px-7 py-3.5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 6px 20px rgba(37,99,235,0.38)',
              }}
            >
              Crear primer reporte
            </motion.button>
          </motion.div>
        )}

        {/* Skeleton siguiente página */}
        {isFetchingNextPage && [0, 1].map(i => <ReportCardSkeleton key={i} />)}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Fin de lista */}
        {!hasNextPage && reports.length > 0 && !isLoading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-gray-200" />
            <p className="text-xs text-gray-400 font-medium">Has visto todo</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
