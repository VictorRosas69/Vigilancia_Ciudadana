import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiUser, HiMail, HiLocationMarker, HiPencil,
  HiLogout, HiClipboardList, HiCheck, HiClock
} from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import reportService from '../services/reportService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token, setAuth, updateUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    phone: user?.phone || '',
  });

  // Mis reportes
  const { data } = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: () => reportService.getAll({ author: user?.id, limit: 100 }),
    enabled: !!token,
  });

  const myReports = data?.reports?.filter(r => r.author?._id === user?.id || r.author?.id === user?.id) || [];

  const stats = {
    total: myReports.length,
    resolved: myReports.filter(r => r.status === 'resolved').length,
    pending: myReports.filter(r => r.status === 'pending').length,
    inProgress: myReports.filter(r => r.status === 'inProgress').length,
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await authService.updateProfile(form);
      updateUser(data.user);
      toast.success('Perfil actualizado ✅');
      setEditing(false);
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header con avatar */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-12 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Mi Perfil</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="p-2 bg-white/20 rounded-xl text-white"
          >
            <HiPencil className="text-xl" />
          </button>
        </div>
      </div>

      {/* Avatar flotante */}
      <div className="px-4 -mt-10 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h2 className="text-lg font-bold text-gray-800">{user?.name}</h2>
              )}
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'admin' ? '🛡️ Admin' : '👤 Ciudadano'}
                </span>
              </div>
            </div>
          </div>

          {/* Info del usuario */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <HiMail className="text-blue-400" />
              <span>{user?.email}</span>
            </div>

            {editing ? (
              <>
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="text-blue-400 flex-shrink-0" />
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Tu ciudad"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">📱</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Tu teléfono"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <HiCheck /> {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                {user?.city && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <HiLocationMarker className="text-blue-400" />
                    <span>{user.city}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span>📱</span>
                    <span>{user.phone}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700', icon: '📋' },
            { label: 'Resueltos', value: stats.resolved, color: 'bg-green-50 text-green-700', icon: '✅' },
            { label: 'En curso', value: stats.inProgress, color: 'bg-purple-50 text-purple-700', icon: '⚙️' },
            { label: 'Pendientes', value: stats.pending, color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-3 text-center`}>
              <p className="text-lg">{stat.icon}</p>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mis reportes */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">📋 Mis Reportes</h2>
            <span className="text-xs text-gray-400">{myReports.length} reportes</span>
          </div>

          {myReports.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="text-4xl">🏗️</span>
              <p className="text-gray-400 text-sm mt-2">No has creado reportes aún</p>
              <button
                onClick={() => navigate('/create-report')}
                className="mt-3 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-semibold"
              >
                Crear primer reporte
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myReports.slice(0, 5).map((report) => (
                <motion.div
                  key={report._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/reports/' + report._id)}
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
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
                    <p className="text-sm font-semibold text-gray-800 truncate">{report.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {report.location?.city || 'Sin ubicación'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                    report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    report.status === 'inProgress' ? 'bg-purple-100 text-purple-700' :
                    report.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                    report.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {report.status === 'resolved' ? 'Resuelto' :
                     report.status === 'inProgress' ? 'En curso' :
                     report.status === 'verified' ? 'Verificado' :
                     report.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </span>
                </motion.div>
              ))}
              {myReports.length > 5 && (
                <div className="px-4 py-3 text-center">
                  <button className="text-blue-600 text-sm font-semibold">
                    Ver todos ({myReports.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel Admin */}
      {user?.role === 'admin' && (
        <div className="px-4 mb-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <h2 className="font-bold text-purple-800 mb-3">🛡️ Panel de Administración</h2>
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm"
            >
              Ir al Panel Admin
            </button>
          </div>
        </div>
      )}

      {/* Cerrar sesión */}
      <div className="px-4">
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <HiLogout className="text-lg" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;