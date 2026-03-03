import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiCheck, HiX, HiClock, HiShieldCheck } from 'react-icons/hi';
import reportService from '../services/reportService';
import useAuthStore from '../store/authStore';

const STATUS_OPTIONS = [
  { value: 'pending',    label: '⏳ Pendiente',   color: 'bg-yellow-100 text-yellow-700' },
  { value: 'verified',   label: '✅ Verificado',  color: 'bg-blue-100 text-blue-700' },
  { value: 'inProgress', label: '⚙️ En progreso', color: 'bg-purple-100 text-purple-700' },
  { value: 'resolved',   label: '🎉 Resuelto',    color: 'bg-green-100 text-green-700' },
  { value: 'rejected',   label: '❌ Rechazado',   color: 'bg-red-100 text-red-700' },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Redirigir si no es admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports', filterStatus],
    queryFn: () => reportService.getAll({ status: filterStatus, limit: 50 }),
  });

  const reports = data?.reports || [];

  const handleStatusChange = async (reportId, newStatus) => {
    if (newStatus === 'rejected') {
      setRejectModal(reportId);
      return;
    }
    setUpdatingId(reportId);
    try {
      await reportService.updateStatus(reportId, newStatus);
      toast.success('Estado actualizado ✅');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setUpdatingId(null);
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
    } catch (error) {
      toast.error('Error al rechazar');
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = {
    total: data?.pagination?.total || 0,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-xl text-white">
            <HiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">🛡️ Panel Admin</h1>
            <p className="text-purple-200 text-sm">Moderación de reportes</p>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.total, bg: 'bg-white/20' },
            { label: 'Pendientes', value: stats.pending, bg: 'bg-yellow-500/30' },
            { label: 'Verificados', value: stats.verified, bg: 'bg-blue-500/30' },
            { label: 'Resueltos', value: stats.resolved, bg: 'bg-green-500/30' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
              <p className="text-white text-lg font-bold">{s.value}</p>
              <p className="text-white/80 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterStatus('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterStatus === '' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          Todos
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterStatus === s.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Lista de reportes */}
      <div className="px-4 flex flex-col gap-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
          </div>
        )}

        {reports.map((report) => (
          <motion.div
            key={report._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            {/* Imagen si tiene */}
            {report.images?.length > 0 && (
              <img
                src={report.images[0].url}
                alt={report.title}
                className="w-full h-32 object-cover cursor-pointer"
                onClick={() => navigate('/reports/' + report._id)}
              />
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                  className="font-bold text-gray-800 text-sm cursor-pointer hover:text-blue-600 flex-1"
                  onClick={() => navigate('/reports/' + report._id)}
                >
                  {report.title}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  STATUS_OPTIONS.find(s => s.value === report.status)?.color || 'bg-gray-100 text-gray-600'
                }`}>
                  {STATUS_OPTIONS.find(s => s.value === report.status)?.label}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-1">
                👤 {report.author?.name} · 📍 {report.location?.city || 'Sin ciudad'}
              </p>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{report.description}</p>

              {/* Selector de estado */}
              {/* Botón eliminar */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm('¿Eliminar este reporte permanentemente?')) return;
                    try {
                      await reportService.delete(report._id);
                      toast.success('Reporte eliminado');
                      refetch();
                    } catch (error) {
                      toast.error('Error al eliminar');
                    }
                  }}
                  className="flex items-center gap-1.5 bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors font-medium"
                >
                  🗑️ Eliminar reporte
                </button>
              </div>

              {/* Selector de estado */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Cambiar estado:</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(report._id, option.value)}
                      disabled={report.status === option.value || updatingId === report._id}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-40 ${
                        report.status === option.value
                          ? option.color + ' ring-2 ring-offset-1 ring-purple-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {updatingId === report._id && report.status !== option.value ? '...' : option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {!isLoading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">✅</span>
            <p className="text-gray-500 font-medium">No hay reportes con este filtro</p>
          </div>
        )}
      </div>

      {/* Modal de rechazo */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-white w-full rounded-t-3xl p-6"
          >
            <h3 className="font-bold text-gray-800 mb-2">❌ Razón de rechazo</h3>
            <p className="text-sm text-gray-500 mb-4">Explica por qué se rechaza este reporte</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: El reporte no tiene evidencia suficiente..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={updatingId}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold text-sm"
              >
                {updatingId ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;