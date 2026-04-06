import { useState, createContext, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';
import reportService from '../services/reportService';
import messageService from '../services/messageService';
import useAuthStore from '../store/authStore';
import { exportReportsPDF } from '../utils/exportPDF';
import { exportPetitionWord } from '../utils/exportWord';
import petitionService from '../services/petitionService';
import useTheme from '../hooks/useTheme';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import notificationService from '../services/notificationService';

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
  sun:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>,
  moon:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  messages:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  map:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  activity:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  bell:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
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

// ─── Tema ─────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({});

const getTheme = (isDark) => isDark ? {
  pageBg:       '#0d1117',
  topbarBg:     'rgba(13,17,23,0.9)',
  topbarBorder: 'rgba(255,255,255,0.06)',
  topbarText:   'white',
  topbarSub:    'rgba(148,163,184,0.7)',
  cardBg:       'rgba(255,255,255,0.04)',
  cardBorder:   '1px solid rgba(255,255,255,0.07)',
  cardShadow:   'none',
  text1:        'white',
  text2:        'rgba(148,163,184,0.9)',
  text3:        'rgba(100,116,139,0.8)',
  theadBg:      'rgba(255,255,255,0.03)',
  theadText:    'rgba(100,116,139,0.9)',
  rowHover:     'rgba(255,255,255,0.04)',
  rowBorder:    'rgba(255,255,255,0.04)',
  inputBg:      'rgba(255,255,255,0.06)',
  inputBorder:  'rgba(255,255,255,0.1)',
  inputText:    'white',
  tagBg:        'rgba(255,255,255,0.07)',
  tagText:      'rgba(148,163,184,0.8)',
  barInactive:  'rgba(59,130,246,0.25)',
  donutCenter:  '#0d1117',
  donutText:    'white',
  donutSub:     '#64748b',
  badgeBg:      'rgba(37,99,235,0.2)',
  badgeText:    '#93c5fd',
  skeletonBg:   'rgba(255,255,255,0.06)',
  emptyText:    'rgba(148,163,184,0.8)',
  btnIcon:      'rgba(100,116,139,0.7)',
  toggleBg:     'rgba(255,255,255,0.1)',
  toggleBorder: 'rgba(255,255,255,0.15)',
} : {
  pageBg:       '#f8fafc',
  topbarBg:     'rgba(255,255,255,0.95)',
  topbarBorder: '#e2e8f0',
  topbarText:   '#111827',
  topbarSub:    '#9ca3af',
  cardBg:       'white',
  cardBorder:   '1px solid #e2e8f0',
  cardShadow:   '0 1px 8px rgba(0,0,0,0.06)',
  text1:        '#111827',
  text2:        '#6b7280',
  text3:        '#9ca3af',
  theadBg:      '#f8fafc',
  theadText:    '#6b7280',
  rowHover:     '#f0f9ff',
  rowBorder:    '#f1f5f9',
  inputBg:      '#f9fafb',
  inputBorder:  '#e2e8f0',
  inputText:    '#374151',
  tagBg:        '#f1f5f9',
  tagText:      '#6b7280',
  barInactive:  '#bfdbfe',
  donutCenter:  'white',
  donutText:    '#1e293b',
  donutSub:     '#94a3b8',
  badgeBg:      '#eff6ff',
  badgeText:    '#2563eb',
  skeletonBg:   '#f1f5f9',
  emptyText:    '#6b7280',
  btnIcon:      '#9ca3af',
  toggleBg:     'rgba(0,0,0,0.06)',
  toggleBorder: 'rgba(0,0,0,0.1)',
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const useConfirm = () => {
  const [state, setState] = useState({
    isOpen: false, title: '', message: '', onConfirm: null,
    variant: 'danger', confirmLabel: 'Eliminar',
  });
  const confirm = ({ title, message, onConfirm, variant = 'danger', confirmLabel = 'Eliminar' }) =>
    setState({ isOpen: true, title, message, onConfirm, variant, confirmLabel });
  const handleConfirm = () => { state.onConfirm?.(); setState(s => ({ ...s, isOpen: false })); };
  const handleCancel  = () => setState(s => ({ ...s, isOpen: false }));
  return { confirmState: state, confirm, handleConfirm, handleCancel };
};

const ConfirmModal = ({ isOpen, title, message, confirmLabel, onConfirm, onCancel, variant, t, isDark }) => {
  if (!isOpen) return null;
  const isDanger = variant === 'danger';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? '#1a2235' : 'white',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}>
        {/* Banda superior de color */}
        <div className="h-1 w-full" style={{ background: isDanger ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#f97316,#ea580c)' }} />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)' }}>
              {isDanger ? '🗑️' : '⚠️'}
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-extrabold text-base leading-snug" style={{ color: t.text1 }}>{title}</h3>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: t.text3 }}>{message}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: t.tagBg, color: t.text2 }}>
              Cancelar
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: isDanger ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#f97316,#ea580c)',
                boxShadow: isDanger ? '0 4px 14px rgba(239,68,68,0.45)' : '0 4px 14px rgba(249,115,22,0.45)',
              }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const { t, isDark } = useContext(ThemeCtx);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    refetchInterval: 30000,
  });
  const { data: recentData } = useQuery({
    queryKey: ['admin-reports-recent'],
    queryFn: () => reportService.getAll({ limit: 5, sort: '-createdAt' }),
    refetchInterval: 30000,
  });
  const { data: topUsersData } = useQuery({
    queryKey: ['admin-top-citizens'],
    queryFn: () => adminService.getUsers({ limit: 20, role: 'citizen' }),
    refetchInterval: 60000,
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
    { label: 'Total reportes',  value: stats?.reports.total,      gradient: 'linear-gradient(135deg,#1e40af,#2563eb)', shadow: 'rgba(37,99,235,0.4)',   icon: '📋' },
    { label: 'Usuarios activos',value: stats?.users.active,       gradient: 'linear-gradient(135deg,#0369a1,#0ea5e9)', shadow: 'rgba(14,165,233,0.4)',  icon: '👥' },
    { label: 'Resueltos',       value: stats?.reports.resolved,   gradient: 'linear-gradient(135deg,#065f46,#059669)', shadow: 'rgba(5,150,105,0.4)',   icon: '✅' },
    { label: 'Pendientes',      value: stats?.reports.pending,    gradient: 'linear-gradient(135deg,#92400e,#d97706)', shadow: 'rgba(217,119,6,0.4)',   icon: '⏳' },
    { label: 'En progreso',     value: stats?.reports.inProgress, gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)', shadow: 'rgba(124,58,237,0.4)',  icon: '⚙️' },
    { label: 'Rechazados',      value: stats?.reports.rejected,   gradient: 'linear-gradient(135deg,#991b1b,#dc2626)', shadow: 'rgba(220,38,38,0.4)',   icon: '🚫' },
    { label: 'Total usuarios',  value: stats?.users.total,        gradient: 'linear-gradient(135deg,#155e75,#0891b2)', shadow: 'rgba(8,145,178,0.4)',   icon: '🧑‍💻' },
    { label: 'Comentarios',     value: stats?.comments.total,     gradient: 'linear-gradient(135deg,#831843,#db2777)', shadow: 'rgba(219,39,119,0.4)',  icon: '💬' },
  ];

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({length: 8}).map((_, i) => (
        <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: t.skeletonBg }} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden transition-transform hover:scale-[1.02]"
            style={{ background: s.gradient, boxShadow: `0 8px 24px ${s.shadow}` }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
              style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-white/15">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-black text-white leading-none tabular-nums">{s.value ?? '—'}</p>
              <p className="text-xs font-semibold mt-1.5 text-white/75">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Barras por mes */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold" style={{ color: t.text1 }}>Reportes por mes</h3>
              <p className="text-xs mt-0.5" style={{ color: t.text3 }}>Últimos 6 meses</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: t.badgeBg, color: t.badgeText }}>
              Total: {stats?.reports.total ?? 0}
            </span>
          </div>
          <div className="flex items-end gap-3 h-44">
            {chartData.map(({ label, count }, i) => {
              const isLast = i === chartData.length - 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: isLast ? '#93c5fd' : t.text2 }}>
                    {count > 0 ? count : ''}
                  </span>
                  <div className="w-full flex items-end justify-center relative" style={{ height: '140px' }}>
                    {count > 0 ? (
                      <div
                        className="w-full rounded-t-xl transition-all duration-700"
                        style={{
                          background: isLast
                            ? 'linear-gradient(180deg,#60a5fa,#2563eb)'
                            : (isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'),
                          height: `${Math.max(pct, 8)}%`,
                          boxShadow: isLast ? '0 0 20px rgba(37,99,235,0.45)' : 'none',
                        }}
                      />
                    ) : (
                      <div className="w-full flex items-center justify-center" style={{ height: '100%' }}>
                        <div className="w-full h-px rounded-full opacity-20" style={{ background: t.text3 }} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: isLast ? t.text2 : t.text3 }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut por estado */}
        <div className="rounded-2xl p-6" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="mb-4">
            <h3 className="font-extrabold" style={{ color: t.text1 }}>Estados</h3>
            <p className="text-xs mt-0.5" style={{ color: t.text3 }}>Distribución actual</p>
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
                <circle cx="70" cy="70" r="32" fill={t.donutCenter} />
                <text x="70" y="67" textAnchor="middle" fontSize="22" fontWeight="900" fill={t.donutText}>{total === 1 ? 0 : total}</text>
                <text x="70" y="82" textAnchor="middle" fontSize="9" fill={t.donutSub} fontWeight="600">REPORTES</text>
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            {donutItems.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium" style={{ color: t.text2 }}>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: t.skeletonBg }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round(item.value / (total === 1 ? 1 : total) * 100)}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right" style={{ color: t.text1 }}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs avanzados */}
      {stats && (() => {
        const resolutionRate = Math.round((stats.reports.resolved / Math.max(stats.reports.total, 1)) * 100);
        const activeRate     = Math.round((stats.users.active / Math.max(stats.users.total, 1)) * 100);
        const thisMonthCount = chartData[chartData.length - 1]?.count || 0;
        const lastMonthCount = chartData[chartData.length - 2]?.count || 0;
        const momGrowth      = lastMonthCount === 0 ? null : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
        const verifiedRate   = Math.round((stats.reports.resolved + (stats.reports.inProgress || 0)) / Math.max(stats.reports.total, 1) * 100);

        const KPIS = [
          {
            label: 'Tasa de resolución',
            value: `${resolutionRate}%`,
            sub: `${stats.reports.resolved} de ${stats.reports.total} resueltos`,
            pct: resolutionRate,
            color: resolutionRate >= 60 ? '#22c55e' : resolutionRate >= 30 ? '#f59e0b' : '#ef4444',
            icon: '✅',
          },
          {
            label: 'Usuarios activos',
            value: `${activeRate}%`,
            sub: `${stats.users.active} de ${stats.users.total} activos`,
            pct: activeRate,
            color: '#3b82f6',
            icon: '👥',
          },
          {
            label: 'En gestión',
            value: `${verifiedRate}%`,
            sub: `Resueltos + en progreso`,
            pct: verifiedRate,
            color: '#8b5cf6',
            icon: '⚙️',
          },
          {
            label: 'Crecimiento mensual',
            value: momGrowth === null ? '—' : `${momGrowth > 0 ? '+' : ''}${momGrowth}%`,
            sub: `${thisMonthCount} reportes este mes`,
            pct: null,
            color: momGrowth === null ? '#6b7280' : momGrowth >= 0 ? '#22c55e' : '#ef4444',
            icon: momGrowth === null ? '📊' : momGrowth >= 0 ? '📈' : '📉',
          },
        ];

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KPIS.map(kpi => (
              <div key={kpi.label} className="rounded-2xl p-5" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{kpi.icon}</span>
                  <span className="text-2xl font-black tabular-nums" style={{ color: kpi.color }}>{kpi.value}</span>
                </div>
                {kpi.pct !== null && (
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: t.skeletonBg }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${kpi.pct}%`, background: kpi.color }} />
                  </div>
                )}
                <p className="text-xs font-extrabold" style={{ color: t.text1 }}>{kpi.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: t.text3 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Top ciudadanos + Reportes recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Top ciudadanos activos */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: t.cardBorder }}>
            <div>
              <h3 className="font-extrabold" style={{ color: t.text1 }}>Top ciudadanos</h3>
              <p className="text-xs mt-0.5" style={{ color: t.text3 }}>Por número de reportes</p>
            </div>
            <span className="text-lg">🏆</span>
          </div>
          <div className="flex-1 divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {(() => {
              const topUsers = (topUsersData?.users || [])
                .filter(u => (u.reportsCount ?? 0) > 0)
                .sort((a, b) => (b.reportsCount ?? 0) - (a.reportsCount ?? 0))
                .slice(0, 5);
              const maxReports = topUsers[0]?.reportsCount || 1;
              const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              if (topUsers.length === 0) return (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-2">👤</div>
                  <p className="text-sm font-semibold" style={{ color: t.text3 }}>Sin datos aún</p>
                </div>
              );
              return topUsers.map((u, i) => {
                const pct = Math.round((u.reportsCount / maxReports) * 100);
                const avatarUrl = u.avatar?.url;
                return (
                  <div key={u._id} className="px-5 py-3 flex items-center gap-3 transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span className="text-base w-6 flex-shrink-0 text-center">{MEDALS[i]}</span>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                      {avatarUrl ? <img src={avatarUrl} alt={u.name} className="w-full h-full object-cover" /> : u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: t.text1 }}>{u.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#3b82f6,#1d4ed8)' }} />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold flex-shrink-0 tabular-nums" style={{ color: i === 0 ? '#f59e0b' : t.text2 }}>{u.reportsCount}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Reportes recientes */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: t.cardBorder }}>
          <h3 className="font-extrabold" style={{ color: t.text1 }}>Reportes recientes</h3>
          <span className="text-xs" style={{ color: t.text3 }}>Últimos 5</span>
        </div>
        <div>
          {recent.map(report => {
            const status = STATUS_MAP[report.status] || STATUS_MAP.pending;
            const priority = PRIORITY_MAP[report.priority] || PRIORITY_MAP.medium;
            return (
              <div key={report._id} className="px-6 py-3.5 flex items-center gap-4 transition-colors"
                style={{ borderBottom: t.rowBorder }}
                onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: t.skeletonBg }}>
                  {report.images?.length > 0
                    ? <img src={report.images[0].url} alt="" className="w-full h-full object-cover rounded-lg" />
                    : WORK_ICONS[report.workType] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: t.text1 }}>{report.title}</p>
                  <p className="text-xs" style={{ color: t.text3 }}>{report.author?.name} · {fmt(report.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-bold flex-shrink-0 ${priority.cls}`}>{priority.label}</span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border flex-shrink-0 ${status.cls}`}>{status.label}</span>
                <button
                  onClick={() => onViewReport(report._id)}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: 'rgba(148,163,184,0.6)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.6)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  {Icons.eye}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      </div>{/* end grid top-citizens + recent */}
    </div>
  );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────
const ReportsTab = ({ onViewReport, adminUser, stats }) => {
  const { t, isDark } = useContext(ThemeCtx);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  const setDatePreset = (preset) => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    if (preset === 'week') {
      const from = new Date(now); from.setDate(from.getDate() - 7);
      setDateFrom(from.toISOString().split('T')[0]); setDateTo(to);
    } else if (preset === 'month') {
      const from = new Date(now); from.setMonth(from.getMonth() - 1);
      setDateFrom(from.toISOString().split('T')[0]); setDateTo(to);
    } else if (preset === '3months') {
      const from = new Date(now); from.setMonth(from.getMonth() - 3);
      setDateFrom(from.toISOString().split('T')[0]); setDateTo(to);
    } else {
      setDateFrom(''); setDateTo('');
    }
    setPage(1);
  };

  const activePreset = (() => {
    if (!dateFrom && !dateTo) return 'all';
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    const week3m = new Date(now); week3m.setMonth(week3m.getMonth() - 3);
    const week1m = new Date(now); week1m.setMonth(week1m.getMonth() - 1);
    const week1w = new Date(now); week1w.setDate(week1w.getDate() - 7);
    if (dateTo === to && dateFrom === week1w.toISOString().split('T')[0]) return 'week';
    if (dateTo === to && dateFrom === week1m.toISOString().split('T')[0]) return 'month';
    if (dateTo === to && dateFrom === week3m.toISOString().split('T')[0]) return '3months';
    return 'custom';
  })();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports-table', search, filterStatus, dateFrom, dateTo, page],
    queryFn: () => reportService.getAll({ search, status: filterStatus, dateFrom, dateTo, page, limit: 15 }),
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

  const handleDelete = (reportId) => {
    confirm({
      title: 'Eliminar reporte',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await reportService.delete(reportId);
          toast.success('Reporte eliminado');
          queryClient.invalidateQueries({ queryKey: ['admin-reports-table'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        } catch {
          toast.error('Error al eliminar');
        }
      },
    });
  };

  const PRESETS = [
    { id: 'week',    label: 'Esta semana' },
    { id: 'month',   label: 'Este mes' },
    { id: '3months', label: 'Últimos 3 meses' },
    { id: 'all',     label: 'Todo' },
  ];

  return (
    <>
    <ConfirmModal {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} t={t} isDark={isDark} />
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3" style={{ background: t.cardBg, border: t.cardBorder }}>
        {/* Fila 1: búsqueda + estado + export */}
        <div className="w-full flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.text3 }}>{Icons.search}</span>
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="py-2.5 px-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text2 }}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_MAP).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {isFetching && <span className="text-xs flex items-center gap-1.5" style={{ color: t.text3 }}><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Actualizando...</span>}
          <button
            onClick={async () => {
              setExporting(true);
              try {
                const all = await reportService.getAll({ status: filterStatus, search, dateFrom, dateTo, limit: 500 });
                exportReportsPDF(all.reports, stats, { status: filterStatus, search }, adminUser);
                toast.success('PDF generado correctamente');
              } catch {
                toast.error('Error al generar el PDF');
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 ml-auto"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
          >
            {exporting
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</>
              : <>{Icons.download} Exportar PDF</>
            }
          </button>
        </div>
        {/* Fila 2: filtros de fecha */}
        <div className="w-full flex flex-wrap items-center gap-2 pt-1" style={{ borderTop: `1px solid ${t.rowBorder}` }}>
          <span className="text-xs font-semibold mr-1" style={{ color: t.text3 }}>{Icons.calendar}</span>
          {PRESETS.map(p => (
            <button key={p.id}
              onClick={() => setDatePreset(p.id)}
              className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all"
              style={activePreset === p.id
                ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }
                : { background: t.tagBg, color: t.text2 }
              }
            >{p.label}</button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text2 }} />
            <span className="text-xs" style={{ color: t.text3 }}>—</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text2 }} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="ml-1 text-xs font-semibold transition-colors"
              style={{ color: '#ef4444' }}>
              Limpiar
            </button>
          )}
          {(dateFrom || dateTo) && (
            <span className="ml-auto text-xs px-2 py-1 rounded-lg font-semibold"
              style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
              {pagination.total ?? '...'} resultado{pagination.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Reporte</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden md:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Autor</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden lg:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Ubicación</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Prioridad</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Estado</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden lg:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Fecha</th>
              <th className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({length: 6}).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td colSpan={7} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl animate-pulse flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 rounded-lg animate-pulse w-2/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="h-3 rounded-lg animate-pulse w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && reports.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-16 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold" style={{ color: 'rgba(148,163,184,0.8)' }}>No se encontraron reportes</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(100,116,139,0.7)' }}>Intenta con otro filtro o búsqueda</p>
              </td></tr>
            )}
            {!isLoading && reports.map((report, idx) => {
              const priority = PRIORITY_MAP[report.priority] || PRIORITY_MAP.medium;
              const status = STATUS_MAP[report.status] || STATUS_MAP.pending;
              return (
                <tr key={report._id} className="group transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {report.images?.length > 0
                        ? <img src={report.images[0].url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
                        : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(37,99,235,0.15)' }}>{WORK_ICONS[report.workType] || '📋'}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate max-w-[200px] text-[13px]">{report.title}</p>
                        <p className="text-xs truncate max-w-[200px] mt-0.5" style={{ color: 'rgba(100,116,139,0.8)' }}>{report.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }}>
                        {report.author?.avatar?.url
                          ? <img src={report.author.avatar.url} alt="" className="w-full h-full object-cover" />
                          : report.author?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'rgba(148,163,184,0.9)' }}>{report.author?.name || 'Anónimo'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(148,163,184,0.8)' }}>{report.location?.neighborhood || report.location?.city || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1.5 rounded-xl font-bold ${priority.cls}`}>{priority.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={report.status}
                      onChange={e => handleStatusChange(report._id, e.target.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold border cursor-pointer focus:outline-none ${status.cls}`}
                    >
                      {Object.entries(STATUS_MAP).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell"><span className="text-xs" style={{ color: 'rgba(100,116,139,0.8)' }}>{fmt(report.createdAt)}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => onViewReport(report._id)} title="Ver detalle"
                        className="p-2 rounded-xl transition-colors" style={{ color: 'rgba(100,116,139,0.7)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(100,116,139,0.7)'; e.currentTarget.style.background = 'transparent'; }}
                      >{Icons.eye}</button>
                      <button onClick={() => handleDelete(report._id)} title="Eliminar"
                        className="p-2 rounded-xl transition-colors" style={{ color: 'rgba(100,116,139,0.7)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(100,116,139,0.7)'; e.currentTarget.style.background = 'transparent'; }}
                      >{Icons.trash}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #f1f5f9' }}>
            <span className="text-xs text-gray-400 font-medium">{reports.length} de {pagination.total} reportes</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium">← Anterior</button>
              <span className="px-3.5 py-1.5 text-xs rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>{page}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium">Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const { t, isDark } = useContext(ThemeCtx);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

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
    <>
    <ConfirmModal {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} t={t} isDark={isDark} />
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(148,163,184,0.6)' }}>{Icons.search}</span>
          <input type="text" placeholder="Buscar por nombre, email o ciudad..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </div>
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="py-2.5 px-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(226,232,240,0.9)' }}
        >
          <option value="">Todos los roles</option>
          <option value="citizen">Ciudadano</option>
          <option value="moderator">Moderador</option>
          <option value="admin">Admin</option>
        </select>
        {isFetching && <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(148,163,184,0.7)' }}><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Actualizando...</span>}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Usuario</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden md:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Email</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden lg:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Ciudad</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Rol</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden md:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Reportes</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Activo</th>
              <th className="text-left px-5 py-4 font-bold text-[11px] uppercase tracking-widest hidden lg:table-cell" style={{ color: 'rgba(100,116,139,0.9)', background: 'rgba(255,255,255,0.03)' }}>Registro</th>
              <th className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({length: 6}).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td colSpan={8} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full animate-pulse flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 rounded-lg animate-pulse w-1/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="h-3 rounded-lg animate-pulse w-1/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-16 text-center">
                <div className="text-4xl mb-3">👥</div>
                <p className="font-semibold" style={{ color: 'rgba(148,163,184,0.8)' }}>No se encontraron usuarios</p>
              </td></tr>
            )}
            {!isLoading && users.map((user, idx) => {
              const role = ROLE_MAP[user.role] || ROLE_MAP.citizen;
              const isAdmin = user.role === 'admin';
              const toggling = toggleMutation.isPending && toggleMutation.variables === user._id;
              return (
                <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
                        style={{ background: user.avatar?.url ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', boxShadow: '0 2px 6px rgba(37,99,235,0.2)' }}>
                        {user.avatar?.url
                          ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                          : user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-[13px]">{user.name}</p>
                        {isAdmin && <p className="text-[10px] text-blue-400 font-bold">Administrador</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell"><span className="text-xs" style={{ color: 'rgba(100,116,139,0.8)' }}>{user.email}</span></td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(148,163,184,0.8)' }}>{user.city || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    {isAdmin ? (
                      <span className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold border ${role.cls}`}>{role.label}</span>
                    ) : (
                      <select value={user.role} onChange={e => roleMutation.mutate({ userId: user._id, role: e.target.value })}
                        disabled={roleMutation.isPending}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold border cursor-pointer focus:outline-none ${role.cls}`}
                      >
                        <option value="citizen">Ciudadano</option>
                        <option value="moderator">Moderador</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-bold text-white text-sm">{user.reportsCount ?? 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    {isAdmin ? <span className="text-xs text-gray-300">—</span> : (
                      <button onClick={() => toggleMutation.mutate(user._id)} disabled={toggling}
                        title={user.isActive ? 'Desactivar' : 'Activar'}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-all focus:outline-none ${user.isActive ? 'bg-green-400' : 'bg-gray-200'} ${toggling ? 'opacity-50' : ''}`}
                        style={user.isActive ? { boxShadow: '0 2px 6px rgba(34,197,94,0.4)' } : {}}
                      >
                        <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${user.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell"><span className="text-xs" style={{ color: 'rgba(100,116,139,0.8)' }}>{fmt(user.createdAt)}</span></td>
                  <td className="px-5 py-4">
                    {!isAdmin && (
                      <button onClick={() => confirm({
                        title: `Eliminar usuario`,
                        message: `¿Eliminar a "${user.name}"? Esta acción no se puede deshacer.`,
                        confirmLabel: 'Eliminar',
                        onConfirm: () => deleteMutation.mutate(user._id),
                      })}
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: 'rgba(100,116,139,0.7)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(100,116,139,0.7)'; e.currentTarget.style.background = 'transparent'; }}>
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
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #f1f5f9' }}>
            <span className="text-xs text-gray-400 font-medium">{users.length} de {pagination.total} usuarios</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium">← Anterior</button>
              <span className="px-3.5 py-1.5 text-xs rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>{page}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium">Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

// ─── Petitions Tab ───────────────────────────────────────────────────────────
const PetitionsTab = () => {
  const { t, isDark } = useContext(ThemeCtx);
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

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

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.inputText,
  };
  const labelStyle = { color: t.text3 };

  // ── Formulario de creación / edición ──
  if (view === 'create' || view === 'edit') {
    return (
      <div className="flex gap-6 items-start">
        {/* Formulario principal */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('list'); setSelected(null); }}
              className="p-2 rounded-xl transition-colors"
              style={{ background: t.tagBg, color: t.text2 }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="font-extrabold text-lg" style={{ color: t.text1 }}>
              {view === 'edit' ? 'Editar petición' : 'Nueva petición'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-5"
            style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>

            {/* Título */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Título de la petición *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Solicitud de reparación urgente de vías en el barrio Centro"
                className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                style={inputStyle}
              />
            </div>

            {/* Destinatario */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Nombre del destinatario</label>
                <input value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Cargo</label>
                <input value={form.recipientTitle} onChange={e => setForm(f => ({ ...f, recipientTitle: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Ciudad / Municipio</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Meta de firmas</label>
                <input type="number" min={1} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Cuerpo */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Cuerpo de la petición *</label>
              <p className="text-xs mb-2" style={{ color: t.text3 }}>Texto formal de la petición. Usa saltos de línea para separar párrafos.</p>
              <textarea required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={8} placeholder="Los ciudadanos del municipio de Pasto, debidamente identificados, nos dirigimos respetuosamente..."
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed transition-colors"
                style={inputStyle}
              />
            </div>

            {/* Petitorio */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest block mb-1.5" style={labelStyle}>Petitorio — Lo que se solicita</label>
              <div className="space-y-2">
                {form.requests.map((req, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="flex-shrink-0 w-7 h-10 flex items-center justify-center text-xs font-extrabold text-blue-500">{i + 1}.</span>
                    <input value={req} onChange={e => handleRequestChange(i, e.target.value)}
                      placeholder="Ej: Proceder a la reparación inmediata de los tramos afectados..."
                      className="flex-1 px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      style={inputStyle}
                    />
                    {form.requests.length > 1 && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, requests: f.requests.filter((_, j) => j !== i) }))}
                        className="p-2 rounded-lg transition-colors flex-shrink-0"
                        style={{ color: t.text3 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.text3; e.currentTarget.style.background = 'transparent'; }}
                      >{Icons.trash}</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm(f => ({ ...f, requests: [...f.requests, ''] }))}
                  className="flex items-center gap-2 text-sm font-semibold mt-1 text-blue-500 hover:text-blue-400 transition-colors"
                >{Icons.plus} Agregar punto</button>
              </div>
            </div>

            {/* Estado abierta/cerrada */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.theadBg }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, isOpen: !f.isOpen }))}
                className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors ${form.isOpen ? 'bg-green-400' : 'bg-gray-400'}`}
              >
                <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform ${form.isOpen ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-semibold" style={{ color: t.text1 }}>
                {form.isOpen ? 'Abierta para firmas' : 'Cerrada para firmas'}
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setView('list'); setSelected(null); }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: t.tagBg, color: t.text2 }}
              >Cancelar</button>
              <button type="submit" disabled={saveMutation.isPending}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
              >{saveMutation.isPending ? 'Guardando...' : (view === 'edit' ? 'Guardar cambios' : 'Crear petición')}</button>
            </div>
          </form>
        </div>

        {/* Panel lateral de ayuda */}
        <div className="w-64 flex-shrink-0 space-y-4 sticky top-6">
          <div className="rounded-2xl p-4 space-y-3" style={{ background: t.cardBg, border: t.cardBorder }}>
            <p className="font-extrabold text-sm" style={{ color: t.text1 }}>💡 Consejos</p>
            {[
              { icon: '✍️', text: 'Usa un título claro y específico que describa el problema' },
              { icon: '📍', text: 'Menciona el barrio o sector afectado en el cuerpo' },
              { icon: '📋', text: 'El petitorio debe tener solicitudes concretas y medibles' },
              { icon: '🎯', text: 'Define una meta de firmas realista según la comunidad' },
            ].map((tip, i) => (
              <div key={i} className="flex gap-2.5 text-xs" style={{ color: t.text2 }}>
                <span className="flex-shrink-0">{tip.icon}</span>
                <p>{tip.text}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}` }}>
            <p className="font-extrabold text-sm text-blue-500 mb-1">📄 Exportación Word</p>
            <p className="text-xs" style={{ color: t.text3 }}>Al guardar podrás exportar la petición como documento Word formal listo para presentar.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Lista de peticiones ──
  return (
    <>
    <ConfirmModal {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} t={t} isDark={isDark} />
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: t.text3 }}>{petitions.length} petición(es) creada(s)</p>
        <button onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
        >{Icons.plus} Nueva petición</button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: t.skeletonBg }} />)}
        </div>
      )}

      {!isLoading && petitions.length === 0 && (
        <div className="rounded-2xl p-16 text-center" style={{ background: t.cardBg, border: t.cardBorder }}>
          <div className="text-5xl mb-3">📜</div>
          <p className="font-bold" style={{ color: t.text1 }}>No hay peticiones aún</p>
          <p className="text-sm mt-1" style={{ color: t.text3 }}>Crea una petición para que los ciudadanos puedan firmarla</p>
        </div>
      )}

      {!isLoading && petitions.map(petition => {
        const pct = Math.min(Math.round((petition.signaturesCount / petition.goal) * 100), 100);
        return (
          <div key={petition._id} className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
            {/* Barra superior de estado */}
            <div className="h-1 w-full" style={{ background: petition.isOpen ? 'linear-gradient(90deg,#22c55e,#16a34a)' : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0') }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${petition.isOpen ? 'bg-green-500/15 text-green-500' : 'text-slate-400'}`}
                      style={!petition.isOpen ? { background: t.tagBg } : {}}>
                      {petition.isOpen ? '● Abierta' : '● Cerrada'}
                    </span>
                    <span className="text-xs" style={{ color: t.text3 }}>{fmt(petition.createdAt)}</span>
                  </div>
                  <h3 className="font-extrabold text-[15px] leading-snug mb-1" style={{ color: t.text1 }}>{petition.title}</h3>
                  <p className="text-xs" style={{ color: t.text3 }}>
                    Para: <span className="font-semibold" style={{ color: t.text2 }}>{petition.recipientTitle}</span> · {petition.city}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(petition)} title="Editar"
                    className="p-2 rounded-xl transition-colors" style={{ color: t.btnIcon }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = t.btnIcon; e.currentTarget.style.background = 'transparent'; }}>
                    {Icons.pen}
                  </button>
                  <button onClick={() => handleExportWord(petition._id)} disabled={exportingId === petition._id}
                    title="Exportar Word"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-colors disabled:opacity-60"
                    style={{ background: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)', color: '#3b82f6' }}
                  >
                    {exportingId === petition._id
                      ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      : Icons.word}
                    Word
                  </button>
                  <button onClick={() => confirm({ title: 'Eliminar petición', message: `¿Eliminar "${petition.title}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', onConfirm: () => deleteMutation.mutate(petition._id) })}
                    title="Eliminar" className="p-2 rounded-xl transition-colors" style={{ color: t.btnIcon }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = t.btnIcon; e.currentTarget.style.background = 'transparent'; }}>
                    {Icons.trash}
                  </button>
                </div>
              </div>

              {/* Progreso de firmas */}
              <div className="rounded-2xl p-4" style={{ background: t.theadBg }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold leading-none" style={{ color: t.text1 }}>{petition.signaturesCount}</span>
                    <span className="text-xs font-medium" style={{ color: t.text3 }}>firmas</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: t.text3 }}>
                    Meta: {petition.goal} · <span style={{ color: '#3b82f6' }}>{pct}%</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#3b82f6,#1d4ed8)' }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
};

// ─── Map Tab ─────────────────────────────────────────────────────────────────
const ADMIN_STATUS_COLORS = {
  pending: '#f59e0b', verified: '#06b6d4', inProgress: '#8b5cf6',
  resolved: '#22c55e', rejected: '#ef4444', closed: '#6b7280',
};
const ADMIN_PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const ADMIN_PRIORITY_WEIGHT = { low: 0.3, medium: 0.5, high: 0.8, critical: 1.0 };
const adminMakePinIcon = (L, color) => L.divIcon({
  html: `<svg width="28" height="38" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))"><path d="M18 0C8.059 0 0 8.059 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.059 27.941 0 18 0Z" fill="${color}"/><circle cx="18" cy="18" r="7" fill="white"/></svg>`,
  className: '', iconSize: [28, 38], iconAnchor: [14, 38],
});

const MapTab = ({ onViewReport }) => {
  const { t, isDark } = useContext(ThemeCtx);
  const [MapComps, setMapComps] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [colorBy, setColorBy] = useState('priority');
  const [viewMode, setViewMode] = useState('pins');
  const [selectedReport, setSelectedReport] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-map-reports'],
    queryFn: () => reportService.getAll({ limit: 500 }),
    staleTime: 60000,
  });

  const allReports = (data?.reports || []).filter(r =>
    r.location?.coordinates?.[0] && r.location.coordinates[1]
  );
  const filtered = allReports.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!priorityFilter || r.priority === priorityFilter)
  );
  const heatPoints = filtered.map(r => [
    r.location.coordinates[1], r.location.coordinates[0],
    ADMIN_PRIORITY_WEIGHT[r.priority] || 0.5,
  ]);
  const clusterKey = `${statusFilter}|${priorityFilter}|${colorBy}`;

  useEffect(() => {
    (async () => {
      const L = await import('leaflet');
      const { MapContainer, TileLayer, useMap } = await import('react-leaflet');
      delete L.default.Icon.Default.prototype._getIconUrl;

      const MapResizer = () => {
        const map = useMap();
        useEffect(() => {
          const t1 = setTimeout(() => map.invalidateSize(), 100);
          const t2 = setTimeout(() => map.invalidateSize(), 500);
          return () => { clearTimeout(t1); clearTimeout(t2); };
        }, []); // eslint-disable-line
        return null;
      };

      const ClusterLayer = ({ reports, onSelect, colorBy }) => {
        const map = useMap();
        useEffect(() => {
          let group = null; let cancelled = false;
          (async () => {
            await import('leaflet.markercluster');
            if (cancelled) return;
            const Lx = L.default;
            group = Lx.markerClusterGroup({ maxClusterRadius: 60, disableClusteringAtZoom: 17 });
            reports.forEach(r => {
              const [lng, lat] = r.location.coordinates;
              const color = colorBy === 'status'
                ? (ADMIN_STATUS_COLORS[r.status] || '#3b82f6')
                : (ADMIN_PRIORITY_COLORS[r.priority] || '#3b82f6');
              const marker = Lx.marker([lat, lng], { icon: adminMakePinIcon(Lx, color) });
              marker.on('click', () => onSelect(r));
              group.addLayer(marker);
            });
            map.addLayer(group);
          })();
          return () => { cancelled = true; if (group) map.removeLayer(group); };
        }, [map, JSON.stringify(reports.map(r => r._id)), colorBy]); // eslint-disable-line
        return null;
      };

      const HeatLayer = ({ points }) => {
        const map = useMap();
        useEffect(() => {
          if (!points?.length) return;
          let hl = null;
          (async () => {
            await import('leaflet.heat');
            const Lx = L.default;
            if (!Lx.heatLayer) return;
            hl = Lx.heatLayer(points, {
              radius: 40, blur: 30, maxZoom: 17, max: 1.0,
              gradient: { 0.2: '#4ade80', 0.4: '#facc15', 0.6: '#fb923c', 1.0: '#dc2626' },
            }).addTo(map);
          })();
          return () => { if (hl) map.removeLayer(hl); };
        }, [map, JSON.stringify(points)]); // eslint-disable-line
        return null;
      };

      setMapComps({ MapContainer, TileLayer, MapResizer, ClusterLayer, HeatLayer });
    })();
  }, []);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="text-sm py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}>
          <option value="">Toda prioridad</option>
          {Object.entries(PRIORITY_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: t.tagBg }}>
          {[{ v: 'priority', l: 'Por prioridad' }, { v: 'status', l: 'Por estado' }].map(({ v, l }) => (
            <button key={v} onClick={() => setColorBy(v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={colorBy === v ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' } : { color: t.text2 }}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 ml-auto" style={{ background: t.tagBg }}>
          {[{ v: 'pins', l: '📍 Pines' }, { v: 'heat', l: '🔥 Calor' }].map(({ v, l }) => (
            <button key={v} onClick={() => setViewMode(v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={viewMode === v ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' } : { color: t.text2 }}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold" style={{ color: t.text3 }}>{filtered.length} reportes visibles</span>
      </div>

      {/* Mapa */}
      <div className="rounded-2xl overflow-hidden relative" style={{ height: 'calc(100vh - 248px)', border: t.cardBorder }}>
        {(!MapComps || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: t.cardBg }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderTopColor: 'transparent' }} />
              <p className="text-sm font-semibold" style={{ color: t.text2 }}>Cargando mapa...</p>
            </div>
          </div>
        )}
        {MapComps && (
          <MapComps.MapContainer center={[1.2136, -77.2811]} zoom={13} style={{ width: '100%', height: '100%' }}>
            <MapComps.TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapComps.MapResizer />
            {viewMode === 'pins' && (
              <MapComps.ClusterLayer key={clusterKey} reports={filtered} onSelect={setSelectedReport} colorBy={colorBy} />
            )}
            {viewMode === 'heat' && <MapComps.HeatLayer points={heatPoints} />}
          </MapComps.MapContainer>
        )}

        {/* Leyenda */}
        {MapComps && viewMode === 'pins' && (
          <div className="absolute bottom-4 left-4 z-[400] rounded-xl px-3 py-2.5 space-y-1.5"
            style={{ background: isDark ? 'rgba(13,17,23,0.92)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', border: t.cardBorder }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: t.text3 }}>
              {colorBy === 'priority' ? 'Prioridad' : 'Estado'}
            </p>
            {colorBy === 'priority'
              ? Object.entries(ADMIN_PRIORITY_COLORS).map(([k, c]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    <span className="text-xs" style={{ color: t.text2 }}>{PRIORITY_MAP[k]?.label}</span>
                  </div>
                ))
              : Object.entries(ADMIN_STATUS_COLORS).map(([k, c]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    <span className="text-xs" style={{ color: t.text2 }}>{STATUS_MAP[k]?.label}</span>
                  </div>
                ))
            }
          </div>
        )}

        {/* Card de reporte seleccionado */}
        {selectedReport && (
          <div className="absolute bottom-4 right-4 z-[400] rounded-2xl p-4 w-72"
            style={{ background: isDark ? 'rgba(13,17,23,0.97)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)', border: t.cardBorder, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <p className="text-sm font-extrabold leading-snug" style={{ color: t.text1 }}>{selectedReport.title}</p>
              <button onClick={() => setSelectedReport(null)}
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                style={{ color: t.text3, background: t.tagBg }}>✕</button>
            </div>
            <div className="flex gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-lg font-bold ${PRIORITY_MAP[selectedReport.priority]?.cls}`}>
                {PRIORITY_MAP[selectedReport.priority]?.label}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${STATUS_MAP[selectedReport.status]?.cls}`}>
                {STATUS_MAP[selectedReport.status]?.label}
              </span>
            </div>
            {selectedReport.description && (
              <p className="text-xs mb-3 overflow-hidden" style={{ color: t.text3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {selectedReport.description}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setSelectedReport(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: t.tagBg, color: t.text2 }}>
                Cerrar
              </button>
              <button onClick={() => { onViewReport(selectedReport._id); setSelectedReport(null); }}
                className="flex-1 py-2 rounded-xl text-white text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                Ver detalle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Activity Tab ─────────────────────────────────────────────────────────────
const ActivityTab = () => {
  const { t, isDark } = useContext(ThemeCtx);
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading: lr } = useQuery({
    queryKey: ['admin-activity-reports'],
    queryFn: () => reportService.getAll({ sort: '-createdAt', limit: 30 }),
    refetchInterval: 30000,
  });
  const { data: messagesData, isLoading: lm } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: messageService.getAll,
    refetchInterval: 30000,
    staleTime: 0,
  });
  const { data: usersData } = useQuery({
    queryKey: ['admin-activity-users'],
    queryFn: () => adminService.getUsers({ limit: 20 }),
    staleTime: 60000,
  });

  const isLoading = lr || lm;

  const fmtAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000)    return 'Hace un momento';
    if (diff < 3600000)  return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000)return `Hace ${Math.floor(diff / 86400000)} días`;
    return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  const events = [];
  (reportsData?.reports || []).forEach(r => {
    events.push({
      id: `r-${r._id}`, date: new Date(r.createdAt),
      icon: '📋', color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
      title: r.title,
      subtitle: `Reporte de ${r.author?.name || 'Anónimo'} · ${r.location?.neighborhood || r.location?.city || 'Sin ubicación'}`,
      priority: r.priority, status: r.status,
    });
  });
  (messagesData?.messages || []).forEach(m => {
    events.push({
      id: `m-${m._id}`, date: new Date(m.createdAt),
      icon: '✉️', color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',
      title: m.subject,
      subtitle: `Mensaje de ${m.from?.name}`,
    });
    (m.replies || []).forEach((r, i) => events.push({
      id: `mr-${m._id}-${i}`, date: new Date(r.createdAt),
      icon: r.isAdmin ? '🛡️' : '💬',
      color: r.isAdmin ? '#10b981' : '#8b5cf6',
      bg: r.isAdmin ? (isDark ? 'rgba(16,185,129,0.12)' : '#f0fdf4') : (isDark ? 'rgba(139,92,246,0.12)' : '#f5f3ff'),
      title: r.isAdmin ? `Respondiste: "${m.subject}"` : `${m.from?.name} respondió`,
      subtitle: r.body.length > 80 ? r.body.slice(0, 80) + '…' : r.body,
    }));
  });
  (usersData?.users || []).forEach(u => events.push({
    id: `u-${u._id}`, date: new Date(u.createdAt),
    icon: '👤', color: '#22c55e', bg: isDark ? 'rgba(34,197,94,0.12)' : '#f0fdf4',
    title: u.name,
    subtitle: `Nuevo ${u.role === 'admin' ? 'administrador' : u.role === 'moderator' ? 'moderador' : 'ciudadano'} · ${u.email}`,
  }));

  events.sort((a, b) => b.date - a.date);
  const top = events.slice(0, 60);

  const grouped = top.reduce((acc, ev) => {
    const key = ev.date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  // Conteos por tipo para el panel lateral
  const countReports  = events.filter(e => e.id.startsWith('r-')).length;
  const countMessages = events.filter(e => e.id.startsWith('m-') || e.id.startsWith('mr-')).length;
  const countUsers    = events.filter(e => e.id.startsWith('u-')).length;
  const countCritical = events.filter(e => e.priority === 'critical').length;
  const countHigh     = events.filter(e => e.priority === 'high').length;

  const TYPE_SUMMARY = [
    { label: 'Reportes',         count: countReports,  color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',  icon: '📋' },
    { label: 'Mensajes',         count: countMessages, color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',  icon: '✉️' },
    { label: 'Usuarios nuevos',  count: countUsers,    color: '#22c55e', bg: isDark ? 'rgba(34,197,94,0.12)'  : '#f0fdf4',  icon: '👤' },
    { label: 'Críticos',         count: countCritical, color: '#ef4444', bg: isDark ? 'rgba(239,68,68,0.12)'  : '#fef2f2',  icon: '🚨' },
  ];

  return (
    <div className="flex gap-6 items-start">

      {/* ── Feed principal ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg" style={{ color: t.text1 }}>Actividad reciente</h2>
            <p className="text-sm mt-0.5" style={{ color: t.text3 }}>{top.length} eventos · últimas 2 semanas</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold" style={{ color: t.text3 }}>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Reportes</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400" />Mensajes</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Usuarios</span>
          </div>
        </div>

        {isLoading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 animate-pulse" style={{ background: t.skeletonBg }} />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 rounded-lg animate-pulse w-2/3" style={{ background: t.skeletonBg }} />
              <div className="h-2.5 rounded-lg animate-pulse w-1/3" style={{ background: t.skeletonBg }} />
            </div>
          </div>
        ))}

        {!isLoading && Object.entries(grouped).map(([label, dayEvs]) => (
          <div key={label}>
            <p className="text-[11px] font-extrabold uppercase tracking-widest capitalize mb-2.5" style={{ color: t.text3 }}>{label}</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
              {dayEvs.map((ev, idx) => (
                <div key={ev.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition-colors cursor-default"
                  style={{ borderBottom: idx < dayEvs.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Línea vertical de color */}
                  <div className="w-0.5 h-10 rounded-full flex-shrink-0" style={{ background: ev.color, opacity: 0.5 }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: ev.bg }}>
                    {ev.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: t.text1 }}>{ev.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: t.text3 }}>{ev.subtitle}</p>
                  </div>
                  {ev.priority && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold flex-shrink-0 ${PRIORITY_MAP[ev.priority]?.cls}`}>
                      {PRIORITY_MAP[ev.priority]?.label}
                    </span>
                  )}
                  {ev.status && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border flex-shrink-0 ${STATUS_MAP[ev.status]?.cls || ''}`}>
                      {STATUS_MAP[ev.status]?.label}
                    </span>
                  )}
                  <span className="text-[11px] flex-shrink-0 whitespace-nowrap pl-2" style={{ color: t.text3 }}>{fmtAgo(ev.date)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && top.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center rounded-2xl"
            style={{ background: t.cardBg, border: t.cardBorder }}>
            <div className="text-5xl">📭</div>
            <p className="font-extrabold text-base" style={{ color: t.text1 }}>Sin actividad reciente</p>
            <p className="text-sm" style={{ color: t.text3 }}>La actividad de la plataforma aparecerá aquí</p>
          </div>
        )}
      </div>

      {/* ── Panel lateral de resumen ── */}
      <div className="w-72 flex-shrink-0 space-y-4 sticky top-6">

        {/* Resumen por tipo */}
        <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}` }}>
            <p className="font-extrabold text-sm" style={{ color: t.text1 }}>Resumen de eventos</p>
            <p className="text-xs mt-0.5" style={{ color: t.text3 }}>Total: {top.length} eventos</p>
          </div>
          <div className="p-4 space-y-3">
            {TYPE_SUMMARY.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: s.bg }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold" style={{ color: t.text1 }}>{s.label}</p>
                    <p className="text-xs font-extrabold" style={{ color: s.color }}>{s.count}</p>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: t.skeletonBg }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${top.length ? Math.round(s.count / top.length * 100) : 0}%`, background: s.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas 24h */}
        <div className="rounded-2xl p-4 space-y-2" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
          <p className="font-extrabold text-sm mb-3" style={{ color: t.text1 }}>Últimas 24 horas</p>
          {(() => {
            const last24 = top.filter(e => Date.now() - e.date.getTime() < 86400000);
            const r24 = last24.filter(e => e.id.startsWith('r-')).length;
            const m24 = last24.filter(e => e.id.startsWith('m-') || e.id.startsWith('mr-')).length;
            const u24 = last24.filter(e => e.id.startsWith('u-')).length;
            return [
              { label: 'Nuevos reportes',  val: r24, color: '#3b82f6' },
              { label: 'Mensajes',         val: m24, color: '#8b5cf6' },
              { label: 'Nuevos usuarios',  val: u24, color: '#22c55e' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 rounded-lg px-2"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                <p className="text-xs" style={{ color: t.text2 }}>{item.label}</p>
                <p className="text-sm font-extrabold" style={{ color: item.val > 0 ? item.color : t.text3 }}>
                  {item.val > 0 ? `+${item.val}` : '0'}
                </p>
              </div>
            ));
          })()}
        </div>

        {/* Alertas críticas */}
        {countCritical > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🚨</span>
              <p className="font-extrabold text-sm text-red-500">{countCritical} reporte{countCritical !== 1 ? 's' : ''} crítico{countCritical !== 1 ? 's' : ''}</p>
            </div>
            <p className="text-xs" style={{ color: t.text3 }}>Requieren atención inmediata</p>
          </div>
        )}
        {countHigh > 0 && (
          <div className="rounded-2xl p-4"
            style={{ background: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed', border: `1px solid ${isDark ? 'rgba(249,115,22,0.25)' : '#fed7aa'}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚠️</span>
              <p className="font-extrabold text-sm text-orange-500">{countHigh} reporte{countHigh !== 1 ? 's' : ''} de alta prioridad</p>
            </div>
            <p className="text-xs" style={{ color: t.text3 }}>Requieren seguimiento pronto</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Messages Tab (web) ───────────────────────────────────────────────────────
const GRADS_MSG = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
];
const gradForMsg  = (name = '') => GRADS_MSG[(name.charCodeAt(0) || 0) % GRADS_MSG.length];
const initialsMsg = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const timeAgoMsg  = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000)    return 'ahora';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
};
const fmtTimeMsg = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const MessagesTab = () => {
  const { t, isDark } = useContext(ThemeCtx);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey:        ['admin-messages'],
    queryFn:         messageService.getAll,
    refetchInterval: 6000,
    staleTime:       0,
  });
  const messages = data?.messages || [];

  // Sync selected con datos actualizados
  useEffect(() => {
    if (selected) {
      const updated = messages.find(m => m._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [messages]); // eslint-disable-line

  // Marcar como leído al abrir
  useEffect(() => {
    if (selected && !selected.adminRead) {
      messageService.markAdminRead(selected._id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-msg-count'] });
    }
  }, [selected?._id]); // eslint-disable-line

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.replies?.length]);

  const replyMut = useMutation({
    mutationFn: (body) => messageService.reply(selected._id, body),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al enviar'),
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !selected) return;
    replyMut.mutate(trimmed);
  };

  const allMsgs = selected ? [
    { body: selected.body, isAdmin: false, createdAt: selected.createdAt },
    ...(selected.replies || []).map(r => ({ body: r.body, isAdmin: r.isAdmin, createdAt: r.createdAt })),
  ] : [];

  return (
    <div className="flex rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 164px)', border: t.cardBorder, boxShadow: t.cardShadow }}>

      {/* ── Lista de conversaciones ── */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: t.cardBg, borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}` }}>
          <p className="font-extrabold text-sm" style={{ color: t.text1 }}>Conversaciones</p>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            {messages.filter(m => !m.adminRead).length > 0
              ? `${messages.filter(m => !m.adminRead).length} sin leer`
              : `${messages.length} total`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && [1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full flex-shrink-0 animate-pulse" style={{ background: t.skeletonBg }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-lg animate-pulse" style={{ background: t.skeletonBg }} />
                <div className="h-2.5 rounded-lg animate-pulse w-2/3" style={{ background: t.skeletonBg }} />
              </div>
            </div>
          ))}

          {!isLoading && messages.map(msg => {
            const citizen   = msg.from;
            const avatarUrl = typeof citizen?.avatar === 'string' ? citizen.avatar : citizen?.avatar?.url;
            const lastReply = msg.replies?.[msg.replies.length - 1];
            const lastMsg   = lastReply || { body: msg.body, createdAt: msg.createdAt };
            const isSelected = selected?._id === msg._id;
            const hasUnread  = !msg.adminRead;
            return (
              <button key={msg._id} onClick={() => setSelected(msg)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                style={{
                  background: isSelected
                    ? (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff')
                    : hasUnread
                      ? (isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)')
                      : 'transparent',
                  borderLeft: `3px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
                }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                  : <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: gradForMsg(citizen?.name) }}>
                      {initialsMsg(citizen?.name)}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-[13px] truncate ${hasUnread ? 'font-extrabold' : 'font-semibold'}`} style={{ color: t.text1 }}>
                      {citizen?.name}
                    </p>
                    <span className="text-[10px] flex-shrink-0" style={{ color: t.text3 }}>{timeAgoMsg(lastMsg.createdAt)}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: t.text3 }}>{msg.subject}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'font-semibold' : ''}`}
                    style={{ color: hasUnread ? '#818cf8' : t.text3 }}>
                    {lastReply?.isAdmin ? '🛡️ Tú: ' : ''}{lastMsg.body}
                  </p>
                </div>
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-indigo-400"
                    style={{ boxShadow: '0 0 6px rgba(129,140,248,0.7)' }} />
                )}
              </button>
            );
          })}

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
              <div className="text-4xl">💬</div>
              <p className="text-sm font-semibold" style={{ color: t.emptyText }}>Sin mensajes aún</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel de chat ── */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0" style={{ background: isDark ? '#0d1117' : '#f8fafc' }}>

          {/* Cabecera chat */}
          <div className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0"
            style={{ background: t.cardBg, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
            {(() => {
              const citizen   = selected.from;
              const avatarUrl = typeof citizen?.avatar === 'string' ? citizen.avatar : citizen?.avatar?.url;
              return (
                <>
                  {avatarUrl
                    ? <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                    : <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: gradForMsg(citizen?.name) }}>
                        {initialsMsg(citizen?.name)}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold" style={{ color: t.text1 }}>{citizen?.name}</p>
                    <p className="text-xs truncate" style={{ color: t.text3 }}>{selected.subject}</p>
                  </div>
                  {citizen?.city && (
                    <span className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: t.tagBg, color: t.tagText }}>
                      {citizen.city}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* Burbujitas */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3"
            style={{
              backgroundImage: isDark ? 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)' : 'none',
              backgroundSize: '24px 24px',
            }}>
            {allMsgs.map((m, i) => {
              const citizen   = selected.from;
              const avatarUrl = typeof citizen?.avatar === 'string' ? citizen.avatar : citizen?.avatar?.url;
              return (
                <div key={i} className={`flex items-end gap-2.5 ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  {!m.isAdmin && (
                    avatarUrl
                      ? <img src={avatarUrl} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1" alt="" />
                      : <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold mb-1"
                          style={{ background: gradForMsg(citizen?.name) }}>
                          {initialsMsg(citizen?.name)}
                        </div>
                  )}
                  <div className={`max-w-[60%] flex flex-col gap-1 ${m.isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className="px-4 py-2.5 text-sm leading-relaxed"
                      style={m.isAdmin
                        ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', borderRadius: '18px 18px 4px 18px', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }
                        : { background: isDark ? 'rgba(255,255,255,0.08)' : 'white', color: t.text1, borderRadius: '18px 18px 18px 4px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                      }
                    >
                      {m.body}
                    </div>
                    <span className="text-[10px] px-1" style={{ color: t.text3 }}>{fmtTimeMsg(m.createdAt)}</span>
                  </div>
                  {m.isAdmin && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mb-1"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input respuesta */}
          <div className="px-5 py-3.5 flex items-end gap-3 flex-shrink-0"
            style={{ background: t.cardBg, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Responder al ciudadano... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ maxHeight: 100, background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText }}
            />
            <button
              onClick={handleSend}
              disabled={replyMut.isPending || !text.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
            >
              {replyMut.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(90deg)' }}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
              }
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: isDark ? '#0d1117' : '#f8fafc' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' }}>
            <svg className="w-8 h-8" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-extrabold text-sm" style={{ color: t.text1 }}>Selecciona una conversación</p>
            <p className="text-xs mt-1" style={{ color: t.text3 }}>Elige un mensaje de la lista para ver y responder</p>
          </div>
        </div>
      )}
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
  const { isDark, toggleTheme } = useTheme();
  const t = getTheme(isDark);
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data: msgCountData } = useQuery({
    queryKey: ['admin-msg-count'],
    queryFn: messageService.getAdminUnreadCount,
    refetchInterval: 15000,
  });
  const unreadMsgs = msgCountData?.count || 0;

  const [showNotifs, setShowNotifs] = useState(false);
  const notifDropRef = useRef(null);

  const { data: notifCountData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
  });
  const notifUnread = notifCountData?.count || 0;

  const { data: notifsData, refetch: refetchNotifs } = useQuery({
    queryKey: ['admin-notifs'],
    queryFn: notificationService.getAll,
    enabled: showNotifs,
    staleTime: 0,
  });
  const notifs = notifsData?.notifications || [];

  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (notifDropRef.current && !notifDropRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const handleNotifClick = async (notif) => {
    await notificationService.markAsRead(notif._id).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    queryClient.invalidateQueries({ queryKey: ['admin-notifs'] });
    if (notif.report) { setDetailReportId(notif.report?._id || notif.report); }
    else if (notif.type === 'new_message') { setActiveTab('messages'); }
    setShowNotifs(false);
  };

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

  const handleDelete = (reportId) => {
    confirm({
      title: 'Eliminar reporte',
      message: '¿Estás seguro? Esta acción es permanente y no se puede deshacer.',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await reportService.delete(reportId);
          toast.success('Reporte eliminado');
          setDetailReportId(null);
          queryClient.invalidateQueries({ queryKey: ['admin-reports-table'] });
          queryClient.invalidateQueries({ queryKey: ['admin-reports-recent'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        } catch { toast.error('Error al eliminar'); }
      },
    });
  };

  const NAV = [
    { id: 'overview',   label: 'Resumen',    icon: Icons.dashboard },
    { id: 'reports',    label: 'Reportes',   icon: Icons.reports },
    { id: 'users',      label: 'Usuarios',   icon: Icons.users },
    { id: 'petitions',  label: 'Peticiones', icon: Icons.petition },
    { id: 'messages',   label: 'Mensajes',   icon: Icons.messages, badge: unreadMsgs },
    { id: 'map',        label: 'Mapa',       icon: Icons.map },
    { id: 'activity',   label: 'Actividad',  icon: Icons.activity },
  ];

  return (
    <ThemeCtx.Provider value={{ t, isDark }}>
    <ConfirmModal {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} t={t} isDark={isDark} />
    <div className="min-h-screen flex" style={{ background: t.pageBg }}>

      {/* Sidebar — solo escritorio */}
      <aside className="w-60 flex-col flex-shrink-0 fixed h-full z-30 hidden lg:flex"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)' }}>
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
          {NAV.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id}
                onClick={() => { item.href ? navigate(item.href) : setActiveTab(item.id); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive ? {
                  background: 'rgba(59,130,246,0.25)',
                  color: 'white',
                  boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.4)',
                } : {
                  color: 'rgba(148,163,184,1)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: isActive ? '#93c5fd' : 'rgba(148,163,184,0.8)' }}>{item.icon}</span>
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 6px rgba(239,68,68,0.5)', minWidth: '18px', textAlign: 'center' }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {!item.badge && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })}
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
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{ background: t.topbarBg, borderBottom: `1px solid ${t.topbarBorder}`, backdropFilter: 'blur(16px)', boxShadow: isDark ? '0 1px 24px rgba(0,0,0,0.4)' : '0 1px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-extrabold" style={{ color: t.topbarText }}>{NAV.find(n => n.id === activeTab)?.label || 'Admin'}</h1>
              <p className="text-xs mt-0.5 capitalize hidden sm:block" style={{ color: t.topbarSub }}>
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Campana de notificaciones */}
            <div className="relative" ref={notifDropRef}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative transition-all"
                style={{ background: t.toggleBg, border: `1px solid ${t.toggleBorder}`, color: t.text2 }}
              >
                {Icons.bell}
                {notifUnread > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-extrabold px-1 min-w-[16px] h-4 rounded-full text-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 6px rgba(239,68,68,0.5)' }}>
                    {notifUnread > 99 ? '99+' : notifUnread}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-11 w-80 rounded-2xl z-50 overflow-hidden"
                  style={{ background: isDark ? '#1a2235' : 'white', border: t.cardBorder, boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
                  <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                    style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}` }}>
                    <p className="font-extrabold text-sm" style={{ color: t.text1 }}>Notificaciones</p>
                    {notifUnread > 0 && (
                      <button
                        onClick={async () => {
                          await notificationService.markAllAsRead().catch(() => {});
                          queryClient.invalidateQueries({ queryKey: ['notif-count'] });
                          queryClient.invalidateQueries({ queryKey: ['admin-notifs'] });
                        }}
                        className="text-xs font-semibold transition-colors"
                        style={{ color: '#3b82f6' }}
                      >
                        Marcar todo leído
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifs.length === 0 && (
                      <div className="py-10 text-center">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="text-sm font-semibold" style={{ color: t.emptyText }}>Sin notificaciones</p>
                      </div>
                    )}
                    {notifs.slice(0, 15).map((n, idx) => (
                      <button key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                        style={{
                          background: !n.read ? (isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff') : 'transparent',
                          borderBottom: idx < Math.min(notifs.length, 15) - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}` : 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = !n.read ? (isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff') : 'transparent'}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base mt-0.5"
                          style={{ background: t.tagBg }}>
                          {n.type === 'new_report' ? '📋' : n.type === 'new_message' ? '💬' : n.type === 'status_change' ? '🔄' : n.type === 'new_comment' ? '💭' : '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!n.read ? 'font-semibold' : ''}`} style={{ color: t.text1 }}>{n.message}</p>
                          <p className="text-[10px] mt-1" style={{ color: t.text3 }}>
                            {new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón modo oscuro/claro */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: t.toggleBg,
                border: `1px solid ${t.toggleBorder}`,
                color: isDark ? '#fbbf24' : '#6366f1',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = t.toggleBg}
            >
              {isDark ? Icons.sun : Icons.moon}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold" style={{ color: t.topbarText }}>{user?.name}</p>
              <p className="text-xs font-semibold text-blue-400">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-extrabold text-sm uppercase flex-shrink-0"
              style={{ background: user?.avatar?.url ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', boxShadow: '0 2px 12px rgba(37,99,235,0.5)' }}>
              {user?.avatar?.url
                ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                : (user?.name?.charAt(0) || 'A')
              }
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-4 lg:py-6 flex-1 pb-20 lg:pb-6">
          {activeTab === 'overview'   && <OverviewTab onViewReport={setDetailReportId} />}
          {activeTab === 'reports'    && <ReportsTab  onViewReport={setDetailReportId} adminUser={user} stats={statsData?.stats} />}
          {activeTab === 'users'      && <UsersTab />}
          {activeTab === 'petitions'  && <PetitionsTab />}
          {activeTab === 'messages'   && <MessagesTab />}
          {activeTab === 'map'        && <MapTab onViewReport={setDetailReportId} />}
          {activeTab === 'activity'   && <ActivityTab />}
        </div>
      </main>

      {/* Bottom nav — solo móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden flex"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-all"
              style={{ color: isActive ? 'white' : 'rgba(148,163,184,0.6)', minWidth: 0 }}>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  style={{ background: 'linear-gradient(90deg,#60a5fa,#3b82f6)' }} />
              )}
              <span className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}
                style={{ color: isActive ? '#60a5fa' : 'rgba(148,163,184,0.6)' }}>
                {item.icon}
              </span>
              <span className="text-[9px] font-semibold leading-none truncate w-full text-center px-0.5"
                style={{ color: isActive ? 'white' : 'rgba(148,163,184,0.55)' }}>
                {item.label}
              </span>
              {item.badge > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-18px)] text-[8px] font-extrabold px-1 min-w-[14px] h-3.5 rounded-full text-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 1px 4px rgba(239,68,68,0.6)' }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

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
    </ThemeCtx.Provider>
  );
};

export default AdminDashboardPage;
