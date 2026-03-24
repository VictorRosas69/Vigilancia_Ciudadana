import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { HiArrowLeft, HiCamera, HiX, HiChevronUp, HiChevronDown } from 'react-icons/hi';
import { HiOutlineSignal, HiOutlineMap } from 'react-icons/hi2';
import reportService from '../services/reportService';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
};

const WORK_TYPES = [
  { value: 'road',      icon: '🛣️',  label: 'Vía / Carretera' },
  { value: 'sidewalk',  icon: '🚶',  label: 'Andén / Acera' },
  { value: 'park',      icon: '🌳',  label: 'Parque / Espacio público' },
  { value: 'building',  icon: '🏢',  label: 'Edificio / Construcción' },
  { value: 'drainage',  icon: '🔧',  label: 'Tubería / Alcantarilla' },
  { value: 'lighting',  icon: '💡',  label: 'Alumbrado público' },
  { value: 'bridge',    icon: '🌉',  label: 'Puente / Paso elevado' },
  { value: 'water',     icon: '🚰',  label: 'Acueducto / Agua' },
  { value: 'other',     icon: '⚙️',  label: 'Otro' },
];

const PRIORITIES = [
  { value: 'low',      dot: 'bg-green-500',  border: 'border-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  label: 'Baja',    desc: 'Sin urgencia' },
  { value: 'medium',   dot: 'bg-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Media',   desc: 'Moderada' },
  { value: 'high',     dot: 'bg-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Alta',    desc: 'Urgente' },
  { value: 'critical', dot: 'bg-red-500',    border: 'border-red-500',    bg: 'bg-red-50',    text: 'text-red-700',   label: 'Crítica', desc: 'Inmediata' },
];

const inputClass = 'w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-base';

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [locationMode, setLocationMode] = useState(null);
  const [MapComponents, setMapComponents] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    workType: '',
    priority: 'medium',
    location: { address: '', city: '', neighborhood: '', coordinates: null },
  });

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    setForm(prev => ({ ...prev, location: { ...prev.location, [name]: value } }));
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) { toast.error('Tu dispositivo no soporta geolocalización'); return; }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setForm(prev => ({ ...prev, location: { ...prev.location, coordinates: [longitude, latitude] } }));
        setLoadingLocation(false);
        setLocationMode('gps');
        toast.success('📍 Ubicación GPS obtenida');

        // Geocodificación inversa — rellenar ciudad, barrio y dirección automáticamente
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          );
          const geo = await res.json();
          const addr = geo.address || {};
          const city        = addr.city || addr.town || addr.municipality || addr.county || '';
          const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '';
          const address     = addr.road
            ? `${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}`
            : geo.display_name?.split(',')[0] || '';

          setForm(prev => ({
            ...prev,
            location: {
              ...prev.location,
              city:         prev.location.city        || city,
              neighborhood: prev.location.neighborhood || neighborhood,
              address:      prev.location.address      || address,
            },
          }));
          if (city || neighborhood) toast.success('✅ Dirección completada automáticamente');
        } catch {
          // Fallo silencioso — el usuario puede llenar manualmente
        }
      },
      () => { toast.error('No se pudo obtener el GPS'); setLoadingLocation(false); }
    );
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) { toast.error('Máximo 5 imágenes'); return; }

    setCompressing(true);
    const toastId = toast.loading(`Optimizando ${files.length > 1 ? files.length + ' imágenes' : 'imagen'}...`);
    try {
      const compressed = await Promise.all(
        files.map(f => imageCompression(f, COMPRESSION_OPTIONS))
      );
      setImages(prev => [...prev, ...compressed]);
      setPreviews(prev => [...prev, ...compressed.map(f => URL.createObjectURL(f))]);
      toast.success('Imágenes listas', { id: toastId });
    } catch {
      toast.error('Error al procesar las imágenes', { id: toastId });
    } finally {
      setCompressing(false);
    }
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
    if (!form.location.city) { toast.error('Ingresa al menos la ciudad'); return; }
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

  const LocationPicker = () => {
    if (!MapComponents) return null;
    const { useMapEvents, Marker } = MapComponents;
    const [markerPos, setMarkerPos] = useState(
      form.location.coordinates ? [form.location.coordinates[1], form.location.coordinates[0]] : null
    );
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPos([lat, lng]);
        setForm(prev => ({ ...prev, location: { ...prev.location, coordinates: [lng, lat] } }));
        toast.success(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
    });
    return markerPos ? <Marker position={markerPos} /> : null;
  };

  const selectedType = WORK_TYPES.find(t => t.value === form.workType);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
        </div>
        <div className="relative px-5 pt-12 pb-5 flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <HiArrowLeft className="text-white text-xl" />
          </button>
          <div>
            <h1 className="text-white text-xl font-extrabold leading-tight tracking-tight">Nuevo Reporte</h1>
            <p className="text-blue-200/70 text-sm font-medium">Completa todos los campos</p>
          </div>
        </div>
        <div className="h-4 rounded-t-[24px] bg-gray-50" />
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">

        {/* ── Fotos ── */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>📷</span> Fotos del reporte
          </h2>

          {/* Grid: 1 grande + 4 pequeñas */}
          <div className="grid grid-cols-3 grid-rows-2 gap-2 h-52">

            {/* Slot principal — ocupa 2 filas */}
            <div className="row-span-2 col-span-1">
              {previews[0] ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(0)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs">
                    <HiX />
                  </button>
                </div>
              ) : (
                <label className="w-full h-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <HiCamera className="text-3xl text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400">Foto principal</span>
                  <input type="file" accept="image/*" onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>

            {/* 4 slots secundarios */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="col-span-1">
                {previews[i] ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs">
                      <HiX />
                    </button>
                  </div>
                ) : (
                  <label className={`w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer transition-colors ${images.length < 5 ? 'hover:border-blue-400 hover:bg-blue-50' : 'opacity-40 cursor-not-allowed'}`}>
                    <span className="text-2xl text-gray-300">+</span>
                    {images.length < 5 && <input type="file" accept="image/*" onChange={handleImages} className="hidden" />}
                  </label>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Máximo 5 fotos · {compressing ? '⚡ Optimizando...' : 'Se comprimen automáticamente'}
          </p>
        </div>

        {/* ── Información del reporte ── */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col gap-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span>📋</span> Información del reporte
          </h2>

          {/* Título */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-800">
                Título del reporte <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-semibold tabular-nums ${form.title.length > 90 ? 'text-red-400' : form.title.length > 70 ? 'text-orange-400' : 'text-gray-400'}`}>
                {form.title.length}/100
              </span>
            </div>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              placeholder="Ej: Vía destruida en la Carrera 15"
              className={inputClass}
            />
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-800">
                Descripción detallada <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-semibold tabular-nums ${form.description.length > 1800 ? 'text-red-400' : form.description.length > 1400 ? 'text-orange-400' : 'text-gray-400'}`}>
                {form.description.length}/2000
              </span>
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={2000}
              placeholder="Describe el problema con el mayor detalle posible..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Tipo de obra — dropdown personalizado */}
          <div ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-800 mb-2 block">
              Tipo de obra <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className={selectedType ? 'text-gray-800' : 'text-gray-400'}>
                {selectedType ? `${selectedType.icon} ${selectedType.label}` : 'Selecciona el tipo de obra'}
              </span>
              {dropdownOpen ? <HiChevronUp className="text-gray-400" /> : <HiChevronDown className="text-gray-400" />}
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden origin-top"
                >
                  {WORK_TYPES.map((t, i) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setForm(prev => ({ ...prev, workType: t.value })); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3.5 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        form.workType === t.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      } ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Prioridad ── */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚡</span> Prioridad del reporte
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PRIORITIES.map(p => {
              const isSelected = form.priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected ? `${p.border} ${p.bg}` : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${p.dot}`} />
                    <span className={`text-base font-bold ${isSelected ? p.text : 'text-gray-800'}`}>
                      {p.label}
                    </span>
                  </div>
                  <p className={`text-xs ml-5 ${isSelected ? p.text : 'text-gray-400'}`}>{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Ubicación ── */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span>📍</span> Ubicación
          </h2>

          {/* Botones GPS / Mapa */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={getGPSLocation}
              disabled={loadingLocation}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all ${
                locationMode === 'gps'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              <HiOutlineSignal className="text-lg" />
              {loadingLocation ? 'Obteniendo...' : 'Usar GPS'}
            </button>
            <button
              type="button"
              onClick={() => setLocationMode(locationMode === 'map' ? null : 'map')}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all ${
                locationMode === 'map'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              <HiOutlineMap className="text-lg" />
              Mapa
            </button>
          </div>

          {/* GPS confirmado */}
          {locationMode === 'gps' && form.location.coordinates && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-green-600 text-sm">✅</span>
              <p className="text-sm text-green-700 font-medium">
                GPS: {form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)}
              </p>
            </div>
          )}

          {/* Mapa interactivo */}
          {locationMode === 'map' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-blue-600 font-medium">Toca en el mapa para seleccionar la ubicación</p>
              <div className="h-56 rounded-2xl overflow-hidden border border-gray-200">
                {!MapComponents ? (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <MapComponents.MapContainer center={[1.2136, -77.2811]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapComponents.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker />
                  </MapComponents.MapContainer>
                )}
              </div>
              {form.location.coordinates && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-green-600 text-sm">✅</span>
                  <p className="text-sm text-green-700 font-medium">
                    {form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Campos de texto */}
          <input
            name="city"
            value={form.location.city}
            onChange={handleLocationChange}
            placeholder="Ciudad / Municipio"
            className={inputClass}
          />
          <input
            name="neighborhood"
            value={form.location.neighborhood}
            onChange={handleLocationChange}
            placeholder="Barrio / Localidad"
            className={inputClass}
          />
          <input
            name="address"
            value={form.location.address}
            onChange={handleLocationChange}
            placeholder="Dirección exacta"
            className={inputClass}
          />
        </div>

        {/* ── Botón publicar ── */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
