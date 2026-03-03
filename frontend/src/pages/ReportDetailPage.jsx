import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  HiArrowLeft, HiLocationMarker, HiClock, HiHeart,
  HiChatAlt, HiEye, HiTrash, HiPaperAirplane
} from 'react-icons/hi';
import reportService from '../services/reportService';
import commentService from '../services/commentService';
import useAuthStore from '../store/authStore';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   class: 'bg-yellow-100 text-yellow-700' },
  verified:   { label: 'Verificado',  class: 'bg-blue-100 text-blue-700' },
  inProgress: { label: 'En progreso', class: 'bg-purple-100 text-purple-700' },
  resolved:   { label: 'Resuelto',    class: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rechazado',   class: 'bg-red-100 text-red-700' },
};

const WORK_TYPE_LABELS = {
  road: '🛣️ Vía', sidewalk: '🚶 Andén', park: '🌳 Parque',
  building: '🏢 Edificio', drainage: '💧 Drenaje', lighting: '💡 Alumbrado',
  bridge: '🌉 Puente', water: '🚰 Acueducto', other: '🔧 Otro',
};

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportService.getById(id),
    onSuccess: (data) => {
      setLiked(data.report.likes?.includes(user?.id));
      setLikesCount(data.report.likesCount || 0);
    },
  });

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentService.getByReport(id),
  });

  const report = data?.report;
  const comments = commentsData?.comments || [];
  const status = STATUS_CONFIG[report?.status] || STATUS_CONFIG.pending;

  const handleLike = async () => {
    if (!token) return toast.error('Inicia sesión para dar me importa');
    try {
      await reportService.toggleLike(id);
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch (e) {
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
    } catch (e) {
      toast.error('Error al comentar');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.delete(commentId);
      refetchComments();
      toast.success('Comentario eliminado');
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Reporte no encontrado</p>
    </div>
  );

  const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <HiArrowLeft className="text-xl text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-800">Detalle del Reporte</h1>
        <div className="w-9" />
      </div>

      {/* Galería de imágenes */}
      {report.images?.length > 0 && (
        <div className="relative">
          <div className="h-64 bg-gray-200 overflow-hidden">
            <img
              src={report.images[activeImage]?.url}
              alt={report.title}
              className="w-full h-full object-cover"
            />
          </div>
          {report.images.length > 1 && (
            <div className="flex gap-2 px-4 py-2 bg-white overflow-x-auto">
              {report.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}>
                  <img
                    src={img.url}
                    alt=""
                    className={`w-14 h-14 object-cover rounded-lg border-2 transition-all ${
                      activeImage === i ? 'border-blue-500' : 'border-transparent'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Info principal */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{WORK_TYPE_LABELS[report.workType]}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.class}`}>
              {status.label}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h1>
          <p className="text-gray-600 text-sm leading-relaxed">{report.description}</p>

          {/* Ubicación */}
          <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-xl">
            <HiLocationMarker className="text-blue-500 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {report.location?.address || 'Sin dirección específica'}
              </p>
              <p className="text-xs text-gray-400">
                {[report.location?.neighborhood, report.location?.city]
                  .filter(Boolean).join(', ') || 'Sin ubicación'}
              </p>
            </div>
          </div>

          {/* Autor y tiempo */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                👤
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{report.author?.name}</p>
                <p className="text-xs text-gray-400">{timeAgo}</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-4">
              <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}>
                <HiHeart className={`text-xl ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{likesCount}</span>
              </button>
              <div className="flex items-center gap-1.5 text-gray-400">
                <HiChatAlt className="text-xl" />
                <span className="text-sm">{comments.length}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <HiEye className="text-xl" />
                <span className="text-sm">{report.viewsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa si hay coordenadas */}
        {report.location?.coordinates &&
         report.location.coordinates[0] !== 0 &&
         report.location.coordinates[1] !== 0 && (
          <MapSection coordinates={report.location.coordinates} title={report.title} />
        )}

        {/* Comentarios */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">💬 Comentarios ({comments.length})</h2>
          </div>

          {/* Lista de comentarios */}
          <div className="flex flex-col divide-y divide-gray-50">
            {comments.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-400 text-sm">Sé el primero en comentar</p>
              </div>
            )}
            {comments.map((c) => (
              <div key={c._id} className="px-4 py-3 flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                  👤
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{c.author?.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}
                      </p>
                      {(user?.id === c.author?._id || user?.role === 'admin') && (
                        <button onClick={() => handleDeleteComment(c._id)} className="text-red-400 hover:text-red-600">
                          <HiTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input de comentario */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                disabled={!comment.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-xl disabled:opacity-50"
              >
                <HiPaperAirplane className="text-lg rotate-90" />
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente del mapa
const MapSection = ({ coordinates, title }) => {
  const lat = coordinates[1];
  const lng = coordinates[0];
  const mapsUrl = 'https://www.google.com/maps?q=' + lat + ',' + lng;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h2 className="font-bold text-gray-800">📍 Ubicación en el mapa</h2>
      </div>
      <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <HiLocationMarker className="text-white text-3xl" />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
          
           <a
  href={mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
>
  Ver en Google Maps
</a>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;