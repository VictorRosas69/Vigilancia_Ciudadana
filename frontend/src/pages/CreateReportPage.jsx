import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiCamera, HiLocationMarker, HiX, HiMap, HiCursorClick } from 'react-icons/hi';
import reportService from '../services/reportService';

const WORK_TYPES = [
  { value: 'road',     label: '🛣️ Vía / Carretera' },
  { value: 'sidewalk', label: '🚶 Andén / Acera' },
  { value: 'park',     label: '🌳 Parque / Zona verde' },
  { value: 'building', label: '🏢 Edificio / Estructura' },
  { value: 'drainage', label: '💧 Drenaje / Alcantarilla' },
  { value: 'lighting', label: '💡 Alumbrado público' },
  { value: 'bridge',   label: '🌉 Puente / Paso' },
  { value: 'water',    label: '🚰 Acueducto / Agua' },
  { value: 'other',    label: '🔧 Otro' },
];

const PRIORITIES = [
  { value: 'low',      label: '🟢 Baja',    desc: 'No urgente' },
  { value: 'medium',   label: '🟡 Media',   desc: 'Moderada' },
  { value: 'high',     label: '🟠 Alta',    desc: 'Urgente' },
  { value: 'critical', label: '🔴 Crítica', desc: 'Emergencia' },
];

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [locationMode, setLocationMode] = useState(null); // 'gps' | 'map'
  const [MapComponents, setMapComponents] = useState(null);
  const markerRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    workType: '',
    priority: 'medium',
    location: {
      address: '',
      city: '',
      neighborhood: '',
      coordinates: null,
    },
  });

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    if (locationMode === 'map') {
      const loadMap = async () => {
        const L = await import('leaflet');
        const { MapContainer, TileLayer, Marker, useMapEvents } = await import('react-leaflet');

        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setMapComponents({ MapContainer, TileLayer, Marker, useMapEvents, L: L.default });
      };
      loadMap();
    }
  }, [locationMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      location: { ...prev.location, [name]: value }
    }));
  };

  // GPS automático
  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu dispositivo no soporta geolocalización');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          location: { ...prev.location, coordinates: [longitude, latitude] }
        }));
        toast.success('📍 Ubicación GPS obtenida');
        setLoadingLocation(false);
        setLocationMode('gps');
      },
      () => {
        toast.error('No se pudo obtener el GPS');
        setLoadingLocation(false);
      }
    );
  };

  // Imágenes
  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Máximo 5 imágenes');
      return;
    }
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.workType) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (!form.location.city) {
      toast.error('Ingresa al menos la ciudad');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('workType', form.workType);
      formData.append('priority', form.priority);
      formData.append('location[address]', form.location.address);
      formData.append('location[city]', form.location.city);
      formData.append('location[neighborhood]', form.location.neighborhood);

      if (form.location.coordinates) {
        formData.append('lat', form.location.coordinates[1]);
        formData.append('lng', form.location.coordinates[0]);
      }

      images.forEach(img => formData.append('images', img));

      await reportService.create(formData);
      toast.success('¡Reporte creado exitosamente! 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Componente interno para capturar clics en el mapa
  const LocationPicker = () => {
    if (!MapComponents) return null;
    const { useMapEvents, Marker } = MapComponents;
    const [markerPos, setMarkerPos] = useState(
      form.location.coordinates
        ? [form.location.coordinates[1], form.location.coordinates[0]]
        : null
    );

    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPos([lat, lng]);
        setForm(prev => ({
          ...prev,
          location: { ...prev.location, coordinates: [lng, lat] }
        }));
        toast.success(`📍 Ubicación seleccionada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
    });

    return markerPos ? <Marker position={markerPos} /> : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-4 flex items-center gap-3 border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <HiArrowLeft className="text-xl text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Nuevo Reporte</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-5">

        {/* Imágenes */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">📸 Fotos de la obra</h2>
          <div className="flex gap-3 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                  <HiX />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <HiCamera className="text-2xl text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Agregar</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">{images.length}/5 fotos</p>
        </div>

        {/* Información básica */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">📋 Información del reporte</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Título <span className="text-red-500">*</span>
            </label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="Ej: Hueco en la vía principal sin reparar"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe el problema, cuánto tiempo lleva abandonado..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Tipo de obra <span className="text-red-500">*</span>
            </label>
            <select name="workType" value={form.workType} onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un tipo...</option>
              {WORK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Prioridad</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.priority === p.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}>
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">📍 Ubicación</h2>

          {/* Selector de modo */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={getGPSLocation}
              disabled={loadingLocation}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                locationMode === 'gps'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">📡</span>
              <p className="text-sm font-semibold text-gray-700">
                {loadingLocation ? 'Obteniendo...' : 'Usar GPS'}
              </p>
              <p className="text-xs text-gray-400 text-center">Posición actual automática</p>
            </button>

            <button
              type="button"
              onClick={() => setLocationMode('map')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                locationMode === 'map'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">🗺️</span>
              <p className="text-sm font-semibold text-gray-700">Seleccionar en mapa</p>
              <p className="text-xs text-gray-400 text-center">Toca el mapa para marcar</p>
            </button>
          </div>

          {/* Confirmación GPS */}
          {locationMode === 'gps' && form.location.coordinates && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <p className="text-sm text-green-700 font-medium">
                GPS: {form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)}
              </p>
            </div>
          )}

          {/* Mapa interactivo */}
          {locationMode === 'map' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                <HiCursorClick /> Toca en el mapa para seleccionar la ubicación
              </p>
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                {!MapComponents ? (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <MapComponents.MapContainer
                    center={[1.2136, -77.2811]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapComponents.TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker />
                  </MapComponents.MapContainer>
                )}
              </div>
              {form.location.coordinates && locationMode === 'map' && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <p className="text-sm text-green-700 font-medium">
                    Ubicación: {form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Campos de texto */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Ciudad <span className="text-red-500">*</span>
            </label>
            <input name="city" value={form.location.city} onChange={handleLocationChange}
              placeholder="Ej: Pasto"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Barrio / Sector</label>
            <input name="neighborhood" value={form.location.neighborhood} onChange={handleLocationChange}
              placeholder="Ej: Centro, El Bosque..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Dirección</label>
            <input name="address" value={form.location.address} onChange={handleLocationChange}
              placeholder="Ej: Calle 18 # 25-40"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Botón enviar */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Publicando...
            </>
          ) : '🚨 Publicar Reporte'}
        </motion.button>

      </form>
    </div>
  );
};

export default CreateReportPage;