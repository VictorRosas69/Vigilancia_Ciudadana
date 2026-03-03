import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import reportService from '../services/reportService';

const WORK_TYPE_LABELS = {
  road: '🛣️ Vía', sidewalk: '🚶 Andén', park: '🌳 Parque',
  building: '🏢 Edificio', drainage: '💧 Drenaje', lighting: '💡 Alumbrado',
  bridge: '🌉 Puente', water: '🚰 Acueducto', other: '🔧 Otro',
};

const STATUS_CONFIG = {
  pending:    { label: 'Pendientes',   color: '#f59e0b', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  verified:   { label: 'Verificados',  color: '#3b82f6', bg: 'bg-blue-50',   text: 'text-blue-700' },
  inProgress: { label: 'En progreso',  color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700' },
  resolved:   { label: 'Resueltos',    color: '#22c55e', bg: 'bg-green-50',  text: 'text-green-700' },
  rejected:   { label: 'Rechazados',   color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700' },
};

const StatsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => reportService.getAll({ limit: 100 }),
  });

  const reports = data?.reports || [];
  const total = reports.length;

  // Estadísticas por estado
  const byStatus = Object.keys(STATUS_CONFIG).map(status => ({
    status,
    count: reports.filter(r => r.status === status).length,
    ...STATUS_CONFIG[status],
  }));

  // Estadísticas por tipo de obra
  const byType = Object.entries(WORK_TYPE_LABELS).map(([type, label]) => ({
    type,
    label,
    count: reports.filter(r => r.workType === type).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  // Estadísticas por prioridad
  const byPriority = [
    { label: '🔴 Crítica',  value: 'critical', color: 'bg-red-500' },
    { label: '🟠 Alta',     value: 'high',     color: 'bg-orange-500' },
    { label: '🟡 Media',    value: 'medium',   color: 'bg-yellow-500' },
    { label: '🟢 Baja',     value: 'low',      color: 'bg-green-500' },
  ].map(p => ({
    ...p,
    count: reports.filter(r => r.priority === p.value).length,
  }));

  // Tasa de resolución
  const resolved = reports.filter(r => r.status === 'resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-12 pb-8">
        <h1 className="text-white text-xl font-bold">📊 Estadísticas</h1>
        <p className="text-blue-200 text-sm mt-1">Estado general de la ciudad</p>

        {/* Tasa de resolución */}
        <div className="mt-4 bg-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-semibold">Tasa de resolución</p>
            <p className="text-white font-bold text-xl">{resolutionRate}%</p>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: resolutionRate + '%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-green-400 h-3 rounded-full"
            />
          </div>
          <p className="text-blue-200 text-xs mt-1">{resolved} de {total} reportes resueltos</p>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Total general */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 text-center"
          >
            <p className="text-4xl font-bold text-blue-600">{total}</p>
            <p className="text-gray-500 text-sm mt-1">Total reportes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 text-center"
          >
            <p className="text-4xl font-bold text-green-600">{resolved}</p>
            <p className="text-gray-500 text-sm mt-1">Resueltos</p>
          </motion.div>
        </div>

        {/* Por estado */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">📋 Por estado</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {byStatus.map((item, index) => (
              <motion.div
                key={item.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                  <span className="text-sm font-bold text-gray-700">{item.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: total > 0 ? (item.count / total * 100) + '%' : '0%' }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Por tipo de obra */}
        {byType.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="font-bold text-gray-800">🏗️ Por tipo de obra</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {byType.map((item, index) => (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: total > 0 ? (item.count / total * 100) + '%' : '0%' }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-6 text-right">{item.count}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Por prioridad */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">⚡ Por prioridad</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {byPriority.map((item, index) => (
              <motion.div
                key={item.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-xl p-3 text-center"
              >
                <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`${item.color} h-1.5 rounded-full`}
                    style={{ width: total > 0 ? (item.count / total * 100) + '%' : '0%' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsPage;