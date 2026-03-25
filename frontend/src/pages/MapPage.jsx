import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiLocationMarker, HiMap, HiFire } from 'react-icons/hi';
import reportService from '../services/reportService';

const PRIORITY_COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

const PRIORITY_WEIGHT = {
  low:      0.3,
  medium:   0.5,
  high:     0.8,
  critical: 1.0,
};

const PRIORITY_CONFIG = {
  low:      { dot: 'bg-green-500',  label: 'Baja' },
  medium:   { dot: 'bg-yellow-400', label: 'Media' },
  high:     { dot: 'bg-orange-500', label: 'Alta' },
  critical: { dot: 'bg-red-500',    label: 'Crítica' },
};

const STATUS_CONFIG = {
  pending:    { dot: 'bg-orange-400', label: 'Pendiente' },
  verified:   { dot: 'bg-blue-500',   label: 'Verificado' },
  inProgress: { dot: 'bg-blue-500',   label: 'En progreso' },
  resolved:   { dot: 'bg-green-500',  label: 'Resuelto' },
  rejected:   { dot: 'bg-red-500',    label: 'Rechazado' },
};

const PRIORITY_FILTERS = [
  { label: 'Todas',   value: '' },
  { label: 'Crítica', value: 'critical' },
  { label: 'Alta',    value: 'high' },
  { label: 'Media',   value: 'medium' },
  { label: 'Baja',    value: 'low' },
];

const STATUS_FILTERS = [
  { label: 'Todos estados', value: '' },
  { label: 'Pendiente',     value: 'pending'    },
  { label: 'En progreso',   value: 'inProgress' },
  { label: 'Resuelto',      value: 'resolved'   },
  { label: 'Rechazado',     value: 'rejected'   },
];

const makePinIcon = (L, color) =>
  L.divIcon({
    html: `
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25))">
        <path d="M18 0C8.059 0 0 8.059 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.059 27.941 0 18 0Z" fill="${color}"/>
        <circle cx="18" cy="18" r="7" fill="white"/>
      </svg>`,
    className: '',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48],
  });

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapPage = () => {
  const navigate = useNavigate();
  const [MapComponents, setMapComponents] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [filterTab, setFilterTab]           = useState('priority'); // 'priority' | 'status'
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('pins'); // 'pins' | 'heat'

  const { data } = useQuery({
    queryKey: ['reports-map'],
    queryFn: () => reportService.getAll({ limit: 200 }),
  });

  const allReports = data?.reports || [];
  const reportsWithCoords = allReports.filter(r =>
    r.location?.coordinates &&
    r.location.coordinates[0] !== 0 &&
    r.location.coordinates[1] !== 0
  );

  const filtered = reportsWithCoords.filter(r => {
    if (priorityFilter && r.priority !== priorityFilter) return false;
    if (statusFilter   && r.status   !== statusFilter)   return false;
    if (nearMeActive && userLocation) {
      const dist = haversineKm(
        userLocation[0], userLocation[1],
        r.location.coordinates[1], r.location.coordinates[0]
      );
      if (dist > 5) return false;
    }
    return true;
  });

  const clusterKey = `${priorityFilter}|${statusFilter}`;

  const heatPoints = filtered.map(r => [
    r.location.coordinates[1],
    r.location.coordinates[0],
    PRIORITY_WEIGHT[r.priority] || 0.5,
  ]);

  useEffect(() => {
    const loadMap = async () => {
      const L = await import('leaflet');
      const { MapContainer, TileLayer, useMap } = await import('react-leaflet');
      delete L.default.Icon.Default.prototype._getIconUrl;

      const HeatLayer = ({ points }) => {
        const map = useMap();
        useEffect(() => {
          if (!points || points.length === 0) return;
          let heatLayer = null;
          const init = async () => {
            await import('leaflet.heat');
            const Lx = L.default;
            if (!Lx.heatLayer) return;
            heatLayer = Lx.heatLayer(points, {
              radius: 40,
              blur: 30,
              maxZoom: 17,
              max: 1.0,
              gradient: { 0.2: '#4ade80', 0.4: '#facc15', 0.6: '#fb923c', 0.8: '#f87171', 1.0: '#dc2626' },
            }).addTo(map);
          };
          init();
          return () => { if (heatLayer) map.removeLayer(heatLayer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [map, JSON.stringify(points)]);
        return null;
      };

      const ClusterLayer = ({ reports, onSelect }) => {
        const map = useMap();
        useEffect(() => {
          let clusterGroup = null;
          let cancelled    = false;

          const init = async () => {
            await import('leaflet.markercluster');
            if (cancelled) return;

            const Lx = L.default;
            if (!Lx.markerClusterGroup) return;

            clusterGroup = Lx.markerClusterGroup({
              chunkedLoading: true,
              maxClusterRadius: 60,
              showCoverageOnHover: false,
              spiderfyOnMaxZoom: true,
            });

            reports.forEach(report => {
              const lat   = report.location.coordinates[1];
              const lng   = report.location.coordinates[0];
              const color = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.medium;
              const icon  = makePinIcon(Lx, color);
              const marker = Lx.marker([lat, lng], { icon });
              marker.on('click', () => onSelect(report));
              clusterGroup.addLayer(marker);
            });

            if (!cancelled) map.addLayer(clusterGroup);
          };

          init();

          return () => {
            cancelled = true;
            if (clusterGroup) map.removeLayer(clusterGroup);
          };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [map]); // el key del padre fuerza remount — aquí solo necesitamos [map]
        return null;
      };

      const FlyToLocation = ({ coords }) => {
        const map = useMap();
        useEffect(() => {
          if (coords) map.flyTo(coords, 14, { duration: 1.2 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [coords?.[0], coords?.[1]]);
        return null;
      };

      setMapComponents({ MapContainer, TileLayer, L: L.default, HeatLayer, ClusterLayer, FlyToLocation });
    };
    loadMap();
  }, []);

  const center = reportsWithCoords.length > 0
    ? [reportsWithCoords[0].location.coordinates[1], reportsWithCoords[0].location.coordinates[0]]
    : [1.2136, -77.2811];

  const cityName = reportsWithCoords[0]?.location?.city || 'tu ciudad';

  return (
    <div className="fixed inset-0 pb-20">

      <div className="absolute inset-0">
        {!MapComponents ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
              <p className="text-gray-500 text-sm">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <MapComponents.MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <MapComponents.TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />

            {viewMode === 'pins' && filtered.length > 0 && (
              <MapComponents.ClusterLayer
                key={clusterKey}
                reports={filtered}
                onSelect={report => setSelected(report)}
              />
            )}

            {viewMode === 'heat' && heatPoints.length > 0 && (
              <MapComponents.HeatLayer points={heatPoints} />
            )}

            {userLocation && <MapComponents.FlyToLocation coords={userLocation} />}
          </MapComponents.MapContainer>
        )}
      </div>

      <div
        className="absolute top-0 left-0 right-0 z-[1000] px-4 pointer-events-none flex flex-col gap-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div
          className="bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 pointer-events-auto"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
        >
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <HiLocationMarker className="text-white text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-extrabold text-gray-900">Mapa de Reportes</h1>
            <p className="text-gray-400 text-xs">
              {filtered.length} reporte{filtered.length !== 1 ? 's' : ''}
              {(priorityFilter || statusFilter || nearMeActive) && (
                <span className="text-blue-500 font-semibold"> · filtrado</span>
              )}
              {nearMeActive && (
                <span className="text-blue-500 font-semibold"> · ≤5km</span>
              )}
              {' · '}{cityName}
            </p>
          </div>

          <button
            onClick={() => {
              if (nearMeActive) {
                setNearMeActive(false);
                setUserLocation(null);
                return;
              }
              setLocating(true);
              navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                  setUserLocation([coords.latitude, coords.longitude]);
                  setNearMeActive(true);
                  setLocating(false);
                  setSelected(null);
                },
                () => { setLocating(false); },
                { enableHighAccuracy: true, timeout: 8000 }
              );
            }}
            disabled={locating}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 mr-1 ${
              nearMeActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-500'
            }`}
            title="Cerca de mí (5 km)"
          >
            {locating ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <HiLocationMarker className="text-base" />
            )}
          </button>

          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 flex-shrink-0">
            <button
              onClick={() => { setViewMode('pins'); setSelected(null); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'pins' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              <HiMap className="text-sm" />
              Pines
            </button>
            <button
              onClick={() => { setViewMode('heat'); setSelected(null); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'heat' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'
              }`}
            >
              <HiFire className="text-sm" />
              Calor
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="flex gap-1.5 bg-white/90 backdrop-blur-xl rounded-xl p-1 shadow"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            {[
              { id: 'priority', label: '🎯 Prioridad' },
              { id: 'status',   label: '📋 Estado'    },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filterTab === 'priority'
              ? PRIORITY_FILTERS.map((f) => {
                  const cfg = f.value ? PRIORITY_CONFIG[f.value] : null;
                  const isActive = priorityFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => { setPriorityFilter(f.value); setSelected(null); }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white text-gray-900 shadow-md border border-gray-100'
                          : 'bg-white/85 backdrop-blur-md text-gray-500 border border-white/60 shadow-sm'
                      }`}
                    >
                      {cfg && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                      {f.label}
                    </button>
                  );
                })
              : STATUS_FILTERS.map((f) => {
                  const cfg = f.value ? STATUS_CONFIG[f.value] : null;
                  const isActive = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => { setStatusFilter(f.value); setSelected(null); }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white text-gray-900 shadow-md border border-gray-100'
                          : 'bg-white/85 backdrop-blur-md text-gray-500 border border-white/60 shadow-sm'
                      }`}
                    >
                      {cfg && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                      {f.label}
                    </button>
                  );
                })
            }
          </div>
        </div>

        {viewMode === 'heat' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-xl rounded-xl px-3 py-2 shadow pointer-events-auto flex items-center gap-2"
          >
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Densidad</span>
            <div className="flex-1 h-2.5 rounded-full" style={{
              background: 'linear-gradient(to right, #4ade80, #facc15, #fb923c, #f87171, #dc2626)'
            }} />
            <div className="flex items-center justify-between w-16">
              <span className="text-[9px] text-gray-400 font-medium">Baja</span>
              <span className="text-[9px] text-gray-400 font-medium">Alta</span>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selected && viewMode === 'pins' && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-24 left-0 right-0 z-[1001] px-4"
          >
            <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {STATUS_CONFIG[selected.status] && (
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                      selected.status === 'resolved'   ? 'bg-green-50 text-green-700' :
                      selected.status === 'inProgress' ? 'bg-violet-50 text-violet-700' :
                      selected.status === 'rejected'   ? 'bg-red-50 text-red-700' :
                                                         'bg-orange-50 text-orange-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status].dot}`} />
                      {STATUS_CONFIG[selected.status].label}
                    </span>
                  )}
                  {PRIORITY_CONFIG[selected.priority] && (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-50 text-gray-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[selected.priority].dot}`} />
                      {PRIORITY_CONFIG[selected.priority].label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <HiX className="text-gray-500 text-sm" />
                </button>
              </div>

              <h3 className="text-base font-extrabold text-gray-900 leading-snug mb-3">
                {selected.title}
              </h3>

              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-4">
                <HiLocationMarker className="text-blue-500 flex-shrink-0 text-base" />
                <span className="text-xs text-gray-600 font-medium truncate">
                  {selected.location?.address ||
                    [selected.location?.neighborhood, selected.location?.city].filter(Boolean).join(', ') ||
                    'Sin dirección'}
                </span>
              </div>

              <button
                onClick={() => navigate(`/reports/${selected._id}`)}
                className="w-full text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
              >
                Ver detalle
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapPage;
