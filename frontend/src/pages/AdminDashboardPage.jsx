import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';
import reportService from '../services/reportService';
import useAuthStore from '../store/authStore';
import { exportReportsPDF } from '../utils/exportPDF';
import { exportPetitionWord } from '../utils/exportWord';
import petitionService from '../services/petitionService';

// ─── Íconos ───────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  reports:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  users:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  logout:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  mobile:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  search:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  trash:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  eye:       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  close:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  download:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  petition:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  plus:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  word:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  pen:       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  check:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  location:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  calendar:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  comment:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  heart:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  user:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:    { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-700 border-amber-200',     dot: 'bg-amber-400' },
  verified:   { label: 'Verificado',  cls: 'bg-cyan-100 text-cyan-700 border-cyan-200',         dot: 'bg-cyan-400' },
  inProgress: { label: 'En progreso', cls: 'bg-violet-100 text-violet-700 border-violet-200',   dot: 'bg-violet-400' },
  resolved:   { label: 'Resuelto',    cls: 'bg-green-100 text-green-700 border-green-200',      dot: 'bg-green-400' },
  rejected:   { label: 'Rechazado',   cls: 'bg-red-100 text-red-700 border-red-200',            dot: 'bg-red-400' },
  closed:     { label: 'Cerrado',     cls: 'bg-gray-100 text-gray-600 border-gray-200',         dot: 'bg-gray-400' },
};

const PRIORITY_MAP = {
  critical: { label: 'Crítica', cls: 'bg-red-500 text-white' },
  high:     { label: 'Alta',    cls: 'bg-orange-400 text-white' },
  medium:   { label: 'Media',   cls: 'bg-yellow-400 text-gray-800' },
  low:      { label: 'Baja',    cls: 'bg-gray-200 text-gray-600' },
};

const ROLE_MAP = {
  admin:     { label: 'Admin',     cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  moderator: { label: 'Moderador', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  citizen:   { label: 'Ciudadano', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const WORK_ICONS = {
  road: '🛣️', sidewalk: '🚶', park: '🌳', building: '🏢',
  drainage: '🔧', lighting: '💡', bridge: '🌉', water: '🚰', other: '⚙️',
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmt = (date) => new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Modal Detalle Reporte ────────────────────────────────────────────────────
const ReportDetailModal = ({ reportId, onClose, onStatusChange, onDelete }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-report-detail', reportId],
    queryFn: () => reportService.getById(reportId),
    enabled: !!reportId,
  });

  const report = data?.report;
  const [imgIdx, setImgIdx] = useState(0);

  const handleStatusChange = async (newStatus) => {
    await onStatusChange(reportId, newStatus);
    queryClient.invalidateQueries({ queryKey: ['dashboard-report-detail', reportId] });
  };

  const handleDelete = async () => {
    await onDelete(reportId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="font-extrabold text-gray-800 text-lg">Detalle del reporte</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            {Icons.close}
          </button>
        </div>

        {isLoading && (
          <div className="p-8 flex flex-col gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-5 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        )}

        {report && (
          <div className="p-6 space-y-5">
            {/* Galería */}
            {report.images?.length > 0 && (
              <div className="space-y-2">
                <img
                  src={report.images[imgIdx]?.url}
                  alt={report.title}
                  className="w-full h-56 object-cover rounded-xl bg-gray-100"
                />
                {report.images.length > 1 && (
                  <div className="flex gap-2">
                    {report.images.map((img, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sin imagen */}
            {(!report.images || report.images.length === 0) && (
              <div className="w-full h-32 bg-gray-50 rounded-xl flex items-center justify-center text-5xl">
                {WORK_ICONS[report.workType] || '📋'}
              </div>
            )}

            {/* Título y badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${PRIORITY_MAP[report.priority]?.cls || ''}`}>
                  {PRIORITY_MAP[report.priority]?.label}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${STATUS_MAP[report.status]?.cls || ''}`}>
                  {STATUS_MAP[report.status]?.label}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 font-medium">
                  {WORK_ICONS[report.workType]} {report.workType}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 leading-snug">{report.title}</h3>
            </div>

            {/* Descripción */}
            <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
                <span className="mt-0.5 text-gray-400">{Icons.user}</span>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Autor</p>
                  <p className="text-sm font-semibold text-gray-700">{report.author?.name || 'Anónimo'}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
                <span className="mt-0.5 text-gray-400">{Icons.location}</span>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Ubicación</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {report.location?.neighborhood || report.location?.city || '—'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
                <span className="mt-0.5 text-gray-400">{Icons.calendar}</span>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Fecha</p>
                  <p className="text-sm font-semibold text-gray-700">{fmt(report.createdAt)}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-gray-500">
                  {Icons.heart}
                  <span className="text-sm font-semibold text-gray-700">{report.likesCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  {Icons.comment}
                  <span className="text-sm font-semibold text-gray-700">{report.commentsCount ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-400 font-medium block mb-1">Cambiar estado</label>
                <select
                  value={report.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-xl border font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 ${STATUS_MAP[report.status]?.cls || ''}`}
                >
                  {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleDelete}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-semibold text-sm transition-colors"
              >
                {Icons.trash} Eliminar reporte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Overview ─────────────────────────────────────────────────────────────────
const OverviewTab = ({ onViewReport }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });
  const { data: recentData } = useQuery({
    queryKey: ['admin-reports-recent'],
    queryFn: () => reportService.getAll({ limit: 5, sort: '-createdAt' }),
  });

  const stats = data?.stats;
  const recent = recentData?.reports || [];

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] };
  });

  const chartData = last6.map(({ year, month, label }) => {
    const found = stats?.reportsPerMonth?.find(r => r._id.year === year && r._id.month === month);
    return { label, count: found?.count || 0 };
  });
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  // Datos para donut
  const donutItems = [
    { key: 'pending',    label: 'Pendientes',   color: '#f59e0b', value: stats?.reports?.pending    || 0 },
    { key: 'inProgress', label: 'En progreso',  color: '#8b5cf6', value: stats?.reports?.inProgress || 0 },
    { key: 'resolved',   label: 'Resueltos',    color: '#22c55e', value: stats?.reports?.resolved   || 0 },
    { key: 'rejected',   label: 'Rechazados',   color: '#ef4444', value: stats?.reports?.rejected   || 0 },
  ];
  const total = donutItems.reduce((s, i) => s + i.value, 0) || 1;
  let cumulative = 0;
  const donutSegments = donutItems.map(item => {
    const pct = item.value / total;
    const start = cumulative;
    cumulative += pct;
    return { ...item, pct, start };
  });

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const describeArc = (cx, cy, r, startPct, endPct) => {
    if (endPct - startPct >= 1) endPct = 0.9999;
    const s = polarToCartesian(cx, cy, r, startPct * 360);
    const e = polarToCartesian(cx, cy, r, endPct * 360);
    const large = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const STAT_CARDS = [
    { label: 'Total reportes',  value: stats?.reports.total,      accent: '#3b82f6', icon: '📋' },
    { label: 'Usuarios activos',value: stats?.users.active,       accent: '#0ea5e9', icon: '👥' },
    { label: 'Resueltos',       value: stats?.reports.resolved,   accent: '#22c55e', icon: '✅' },
    { label: 'Pendientes',      value: stats?.reports.pending,    accent: '#f59e0b', icon: '⏳' },
    { label: 'En progreso',     value: stats?.reports.inProgress, accent: '#8b5cf6', icon: '⚙️' },
    { label: 'Rechazados',      value: stats?.reports.rejected,   accent: '#ef4444', icon: '🚫' },
    { label: 'Total usuarios',  value: stats?.users.total,        accent: '#06b6d4', icon: '🧑‍💻' },
    { label: 'Comentarios',     value: stats?.comments.total,     accent: '#ec4899', icon: '💬' },
  ];

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({length: 8}).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all group"
            style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.accent}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${s.accent}18` }}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">{s.value ?? '—'}</p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: s.accent }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Barras por mes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-gray-800">Reportes por mes</h3>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1 rounded-lg">
              Total: {stats?.reports.total ?? 0}
            </span>
          </div>
          <div className="flex items-end gap-3 h-44">
            {chartData.map(({ label, count }, i) => {
              const isLast = i === chartData.length - 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">{count > 0 ? count : ''}</span>
                  <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                    <div
                      className="w-full rounded-t-xl transition-all duration-700"
                      style={{ background: isLast ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)' : '#bfdbfe' }}
                      style={{ height: `${Math.max(pct, count > 0 ? 6 : 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut por estado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-extrabold text-gray-800">Estados</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribución actual</p>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140">
                {donutSegments.map((seg, i) =>
                  seg.value > 0 ? (
                    <path
                      key={i}
                      d={describeArc(70, 70, 52, seg.start, seg.start + seg.pct)}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeLinecap="butt"
                    />
                  ) : null
                )}
                <circle cx="70" cy="70" r="32" fill="white" />
                <text x="70" y="67" textAnchor="middle" className="text-lg font-black" fontSize="22" fontWeight="900" fill="#1e293b">{total === 1 ? 0 : total}</text>
                <text x="70" y="82" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">REPORTES</text>
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            {donutItems.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(item.value / (total === 1 ? 1 : total) * 100)}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reportes recientes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-extrabold text-gray-800">Reportes recientes</h3>
          <span className="text-xs text-gray-400">Últimos 5</span>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.map(report => {
            const status = STATUS_MAP[report.status] || STATUS_MAP.pending;
            const priority = PRIORITY_MAP[report.priority] || PRIORITY_MAP.medium;
            return (
              <div key={report._id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                  {report.images?.length > 0
                    ? <img src={report.images[0].url} alt="" className="w-full h-full object-cover rounded-lg" />
                    : WORK_ICONS[report.workType] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{report.title}</p>
                  <p className="text-xs text-gray-400">{report.author?.name} · {fmt(report.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-bold flex-shrink-0 ${priority.cls}`}>{priority.label}</span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border flex-shrink-0 ${status.cls}`}>{status.label}</span>
                <button
                  onClick={() => onViewReport(report._id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  {Icons.eye}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────
const ReportsTab = ({ onViewReport, adminUser, stats }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports-table', search, filterStatus, page],
    queryFn: () => reportService.getAll({ search, status: filterStatus, page, limit: 15 }),
  });

  const reports = data?.reports || [];
  const pagination = data?.pagination || {};

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await reportService.updateStatus(reportId, newStatus);
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-reports-table'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('¿Eliminar este reporte permanentemente?')) return;
    try {
      await reportService.delete(reportId);
      toast.success('Reporte eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-reports-table'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_MAP).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {isFetching && <span className="text-xs text-gray-400 flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Cargando...</span>}
        <button
          onClick={async () => {
            setExporting(true);
            try {
              const all = await reportService.getAll({ status: filterStatus, search, limit: 500 });
              exportReportsPDF(all.reports, stats, { status: filterStatus, search }, adminUser);
              toast.success('PDF generado correctamente');
            } catch {
              toast.error('Error al generar el PDF');
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm shadow-blue-200 ml-auto"
        >
          {exporting
            ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</>
            : <>{Icons.download} Exportar PDF</>
          }
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Reporte</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Autor</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Ubicación</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Prioridad</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Estado</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Fecha</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && Array.from({length: 8}).map((_, i) => (
              <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
            ))}
            {!isLoading && reports.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-14 text-center text-gray-400 text-sm">No se encontraron reportes</td></tr>
            )}
            {!isLoading && reports.map(report => {
              const priority = PRIORITY_MAP[report.priority] || PRIORITY_MAP.medium;
              const status = STATUS_MAP[report.status] || STATUS_MAP.pending;
              return (
                <tr key={report._id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {report.images?.length > 0
                        ? <img src={report.images[0].url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">{WORK_ICONS[report.workType] || '📋'}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-[180px]">{report.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{report.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><span className="text-gray-600 text-sm">{report.author?.name || 'Anónimo'}</span></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-gray-500 text-xs">{report.location?.neighborhood || report.location?.city || '—'}</span></td>
                  <td className="px-5 py-3.5"><span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${priority.cls}`}>{priority.label}</span></td>
                  <td className="px-5 py-3.5">
                    <select
                      value={report.status}
                      onChange={e => handleStatusChange(report._id, e.target.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border cursor-pointer focus:outline-none ${status.cls}`}
                    >
                      {Object.entries(STATUS_MAP).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-400">{fmt(report.createdAt)}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => onViewReport(report._id)} title="Ver detalle" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">{Icons.eye}</button>
                      <button onClick={() => handleDelete(report._id)} title="Eliminar" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">{Icons.trash}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">Mostrando {reports.length} de {pagination.total} reportes</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-semibold">{page}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users-table', search, filterRole, page],
    queryFn: () => adminService.getUsers({ search, role: filterRole, page, limit: 15 }),
  });

  const users = data?.users || [];
  const pagination = data?.pagination || {};

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleUserStatus,
    onSuccess: (data) => { toast.success(data.message); queryClient.invalidateQueries({ queryKey: ['admin-users-table'] }); queryClient.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: () => toast.error('Error al actualizar'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => adminService.updateUserRole(userId, role),
    onSuccess: () => { toast.success('Rol actualizado'); queryClient.invalidateQueries({ queryKey: ['admin-users-table'] }); },
    onError: () => toast.error('Error al cambiar rol'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => { toast.success('Usuario eliminado'); queryClient.invalidateQueries({ queryKey: ['admin-users-table'] }); queryClient.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
          <input type="text" placeholder="Buscar por nombre, email o ciudad..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-700"
        >
          <option value="">Todos los roles</option>
          <option value="citizen">Ciudadano</option>
          <option value="moderator">Moderador</option>
          <option value="admin">Admin</option>
        </select>
        {isFetching && <span className="text-xs text-gray-400 flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Cargando...</span>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Usuario</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Ciudad</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Rol</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Reportes</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Activo</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Registro</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && Array.from({length: 8}).map((_, i) => (
              <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
            ))}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-14 text-center text-gray-400 text-sm">No se encontraron usuarios</td></tr>
            )}
            {!isLoading && users.map(user => {
              const role = ROLE_MAP[user.role] || ROLE_MAP.citizen;
              const isAdmin = user.role === 'admin';
              const toggling = toggleMutation.isPending && toggleMutation.variables === user._id;
              return (
                <tr key={user._id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0 uppercase">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-semibold text-gray-800 truncate max-w-[140px]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><span className="text-gray-500 text-xs">{user.email}</span></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-gray-500 text-xs">{user.city || '—'}</span></td>
                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${role.cls}`}>{role.label}</span>
                    ) : (
                      <select value={user.role} onChange={e => roleMutation.mutate({ userId: user._id, role: e.target.value })}
                        disabled={roleMutation.isPending}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border cursor-pointer focus:outline-none ${role.cls}`}
                      >
                        <option value="citizen">Ciudadano</option>
                        <option value="moderator">Moderador</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><span className="text-gray-700 font-semibold">{user.reportsCount ?? 0}</span></td>
                  <td className="px-5 py-3.5">
                    {isAdmin ? <span className="text-xs text-gray-300">—</span> : (
                      <button
                        onClick={() => toggleMutation.mutate(user._id)}
                        disabled={toggling}
                        title={user.isActive ? 'Desactivar' : 'Activar'}
                        className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none ${user.isActive ? 'bg-green-400' : 'bg-gray-200'} ${toggling ? 'opacity-50' : ''}`}
                      >
                        <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform ${user.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-400">{fmt(user.createdAt)}</span></td>
                  <td className="px-5 py-3.5">
                    {!isAdmin && (
                      <button
                        onClick={() => { if (!window.confirm(`¿Eliminar a "${user.name}"?`)) return; deleteMutation.mutate(user._id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        {Icons.trash}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">Mostrando {users.length} de {pagination.total} usuarios</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-semibold">{page}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Petitions Tab ───────────────────────────────────────────────────────────
const PetitionsTab = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const [form, setForm] = useState({
    title: '', recipientName: 'Señor Alcalde Municipal', recipientTitle: 'Alcalde Municipal',
    city: 'Pasto', body: '', requests: [''], goal: 100, isOpen: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-petitions'],
    queryFn: petitionService.getAll,
  });

  const petitions = data?.petitions || [];

  const saveMutation = useMutation({
    mutationFn: (data) => selected
      ? petitionService.update(selected._id, data)
      : petitionService.create(data),
    onSuccess: () => {
      toast.success(selected ? 'Petición actualizada' : 'Petición creada');
      queryClient.invalidateQueries({ queryKey: ['admin-petitions'] });
      setView('list'); setSelected(null);
      setForm({ title: '', recipientName: 'Señor Alcalde Municipal', recipientTitle: 'Alcalde Municipal', city: 'Pasto', body: '', requests: [''], goal: 100, isOpen: true });
    },
    onError: () => toast.error('Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: petitionService.delete,
    onSuccess: () => { toast.success('Petición eliminada'); queryClient.invalidateQueries({ queryKey: ['admin-petitions'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const openEdit = (petition) => {
    setSelected(petition);
    setForm({
      title: petition.title, recipientName: petition.recipientName,
      recipientTitle: petition.recipientTitle, city: petition.city,
      body: petition.body, requests: petition.requests?.length ? petition.requests : [''],
      goal: petition.goal, isOpen: petition.isOpen,
    });
    setView('edit');
  };

  const handleRequestChange = (i, val) => {
    const arr = [...form.requests];
    arr[i] = val;
    setForm(f => ({ ...f, requests: arr }));
  };

  const handleExportWord = async (petitionId) => {
    setExportingId(petitionId);
    try {
      const res = await petitionService.getById(petitionId);
      await exportPetitionWord(res.petition);
      toast.success('Documento Word generado');
    } catch { toast.error('Error al generar el Word'); }
    finally { setExportingId(null); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = { ...form, requests: form.requests.filter(r => r.trim()) };
    saveMutation.mutate(clean);
  };

  // ── Formulario de creación / edición ──
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); setSelected(null); }} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="font-extrabold text-gray-800 text-lg">{view === 'edit' ? 'Editar petición' : 'Nueva petición'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Título de la petición *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Solicitud de reparación urgente de vías en el barrio Centro"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Destinatario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre del destinatario</label>
              <input value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Cargo</label>
              <input value={form.recipientTitle} onChange={e => setForm(f => ({ ...f, recipientTitle: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Ciudad / Municipio</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Meta de firmas</label>
              <input type="number" min={1} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Cuerpo */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Cuerpo de la petición *</label>
            <p className="text-xs text-gray-400 mb-2">Escribe el texto formal de la petición. Usa saltos de línea para separar párrafos.</p>
            <textarea required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={8} placeholder="Los ciudadanos del municipio de Pasto, debidamente identificados, nos dirigimos respetuosamente a su despacho con el fin de..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none leading-relaxed"
            />
          </div>

          {/* Petitorio */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Petitorio — Lo que se solicita</label>
            <div className="space-y-2">
              {form.requests.map((req, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-xs font-bold text-blue-500">{i + 1}.</span>
                  <input value={req} onChange={e => handleRequestChange(i, e.target.value)}
                    placeholder="Ej: Proceder a la reparación inmediata de los tramos afectados..."
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {form.requests.length > 1 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, requests: f.requests.filter((_, j) => j !== i) }))}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >{Icons.trash}</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setForm(f => ({ ...f, requests: [...f.requests, ''] }))}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold mt-1"
              >{Icons.plus} Agregar punto</button>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <button type="button" onClick={() => setForm(f => ({ ...f, isOpen: !f.isOpen }))}
              className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors ${form.isOpen ? 'bg-green-400' : 'bg-gray-200'}`}
            >
              <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform ${form.isOpen ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-700">{form.isOpen ? 'Abierta para firmas' : 'Cerrada para firmas'}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setView('list'); setSelected(null); }}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
            >Cancelar</button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm shadow-blue-200"
            >{saveMutation.isPending ? 'Guardando...' : (view === 'edit' ? 'Guardar cambios' : 'Crear petición')}</button>
          </div>
        </form>
      </div>
    );
  }

  // ── Lista de peticiones ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{petitions.length} petición(es) creada(s)</p>
        <button onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >{Icons.plus} Nueva petición</button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />)}
        </div>
      )}

      {!isLoading && petitions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-3">📜</div>
          <p className="font-bold text-gray-700">No hay peticiones aún</p>
          <p className="text-sm text-gray-400 mt-1">Crea una petición para que los ciudadanos puedan firmarla</p>
        </div>
      )}

      {!isLoading && petitions.map(petition => {
        const pct = Math.min(Math.round((petition.signaturesCount / petition.goal) * 100), 100);
        return (
          <div key={petition._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold border ${petition.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {petition.isOpen ? 'Abierta' : 'Cerrada'}
                  </span>
                  <span className="text-xs text-gray-400">{fmt(petition.createdAt)}</span>
                </div>
                <h3 className="font-extrabold text-gray-800 text-base leading-snug">{petition.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Para: {petition.recipientTitle} · {petition.city}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => openEdit(petition)} title="Editar" className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">{Icons.pen}</button>
                <button
                  onClick={() => handleExportWord(petition._id)}
                  disabled={exportingId === petition._id}
                  title="Exportar Word"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition-colors disabled:opacity-60"
                >
                  {exportingId === petition._id
                    ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    : Icons.word
                  }
                  Word
                </button>
                <button onClick={() => { if (window.confirm('¿Eliminar esta petición?')) deleteMutation.mutate(petition._id); }} title="Eliminar" className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">{Icons.trash}</button>
              </div>
            </div>

            {/* Barra de progreso de firmas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-600">{petition.signaturesCount} firmas</span>
                <span className="text-xs text-gray-400">Meta: {petition.goal}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{pct}% completado</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Dashboard Principal ──────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailReportId, setDetailReportId] = useState(null);
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await reportService.updateStatus(reportId, newStatus);
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-reports-table'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-recent'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('¿Eliminar este reporte permanentemente?')) return;
    try {
      await reportService.delete(reportId);
      toast.success('Reporte eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-reports-table'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-recent'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Error al eliminar'); }
  };

  const NAV = [
    { id: 'overview',   label: 'Resumen',    icon: Icons.dashboard },
    { id: 'reports',    label: 'Reportes',   icon: Icons.reports },
    { id: 'users',      label: 'Usuarios',   icon: Icons.users },
    { id: 'petitions',  label: 'Peticiones', icon: Icons.petition },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-60 flex flex-col flex-shrink-0 fixed h-full z-10" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.5)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-none">Vigilancia</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(147,197,253,0.8)' }}>Panel Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === item.id ? {
                background: 'rgba(59,130,246,0.25)',
                color: 'white',
                boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.4)',
              } : {
                color: 'rgba(148,163,184,1)',
              }}
              onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: activeTab === item.id ? '#93c5fd' : 'rgba(148,163,184,0.8)' }}>{item.icon}</span>
              {item.label}
              {activeTab === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: 'rgba(148,163,184,1)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(148,163,184,1)'; }}
          >
            {Icons.mobile} Ver App Móvil
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: 'rgba(252,165,165,0.9)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(252,165,165,0.9)'; }}
          >
            {Icons.logout} Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-10" style={{ borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">{NAV.find(n => n.id === activeTab)?.label}</h1>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user?.name}</p>
              <p className="text-xs font-semibold" style={{ color: '#3b82f6' }}>Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-extrabold text-sm uppercase flex-shrink-0"
              style={{ background: user?.avatar?.url ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {user?.avatar?.url
                ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                : (user?.name?.charAt(0) || 'A')
              }
            </div>
          </div>
        </header>

        <div className="px-8 py-6 flex-1">
          {activeTab === 'overview'   && <OverviewTab onViewReport={setDetailReportId} />}
          {activeTab === 'reports'    && <ReportsTab  onViewReport={setDetailReportId} adminUser={user} stats={statsData?.stats} />}
          {activeTab === 'users'      && <UsersTab />}
          {activeTab === 'petitions'  && <PetitionsTab />}
        </div>
      </main>

      {/* Modal detalle */}
      {detailReportId && (
        <ReportDetailModal
          reportId={detailReportId}
          onClose={() => setDetailReportId(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
