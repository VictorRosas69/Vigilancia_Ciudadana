import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { HiArrowLeft, HiLocationMarker, HiHeart, HiChatAlt, HiEye, HiTrash, HiPaperAirplane, HiShare, HiDotsVertical, HiPencil, HiClipboardList, HiShieldCheck, HiX } from 'react-icons/hi';
import reportService from '../services/reportService';
import commentService from '../services/commentService';
import useAuthStore from '../store/authStore';
import useSwipeBack from '../hooks/useSwipeBack';
import haptic from '../utils/haptic';

const STATUS_CONFIG = {
  pending:    { dot: 'bg-orange-400', label: 'Pendiente' },
  verified:   { dot: 'bg-blue-500',   label: 'Verificado' },
  inProgress: { dot: 'bg-blue-500',   label: 'En progreso' },
  resolved:   { dot: 'bg-green-500',  label: 'Resuelto' },
  rejected:   { dot: 'bg-red-500',    label: 'Rechazado' },
};

const PRIORITY_CONFIG = {
  low:      { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700',   label: 'Baja' },
  medium:   { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700', label: 'Media' },
  high:     { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700', label: 'Alta' },
  critical: { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-600',       label: 'Crítica' },
};

const WORK_TYPE_LABELS = {
  road:     '🛣️ Vía / Carretera', sidewalk: '🚶 Andén / Acera',
  park:     '🌳 Parque',           building: '🏢 Edificio',
  drainage: '💧 Drenaje',          lighting: '💡 Alumbrado',
  bridge:   '🌉 Puente',           water:    '🚰 Acueducto',
  other:    '🔧 Otro',
};

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-purple-600', 'bg-green-600',
  'bg-orange-500', 'bg-pink-600', 'bg-teal-600',
];

const getAvatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const Avatar = ({ name = '', src = '', size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : name[0]?.toUpperCase() || '?'}
    </div>
  );
};

const MapSection = ({ coordinates }) => {
  const [MapComponents, setMapComponents] = useState(null);
  const lat = coordinates[1];
  const lng = coordinates[0];
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  useEffect(() => {
    const load = async () => {
      const L = await import('leaflet');
      const { MapContainer, TileLayer, Marker } = await import('react-leaflet');
      delete L.default.Icon.Default.prototype._getIconUrl;

      const icon = L.default.divIcon({
        html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
          <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="#2563EB"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>`,
        className: '',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      setMapComponents({ MapContainer, TileLayer, Marker, icon });
    };
    load();
  }, []);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <span>📍</span> Ubicación en el mapa
        </h2>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 text-sm font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Google Maps
        </a>
      </div>
      <div className="h-44 rounded-2xl overflow-hidden border border-gray-100">
        {!MapComponents ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <MapComponents.MapContainer
            center={[lat, lng]} zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false} dragging={false} scrollWheelZoom={false}
          >
            <MapComponents.TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            <MapComponents.Marker position={[lat, lng]} icon={MapComponents.icon} />
          </MapComponents.MapContainer>
        )}
      </div>
    </div>
  );
};

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  useSwipeBack();
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heartBursts, setHeartBursts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);
  const touchStartXRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportService.getById(id),
  });

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentService.getByReport(id),
  });

  const report = data?.report;
  const comments = commentsData?.comments || [];

  useEffect(() => {
    if (report && !initialized) {
      setLiked(report.likes?.includes(user?.id));
      setLikesCount(report.likesCount || 0);
      setInitialized(true);
    }
  }, [report]);

  useEffect(() => {
    if (!id || !token) return;
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    const es = new EventSource(`${base}/reports/${id}/events?token=${token}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'status_change') {
          queryClient.invalidateQueries({ queryKey: ['report', id] });
          const STATUS_LABELS = {
            pending: 'Pendiente', verified: 'Verificado', inProgress: 'En progreso',
            resolved: 'Resuelto ✅', rejected: 'Rechazado', closed: 'Cerrado',
          };
          toast(`Estado actualizado: ${STATUS_LABELS[data.status] || data.status}`, {
            icon: '🔄',
            style: { background: '#1e3a8a', color: 'white', fontWeight: 600 },
          });
        }
      } catch {}
    };

    return () => es.close();
  }, [id, token, queryClient]);

  const handleLike = async () => {
    if (!token) return toast.error('Inicia sesión para reaccionar');
    try {
      if (navigator.vibrate) navigator.vibrate(!liked ? [10, 30, 60] : 8);
      await reportService.toggleLike(id);
      if (!liked) {
        // Lanzar rafaga de corazones
        const burst = Array.from({ length: 6 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 60 - 30,
          delay: i * 0.06,
        }));
        setHeartBursts(prev => [...prev, ...burst]);
        setTimeout(() => setHeartBursts(prev => prev.filter(h => !burst.find(b => b.id === h.id))), 1200);
      }
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch (err) {
      toast.error('Error al procesar');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!token) return toast.error('Inicia sesión para comentar');
    try {
      if (navigator.vibrate) navigator.vibrate(12);
      await commentService.create({ reportId: id, content: comment });
      setComment('');
      refetchComments();
      toast.success('Comentario publicado');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al comentar';
      toast.error(msg);
    }
  };

  const handleDeleteReport = async () => {
    try {
      await reportService.delete(id);
      toast.success('Reporte eliminado');
      navigate('/');
    } catch {
      toast.error('Error al eliminar el reporte');
    }
  };

  const handleDeleteComment = (commentId) => {
    setConfirmDeleteComment(commentId);
  };

  const handleConfirmDeleteComment = async () => {
    try {
      await commentService.delete(confirmDeleteComment);
      refetchComments();
      toast.success('Comentario eliminado');
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setConfirmDeleteComment(null);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen pb-48" style={{ background: 'var(--page-bg)' }}>
      {/* Hero skeleton */}
      <div className="h-72 bg-gray-200 animate-pulse relative">
        <div className="absolute top-12 left-4 w-10 h-10 bg-white/30 rounded-2xl" />
        <div className="absolute top-12 right-4 w-10 h-10 bg-white/30 rounded-2xl" />
      </div>
      <div className="px-4 py-5 flex flex-col gap-4">
        {/* Info card skeleton */}
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex justify-between mb-4">
            <div className="h-6 w-24 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-7 w-3/4 bg-gray-100 rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-1/2 bg-gray-100 rounded-xl animate-pulse mb-4" />
          <div className="h-4 w-full bg-gray-50 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-5/6 bg-gray-50 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-4/6 bg-gray-50 rounded-xl animate-pulse mb-4" />
          <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div>
              <div className="h-4 w-28 bg-gray-100 rounded-xl animate-pulse mb-1" />
              <div className="h-3 w-20 bg-gray-50 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        {/* Location skeleton */}
        <div className="bg-white rounded-3xl px-5 py-4 flex gap-3 items-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="w-10 h-10 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0" />
          <div className="h-4 w-2/3 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        {/* Timeline skeleton */}
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="h-4 w-32 bg-gray-100 rounded-xl animate-pulse mb-4" />
          {[0,1,2].map(i => (
            <div key={i} className="flex gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-100 rounded-xl animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-50 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
          🔍
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">Reporte no encontrado</h2>
        <p className="text-sm text-gray-400">Es posible que haya sido eliminado o no exista.</p>
      </div>
    </div>
  );

  const authorId = typeof report.author === 'object' ? report.author?._id : report.author;
  const isOwner = !!(user && authorId && (
    String(user.id) === String(authorId) ||
    String(user._id) === String(authorId) ||
    user.role === 'admin'
  ));

  const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });
  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[report.priority];
  const hasCoords = report.location?.coordinates &&
    report.location.coordinates[0] !== 0 &&
    report.location.coordinates[1] !== 0;

  const statusBadgeClass =
    status.dot === 'bg-orange-400' ? 'bg-orange-50 text-orange-600' :
    status.dot === 'bg-violet-500' ? 'bg-violet-50 text-violet-600' :
    status.dot === 'bg-blue-500'   ? 'bg-blue-50 text-blue-600' :
    status.dot === 'bg-green-500'  ? 'bg-green-50 text-green-600' :
                                     'bg-red-50 text-red-600';

  const isResolved = report.status === 'resolved';
  const isRejected = report.status === 'rejected';
  const isReadonly = isResolved || isRejected;

  return (
    <div className="min-h-screen pb-48" style={{ background: 'var(--page-bg)' }}>
      {/* Banner readonly */}
      {isReadonly && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-30 flex justify-center pointer-events-none"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
        >
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg"
            style={{ background: isResolved ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: isResolved ? '0 4px 20px rgba(5,150,105,0.4)' : '0 4px 20px rgba(220,38,38,0.4)' }}>
            <span>{isResolved ? '✅' : '❌'}</span>
            {isResolved ? 'Reporte resuelto — solo lectura' : 'Reporte rechazado — solo lectura'}
          </div>
        </motion.div>
      )}

      {/* ── Hero image ── */}
      <div className="relative">
        {report.images?.length > 0 ? (
          <div
            className="h-72 bg-gray-200 overflow-hidden cursor-pointer"
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const diff = touchStartXRef.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && activeImage < report.images.length - 1) setActiveImage(i => i + 1);
                else if (diff < 0 && activeImage > 0) setActiveImage(i => i - 1);
                if (navigator.vibrate) navigator.vibrate(8);
              }
              touchStartXRef.current = null;
            }}
            onClick={() => setFullscreenIndex(activeImage)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={report.images[activeImage]?.url}
                alt={report.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />
            {/* Tap to expand hint */}
            <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
              <span className="text-white text-[10px] font-semibold">Ver</span>
            </div>
            {/* Swipe indicator dots */}
            {report.images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                {report.images.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all duration-200 ${i === activeImage ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-52 relative overflow-hidden" style={{
            background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
          }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
              <div className="absolute bottom-8 left-1/3 w-28 h-28 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {report.workType === 'road' ? '🛣️' : report.workType === 'park' ? '🌳' : report.workType === 'lighting' ? '💡' : '🏗️'}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-6 rounded-t-[24px]" style={{ background: 'var(--page-bg)' }} />
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 bg-black/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
        >
          <HiArrowLeft className="text-white text-xl" />
        </button>

        <button
          onClick={async () => {
            if (navigator.vibrate) navigator.vibrate(12);
            try {
              const { default: jsPDF } = await import('jspdf');
              const doc = new jsPDF();
              doc.setFontSize(18);
              doc.setFont('helvetica', 'bold');
              doc.text(report.title, 20, 25);
              doc.setFontSize(11);
              doc.setFont('helvetica', 'normal');
              const statusLabel = { pending:'Pendiente', verified:'Verificado', inProgress:'En progreso', resolved:'Resuelto', rejected:'Rechazado' };
              const priorityLabel = { low:'Baja', medium:'Media', high:'Alta', critical:'Crítica' };
              doc.text(`Estado: ${statusLabel[report.status] || report.status}`, 20, 38);
              doc.text(`Prioridad: ${priorityLabel[report.priority] || report.priority}`, 20, 48);
              const dateStr = new Date(report.createdAt).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });
              doc.text(`Fecha: ${dateStr}`, 20, 58);
              if (report.location?.city) {
                const loc = [report.location.address, report.location.neighborhood, report.location.city].filter(Boolean).join(', ');
                const locLines = doc.splitTextToSize(`Ubicación: ${loc}`, 170);
                doc.text(locLines, 20, 68);
              }
              doc.setFontSize(10);
              const descLines = doc.splitTextToSize(report.description, 170);
              doc.text(descLines, 20, 85);
              doc.setFontSize(8);
              doc.setTextColor(150);
              doc.text('Generado por Vigilancia Ciudadana', 20, 285);
              doc.save(`reporte-${id}.pdf`);
            } catch { toast.error('Error al generar PDF'); }
          }}
          className="absolute top-12 right-28 w-10 h-10 bg-black/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
          title="Exportar PDF"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
        </button>

        <button
          onClick={async () => {
            const url = window.location.href;
            const shareData = {
              title: report.title,
              text: `Mira este reporte en Vigilancia Ciudadana: ${report.title}`,
              url,
            };
            if (navigator.share && navigator.canShare?.(shareData)) {
              try { await navigator.share(shareData); } catch { /* usuario canceló */ }
            } else {
              navigator.clipboard.writeText(url);
              toast.success('Enlace copiado al portapapeles');
            }
          }}
          className="absolute top-12 right-16 w-10 h-10 bg-black/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
        >
          <HiShare className="text-white text-xl" />
        </button>

        {isOwner && (
          <button
            onClick={() => setMenuOpen(true)}
            className="absolute top-12 right-4 w-10 h-10 bg-black/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
          >
            <HiDotsVertical className="text-white text-xl" />
          </button>
        )}

        <AnimatePresence>
          {menuOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end" onClick={() => setMenuOpen(false)}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="relative rounded-t-3xl px-5 pt-4 max-w-lg mx-auto w-full"
                style={{
                  background: 'var(--card-bg)',
                  paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--text-3)' }} />

                <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-4" style={{ color: 'var(--text-3)' }}>
                  Opciones del reporte
                </p>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { haptic.tap(); setMenuOpen(false); navigate(`/reports/${id}/edit`); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl mb-2.5 transition-colors"
                  style={{ background: 'var(--input-bg)', border: '1.5px solid var(--border)' }}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                    <HiPencil className="text-white text-lg" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Editar reporte</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Modifica título, descripción o ubicación</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-3)' }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { haptic.error(); setMenuOpen(false); setConfirmDelete(true); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                    <HiTrash className="text-white text-lg" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-red-500">Eliminar reporte</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Esta acción no se puede deshacer</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center px-6"
              onClick={() => setConfirmDelete(false)}
            >
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="rounded-3xl p-7 w-full max-w-sm"
                style={{ background: 'var(--card-bg)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
                  <HiTrash className="text-white text-3xl" />
                </div>

                <h3 className="text-xl font-extrabold text-center mb-2" style={{ color: 'var(--text-1)' }}>
                  ¿Eliminar reporte?
                </h3>
                <p className="text-sm text-center mb-7" style={{ color: 'var(--text-2)' }}>
                  Esta acción es permanente y no se puede deshacer.
                </p>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-1)', border: '1.5px solid var(--border)' }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptic.error(); handleDeleteReport(); }}
                    className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 6px 20px rgba(239,68,68,0.4)' }}
                  >
                    Sí, eliminar
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {report.images?.length > 1 && (
        <div className="flex gap-2 px-5 py-3 bg-white border-b border-gray-100 overflow-x-auto">
          {report.images.map((img, i) => (
            <button key={i} onClick={() => setActiveImage(i)} className="flex-shrink-0">
              <img
                src={img.url}
                alt=""
                className={`w-14 h-14 object-cover rounded-xl border-2 transition-all ${
                  activeImage === i ? 'border-blue-500 scale-105' : 'border-transparent opacity-70'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-5 flex flex-col gap-4">
        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-3 py-1.5 rounded-xl">
              {WORK_TYPE_LABELS[report.workType] || '🔧 Otro'}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusBadgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-gray-900 leading-snug mb-3">
            {report.title}
          </h1>

          {priority && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${priority.badge}`}>
              <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
              Prioridad {priority.label}
            </span>
          )}

          {report.description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-4 pt-3 border-t border-gray-50">
              {report.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <button
              onClick={() => { const aid = report.author?._id; if (aid) navigate(`/users/${aid}`); }}
              className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
            >
              <Avatar name={report.author?.name} src={report.author?.avatar?.url} />
              <div>
                <p className="text-sm font-bold text-gray-900">{report.author?.name}</p>
                <p className="text-xs text-gray-400">{timeAgo}</p>
              </div>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={isReadonly ? undefined : handleLike}
                disabled={isReadonly}
                title={isReadonly ? 'Este reporte ya no acepta reacciones' : ''}
                className={`relative flex items-center gap-1 text-sm font-semibold transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}
              >
                <AnimatePresence>
                  {heartBursts.map(h => (
                    <motion.span
                      key={h.id}
                      className="absolute bottom-4 left-1/2 pointer-events-none text-red-500 text-lg"
                      initial={{ opacity: 1, y: 0, x: h.x, scale: 0.6 }}
                      animate={{ opacity: 0, y: -40, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, delay: h.delay, ease: 'easeOut' }}
                    >
                      ❤️
                    </motion.span>
                  ))}
                </AnimatePresence>
                <motion.div
                  animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <HiHeart className={`text-base ${liked ? 'fill-current' : ''}`} />
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={likesCount}
                    initial={{ y: liked ? -12 : 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: liked ? 12 : -12, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="inline-block min-w-[1.5ch] text-center"
                  >
                    {likesCount}
                  </motion.span>
                </AnimatePresence>
              </button>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <HiChatAlt className="text-base" />
                <span className="font-medium">{comments.length}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <HiEye className="text-base" />
                <span className="font-medium">{report.viewsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <HiLocationMarker className="text-blue-500 text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {report.location?.address ||
                [report.location?.neighborhood, report.location?.city].filter(Boolean).join(', ') ||
                report.author?.city ||
                'Sin dirección específica'}
            </p>
            {report.location?.address && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[report.location?.neighborhood, report.location?.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {hasCoords && (
          <div className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
            <MapSection coordinates={report.location.coordinates} />
          </div>
        )}

        {(() => {
          const history = report.statusHistory?.length > 0
            ? report.statusHistory
            : [
                { status: 'pending', changedAt: report.createdAt, changedBy: report.author },
                ...(report.verifiedAt ? [{ status: 'verified', changedAt: report.verifiedAt, changedBy: report.verifiedBy }] : []),
                ...(report.status !== 'pending' && report.status !== 'verified' && !report.statusHistory?.length
                  ? [{ status: report.status, changedAt: report.updatedAt, changedBy: null }]
                  : []),
              ];

          const STATUS_TIMELINE = {
            pending:    { label: 'Reportado',   icon: '📋', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
            verified:   { label: 'Verificado',  icon: '✅', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)'  },
            inProgress: { label: 'En progreso', icon: '🔧', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.3)'  },
            resolved:   { label: 'Resuelto',    icon: '🎉', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)'  },
            rejected:   { label: 'Rechazado',   icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
            closed:     { label: 'Cerrado',     icon: '🔒', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' },
          };

          return (
            <div className="bg-white rounded-3xl p-5"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <h2 className="font-extrabold text-gray-900 text-sm mb-5 flex items-center gap-2">
                <HiClipboardList className="text-blue-500 text-base" />
                Historial de cambios
                <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              </h2>

              <div className="relative">
                {history.length > 1 && (
                  <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gray-100" />
                )}

                <div className="flex flex-col gap-4">
                  {history.map((entry, i) => {
                    const cfg = STATUS_TIMELINE[entry.status] || STATUS_TIMELINE.pending;
                    const isLast = i === history.length - 1;
                    const dateStr = entry.changedAt
                      ? format(new Date(entry.changedAt), "d 'de' MMMM · HH:mm", { locale: es })
                      : '—';
                    const byName = entry.changedBy?.name;
                    const isAdmin = entry.changedBy?.role === 'admin';

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-3 relative"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 relative z-10"
                          style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}
                        >
                          {cfg.icon}
                        </div>

                        <div className={`flex-1 pb-1 ${!isLast ? 'pb-2' : ''}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold" style={{ color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {isLast && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ background: cfg.color }}>
                                Actual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                          {byName && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              {isAdmin && <HiShieldCheck className="text-blue-400 text-xs" />}
                              {isAdmin ? 'Admin' : byName}
                            </p>
                          )}
                          {entry.status === 'rejected' && report.rejectionReason && i === history.length - 1 && (
                            <p className="text-xs text-red-400 mt-1 bg-red-50 rounded-xl px-3 py-1.5 font-medium">
                              {report.rejectionReason}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <HiChatAlt className="text-blue-500 text-base" />
            Comentarios
            <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </h2>

          <div className="flex flex-col gap-4">
            {comments.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Sé el primero en comentar</p>
              </div>
            )}
            {comments.map((c) => {
              const isOwn = user?.id === c.author?._id || user?._id === c.author?._id;
              const commentTime = formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es });
              return (
                <div key={c._id} className="flex gap-3">
                  <Avatar name={c.author?.name} src={c.author?.avatar?.url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{c.author?.name}</span>
                      {isOwn && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">Tú</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{commentTime}</span>
                      {(isOwn || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <HiTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-2xl px-3 py-2">
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {fullscreenIndex !== null && report.images?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
            onClick={() => setFullscreenIndex(null)}
          >
            <button
              className="absolute top-12 right-4 w-10 h-10 rounded-2xl flex items-center justify-center z-10"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
              onClick={() => setFullscreenIndex(null)}
            >
              <HiX className="text-white text-xl" />
            </button>

            {report.images.length > 1 && (
              <div className="absolute top-14 left-0 right-0 text-center text-white/60 text-sm font-semibold pointer-events-none">
                {fullscreenIndex + 1} / {report.images.length}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={fullscreenIndex}
                src={report.images[fullscreenIndex]?.url}
                alt=""
                className="max-w-full max-h-full object-contain select-none"
                style={{ maxHeight: '85dvh' }}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchStartXRef.current === null) return;
                  const diff = touchStartXRef.current - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) setFullscreenIndex(i => Math.min(i + 1, report.images.length - 1));
                    else setFullscreenIndex(i => Math.max(i - 1, 0));
                    if (navigator.vibrate) navigator.vibrate(8);
                  }
                  touchStartXRef.current = null;
                }}
              />
            </AnimatePresence>

            {fullscreenIndex > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                onClick={(e) => { e.stopPropagation(); setFullscreenIndex(i => i - 1); }}
              >
                <HiArrowLeft className="text-white text-xl" />
              </button>
            )}
            {fullscreenIndex < report.images.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                onClick={(e) => { e.stopPropagation(); setFullscreenIndex(i => i + 1); }}
              >
                <HiArrowLeft className="text-white text-xl rotate-180" />
              </button>
            )}

            {report.images.length > 1 && (
              <div className="absolute bottom-10 flex gap-2 justify-center pointer-events-none">
                {report.images.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === fullscreenIndex ? '20px' : '6px',
                      background: i === fullscreenIndex ? 'white' : 'rgba(255,255,255,0.35)',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="fixed left-0 right-0 z-40 max-w-lg mx-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <div className="absolute inset-x-0 -top-6 bottom-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--page-bg) 60%, transparent 100%)' }} />

        <form onSubmit={handleComment} className="relative px-3 pb-3 pt-1">
          <div
            className="flex items-center gap-3 px-2 py-2 rounded-2xl"
            style={{
              background: 'var(--card-bg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex-shrink-0 p-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Avatar name={user?.name} src={user?.avatar?.url} size="sm" />
            </div>

            {/* Campo de texto */}
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3.5 py-2.5"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.85 }}
              disabled={!comment.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: comment.trim()
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : '#f1f5f9',
                boxShadow: comment.trim() ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                transform: comment.trim() ? 'scale(1)' : 'scale(0.95)',
              }}
            >
              <HiPaperAirplane
                className={`text-[17px] rotate-90 transition-colors ${comment.trim() ? 'text-white' : 'text-gray-300'}`}
              />
            </motion.button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {confirmDeleteComment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end justify-center">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="rounded-t-3xl p-6 w-full max-w-lg mx-auto"
              style={{ background: 'var(--card-bg)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--text-3)' }} />
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HiTrash className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-base font-extrabold text-center mb-1" style={{ color: 'var(--text-1)' }}>¿Borrar comentario?</h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--text-2)' }}>Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteComment(null)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteComment}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm"
                  style={{ boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }}
                >
                  Sí, borrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ReportDetailPage;
