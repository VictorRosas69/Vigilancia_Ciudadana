import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow, subMonths, format, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../services/reportService';

// ── Configuración ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: '#f59e0b', dot: 'bg-orange-400' },
  verified:   { label: 'Verificado',  color: '#06b6d4', dot: 'bg-cyan-500' },
  inProgress: { label: 'En progreso', color: '#3b82f6', dot: 'bg-blue-500' },
  resolved:   { label: 'Resuelto',    color: '#22c55e', dot: 'bg-green-500' },
  rejected:   { label: 'Rechazado',   color: '#ef4444', dot: 'bg-red-500' },
};

const WORK_TYPE_LABELS = {
  road:     { icon: '🛣️', label: 'Vía' },
  lighting: { icon: '💡', label: 'Alumbrado' },
  sidewalk: { icon: '🚶', label: 'Andén' },
  drainage: { icon: '🔧', label: 'Tubería' },
  park:     { icon: '🌳', label: 'Parque' },
  bridge:   { icon: '🚉', label: 'Puente' },
  building: { icon: '🏢', label: 'Edificio' },
  water:    { icon: '🚰', label: 'Acueducto' },
  other:    { icon: '⚙️', label: 'Otro' },
};

// ── Donut SVG ─────────────────────────────────────────────────────────────────

const DonutChart = ({ segments, size = 120 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 14;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  const GAP = total > 1 ? 2 : 0;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = total > 0 ? Math.max(0, (seg.value / total) * circumference - GAP) : 0;
    const arc = { ...seg, dash, offset: circumference - offset };
    offset += dash + GAP;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
      ) : (
        arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="18"
            strokeDasharray={`${arc.dash} ${circumference}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="butt"
          />
        ))
      )}
      {/* Hole */}
      <circle cx={cx} cy={cy} r={r - 14} fill="white" />
    </svg>
  );
};

// ── Página ────────────────────────────────────────────────────────────────────

const StatsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => reportService.getAll({ limit: 200 }),
  });

  const reports = data?.reports || [];
  const total = reports.length;
  const resolved = reports.filter(r => r.status === 'resolved').length;
  const inProgress = reports.filter(r => r.status === 'inProgress').length;
  const pending = reports.filter(r => r.status === 'pending').length;

  // Por estado (para donut)
  const statusSegments = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label,
    color: cfg.color,
    dot: cfg.dot,
    value: reports.filter(r => r.status === key).length,
  })).filter(s => s.value > 0);

  // Por tipo de obra
  const byType = Object.entries(WORK_TYPE_LABELS).map(([type, cfg]) => ({
    ...cfg,
    count: reports.filter(r => r.workType === type).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const maxType = byType[0]?.count || 1;

  // Últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
  const monthlyData = months.map(m => ({
    label: format(m, 'MMM', { locale: es }),
    count: reports.filter(r => isSameMonth(new Date(r.createdAt), m)).length,
    isCurrent: isSameMonth(m, now),
  }));
  const maxMonth = Math.max(...monthlyData.map(m => m.count), 1);

  const updatedAgo = formatDistanceToNow(new Date(), { addSuffix: false, locale: es });
  const city = reports[0]?.location?.city || 'tu ciudad';

  const STAT_CARDS = [
    { icon: '📋', label: 'Total Reportes', value: total,      border: 'border-l-blue-500',   iconBg: 'bg-blue-50' },
    { icon: '✅', label: 'Resueltos',       value: resolved,   border: 'border-l-green-500',  iconBg: 'bg-green-50' },
    { icon: '⚙️', label: 'En curso',        value: inProgress, border: 'border-l-orange-400', iconBg: 'bg-orange-50' },
    { icon: '⏳', label: 'Pendientes',      value: pending,    border: 'border-l-orange-400', iconBg: 'bg-orange-50' },
  ];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Header ── */}
      <div className="bg-white px-5 pt-12 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">📊 Estadísticas</h1>
        <p className="text-gray-400 text-sm mt-0.5">{city} · Actualizado hace {updatedAgo}</p>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">

        {/* ── 4 stat cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-white rounded-2xl p-4 border border-gray-100 border-l-4 ${card.border} shadow-sm`}
            >
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center text-xl mb-3`}>
                {card.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Reportes por mes ── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span>📝</span> Reportes por mes
          </h2>
          <div className="flex items-end justify-between gap-2 h-28">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">{m.count > 0 ? m.count : ''}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: maxMonth > 0 ? `${(m.count / maxMonth) * 80}px` : '4px' }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                  className={`w-full rounded-t-lg min-h-[4px] ${m.isCurrent ? 'bg-blue-600' : 'bg-blue-200'}`}
                />
                <span className="text-xs text-gray-400 capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Por estado (donut) ── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🧡</span> Por estado
          </h2>
          <div className="flex items-center gap-6">
            <DonutChart segments={statusSegments} size={120} />
            <div className="flex flex-col gap-2.5 flex-1">
              {statusSegments.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className="text-sm text-gray-700">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Por tipo de obra ── */}
        {byType.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🚧</span> Por tipo de obra
            </h2>
            <div className="flex flex-col gap-4">
              {byType.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-800 flex items-center gap-1.5">
                      <span>{item.icon}</span> {item.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxType) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                      className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StatsPage;
