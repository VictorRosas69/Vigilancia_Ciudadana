import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiChevronUp, HiChevronDown } from 'react-icons/hi';
import reportService from '../services/reportService';

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

const inputClass = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

const EditReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    workType: '',
    priority: 'medium',
    location: { address: '', city: '', neighborhood: '' },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportService.getById(id),
  });

  // Pre-llenar el formulario cuando lleguen los datos
  useEffect(() => {
    if (data?.report && !ready) {
      const r = data.report;
      setForm({
        title: r.title || '',
        description: r.description || '',
        workType: r.workType || '',
        priority: r.priority || 'medium',
        location: {
          address:      r.location?.address      || '',
          city:         r.location?.city         || '',
          neighborhood: r.location?.neighborhood || '',
        },
      });
      setReady(true);
    }
  }, [data]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, location: { ...prev.location, [name]: value } }));
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
      await reportService.update(id, {
        title: form.title,
        description: form.description,
        workType: form.workType,
        priority: form.priority,
        'location.address':      form.location.address,
        'location.city':         form.location.city,
        'location.neighborhood': form.location.neighborhood,
      });
      toast.success('Reporte actualizado');
      navigate(`/reports/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = WORK_TYPES.find(t => t.value === form.workType);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-5 pt-12 pb-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0"
        >
          <HiArrowLeft className="text-xl text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Editar Reporte</h1>
          <p className="text-gray-400 text-sm">Modifica los detalles del reporte</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">

        {/* Información */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col gap-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span>📋</span> Información del reporte
          </h2>

          <div>
            <label className="text-sm font-medium text-gray-800 mb-2 block">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Título del reporte"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800 mb-2 block">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe el problema..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Tipo de obra */}
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

        {/* Prioridad */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚡</span> Prioridad
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
                    <span className={`text-base font-bold ${isSelected ? p.text : 'text-gray-800'}`}>{p.label}</span>
                  </div>
                  <p className={`text-xs ml-5 ${isSelected ? p.text : 'text-gray-400'}`}>{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span>📍</span> Ubicación
          </h2>
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

        {/* Botón guardar */}
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
              Guardando...
            </>
          ) : '💾 Guardar cambios'}
        </motion.button>

      </form>
    </div>
  );
};

export default EditReportPage;
