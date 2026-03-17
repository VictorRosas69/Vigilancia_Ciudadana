import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiSearch, HiEye, HiTrash,
  HiChevronDown, HiExclamation, HiCheckCircle,
  HiX, HiRefresh, HiDesktopComputer
} from 'react-icons/hi';
import reportService from '../services/reportService';
import useAuthStore from '../store/authStore';

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pendiente',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400',  border: 'border-amber-300' },
  { value: 'verified',   label: 'Verificado',  color: 'bg-cyan-100 text-cyan-700',     dot: 'bg-cyan-400',   border: 'border-cyan-300' },
  { value: 'inProgress', label: 'En progreso', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400', border: 'border-violet-300' },
  { value: 'resolved',   label: 'Resuelto',    color: 'bg-green-100 text-green-700',   dot: 'bg-green-400',  border: 'border-green-300' },
  { value: 'rejected',   label: 'Rechazado',   color: 'bg-red-100 text-red-700',       dot: 'bg-red-400',    border: 'border-red-300' },
];

const PRIORITY_CONFIG = {
  critical: { label: 'Crítica',  bg: 'bg-red-500',    text: 'text-white' },
  high:     { label: 'Alta',     bg: 'bg-orange-400',  text: 'text-white' },
  medium:   { label: 'Media',    bg: 'bg-yellow-400',  text: 'text-gray-800' },
  low:      { label: 'Baja',     bg: 'bg-gray-300',    text: 'text-gray-700' },
};

const WORK_ICONS = {
  road: '🛣️', sidewalk: '🚶', park: '🌳', building: '🏢',
  drainage: '🔧', lighting: '💡', bridge: '🌉', water: '🚰', other: '⚙️',
};

const StatusDropdown = ({ report, onStatusChange, loading }) => {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find(o => o.value === report.status) || STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${current.color} ${current.border} ${loading ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {loading ? (
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        )}
        {current.label}
        <HiChevronDown className={`text-sm transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-1 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[150px]"
            >
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setOpen(false); onStatusChange(report._id, opt.value); }}
                  disabled={opt.value === report.status}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors
                    ${opt.value === report.status
                      ? 'bg-gray-50 text-gray-400 cursor-default'
                      : 'hover:bg-gray-50 text-gray-700'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                  {opt.value === report.status && <HiCheckCircle className="ml-auto text-gray-300 text-sm" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportCardAdmin = ({ report, onStatusChange, onDelete, updatingId }) => {
  const navigate = useNavigate();
  const priority = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.medium;
  const loading = updatingId === report._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex gap-0">
        {/* Imagen */}
        {report.images?.length > 0 ? (
          <div
            className="w-24 flex-shrink-0 relative cursor-pointer"
            onClick={() => navigate('/reports/' + report._id)}
          >
            <img
              src={report.images[0].url}
              alt={report.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          </div>
        ) : (
          <div
            className="w-24 flex-shrink-0 bg-gray-50 flex items-center justify-center text-3xl cursor-pointer"
            onClick={() => navigate('/reports/' + report._id)}
          >
            {WORK_ICONS[report.workType] || '📋'}
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 p-3 min-w-0">
          {/* Fila superior */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3
              className="text-sm font-bold text-gray-800 leading-tight cursor-pointer hover:text-purple-600 transition-colors line-clamp-1"
              onClick={() => navigate('/reports/' + report._id)}
            >
              {report.title}
            </h3>
            <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-bold ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
            <span className="truncate">👤 {report.author?.name || 'Anónimo'}</span>
            <span>·</span>
            <span className="truncate">📍 {report.location?.neighborhood || report.location?.city || 'Sin ubicación'}</span>
          </div>

          <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">{report.description}</p>

          {/* Acciones */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <StatusDropdown
              report={report}
              onStatusChange={onStatusChange}
              loading={loading}
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate('/reports/' + report._id)}
                className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Ver detalle"
              >
                <HiEye className="text-sm" />
              </button>
              <button
                onClick={() => onDelete(report._id)}
                className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Eliminar"
              >
                <HiTrash className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-reports', filterStatus, search],
    queryFn: () => reportService.getAll({ status: filterStatus, search, limit: 50 }),
  });

  const reports = data?.reports || [];
  const totalInDB = data?.pagination?.total || 0;

  // Stats reales del filtro actual
  const countByStatus = (status) => reports.filter(r => r.status === status).length;

  const handleStatusChange = async (reportId, newStatus) => {
    if (newStatus === 'rejected') {
      setRejectModal(reportId);
      return;
    }
    setUpdatingId(reportId);
    try {
      await reportService.updateStatus(reportId, newStatus);
      toast.success('Estado actualizado');
      refetch();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('¿Eliminar este reporte permanentemente?')) return;
    try {
      await reportService.delete(reportId);
      toast.success('Reporte eliminado');
      refetch();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Ingresa una razón de rechazo');
      return;
    }
    setUpdatingId(rejectModal);
    try {
      await reportService.updateStatus(rejectModal, 'rejected', rejectReason);
      toast.success('Reporte rechazado');
      setRejectModal(null);
      setRejectReason('');
      refetch();
    } catch {
      toast.error('Error al rechazar');
    } finally {
      setUpdatingId(null);
    }
  };

  const STAT_CARDS = [
    { label: 'Total',       value: totalInDB,              bg: 'bg-white/20',        icon: '📋' },
    { label: 'Pendientes',  value: countByStatus('pending'),    bg: 'bg-amber-500/25',    icon: '⏳' },
    { label: 'En progreso', value: countByStatus('inProgress'), bg: 'bg-violet-500/25',   icon: '⚙️' },
    { label: 'Resueltos',   value: countByStatus('resolved'),   bg: 'bg-green-500/25',    icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/15 backdrop-blur rounded-xl text-white active:scale-95 transition-transform"
          >
            <HiArrowLeft className="text-lg" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-extrabold">Panel Admin</h1>
            <p className="text-purple-200 text-xs mt-0.5">Moderación · {totalInDB} reportes en total</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white/15 backdrop-blur rounded-xl text-white active:scale-95 transition-transform"
            title="Panel web"
          >
            <HiDesktopComputer className="text-lg" />
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-white/15 backdrop-blur rounded-xl text-white active:scale-95 transition-transform"
          >
            <HiRefresh className={`text-lg ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {STAT_CARDS.map(s => (
            <div key={s.label} className={`${s.bg} backdrop-blur rounded-2xl p-2.5 text-center border border-white/10`}>
              <p className="text-lg mb-0.5">{s.icon}</p>
              <p className="text-white text-base font-extrabold leading-none">{s.value}</p>
              <p className="text-white/70 text-[10px] mt-0.5 font-medium leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-base" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="w-full bg-white/15 backdrop-blur border border-white/20 text-white placeholder-white/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <HiX className="text-base" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filtros de estado ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterStatus('')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterStatus === ''
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === s.value
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === s.value ? 'bg-white' : s.dot}`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-3">
              {filterStatus ? '🔍' : '✅'}
            </div>
            <p className="text-gray-700 font-bold text-base">
              {filterStatus || search ? 'Sin resultados' : 'Sin reportes'}
            </p>
            <p className="text-gray-400 text-sm mt-1 text-center px-8">
              {filterStatus || search
                ? 'Intenta con otro filtro o búsqueda'
                : 'Aún no hay reportes en la plataforma'}
            </p>
          </div>
        )}

        {!isLoading && reports.map(report => (
          <ReportCardAdmin
            key={report._id}
            report={report}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            updatingId={updatingId}
          />
        ))}

        {!isLoading && reports.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-2">
            Mostrando {reports.length} de {totalInDB} reportes
          </p>
        )}
      </div>

      {/* ── Modal rechazo ── */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            onClick={() => { setRejectModal(null); setRejectReason(''); }}
          >
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full rounded-t-3xl p-6 pb-10"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <HiExclamation className="text-red-500 text-xl" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-800">Rechazar reporte</h3>
                  <p className="text-xs text-gray-400">Esta acción notificará al autor</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explica por qué se rechaza este reporte..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
                autoFocus
              />
              <div className="flex gap-2.5">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!!updatingId}
                  className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-red-200 active:scale-98 transition-transform disabled:opacity-60"
                >
                  {updatingId ? 'Rechazando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
