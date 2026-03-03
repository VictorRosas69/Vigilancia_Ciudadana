import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiLocationMarker, HiClock, HiHeart, HiChatAlt, HiEye } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../../services/reportService';
import useAuthStore from '../../store/authStore';
import { useState } from 'react';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',    class: 'bg-yellow-100 text-yellow-700' },
  verified:   { label: 'Verificado',   class: 'bg-blue-100 text-blue-700' },
  inProgress: { label: 'En progreso',  class: 'bg-purple-100 text-purple-700' },
  resolved:   { label: 'Resuelto',     class: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rechazado',    class: 'bg-red-100 text-red-700' },
};

const WORK_TYPE_LABELS = {
  road:      '🛣️ Vía',
  sidewalk:  '🚶 Andén',
  park:      '🌳 Parque',
  building:  '🏢 Edificio',
  drainage:  '💧 Drenaje',
  lighting:  '💡 Alumbrado',
  bridge:    '🌉 Puente',
  water:     '🚰 Acueducto',
  other:     '🔧 Otro',
};

const ReportCard = ({ report, onRefetch }) => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [likesCount, setLikesCount] = useState(report.likesCount || 0);
  const [liked, setLiked] = useState(report.likes?.includes(user?.id));
  const [likeLoading, setLikeLoading] = useState(false);

  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const timeAgo = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
    locale: es,
  });

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
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/reports/${report._id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Imagen principal */}
      {report.images?.length > 0 && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={report.images[0].url}
            alt={report.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.class}`}>
              {status.label}
            </span>
          </div>
          {report.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              +{report.images.length - 1} fotos
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Sin imagen — badge de estado arriba */}
        {!report.images?.length && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.class} mb-2 inline-block`}>
            {status.label}
          </span>
        )}

        {/* Tipo de obra */}
        <span className="text-xs text-gray-500 font-medium">
          {WORK_TYPE_LABELS[report.workType] || '🔧 Otro'}
        </span>

        {/* Título */}
        <h3 className="font-bold text-gray-800 mt-1 mb-2 leading-tight line-clamp-2">
          {report.title}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {report.description}
        </p>

        {/* Ubicación */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <HiLocationMarker className="text-blue-400 flex-shrink-0" />
          <span className="truncate">
            {report.location?.address || report.location?.neighborhood || report.location?.city || 'Sin ubicación'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {/* Autor y tiempo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
              👤
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">
                {report.author?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-400">{timeAgo}</p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <HiHeart className={`text-base ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <HiChatAlt className="text-base" />
              <span>{report.commentsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <HiEye className="text-base" />
              <span>{report.viewsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportCard;