import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Ilustraciones SVG para cada slide ─── */

const IllustrationReport = () => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Mapa base */}
    <rect x="30" y="60" width="160" height="110" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    {/* Calles */}
    <line x1="30" y1="110" x2="190" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
    <line x1="110" y1="60" x2="110" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
    {/* Manzanas */}
    <rect x="40" y="70" width="60" height="30" rx="6" fill="rgba(99,102,241,0.3)" />
    <rect x="120" y="70" width="60" height="30" rx="6" fill="rgba(59,130,246,0.25)" />
    <rect x="40" y="120" width="60" height="40" rx="6" fill="rgba(59,130,246,0.25)" />
    <rect x="120" y="120" width="60" height="40" rx="6" fill="rgba(99,102,241,0.2)" />
    {/* Pin principal con glow */}
    <circle cx="110" cy="95" r="22" fill="rgba(239,68,68,0.2)" />
    <circle cx="110" cy="95" r="14" fill="rgba(239,68,68,0.35)" />
    <circle cx="110" cy="95" r="9" fill="#ef4444" />
    <circle cx="110" cy="95" r="4" fill="white" />
    {/* Línea del pin */}
    <line x1="110" y1="104" x2="110" y2="117" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    {/* Notificación flotante */}
    <rect x="125" y="72" width="54" height="26" rx="8" fill="white" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
    <circle cx="137" cy="85" r="5" fill="#ef4444" />
    <rect x="146" y="81" width="24" height="3" rx="1.5" fill="#e2e8f0" />
    <rect x="146" y="87" width="18" height="3" rx="1.5" fill="#e2e8f0" />
    {/* Iconos de edificios */}
    <rect x="50" y="75" width="12" height="20" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="65" y="79" width="8" height="16" rx="2" fill="rgba(255,255,255,0.15)" />
    <rect x="130" y="76" width="10" height="19" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="143" y="80" width="14" height="15" rx="2" fill="rgba(255,255,255,0.15)" />
  </svg>
);

const IllustrationCamera = () => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Teléfono */}
    <rect x="60" y="30" width="100" height="145" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    <rect x="66" y="44" width="88" height="118" rx="12" fill="rgba(15,23,42,0.6)" />
    {/* Pantalla de cámara */}
    <rect x="66" y="44" width="88" height="90" rx="12" fill="rgba(30,58,138,0.7)" />
    {/* Cuadro de enfoque */}
    <rect x="86" y="58" width="48" height="48" rx="4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="8 4" />
    {/* Sujeto enfocado - bache en calle */}
    <rect x="95" y="75" width="30" height="12" rx="3" fill="rgba(239,68,68,0.5)" />
    <ellipse cx="110" cy="81" rx="11" ry="5" fill="rgba(239,68,68,0.7)" />
    {/* Esquinas del viewfinder */}
    <path d="M86 66 L86 58 L94 58" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M126 58 L134 58 L134 66" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M86 98 L86 106 L94 106" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M126 106 L134 106 L134 98" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Botón cámara */}
    <circle cx="110" cy="148" r="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    <circle cx="110" cy="148" r="7" fill="white" />
    {/* Galería y switch */}
    <rect x="74" y="143" width="18" height="12" rx="4" fill="rgba(255,255,255,0.2)" />
    <circle cx="146" cy="148" r="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    {/* Flash */}
    <circle cx="128" cy="50" r="3" fill="rgba(255,255,255,0.4)" />
    {/* Destellos decorativos */}
    <circle cx="165" cy="45" r="3" fill="rgba(255,255,255,0.3)" />
    <circle cx="55" cy="80" r="2" fill="rgba(255,255,255,0.2)" />
    <circle cx="175" cy="130" r="4" fill="rgba(59,130,246,0.4)" />
    {/* Badge "Evidencia" */}
    <rect x="68" y="140" width="0" height="0" rx="0" fill="none" />
    <rect x="30" y="95" width="52" height="22" rx="8" fill="white" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
    <circle cx="42" cy="106" r="5" fill="#22c55e" />
    <rect x="50" y="102" width="24" height="3" rx="1.5" fill="#e2e8f0" />
    <rect x="50" y="108" width="18" height="3" rx="1.5" fill="#e2e8f0" />
  </svg>
);

const IllustrationTracking = () => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Tarjeta de seguimiento principal */}
    <rect x="25" y="30" width="170" height="145" rx="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
    {/* Header de la tarjeta */}
    <rect x="25" y="30" width="170" height="44" rx="20" fill="rgba(255,255,255,0.1)" />
    <rect x="25" y="54" width="170" height="20" fill="rgba(255,255,255,0.1)" />
    <circle cx="50" cy="52" r="14" fill="rgba(59,130,246,0.3)" />
    <path d="M44 52 L48 56 L56 47" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="72" y="44" width="80" height="5" rx="2.5" fill="rgba(255,255,255,0.5)" />
    <rect x="72" y="53" width="55" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
    {/* Progress timeline */}
    {/* Paso 1 - Completado */}
    <circle cx="55" cy="100" r="10" fill="#22c55e" />
    <path d="M50 100 L54 104 L61 96" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="72" y="96" width="65" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="72" y="103" width="45" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
    {/* Línea conectora */}
    <line x1="55" y1="110" x2="55" y2="126" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3 3" />
    {/* Paso 2 - En curso */}
    <circle cx="55" cy="136" r="10" fill="rgba(59,130,246,0.8)" />
    <circle cx="55" cy="136" r="4" fill="white" />
    <rect x="72" y="132" width="75" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
    <rect x="72" y="139" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
    {/* Línea conectora */}
    <line x1="55" y1="146" x2="55" y2="162" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="3 3" />
    {/* Paso 3 - Pendiente */}
    <circle cx="55" cy="162" r="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    <rect x="72" y="158" width="55" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="72" y="165" width="38" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
    {/* Badge de notificación */}
    <rect x="140" y="88" width="58" height="26" rx="10" fill="white" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.25))' }} />
    <circle cx="152" cy="101" r="5" fill="#f59e0b" />
    <rect x="161" y="97" width="28" height="3" rx="1.5" fill="#e2e8f0" />
    <rect x="161" y="103" width="20" height="3" rx="1.5" fill="#e2e8f0" />
  </svg>
);

const IllustrationCommunity = () => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Edificio / ciudad en fondo */}
    <rect x="20" y="110" width="30" height="65" rx="4" fill="rgba(255,255,255,0.06)" />
    <rect x="25" y="100" width="20" height="10" rx="2" fill="rgba(255,255,255,0.1)" />
    <rect x="170" y="95" width="30" height="80" rx="4" fill="rgba(255,255,255,0.06)" />
    <rect x="145" y="120" width="25" height="55" rx="4" fill="rgba(255,255,255,0.08)" />
    {/* Avatares de la comunidad */}
    {/* Avatar 1 - izquierda abajo */}
    <circle cx="55" cy="140" r="22" fill="rgba(99,102,241,0.3)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
    <circle cx="55" cy="133" r="8" fill="rgba(255,255,255,0.4)" />
    <ellipse cx="55" cy="152" rx="12" ry="7" fill="rgba(255,255,255,0.3)" />
    {/* Avatar 2 - derecha abajo */}
    <circle cx="165" cy="140" r="22" fill="rgba(59,130,246,0.3)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
    <circle cx="165" cy="133" r="8" fill="rgba(255,255,255,0.4)" />
    <ellipse cx="165" cy="152" rx="12" ry="7" fill="rgba(255,255,255,0.3)" />
    {/* Avatar 3 - centro arriba (más grande, protagonista) */}
    <circle cx="110" cy="105" r="30" fill="rgba(37,99,235,0.5)" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
    <circle cx="110" cy="96" r="11" fill="rgba(255,255,255,0.5)" />
    <ellipse cx="110" cy="120" rx="16" ry="9" fill="rgba(255,255,255,0.4)" />
    {/* Escudo badge en avatar central */}
    <circle cx="132" cy="83" r="11" fill="#3b82f6" stroke="white" strokeWidth="2" />
    <path d="M132 77 C132 77 126 79 126 83 C126 87 129 90 132 92 C135 90 138 87 138 83 C138 79 132 77 132 77Z" fill="rgba(255,255,255,0.3)" />
    <path d="M129 83 L131 85 L136 80" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* Líneas de conexión */}
    <line x1="77" y1="130" x2="90" y2="118" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />
    <line x1="143" y1="130" x2="130" y2="118" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />
    {/* Estrella / stats flotantes */}
    <rect x="30" y="95" width="42" height="22" rx="8" fill="white" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
    <text x="37" y="110" fontSize="10" fill="#f59e0b" fontWeight="bold">★ 4.9</text>
    <rect x="148" y="95" width="42" height="22" rx="8" fill="white" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
    <text x="153" y="110" fontSize="9" fill="#3b82f6" fontWeight="bold">+2.4k</text>
    {/* Corazón flotante */}
    <circle cx="110" cy="60" r="16" fill="rgba(239,68,68,0.2)" />
    <path d="M110 68 C107 64 100 62 100 57 C100 53 103 51 106 51 C108 51 110 53 110 53 C110 53 112 51 114 51 C117 51 120 53 120 57 C120 62 113 64 110 68Z" fill="#ef4444" />
  </svg>
);

/* ─── Datos de los slides ─── */
const slides = [
  {
    id: 0,
    tag: 'Bienvenido',
    title: 'Tu ciudad,\ntu responsabilidad',
    subtitle:
      'Vigilancia Ciudadana es la plataforma que conecta a los ciudadanos con las autoridades para mejorar juntos la ciudad.',
    illustration: <IllustrationReport />,
    accent: '#ef4444',
    accentLight: 'rgba(239,68,68,0.15)',
  },
  {
    id: 1,
    tag: 'Paso 1',
    title: 'Reporta en\nsegundos',
    subtitle:
      'Toma una foto, añade la ubicación exacta y describe el problema. Baches, alumbrado, basura — todo en menos de un minuto.',
    illustration: <IllustrationCamera />,
    accent: '#3b82f6',
    accentLight: 'rgba(59,130,246,0.15)',
  },
  {
    id: 2,
    tag: 'Paso 2',
    title: 'Monitorea\nel progreso',
    subtitle:
      'Recibe notificaciones en tiempo real. Sigue el estado de tus reportes desde "Recibido" hasta "Resuelto".',
    illustration: <IllustrationTracking />,
    accent: '#22c55e',
    accentLight: 'rgba(34,197,94,0.15)',
  },
  {
    id: 3,
    tag: 'Comunidad',
    title: 'Construye\nuna mejor ciudad',
    subtitle:
      'Únete a miles de ciudadanos activos. Juntos logramos que las autoridades respondan más rápido y mejor.',
    illustration: <IllustrationCommunity />,
    accent: '#a855f7',
    accentLight: 'rgba(168,85,247,0.15)',
  },
];

/* ─── Componente principal ─── */
const OnboardingPage = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const isLast = current === slides.length - 1;

  const goTo = (index) => {
    if (index === current) return;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('onboarding_done', '1');
      navigate('/login');
    } else {
      goTo(current + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_done', '1');
    navigate('/login');
  };

  const slide = slides[current];

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -280 : 280, opacity: 0 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col select-none overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)' }}
    >
      {/* ── Destellos de fondo ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
        />
        <motion.div
          className="absolute top-1/2 -left-24 w-64 h-64 rounded-full"
          animate={{ opacity: [0.2, 0.38, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
        />
        <motion.div
          className="absolute -bottom-10 right-1/4 w-48 h-48 rounded-full"
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Skip ── */}
      <div className="relative z-20 flex justify-end px-6 pt-14">
        {!isLast && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="text-white/50 text-sm font-semibold px-4 py-2 rounded-full active:bg-white/10 transition-colors"
          >
            Omitir
          </motion.button>
        )}
      </div>

      {/* ── Ilustración ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 pt-2 pb-0" style={{ minHeight: '240px', maxHeight: '300px' }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full h-full flex items-center justify-center"
            style={{ maxWidth: '260px', maxHeight: '220px' }}
          >
            {slide.illustration}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Contenido en tarjeta blanca ── */}
      <motion.div
        className="relative z-10 bg-white rounded-t-[32px] px-7 pt-8 pb-10 flex flex-col gap-0"
        style={{ boxShadow: '0 -4px 48px rgba(0,0,0,0.22)', minHeight: '360px' }}
        layout
      >
        {/* Tag de slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tag-${current}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4"
            style={{ background: slide.accentLight, color: slide.accent }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: slide.accent }}
            />
            {slide.tag}
          </motion.div>
        </AnimatePresence>

        {/* Título */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={`title-${current}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="text-[30px] font-extrabold text-gray-900 leading-[1.18] tracking-tight mb-3 whitespace-pre-line"
          >
            {slide.title}
          </motion.h1>
        </AnimatePresence>

        {/* Subtítulo */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-gray-400 text-[15px] leading-relaxed mb-8"
          >
            {slide.subtitle}
          </motion.p>
        </AnimatePresence>

        {/* Dots + Botón */}
        <div className="flex items-center justify-between mt-auto">
          {/* Indicadores */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}>
                <motion.div
                  animate={{
                    width: i === current ? 24 : 8,
                    opacity: i === current ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-2 rounded-full"
                  style={{ background: i === current ? slide.accent : '#94a3b8' }}
                />
              </button>
            ))}
          </div>

          {/* Botón siguiente / empezar */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="flex items-center gap-2.5 text-white font-bold text-[15px] px-7 py-3.5 rounded-2xl transition-all"
            style={{
              background: `linear-gradient(135deg, ${slide.accent} 0%, ${slide.accent}cc 100%)`,
              boxShadow: `0 6px 20px ${slide.accent}50`,
            }}
            animate={{ background: `linear-gradient(135deg, ${slide.accent} 0%, ${slide.accent}cc 100%)` }}
            transition={{ duration: 0.4 }}
          >
            {isLast ? (
              <>
                Comenzar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              <>
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
