import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiMail, HiLocationMarker, HiPencil,
  HiLogout, HiClipboardList, HiCheck, HiChevronRight, HiBell
} from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import reportService from '../services/reportService';
import notificationService from '../services/notificationService';

const STATUS_LABEL = {
  resolved:   { label: 'Resuelto',  cls: 'bg-green-50 text-green-700' },
  inProgress: { label: 'En curso',  cls: 'bg-violet-50 text-violet-700' },
  verified:   { label: 'Verificado',cls: 'bg-blue-50 text-blue-700' },
  rejected:   { label: 'Rechazado', cls: 'bg-red-50 text-red-700' },
  pending:    { label: 'Pendiente', cls: 'bg-yellow-50 text-yellow-700' },
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
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const myReports = data?.reports?.filter(
    r => r.author?._id === user?.id || r.author?.id === user?.id
  ) || [];

  const stats = {
    total:      myReports.length,
    resolved:   myReports.filter(r => r.status === 'resolved').length,
    pending:    myReports.filter(r => r.status === 'pending').length,
    inProgress: myReports.filter(r => r.status === 'inProgress').length,
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

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* ── Header con gradiente ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-14 pb-20 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute top-8 right-12 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 rounded-t-3xl" />

        <div className="relative flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Mi Perfil</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="p-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-white active:scale-95 transition-transform"
          >
            <HiPencil className="text-lg" />
          </button>
        </div>
      </div>

      {/* ── Tarjeta de usuario (superpuesta) ── */}
      <div className="px-4 -mt-10 mb-4">
        <div className="bg-white rounded-3xl pt-6 pb-5 px-5 shadow-lg border border-gray-100/60">
          {/* Avatar centrado */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="relative mb-3">
              <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-white text-4xl font-extrabold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
            </div>

            {/* Nombre siempre visible, sin truncar */}
            {editing ? (
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
            ) : (
              <h2 className="text-xl font-extrabold text-gray-900 w-full break-words">{user?.name}</h2>
            )}

            <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold mt-1.5 ${
              user?.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 Ciudadano'}
            </span>
          </div>

          {/* Info */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-gray-500 text-sm">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <HiMail className="text-blue-500 text-sm" />
              </div>
              <span className="truncate">{user?.email}</span>
            </div>

            {editing ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HiLocationMarker className="text-blue-500 text-sm" />
                  </div>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Tu ciudad"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                    📱
                  </div>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Tu teléfono"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 active:scale-98 transition-transform"
                  >
                    <HiCheck /> {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                {user?.city && (
                  <div className="flex items-center gap-2.5 text-gray-500 text-sm">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HiLocationMarker className="text-blue-500 text-sm" />
                    </div>
                    <span>{user.city}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-2.5 text-gray-500 text-sm">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                      📱
                    </div>
                    <span>{user.phone}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total',      value: stats.total,      bg: 'bg-blue-600',   text: 'text-white', sub: 'text-blue-200' },
            { label: 'Resueltos',  value: stats.resolved,   bg: 'bg-green-500',  text: 'text-white', sub: 'text-green-200' },
            { label: 'En curso',   value: stats.inProgress, bg: 'bg-violet-500', text: 'text-white', sub: 'text-violet-200' },
            { label: 'Pendientes', value: stats.pending,    bg: 'bg-orange-400', text: 'text-white', sub: 'text-orange-100' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
              <p className={`text-[10px] font-semibold mt-0.5 ${s.sub}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mis reportes ── */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <HiClipboardList className="text-blue-500" />
              Mis Reportes
            </h2>
            <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
              {myReports.length}
            </span>
          </div>

          {myReports.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🏗️</span>
              </div>
              <p className="text-gray-400 text-sm font-medium">No has creado reportes aún</p>
              <button
                onClick={() => navigate('/create-report')}
                className="mt-4 bg-blue-600 text-white text-sm px-5 py-2.5 rounded-2xl font-bold shadow-md shadow-blue-200"
              >
                Crear reporte
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myReports.slice(0, 5).map((report) => {
                const st = STATUS_LABEL[report.status] || STATUS_LABEL.pending;
                return (
                  <motion.div
                    key={report._id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/reports/' + report._id)}
                    className="px-5 py-3.5 flex items-center gap-3 cursor-pointer active:bg-gray-50"
                  >
                    {report.images?.length > 0 ? (
                      <img
                        src={report.images[0].url}
                        alt=""
                        className="w-12 h-12 object-cover rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <HiClipboardList className="text-blue-400 text-xl" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{report.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {report.location?.city || report.location?.neighborhood || 'Sin ubicación'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                      <HiChevronRight className="text-gray-300 text-base" />
                    </div>
                  </motion.div>
                );
              })}
              {myReports.length > 5 && (
                <div className="px-5 py-4 text-center">
                  <button className="text-blue-600 text-sm font-bold">
                    Ver todos ({myReports.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel Admin ── */}
      {user?.role === 'admin' && (
        <div className="px-4 mb-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between bg-white border border-purple-100 rounded-2xl px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">
                🛡️
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Panel de Administración</p>
                <p className="text-xs text-gray-400">Gestiona reportes y usuarios</p>
              </div>
            </div>
            <HiChevronRight className="text-gray-300 text-xl" />
          </button>
        </div>
      )}

      {/* ── Notificaciones ── */}
      <div className="px-4 mb-3">
        <button
          onClick={() => navigate('/notifications')}
          className="w-full flex items-center justify-between bg-white border border-blue-100 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center relative">
              <HiBell className="text-blue-600 text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Notificaciones</p>
              <p className="text-xs text-gray-400">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones nuevas'}
              </p>
            </div>
          </div>
          <HiChevronRight className="text-gray-300 text-xl" />
        </button>
      </div>

      {/* ── Cerrar sesión ── */}
      <div className="px-4">
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-100 text-red-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:bg-red-50 transition-colors"
        >
          <HiLogout className="text-lg" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
