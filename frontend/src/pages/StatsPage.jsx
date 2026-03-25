import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { subMonths, format, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../services/reportService';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: '#f59e0b', dot: 'bg-orange-400' },
  verified:   { label: 'Verificado',  color: '#06b6d4', dot: 'bg-cyan-500'   },
  inProgress: { label: 'En progreso', color: '#3b82f6', dot: 'bg-blue-500'   },
  resolved:   { label: 'Resuelto',    color: '#22c55e', dot: 'bg-green-500'  },
  rejected:   { label: 'Rechazado',   color: '#ef4444', dot: 'bg-red-500'    },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Baja',    color: '#22c55e', bg: 'bg-green-100'  },
  medium:   { label: 'Media',   color: '#f59e0b', bg: 'bg-yellow-100' },
  high:     { label: 'Alta',    color: '#f97316', bg: 'bg-orange-100' },
  critical: { label: 'Crítica', color: '#ef4444', bg: 'bg-red-100'    },
};

const WORK_TYPE_LABELS = {
  road:     { icon: '🛣️', label: 'Vía'       },
  lighting: { icon: '💡', label: 'Alumbrado' },
  sidewalk: { icon: '🚶', label: 'Andén'     },
  drainage: { icon: '🔧', label: 'Tubería'   },
  park:     { icon: '🌳', label: 'Parque'    },
  bridge:   { icon: '🚉', label: 'Puente'    },
  building: { icon: '🏢', label: 'Edificio'  },
  water:    { icon: '🚰', label: 'Acueducto' },
  other:    { icon: '⚙️', label: 'Otro'      },
};

// ── Donut Chart ──────────────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 120, centerLabel = '' }) => {
  const cx = size / 2, cy = size / 2;
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
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {total === 0
          ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
          : arcs.map((arc, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={arc.color} strokeWidth="18"
              strokeDasharray={`${arc.dash} ${circumference}`}
              strokeDashoffset={arc.offset} strokeLinecap="butt"
            />
          ))
        }
        <circle cx={cx} cy={cy} r={r - 14} fill="white" />
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-extrabold text-gray-900">{centerLabel}</span>
        </div>
      )}
    </div>
  );
};

// ── Resolution Gauge ─────────────────────────────────────────────────────────
const ResolutionGauge = ({ pct }) => {
  const r = 48;
  const circumference = Math.PI * r; // half circle
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 120, height: 66 }}>
        <svg width="120" height="66" viewBox="0 0 120 66">
          {/* Background arc */}
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
          {/* Value arc */}
          <motion.path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className="text-2xl font-extrabold text-gray-900">{pct}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 font-semibold mt-1">Tasa de resolución</p>
    </div>
  );
};

const StatsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => reportService.getAll({ limit: 200 }),
  });

  const reports    = data?.reports || [];
  const total      = reports.length;
  const resolved   = reports.filter(r => r.status === 'resolved').length;
  const inProgress = reports.filter(r => r.status === 'inProgress').length;
  const pending    = reports.filter(r => r.status === 'pending').length;
  const city       = reports[0]?.location?.city || 'tu ciudad';
  const resoPct    = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const statusSegments = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label, color: cfg.color, dot: cfg.dot,
    value: reports.filter(r => r.status === key).length,
  })).filter(s => s.value > 0);

  const byType = Object.entries(WORK_TYPE_LABELS).map(([type, cfg]) => ({
    ...cfg, count: reports.filter(r => r.workType === type).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
  const maxType = byType[0]?.count || 1;

  const byPriority = ['critical', 'high', 'medium', 'low'].map(p => ({
    ...PRIORITY_CONFIG[p],
    count: reports.filter(r => r.priority === p).length,
  })).filter(p => p.count > 0);
  const maxPriority = byPriority[0]?.count || 1;

  // Top barrios/ciudades
  const locationCounts = {};
  reports.forEach(r => {
    const loc = r.location?.neighborhood || r.location?.city || 'Sin ubicación';
    if (loc) locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxLoc = topLocations[0]?.[1] || 1;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
  const monthlyData = months.map(m => ({
    label: format(m, 'MMM', { locale: es }),
    count: reports.filter(r => isSameMonth(new Date(r.createdAt), m)).length,
    isCurrent: isSameMonth(m, now),
  }));
  const maxMonth = Math.max(...monthlyData.map(m => m.count), 1);

  const STAT_CARDS = [
    { icon: '📋', label: 'Total',      value: total,      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', shadow: 'rgba(37,99,235,0.3)' },
    { icon: '✅', label: 'Resueltos',  value: resolved,   gradient: 'linear-gradient(135deg, #34d399, #059669)', shadow: 'rgba(5,150,105,0.3)' },
    { icon: '⚙️', label: 'En curso',   value: inProgress, gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)', shadow: 'rgba(124,58,237,0.3)' },
    { icon: '⏳', label: 'Pendientes', value: pending,    gradient: 'linear-gradient(135deg, #fb923c, #ea580c)', shadow: 'rgba(234,88,12,0.3)' },
  ];

  if (isLoading) return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--page-bg)' }}>
      <div className="h-32 animate-pulse" style={{ background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)' }} />
      <div className="px-4 pt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-3xl animate-pulse" />)}
        </div>
        {[0,1,2].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--page-bg)' }}>

      {/* ── Header ── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-8 -left-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-6">
          <h1 className="text-white text-2xl font-extrabold tracking-tight">Estadísticas</h1>
          <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
            {city} · {total} reporte{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: 'var(--page-bg)' }} />
      </div>

      <div className="px-4 -mt-1 flex flex-col gap-4">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-3xl p-5 text-white"
              style={{ background: card.gradient, boxShadow: `0 4px 20px ${card.shadow}` }}
            >
              <p className="text-3xl mb-1">{card.icon}</p>
              <p className="text-4xl font-extrabold leading-none">{card.value}</p>
              <p className="text-white/70 text-sm mt-1.5 font-medium">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Gauge + Donut en fila ── */}
        <div className="bg-white rounded-3xl p-5 flex items-center justify-around gap-4"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <ResolutionGauge pct={resoPct} />
          <div className="w-px h-20 bg-gray-100" />
          <div className="flex flex-col items-center gap-1">
            <DonutChart segments={statusSegments} size={100} centerLabel={`${total}`} />
            <p className="text-xs text-gray-400 font-semibold">Por estado</p>
          </div>
        </div>

        {/* ── Reportes por mes ── */}
        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <h2 className="font-extrabold text-gray-900 mb-5 text-base">Reportes por mes</h2>
          <div className="flex items-end justify-between gap-2 h-28">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold">{m.count > 0 ? m.count : ''}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: maxMonth > 0 ? `${(m.count / maxMonth) * 80}px` : '4px' }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                  className="w-full rounded-xl min-h-[4px]"
                  style={{
                    background: m.isCurrent
                      ? 'linear-gradient(to top, #1d4ed8, #3b82f6)'
                      : '#dbeafe',
                  }}
                />
                <span className="text-xs text-gray-400 capitalize font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Por prioridad ── */}
        {byPriority.length > 0 && (
          <div className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
            <h2 className="font-extrabold text-gray-900 mb-4 text-base">Por prioridad</h2>
            <div className="flex flex-col gap-3">
              {byPriority.map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                    <span className="text-sm font-extrabold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxPriority) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-2.5 rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Por estado (leyenda) ── */}
        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <h2 className="font-extrabold text-gray-900 mb-4 text-base">Detalle por estado</h2>
          <div className="flex flex-col gap-3">
            {statusSegments.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className="text-sm text-gray-600 font-medium">{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: total > 0 ? `${(s.value / total) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: s.color }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 w-6 text-right">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top ubicaciones ── */}
        {topLocations.length > 0 && (
          <div className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
            <h2 className="font-extrabold text-gray-900 mb-4 text-base">📍 Zonas más reportadas</h2>
            <div className="flex flex-col gap-3">
              {topLocations.map(([loc, count], i) => (
                <motion.div key={loc}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold text-white"
                    style={{ background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : i === 1 ? 'linear-gradient(135deg,#9ca3af,#6b7280)' : 'linear-gradient(135deg,#b45309,#92400e)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{loc}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxLoc) * 100}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(to right,#3b82f6,#8b5cf6)' }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 flex-shrink-0">{count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Por tipo de obra ── */}
        {byType.length > 0 && (
          <div className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
            <h2 className="font-extrabold text-gray-900 mb-4 text-base">Por tipo de obra</h2>
            <div className="flex flex-col gap-4">
              {byType.map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 font-medium flex items-center gap-1.5">
                      <span>{item.icon}</span> {item.label}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxType) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                      className="h-2 rounded-full"
                      style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}
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
