import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { HiSearch, HiBell, HiFire, HiRefresh } from 'react-icons/hi';
import { HiAdjustments } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../services/reportService';
import notificationService from '../services/notificationService';
import useAuthStore from '../store/authStore';
import ReportCard from '../components/ui/ReportCard';
import ReportCardSkeleton from '../components/ui/ReportCardSkeleton';
import usePullToRefresh from '../hooks/usePullToRefresh';
import ErrorScreen from '../components/ui/ErrorScreen';

const PAGE_SIZE = 10;

const HISTORY_KEY = 'vc_search_history';
const getHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } };
const saveHistory = (term) => {
  if (!term?.trim()) return;
  const updated = [term, ...getHistory().filter(h => h !== term)].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

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
  const queryClient   = useQueryClient();
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState(getHistory);
  const [newReportsAvailable, setNewReportsAvailable] = useState(false);
  const sentinelRef = useRef(null);
  const shownNewestRef = useRef(null);

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn:  notificationService.getUnreadCount,
    enabled:  !!token,
  });
  const unreadCount = notifData?.count || 0;

  const handlePullRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['reports'] });
    await queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    await queryClient.invalidateQueries({ queryKey: ['reports-trending'] });
  }, [queryClient]);

  const { pullY, refreshing } = usePullToRefresh(handlePullRefresh);

  const {
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch,
  } = useInfiniteQuery({
    queryKey: ['reports', statusFilter, search, workTypeFilter, sortBy],
    queryFn: ({ pageParam = 1 }) => reportService.getAll({
      page: pageParam, limit: PAGE_SIZE,
      ...(statusFilter   && { status: statusFilter }),
      ...(search         && { search }),
      ...(workTypeFilter && { workType: workTypeFilter }),
      sort: sortBy,
    }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination || {};
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const { data: trendingData } = useQuery({
    queryKey: ['reports-trending'],
    queryFn: () => reportService.getAll({ limit: 8, sort: '-likesCount' }),
    staleTime: 1000 * 60 * 10,
  });
  const trending = trendingData?.reports?.filter(r => r.likesCount > 0) || [];

  const reports      = data?.pages.flatMap(p => p.reports) || [];
  const totalReports = data?.pages[0]?.pagination?.total ?? reports.length;
  const greeting     = getGreeting();
  const firstName    = user?.name?.split(' ')[0] || 'Usuario';
  const avatarGradient = getAvatarGradient(user?.name);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      if (searchInput.trim().length >= 2) {
        saveHistory(searchInput.trim());
        setSearchHistory(getHistory());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      saveHistory(searchInput.trim());
      setSearchHistory(getHistory());
    }
    setSearch(searchInput);
    setShowHistory(false);
  };

  const applyHistorySearch = (term) => {
    setSearchInput(term);
    setSearch(term);
    setShowHistory(false);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setSearchHistory([]);
    setShowHistory(false);
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

  useEffect(() => {
    if (reports.length > 0 && !shownNewestRef.current) {
      shownNewestRef.current = reports[0]._id;
    }
  }, [reports]);

  useEffect(() => {
    if (search || statusFilter || workTypeFilter) return;
    const check = async () => {
      if (!shownNewestRef.current) return;
      try {
        const res = await reportService.getAll({ limit: 1, sort: '-createdAt' });
        const latest = res.reports?.[0];
        if (latest && latest._id !== shownNewestRef.current) {
          setNewReportsAvailable(true);
        }
      } catch {}
    };
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [search, statusFilter, workTypeFilter]);

  const handleRefreshNew = async () => {
    setNewReportsAvailable(false);
    shownNewestRef.current = null;
    await queryClient.invalidateQueries({ queryKey: ['reports'] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilter = FILTERS.find(f => f.value === statusFilter) || FILTERS[0];

  return (
    <div className="min-h-screen bg-gray-50/80 pb-32">

      {/* ── Pull to refresh indicator ── */}
      <AnimatePresence>
        {(pullY > 0 || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
            style={{ paddingTop: refreshing ? 14 : Math.max(4, pullY / 4) }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
              <motion.div animate={{ rotate: refreshing ? 360 : pullY * 3.6 }} transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : {}}>
                <HiRefresh className="text-base" />
              </motion.div>
              {refreshing ? 'Actualizando...' : pullY >= 72 ? 'Suelta para actualizar' : 'Desliza para actualizar'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Banner nuevos reportes ── */}
      <AnimatePresence>
        {newReportsAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-4 left-0 right-0 z-40 flex justify-center pointer-events-none px-4"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleRefreshNew}
              className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                boxShadow: '0 8px 32px rgba(37,99,235,0.5)',
              }}
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ↑
              </motion.span>
              Nuevos reportes disponibles
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-8 -left-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
          <div className="absolute bottom-4 right-1/3 w-28 h-28 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-6">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden`}
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                {user?.avatar?.url
                  ? <img src={user.avatar.url} alt={firstName} className="w-full h-full object-cover" />
                  : <span className="text-white text-lg font-extrabold">{firstName[0]?.toUpperCase()}</span>
                }
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvanced(true)}
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                style={{
                  background: (workTypeFilter || sortBy !== '-createdAt') ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                <HiAdjustments className="text-white text-xl" />
                {(workTypeFilter || sortBy !== '-createdAt') && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => navigate('/notifications')}
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
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
          </div>

          <div className="relative mb-4">
            <form onSubmit={handleSearch}>
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setShowHistory(true); }}
                onFocus={() => { if (!searchInput) setShowHistory(true); }}
                onBlur={() => setTimeout(() => setShowHistory(false), 150)}
                className="w-full bg-white rounded-2xl pl-11 pr-10 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-base"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch(''); setShowHistory(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <span className="text-gray-500 text-xs font-bold leading-none">✕</span>
                </button>
              )}
            </form>

            <AnimatePresence>
              {showHistory && searchHistory.length > 0 && !searchInput && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden z-30"
                  style={{ background: 'var(--card-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Recientes</span>
                    <button onClick={clearHistory} className="text-[10px] font-semibold text-blue-500">Limpiar</button>
                  </div>
                  {searchHistory.map((term, i) => (
                    <button
                      key={i}
                      onMouseDown={() => applyHistorySearch(term)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm" style={{ color: 'var(--text-3)' }}>🕐</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{term}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {FILTERS.map((f) => {
              const isActive = statusFilter === f.value;
              return (
                <motion.button
                  key={f.value}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setStatusFilter(f.value)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200"
                  style={isActive
                    ? { background: 'rgba(255,255,255,0.95)', color: '#1e3a8a', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }
                    : { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }
                  }
                >
                  {f.dot && (
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? f.dot : 'bg-white/50'}`} />
                  )}
                  {f.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {trending.length > 0 && !search && !statusFilter && !workTypeFilter && (
        <div className="bg-gray-50/80 rounded-t-[28px] -mt-3 pt-5">
          <div className="px-5 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <span className="text-base">🔥</span> Tendencias
            </h2>
            <span className="text-xs text-gray-400 font-medium">Más apoyados</span>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-4">
            {trending.map((r) => {
              const timeAgo = formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es });
              return (
                <motion.div
                  key={r._id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/reports/${r._id}`)}
                  className="flex-shrink-0 w-52 bg-white rounded-3xl overflow-hidden cursor-pointer"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  {r.images?.length > 0 ? (
                    <div className="h-28 bg-gray-100 relative overflow-hidden">
                      <img src={r.images[0].url} alt={r.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-2 left-3 text-white text-[10px] font-bold flex items-center gap-1">
                        ❤️ {r.likesCount}
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-4xl"
                      style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
                      🏗️
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-extrabold text-gray-900 leading-snug line-clamp-2">{r.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{timeAgo}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`bg-gray-50/80 px-5 pt-5 flex flex-col gap-4 ${trending.length > 0 && !search && !statusFilter && !workTypeFilter ? '' : 'rounded-t-[28px] -mt-3'}`}>

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

        {isError && !isLoading && (
          <ErrorScreen onRetry={() => refetch()} />
        )}

        {isLoading && [0, 1, 2].map(i => <ReportCardSkeleton key={i} />)}

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

        {isFetchingNextPage && [0, 1].map(i => <ReportCardSkeleton key={i} />)}

        <div ref={sentinelRef} className="h-4" />

        {!hasNextPage && reports.length > 0 && !isLoading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-gray-200" />
            <p className="text-xs text-gray-400 font-medium">Has visto todo</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end" onClick={() => setShowAdvanced(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative rounded-t-3xl px-5 pt-4"
              style={{ background: 'var(--card-bg)', maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--text-3)' }} />

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>Filtros avanzados</h3>
                {(workTypeFilter || sortBy !== '-createdAt') && (
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full">Activo</span>
                )}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Ordenar por</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { label: 'Recientes', value: '-createdAt', icon: '🕐' },
                  { label: 'Más votados', value: '-likesCount', icon: '❤️' },
                  { label: 'Más vistos', value: '-viewsCount', icon: '👁️' },
                ].map(s => {
                  const active = sortBy === s.value;
                  return (
                    <button key={s.value} onClick={() => setSortBy(s.value)}
                      className="py-3 rounded-2xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all"
                      style={active
                        ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }
                        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }
                      }>
                      <span className="text-lg leading-none">{s.icon}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Tipo de obra</p>
              <div className="flex flex-wrap gap-2 mb-7">
                {[
                  { value: '', label: 'Todos' },
                  { value: 'road', label: '🛣️ Vía' },
                  { value: 'sidewalk', label: '🚶 Andén' },
                  { value: 'park', label: '🌳 Parque' },
                  { value: 'building', label: '🏢 Edificio' },
                  { value: 'drainage', label: '🔧 Tubería' },
                  { value: 'lighting', label: '💡 Alumbrado' },
                  { value: 'bridge', label: '🌉 Puente' },
                  { value: 'water', label: '🚰 Acueducto' },
                  { value: 'other', label: '⚙️ Otro' },
                ].map(t => {
                  const active = workTypeFilter === t.value;
                  return (
                    <button key={t.value} onClick={() => setWorkTypeFilter(t.value)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={active
                        ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', boxShadow: '0 3px 10px rgba(37,99,235,0.3)' }
                        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }
                      }>
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setWorkTypeFilter(''); setSortBy('-createdAt'); }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }}
                >
                  Limpiar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAdvanced(false)}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
                >
                  Aplicar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
