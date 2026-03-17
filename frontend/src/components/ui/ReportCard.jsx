import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiLocationMarker, HiHeart, HiChatAlt, HiEye } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../../services/reportService';
import useAuthStore from '../../store/authStore';
import { useState } from 'react';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   dot: 'bg-orange-400', badge: 'bg-orange-50/90 text-orange-600',  border: 'border-l-orange-400' },
  verified:   { label: 'Verificado',  dot: 'bg-blue-500',   badge: 'bg-blue-50/90 text-blue-600',      border: 'border-l-blue-500' },
  inProgress: { label: 'En progreso', dot: 'bg-violet-500', badge: 'bg-violet-50/90 text-violet-600',  border: 'border-l-violet-500' },
  resolved:   { label: 'Resuelto',    dot: 'bg-green-500',  badge: 'bg-green-50/90 text-green-600',    border: 'border-l-green-500' },
  rejected:   { label: 'Rechazado',   dot: 'bg-red-500',    badge: 'bg-red-50/90 text-red-600',        border: 'border-l-red-400' },
};

const PRIORITY_CONFIG = {
  low:      { dot: 'bg-green-400',  label: 'Baja' },
  medium:   { dot: 'bg-yellow-400', label: 'Media' },
  high:     { dot: 'bg-orange-500', label: 'Alta' },
  critical: { dot: 'bg-red-500',    label: 'Crítica' },
};

const WORK_TYPE_LABELS = {
  road:      { icon: '🛣️', label: 'Vía' },
  sidewalk:  { icon: '🚶', label: 'Andén' },
  park:      { icon: '🌳', label: 'Parque' },
  building:  { icon: '🏢', label: 'Edificio' },
  drainage:  { icon: '💧', label: 'Drenaje' },
  lighting:  { icon: '💡', label: 'Alumbrado' },
  bridge:    { icon: '🌉', label: 'Puente' },
  water:     { icon: '🚰', label: 'Acueducto' },
  other:     { icon: '🔧', label: 'Otro' },
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
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [likesCount, setLikesCount] = useState(report.likesCount || 0);
  const [liked, setLiked] = useState(report.likes?.includes(user?.id));
  const [likeLoading, setLikeLoading] = useState(false);

  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[report.priority];
  const workType = WORK_TYPE_LABELS[report.workType] || WORK_TYPE_LABELS.other;
  const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });
  const authorName = report.author?.name || 'Usuario';
  const authorInitial = authorName[0].toUpperCase();
  const avatarGradient = getAvatarGradient(authorName);

  const locationText = report.location?.address ||
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
    } catch (error) {
      console.error('Error al dar like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate(`/reports/${report._id}`)}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100/80 border-l-4 ${status.border} overflow-hidden cursor-pointer active:shadow-none transition-shadow`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Imagen con overlay gradiente */}
      {report.images?.length > 0 && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={report.images[0].url}
            alt={report.title}
            className="w-full h-full object-cover"
          />
          {/* Gradiente de abajo para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Badge estado — arriba derecha */}
          <div className="absolute top-3 right-3">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full backdrop-blur-md ${status.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Badge categoría + prioridad — abajo izquierda */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
              {workType.icon} {workType.label}
            </span>
            {priority && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Sin imagen: badges en línea */}
        {!report.images?.length && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className="text-xs text-gray-400 font-medium">{workType.icon} {workType.label}</span>
            {priority && (
              <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            )}
          </div>
        )}

        {/* Título */}
        <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 mb-2.5">
          {report.title}
        </h3>

        {/* Ubicación */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
          <HiLocationMarker className="text-red-400 flex-shrink-0 text-sm" />
          <span className="truncate">{locationText}</span>
        </div>

        {/* Footer: autor + stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 bg-gradient-to-br ${avatarGradient} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {authorInitial}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-700">
                {authorName.split(' ')[0]}
              </span>
              <span className="text-gray-300 text-xs mx-1.5">·</span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <HiHeart className={`text-sm ${liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </button>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <HiChatAlt className="text-sm" />
              <span className="font-medium">{report.commentsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <HiEye className="text-sm" />
              <span className="font-medium">{report.viewsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportCard;
