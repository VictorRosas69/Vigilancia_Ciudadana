import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { HiArrowLeft, HiLocationMarker, HiHeart, HiChatAlt, HiEye, HiTrash, HiPaperAirplane, HiShare } from 'react-icons/hi';
import reportService from '../services/reportService';
import commentService from '../services/commentService';
import useAuthStore from '../store/authStore';

// ── Config ────────────────────────────────────────────────────────────────────

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

const Avatar = ({ name = '', size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
};

// ── Mapa en el detalle ────────────────────────────────────────────────────────

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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
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

// ── Página principal ──────────────────────────────────────────────────────────

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [initialized, setInitialized] = useState(false);

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

  const handleLike = async () => {
    if (!token) return toast.error('Inicia sesión para reaccionar');
    try {
      await reportService.toggleLike(id);
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
      await commentService.create({ reportId: id, content: comment });
      setComment('');
      refetchComments();
      toast.success('Comentario publicado');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al comentar';
      toast.error(msg);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.delete(commentId);
      refetchComments();
      toast.success('Comentario eliminado');
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">Reporte no encontrado</p>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50 pb-48">

      {/* ── Hero image ── */}
      <div className="relative">
        {report.images?.length > 0 ? (
          <div className="h-72 bg-gray-200 overflow-hidden">
            <img
              src={report.images[activeImage]?.url}
              alt={report.title}
              className="w-full h-full object-cover"
            />
            {/* Gradiente inferior para transición suave */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50/60 via-transparent to-black/20" />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-50 rounded-t-3xl" />
          </div>
        )}

        {/* Botón back */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 bg-black/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
        >
          <HiArrowLeft className="text-white text-xl" />
        </button>

        {/* Botón compartir */}
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
          className="absolute top-12 right-4 w-10 h-10 bg-black/25 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
        >
          <HiShare className="text-white text-xl" />
        </button>
      </div>

      {/* ── Thumbnails ── */}
      {report.images?.length > 1 && (
        <div className="flex gap-2 px-5 py-3 bg-white border-b border-gray-50 overflow-x-auto">
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

      {/* ── Contenido principal ── */}
      <div className="px-4 py-5 flex flex-col gap-4">

        {/* Tarjeta info principal */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/60">
          {/* Tipo + Estado */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-3 py-1.5 rounded-xl">
              {WORK_TYPE_LABELS[report.workType] || '🔧 Otro'}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusBadgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Título */}
          <h1 className="text-xl font-extrabold text-gray-900 leading-snug mb-3">
            {report.title}
          </h1>

          {/* Badge prioridad */}
          {priority && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${priority.badge}`}>
              <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
              Prioridad {priority.label}
            </span>
          )}

          {/* Descripción */}
          {report.description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-4 pt-3 border-t border-gray-50">
              {report.description}
            </p>
          )}

          {/* Autor + stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2.5">
              <Avatar name={report.author?.name} />
              <div>
                <p className="text-sm font-bold text-gray-900">{report.author?.name}</p>
                <p className="text-xs text-gray-400">{timeAgo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-sm font-semibold transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}
              >
                <HiHeart className={`text-base ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
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

        {/* Tarjeta ubicación */}
        <div className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100/60 flex items-center gap-3">
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

        {/* Mapa */}
        {hasCoords && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/60">
            <MapSection coordinates={report.location.coordinates} />
          </div>
        )}

        {/* Comentarios */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/60">
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
                  <Avatar name={c.author?.name} size="sm" />
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

      {/* ── Barra de comentarios fija — se posiciona SOBRE el BottomNav ── */}
      <div
        className="fixed left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-4 py-3 z-40 max-w-lg mx-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <form onSubmit={handleComment} className="flex items-center gap-2.5">
          <Avatar name={user?.name} size="sm" />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.88 }}
            disabled={!comment.trim()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center disabled:opacity-40 flex-shrink-0 transition-all"
            style={{
              background: comment.trim()
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : '#f1f5f9',
            }}
          >
            <HiPaperAirplane className={`text-lg rotate-90 ${comment.trim() ? 'text-white' : 'text-gray-400'}`} />
          </motion.button>
        </form>
      </div>

    </div>
  );
};

export default ReportDetailPage;
