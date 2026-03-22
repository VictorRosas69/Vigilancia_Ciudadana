import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiLocationMarker, HiHeart, HiChatAlt, HiEye } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../../services/reportService';
import useAuthStore from '../../store/authStore';
import { useState } from 'react';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   dot: 'bg-orange-400', badge: 'bg-orange-500/90 text-white',   topBar: '#f97316' },
  verified:   { label: 'Verificado',  dot: 'bg-blue-500',   badge: 'bg-blue-600/90 text-white',     topBar: '#3b82f6' },
  inProgress: { label: 'En progreso', dot: 'bg-violet-500', badge: 'bg-violet-600/90 text-white',   topBar: '#8b5cf6' },
  resolved:   { label: 'Resuelto',    dot: 'bg-green-500',  badge: 'bg-green-600/90 text-white',    topBar: '#22c55e' },
  rejected:   { label: 'Rechazado',   dot: 'bg-red-500',    badge: 'bg-red-600/90 text-white',      topBar: '#ef4444' },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Baja',    dot: 'bg-green-400'  },
  medium:   { label: 'Media',   dot: 'bg-yellow-400' },
  high:     { label: 'Alta',    dot: 'bg-orange-500' },
  critical: { label: 'Crítica', dot: 'bg-red-500'    },
};

const WORK_TYPE_LABELS = {
  road:     { icon: '🛣️', label: 'Vía'       },
  sidewalk: { icon: '🚶', label: 'Andén'     },
  park:     { icon: '🌳', label: 'Parque'    },
  building: { icon: '🏢', label: 'Edificio'  },
  drainage: { icon: '💧', label: 'Drenaje'   },
  lighting: { icon: '💡', label: 'Alumbrado' },
  bridge:   { icon: '🌉', label: 'Puente'    },
  water:    { icon: '🚰', label: 'Acueducto' },
  other:    { icon: '🔧', label: 'Otro'      },
};

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-green-500 to-green-700',
  'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];
const getAvatarGradient = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const ReportCard = ({ report, onRefetch }) => {
  const navigate  = useNavigate();
  const { user, token } = useAuthStore();
  const [likesCount, setLikesCount] = useState(report.likesCount || 0);
  const [liked, setLiked]           = useState(report.likes?.includes(user?.id));
  const [likeLoading, setLikeLoading] = useState(false);

  const status   = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[report.priority];
  const workType = WORK_TYPE_LABELS[report.workType] || WORK_TYPE_LABELS.other;
  const timeAgo  = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });
  const authorName    = report.author?.name || 'Usuario';
  const authorInitial = authorName[0].toUpperCase();
  const avatarGradient = getAvatarGradient(authorName);

  const locationText =
    report.location?.address ||
    [report.location?.neighborhood, report.location?.city].filter(Boolean).join(', ') ||
    report.author?.city || 'Sin ubicación';

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!token || likeLoading) return;
    setLikeLoading(true);
    try {
      await reportService.toggleLike(report._id);
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch {}
    finally { setLikeLoading(false); }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.983 }}
      onClick={() => navigate(`/reports/${report._id}`)}
      className="bg-white rounded-3xl overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* ── Barra de color de estado (top) ── */}
      <div className="h-1 w-full" style={{ background: status.topBar }} />

      {/* ── Imagen ── */}
      {report.images?.length > 0 && (
        <div className="relative h-52 bg-gray-100">
          <img
            src={report.images[0].url}
            alt={report.title}
            className="w-full h-full object-cover"
          />
          {/* Gradiente oscuro para legibilidad de badges */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 35%, rgba(0,0,0,0.55) 100%)' }}
          />

          {/* Badge de estado — arriba derecha */}
          <div className="absolute top-3 right-3">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${status.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-white/80`} />
              {status.label}
            </span>
          </div>

          {/* Categoría + prioridad — abajo izquierda */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
              {workType.icon} {workType.label}
            </span>
            {priority && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)' }}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Contenido ── */}
      <div className="px-4 pt-3.5 pb-4">

        {/* Sin imagen: badges en fila */}
        {!report.images?.length && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full ${status.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              {status.label}
            </span>
            <span className="text-xs text-gray-400 font-medium">{workType.icon} {workType.label}</span>
            {priority && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            )}
          </div>
        )}

        {/* Título */}
        <h3 className="font-extrabold text-gray-900 text-[15px] leading-snug line-clamp-2 mb-2">
          {report.title}
        </h3>

        {/* Ubicación */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
          <HiLocationMarker className="text-red-400 flex-shrink-0 text-sm" />
          <span className="truncate">{locationText}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-gray-50">
          {/* Autor (clickable → perfil público) */}
          <button
            onClick={(e) => { e.stopPropagation(); if (report.author?._id) navigate(`/users/${report.author._id}`); }}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradient} rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm overflow-hidden`}>
              {report.author?.avatar?.url ? (
                <img src={report.author.avatar.url} alt="" className="w-full h-full object-cover" />
              ) : authorInitial}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 leading-tight">
                {authorName.split(' ')[0]}
              </p>
              <p className="text-[11px] text-gray-400 leading-tight">{timeAgo}</p>
            </div>
          </button>

          {/* Stats */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                liked ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              <HiHeart className={`text-sm ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
              <HiChatAlt className="text-sm" />
              <span>{report.commentsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
              <HiEye className="text-sm" />
              <span>{report.viewsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportCard;
