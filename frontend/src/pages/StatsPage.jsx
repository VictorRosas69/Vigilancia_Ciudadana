import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow, subMonths, format, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../services/reportService';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: '#f59e0b', dot: 'bg-orange-400' },
  verified:   { label: 'Verificado',  color: '#06b6d4', dot: 'bg-cyan-500'   },
  inProgress: { label: 'En progreso', color: '#3b82f6', dot: 'bg-blue-500'   },
  resolved:   { label: 'Resuelto',    color: '#22c55e', dot: 'bg-green-500'  },
  rejected:   { label: 'Rechazado',   color: '#ef4444', dot: 'bg-red-500'    },
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

const DonutChart = ({ segments, size = 120 }) => {
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

  const statusSegments = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label, color: cfg.color, dot: cfg.dot,
    value: reports.filter(r => r.status === key).length,
  })).filter(s => s.value > 0);

  const byType = Object.entries(WORK_TYPE_LABELS).map(([type, cfg]) => ({
    ...cfg, count: reports.filter(r => r.workType === type).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
  const maxType = byType[0]?.count || 1;

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f8fafc' }}>

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

        <div className="h-5 rounded-t-[28px]" style={{ background: '#f8fafc' }} />
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

        {/* ── Por estado (donut) ── */}
        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <h2 className="font-extrabold text-gray-900 mb-4 text-base">Por estado</h2>
          <div className="flex items-center gap-6">
            <DonutChart segments={statusSegments} size={120} />
            <div className="flex flex-col gap-3 flex-1">
              {statusSegments.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className="text-sm text-gray-600 font-medium">{s.label}</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
