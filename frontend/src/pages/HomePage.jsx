import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { HiSearch, HiBell, HiFire } from 'react-icons/hi';
import reportService from '../services/reportService';
import notificationService from '../services/notificationService';
import useAuthStore from '../store/authStore';
import ReportCard from '../components/ui/ReportCard';
import ReportCardSkeleton from '../components/ui/ReportCardSkeleton';

const PAGE_SIZE = 10;

const FILTERS = [
  { label: 'Todos',       value: '',           color: 'blue' },
  { label: 'Pendientes',  value: 'pending',    color: 'orange' },
  { label: 'En progreso', value: 'inProgress', color: 'purple' },
  { label: 'Resueltos',   value: 'resolved',   color: 'green' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { text: 'Buenos días', emoji: '☀️' };
  if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
  return { text: 'Buenas noches', emoji: '🌙' };
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const sentinelRef = useRef(null);
  const token = useAuthStore(s => s.token);

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationService.getUnreadCount,
    enabled: !!token,
  });
  const unreadCount = notifData?.count || 0;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['reports', statusFilter, search],
    queryFn: ({ pageParam = 1 }) => reportService.getAll({
      page: pageParam,
      limit: PAGE_SIZE,
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search }),
    }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination || {};
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const reports = data?.pages.flatMap(p => p.reports) || [];
  const totalReports = data?.pages[0]?.pagination?.total ?? reports.length;
  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // IntersectionObserver — carga siguiente página al llegar al final
  const handleIntersection = useCallback((entries) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersection, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* ── Header ── */}
      <div className="relative bg-white px-5 pt-14 pb-5 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-blue-50 rounded-full opacity-60" />
        <div className="absolute top-4 right-8 w-16 h-16 bg-blue-100 rounded-full opacity-40" />

        <div className="relative flex items-start justify-between mb-5">
          <div>
            <p className="text-gray-400 text-sm font-medium">
              {greeting.emoji} {greeting.text}
            </p>
            <h1 className="text-gray-900 text-[1.6rem] font-extrabold leading-tight mt-0.5">
              {firstName}
            </h1>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-11 h-11 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mt-1 active:scale-95 transition-transform"
          >
            <HiBell className="text-gray-500 text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        </form>
      </div>

      {/* ── Filtros ── */}
      <div className="px-5 pt-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.93 }}
            onClick={() => setStatusFilter(f.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-gray-500 border border-gray-100 shadow-sm'
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* ── Lista de reportes ── */}
      <div className="px-5 mt-4 flex flex-col gap-3.5">

        {/* Encabezado sección */}
        {!isLoading && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiFire className="text-orange-400 text-base" />
              <p className="text-gray-900 font-bold text-sm">
                {totalReports} reporte{totalReports !== 1 ? 's' : ''}
              </p>
            </div>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="text-blue-600 text-xs font-semibold bg-blue-50 px-3 py-1 rounded-full"
              >
                Ver todos
              </button>
            )}
          </div>
        )}

        {/* Skeletons carga inicial */}
        {isLoading && (
          <>
            <ReportCardSkeleton />
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </>
        )}

        {/* Reportes */}
        <AnimatePresence>
          {reports.map((report, index) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 5) * 0.04, duration: 0.25 }}
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
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <span className="text-4xl">🏗️</span>
            </div>
            <h3 className="text-base font-bold text-gray-700">No hay reportes</h3>
            <p className="text-gray-400 text-sm mt-1 mb-6 max-w-[200px]">
              Sé el primero en reportar una obra abandonada
            </p>
            <button
              onClick={() => navigate('/create-report')}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-md shadow-blue-200"
            >
              Crear reporte
            </button>
          </motion.div>
        )}

        {/* Skeleton de carga siguiente página */}
        {isFetchingNextPage && (
          <>
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </>
        )}

        {/* Sentinel para IntersectionObserver */}
        <div ref={sentinelRef} className="h-4" />

        {/* Fin de resultados */}
        {!hasNextPage && reports.length > 0 && !isLoading && (
          <p className="text-center text-xs text-gray-400 py-4">
            Has visto todos los reportes
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
