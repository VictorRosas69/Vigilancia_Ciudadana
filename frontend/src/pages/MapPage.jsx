import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import reportService from '../services/reportService';

const PRIORITY_COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

const PRIORITY_LABELS = {
  low:      '🟢 Baja',
  medium:   '🟡 Media',
  high:     '🟠 Alta',
  critical: '🔴 Crítica',
};

const STATUS_LABELS = {
  pending:    'Pendiente',
  verified:   'Verificado',
  inProgress: 'En progreso',
  resolved:   'Resuelto',
  rejected:   'Rechazado',
};

const MapPage = () => {
  const navigate = useNavigate();
  const [MapComponents, setMapComponents] = useState(null);

  const { data } = useQuery({
    queryKey: ['reports-map'],
    queryFn: () => reportService.getAll({ limit: 100 }),
  });

  const reports = data?.reports || [];
  const reportsWithCoords = reports.filter(r =>
    r.location?.coordinates &&
    r.location.coordinates[0] !== 0 &&
    r.location.coordinates[1] !== 0
  );

  useEffect(() => {
    const loadMap = async () => {
      const L = await import('leaflet');
      const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');

      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      setMapComponents({ MapContainer, TileLayer, Marker, Popup, L: L.default });
    };
    loadMap();
  }, []);

  const center = reportsWithCoords.length > 0
    ? [reportsWithCoords[0].location.coordinates[1], reportsWithCoords[0].location.coordinates[0]]
    : [1.2136, -77.2811];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 pt-12 pb-4">
        <h1 className="text-white text-xl font-bold">🗺️ Mapa de Reportes</h1>
        <p className="text-blue-200 text-sm mt-1">
          {reportsWithCoords.length} reporte{reportsWithCoords.length !== 1 ? 's' : ''} con ubicación
        </p>
      </div>

      {/* Leyenda de prioridades */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <p className="text-xs text-gray-500 font-medium mb-2">Color por prioridad:</p>
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[key] }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <div className="h-[calc(100vh-220px)]">
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
          >
            <MapComponents.TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reportsWithCoords.map((report) => {
              const lat = report.location.coordinates[1];
              const lng = report.location.coordinates[0];
              const color = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.medium;

              const icon = MapComponents.L.divIcon({
                html: `<div style="
                  background:${color};
                  width:32px;height:32px;
                  border-radius:50% 50% 50% 0;
                  transform:rotate(-45deg);
                  border:3px solid white;
                  box-shadow:0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              });

              return (
                <MapComponents.Marker key={report._id} position={[lat, lng]} icon={icon}>
                  <MapComponents.Popup>
                    <div style={{ minWidth: '200px' }}>
                      {/* Prioridad y estado */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <span style={{
                          background: color, color: 'white',
                          fontSize: '11px', padding: '2px 8px',
                          borderRadius: '999px', fontWeight: '600'
                        }}>
                          {PRIORITY_LABELS[report.priority]}
                        </span>
                        <span style={{
                          background: '#f3f4f6', color: '#374151',
                          fontSize: '11px', padding: '2px 8px',
                          borderRadius: '999px'
                        }}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </div>
                      {/* Título */}
                      <p style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                        {report.title}
                      </p>
                      {/* Ubicación */}
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        📍 {report.location?.address || report.location?.neighborhood || report.location?.city || 'Sin dirección'}
                      </p>
                      {/* Botón */}
                      <button
                        onClick={() => navigate('/reports/' + report._id)}
                        style={{
                          background: '#2563eb', color: 'white',
                          border: 'none', padding: '8px 12px',
                          borderRadius: '8px', cursor: 'pointer',
                          fontSize: '12px', width: '100%',
                          fontWeight: '600'
                        }}
                      >
                        Ver detalle →
                      </button>
                    </div>
                  </MapComponents.Popup>
                </MapComponents.Marker>
              );
            })}
          </MapComponents.MapContainer>
        )}
      </div>
    </div>
  );
};

export default MapPage;