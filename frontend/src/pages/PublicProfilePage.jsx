import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { HiArrowLeft, HiLocationMarker, HiClipboardList, HiHeart, HiChatAlt } from 'react-icons/hi';
import userService from '../services/userService';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-green-500 to-green-700',
  'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];
const getGradient = (name = '') => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700' },
  verified:   { label: 'Verificado',  color: 'bg-cyan-100 text-cyan-700' },
  inProgress: { label: 'En progreso', color: 'bg-violet-100 text-violet-700' },
  resolved:   { label: 'Resuelto',    color: 'bg-green-100 text-green-700' },
};

const WORK_ICONS = { road:'🛣️', sidewalk:'🚶', park:'🌳', building:'🏢', drainage:'🔧', lighting:'💡', bridge:'🌉', water:'🚰', other:'⚙️' };

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => userService.getProfile(id),
  });

  const user = data?.user;
  const reports = data?.reports || [];
  const gradient = getGradient(user?.name);
  const firstName = user?.name?.split(' ')[0] || '';
  const memberSince = user?.createdAt
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: es })
    : '';

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <p className="text-gray-400 text-sm">Usuario no encontrado</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f8fafc' }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-8 -left-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-8">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(-1)}
            className="mb-5 w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <HiArrowLeft className="text-white text-xl" />
          </motion.button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-white text-3xl font-extrabold">{firstName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-xl font-extrabold leading-tight">{user.name}</h1>
              <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
                {user.role === 'admin' ? '🛡️ Administrador' : '👤 Ciudadano'}
              </p>
              {user.city && (
                <p className="text-blue-200/60 text-xs mt-1 flex items-center gap-1">
                  <HiLocationMarker className="flex-shrink-0" /> {user.city}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <div className="rounded-2xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-white text-2xl font-extrabold leading-none">{user.reportsCount || reports.length}</p>
              <p className="text-white/60 text-xs mt-1 font-semibold">Reportes</p>
            </div>
            <div className="rounded-2xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-white/60 text-xs font-semibold mb-1">Miembro</p>
              <p className="text-white text-xs font-bold leading-tight">{memberSince}</p>
            </div>
          </div>
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: '#f8fafc' }} />
      </div>

      {/* Reports list */}
      <div className="px-4 -mt-1">
        <div className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <HiClipboardList className="text-blue-500 text-base" />
              Reportes de {firstName}
            </h2>
            <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-full">{reports.length}</span>
          </div>

          {reports.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
                <span className="text-3xl">🏗️</span>
              </div>
              <p className="text-gray-400 text-sm font-medium">Sin reportes aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((report, i) => {
                const st = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es });
                return (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(`/reports/${report._id}`)}
                    className="px-5 py-3.5 flex items-center gap-3 cursor-pointer active:bg-gray-50 transition-colors"
                  >
                    {report.images?.length > 0 ? (
                      <img src={report.images[0].url} alt="" className="w-12 h-12 object-cover rounded-2xl flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl">
                        {WORK_ICONS[report.workType] || '🏗️'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{report.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-400 flex-shrink-0">
                      <span className="flex items-center gap-1"><HiHeart className="text-xs" />{report.likesCount || 0}</span>
                      <span className="flex items-center gap-1"><HiChatAlt className="text-xs" />{report.commentsCount || 0}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
