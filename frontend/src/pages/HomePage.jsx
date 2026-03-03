import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { HiPlus, HiFilter, HiSearch, HiLocationMarker } from 'react-icons/hi';
import reportService from '../services/reportService';
import useAuthStore from '../store/authStore';
import ReportCard from '../components/ui/ReportCard';
import ReportCardSkeleton from '../components/ui/ReportCardSkeleton';

const FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'En progreso', value: 'inProgress' },
  { label: 'Resueltos', value: 'resolved' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', statusFilter, search],
    queryFn: () => reportService.getAll({
  ...(statusFilter && { status: statusFilter }),
  ...(search && { search }),
  limit: 20,
}),
  });

  const reports = data?.reports || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">Bienvenido</p>
            <h1 className="text-white text-xl font-bold">{user?.name} 👋</h1>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🏛️</span>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </form>
      </div>

      {/* ─── Filtros ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`
              flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${statusFilter === f.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── Lista de reportes ───────────────────────────────────────── */}
      <div className="px-4 flex flex-col gap-3">

        {/* Contador */}
        {!isLoading && (
          <p className="text-sm text-gray-500">
            {reports.length} reporte{reports.length !== 1 ? 's' : ''} encontrado{reports.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Skeletons mientras carga */}
        {isLoading && (
          <>
            <ReportCardSkeleton />
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </>
        )}

        {/* Lista de reportes */}
        <AnimatePresence>
          {reports.map((report, index) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ReportCard report={report} onRefetch={refetch} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Sin resultados */}
        {!isLoading && reports.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <span className="text-6xl mb-4">🏗️</span>
            <h3 className="text-lg font-semibold text-gray-700">No hay reportes aún</h3>
            <p className="text-gray-400 text-sm mt-1 mb-6">
              Sé el primero en reportar una obra abandonada
            </p>
            <button
              onClick={() => navigate('/create-report')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
            >
              <HiPlus /> Crear primer reporte
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;