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

const inputClass = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base bg-gray-50/50';

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f8fafc' }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-12 pb-5 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <HiArrowLeft className="text-white text-xl" />
          </motion.button>
          <div>
            <h1 className="text-white text-xl font-extrabold tracking-tight">Editar Reporte</h1>
            <p className="text-blue-200/70 text-sm mt-0.5 font-medium">Modifica los detalles</p>
          </div>
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: '#f8fafc' }} />
      </div>

      <form onSubmit={handleSubmit} className="px-5 -mt-1 flex flex-col gap-4">

        {/* ── Información ── */}
        <div className="bg-white rounded-3xl p-5 flex flex-col gap-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span>📋</span> Información del reporte
          </p>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
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
            <label className="text-sm font-bold text-gray-700 mb-2 block">
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
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              Tipo de obra <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-base flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
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
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                >
                  {WORK_TYPES.map((t, i) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setForm(prev => ({ ...prev, workType: t.value })); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3.5 text-sm flex items-center gap-3 transition-colors ${
                        form.workType === t.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      } ${i !== 0 ? 'border-t border-gray-50' : ''}`}
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
        <div className="bg-white rounded-3xl p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚡</span> Prioridad
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PRIORITIES.map(p => {
              const isSelected = form.priority === p.value;
              return (
                <motion.button
                  key={p.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
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
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Ubicación ── */}
        <div className="bg-white rounded-3xl p-5 flex flex-col gap-4"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span>📍</span> Ubicación
          </p>
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

        {/* ── Guardar ── */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full text-white font-bold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 text-base"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 6px 20px rgba(37,99,235,0.38)',
          }}
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
