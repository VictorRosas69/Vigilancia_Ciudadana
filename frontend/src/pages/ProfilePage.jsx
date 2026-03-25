import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiMail, HiLocationMarker, HiPencil,
  HiLogout, HiClipboardList, HiCheck, HiChevronRight, HiBell, HiCamera, HiChatAlt, HiMoon, HiSun
} from 'react-icons/hi';
import useTheme from '../hooks/useTheme';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import reportService from '../services/reportService';
import notificationService from '../services/notificationService';

const STATUS_LABEL = {
  resolved:   { label: 'Resuelto',  cls: 'bg-green-100 text-green-700' },
  inProgress: { label: 'En curso',  cls: 'bg-violet-100 text-violet-700' },
  verified:   { label: 'Verificado',cls: 'bg-blue-100 text-blue-700' },
  rejected:   { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
  pending:    { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-green-500 to-green-700',
  'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];
const getGradient = (name = '') =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token, updateUser, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileFilter, setProfileFilter] = useState('');
  const avatarInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    phone: user?.phone || '',
  });

  const { data } = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: () => reportService.getAll({ author: user?.id, limit: 100 }),
    enabled: !!token,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000,
    enabled: !!token,
  });
  const unreadCount = notifData?.count || 0;

  const allMyReports = data?.reports?.filter(
    r => r.author?._id === user?.id || r.author?.id === user?.id
  ) || [];
  const myReports = profileFilter
    ? allMyReports.filter(r => r.status === profileFilter)
    : allMyReports;

  const stats = {
    total:      myReports.length,
    resolved:   myReports.filter(r => r.status === 'resolved').length,
    pending:    myReports.filter(r => r.status === 'pending').length,
    inProgress: myReports.filter(r => r.status === 'inProgress').length,
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB');
      return;
    }
    setAvatarLoading(true);
    try {
      const data = await authService.uploadAvatar(file);
      updateUser(data.user);
      toast.success('Foto de perfil actualizada');
    } catch {
      toast.error('Error al subir la foto');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await authService.updateProfile(form);
      updateUser(data.user);
      toast.success('Perfil actualizado');
      setEditing(false);
    } catch {
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  const gradient = getGradient(user?.name);
  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--page-bg)' }}>

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">Mi Perfil</h1>
              <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
                {user?.role === 'admin' ? '🛡️ Administrador' : '👤 Ciudadano'}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setEditing(!editing)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
              style={{
                background: editing ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <HiPencil className={`text-lg ${editing ? 'text-blue-700' : 'text-white'}`} />
            </motion.button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-20 h-20 rounded-3xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              >
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <span className="text-white text-3xl font-extrabold">
                      {firstName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity rounded-3xl">
                  {avatarLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiCamera className="text-white text-2xl" />
                  )}
                </div>
              </motion.button>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', border: '2px solid rgba(15,23,42,1)' }}>
                {avatarLoading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiCamera className="text-white text-xs" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-white/15 border border-white/30 rounded-2xl px-4 py-2.5 text-white text-base font-bold focus:outline-none focus:border-white/60 placeholder-white/50 mb-1"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
              ) : (
                <h2 className="text-white text-xl font-extrabold leading-tight break-words">{user?.name}</h2>
              )}
              <p className="text-blue-200/70 text-sm mt-1 font-medium flex items-center gap-1.5">
                <HiMail className="text-sm flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-6">
            {[
              { label: 'Total',      value: stats.total,      color: 'rgba(255,255,255,0.15)', icon: '📊' },
              { label: 'Resueltos',  value: stats.resolved,   color: 'rgba(52,211,153,0.25)',  icon: '✅' },
              { label: 'En curso',   value: stats.inProgress, color: 'rgba(167,139,250,0.25)', icon: '🔧' },
              { label: 'Pendientes', value: stats.pending,    color: 'rgba(251,146,60,0.25)',  icon: '⏳' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-2.5 text-center"
                style={{ background: s.color, border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className="text-base leading-none mb-0.5">{s.icon}</p>
                <p className="text-white text-lg font-extrabold leading-none">{s.value}</p>
                <p className="text-white/60 text-[10px] mt-0.5 font-semibold leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {stats.total > 0 && (
            <div className="mt-4 rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-xs font-semibold">Tasa de resolución</span>
                <span className="text-white text-xs font-extrabold">
                  {Math.round((stats.resolved / stats.total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((stats.resolved / stats.total) * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #34d399, #10b981)' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: 'var(--page-bg)' }} />
      </div>

      <div className="px-4 -mt-1 flex flex-col gap-3">

        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Editar información</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HiLocationMarker className="text-blue-500" />
                </div>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Tu ciudad"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-base">
                  📱
                </div>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Tu teléfono"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
                >
                  <HiCheck />
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </motion.button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!editing && (user?.city || user?.phone) && (
          <div className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Información</p>
            <div className="flex flex-col gap-3">
              {user?.city && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HiLocationMarker className="text-blue-500" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{user.city}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-base">
                    📱
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <HiClipboardList className="text-blue-500 text-base" />
                Mis Reportes
              </h2>
              <span className="text-xs text-gray-400 font-semibold" style={{ color: 'var(--text-3)' }}>
                {myReports.length} de {allMyReports.length}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {[
                { value: '', label: 'Todos' },
                { value: 'pending', label: '⏳ Pendiente' },
                { value: 'inProgress', label: '🔧 En curso' },
                { value: 'resolved', label: '✅ Resuelto' },
                { value: 'rejected', label: '❌ Rechazado' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setProfileFilter(f.value)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={profileFilter === f.value
                    ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff' }
                    : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {myReports.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
                <span className="text-3xl">🏗️</span>
              </div>
              <p className="text-gray-400 text-sm font-medium">No has creado reportes aún</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/create-report')}
                className="mt-4 text-white text-sm px-5 py-2.5 rounded-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
              >
                Crear reporte
              </motion.button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myReports.slice(0, 5).map((report) => {
                const st = STATUS_LABEL[report.status] || STATUS_LABEL.pending;
                return (
                  <motion.div
                    key={report._id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/reports/' + report._id)}
                    className="px-5 py-3.5 flex items-center gap-3 cursor-pointer active:bg-gray-50 transition-colors"
                  >
                    {report.images?.length > 0 ? (
                      <img
                        src={report.images[0].url}
                        alt=""
                        className="w-12 h-12 object-cover rounded-2xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <HiClipboardList className="text-blue-400 text-xl" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{report.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {report.location?.city || report.location?.neighborhood || 'Sin ubicación'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                      <HiChevronRight className="text-gray-300 text-base" />
                    </div>
                  </motion.div>
                );
              })}
              {myReports.length > 5 && (
                <div className="px-5 py-4 text-center">
                  <span className="text-blue-600 text-sm font-bold">
                    Ver todos ({myReports.length})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {(() => {
          const BADGES = [
            { icon: '🌱', label: 'Primer reporte',    desc: 'Publicaste tu primer reporte',  earned: stats.total >= 1  },
            { icon: '🔥', label: 'Ciudadano activo',  desc: '5 reportes publicados',          earned: stats.total >= 5  },
            { icon: '💪', label: 'Comprometido',      desc: '10 reportes publicados',         earned: stats.total >= 10 },
            { icon: '🏆', label: 'Héroe ciudadano',   desc: '20 reportes publicados',         earned: stats.total >= 20 },
            { icon: '✅', label: 'Efectivo',           desc: 'Un reporte fue resuelto',        earned: stats.resolved >= 1  },
            { icon: '🎯', label: 'Alto impacto',      desc: '5 reportes resueltos',           earned: stats.resolved >= 5  },
            { icon: '⭐', label: 'Veterano',           desc: '15 reportes publicados',         earned: stats.total >= 15 },
            { icon: '🎉', label: 'Gran resolución',   desc: '10 reportes resueltos',          earned: stats.resolved >= 10 },
          ];
          const earned = BADGES.filter(b => b.earned);
          const locked = BADGES.filter(b => !b.earned);
          return (
            <div className="bg-white rounded-3xl p-5"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  🏅 Logros
                </h2>
                <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-full">
                  {earned.length}/{BADGES.length}
                </span>
              </div>

              {earned.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">🔒</p>
                  <p className="text-sm text-gray-400 font-medium">Crea reportes para desbloquear logros</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {earned.map((b, i) => (
                      <motion.div
                        key={b.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                        className="flex flex-col items-center gap-1"
                        title={b.desc}
                      >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px solid #bfdbfe' }}>
                          {b.icon}
                        </div>
                        <p className="text-[10px] text-gray-600 font-bold text-center leading-tight">{b.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {locked.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Por desbloquear</p>
                      <div className="flex flex-col gap-2">
                        {locked.slice(0, 3).map((b) => (
                          <div key={b.label} className="flex items-center gap-3 py-2 px-3 rounded-2xl bg-gray-50">
                            <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center text-lg opacity-40 flex-shrink-0">
                              {b.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-500">{b.label}</p>
                              <p className="text-[11px] text-gray-400">{b.desc}</p>
                            </div>
                            <span className="text-gray-300 text-base flex-shrink-0">🔒</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })()}

        <div className="flex flex-col gap-2.5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(user?.role === 'admin' ? '/admin/messages' : '/messages')}
            className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3 w-full text-left"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
              💬
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">Mensajes</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.role === 'admin' ? 'Bandeja de entrada de ciudadanos' : 'Contacta al administrador'}
              </p>
            </div>
            <HiChevronRight className="text-gray-300 text-lg flex-shrink-0" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/notifications')}
            className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3 w-full text-left"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
          >
            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center relative flex-shrink-0">
              <HiBell className="text-blue-600 text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">Notificaciones</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones nuevas'}
              </p>
            </div>
            <HiChevronRight className="text-gray-300 text-lg flex-shrink-0" />
          </motion.button>

          {user?.role === 'admin' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin')}
              className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3 w-full text-left"
              style={{
                boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.12)',
              }}
            >
              <div className="w-11 h-11 bg-violet-100 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
                🛡️
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">Panel de Administración</p>
                <p className="text-xs text-gray-400 mt-0.5">Gestiona reportes y usuarios</p>
              </div>
              <HiChevronRight className="text-gray-300 text-lg flex-shrink-0" />
            </motion.button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className="bg-white rounded-3xl px-5 py-4 flex items-center gap-3 w-full text-left"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
            {isDark ? <HiMoon className="text-white text-xl" /> : <HiSun className="text-white text-xl" />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Apariencia</p>
            <p className="text-xs text-gray-400 mt-0.5">{isDark ? 'Modo oscuro activo' : 'Modo claro activo'}</p>
          </div>
          <div
            className="w-12 h-6 rounded-full flex items-center transition-all duration-300 flex-shrink-0 px-0.5"
            style={{ background: isDark ? '#2563eb' : '#e5e7eb' }}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: isDark ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            />
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full bg-white rounded-3xl py-4 flex items-center justify-center gap-2 font-bold text-sm text-red-500"
          style={{
            boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.1)',
          }}
        >
          <HiLogout className="text-lg" />
          Cerrar sesión
        </motion.button>

      </div>
    </div>
  );
};

export default ProfilePage;
