import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiCheck, HiLockClosed, HiX, HiPencil } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import petitionService from '../services/petitionService';
import useAuthStore from '../store/authStore';

// ─── Signature Canvas Modal ────────────────────────────────────────────────────
const SignatureModal = ({ petition, onClose, onConfirm, isLoading }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const hasDrawnRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [cedula, setCedula] = useState('');
  const [step, setStep] = useState('cedula'); // 'cedula' | 'canvas'

  // Helpers de posición — estables porque usan solo la ref
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.changedTouches?.[0] ?? e.touches?.[0] ?? e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }, []);

  const startDrawFn = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
  }, [getPos]);

  const drawFn = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawn(true);
    }
  }, [getPos]);

  const stopDrawFn = useCallback((e) => {
    e?.preventDefault?.();
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  // Inicializar canvas Y registrar eventos touch con passive:false
  // Solo cuando step cambia a 'canvas' (canvas aún no existe en step 'cedula')
  useEffect(() => {
    if (step !== 'canvas') return;

    let canvas;
    const t = setTimeout(() => {
      canvas = canvasRef.current;
      if (!canvas) return;

      // Dimensiones nítidas en pantallas de alta densidad
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Eventos touch con passive:false para que preventDefault() funcione
      // y no entre en conflicto con el scroll de la página
      canvas.addEventListener('touchstart',  startDrawFn, { passive: false });
      canvas.addEventListener('touchmove',   drawFn,      { passive: false });
      canvas.addEventListener('touchend',    stopDrawFn,  { passive: false });
      canvas.addEventListener('touchcancel', stopDrawFn,  { passive: false });
    }, 80);

    // Parar dibujo si el dedo sale de la ventana
    const globalStop = () => { isDrawing.current = false; lastPos.current = null; };
    document.addEventListener('mouseup',  globalStop);
    document.addEventListener('touchend', globalStop);

    return () => {
      clearTimeout(t);
      document.removeEventListener('mouseup',  globalStop);
      document.removeEventListener('touchend', globalStop);
      if (canvas) {
        canvas.removeEventListener('touchstart',  startDrawFn);
        canvas.removeEventListener('touchmove',   drawFn);
        canvas.removeEventListener('touchend',    stopDrawFn);
        canvas.removeEventListener('touchcancel', stopDrawFn);
      }
    };
  }, [step, startDrawFn, drawFn, stopDrawFn]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.getContext('2d').clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasDrawnRef.current = false;
    setHasDrawn(false);
  };

  const confirm = () => {
    onConfirm(petition._id, canvasRef.current.toDataURL('image/png'), cedula.trim());
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HiPencil className="text-indigo-600 text-base" />
            </div>
            <div>
              <p className="font-extrabold text-gray-800 text-sm">
                {step === 'cedula' ? 'Verifica tu identidad' : 'Dibuja tu firma'}
              </p>
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{petition.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <HiX className="text-gray-500 text-base" />
          </button>
        </div>

        {/* ── Paso 1: Cédula ─────────────────────────────────────── */}
        {step === 'cedula' && (
          <>
            <div className="flex-1 flex flex-col justify-center px-6 py-6 bg-gray-50 gap-5 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">🪪</span>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Tu número de cédula se incluirá en el documento oficial enviado a la Alcaldía para verificar la autenticidad de tu firma.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Número de cédula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cedula}
                  onChange={e => setCedula(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 1234567890"
                  maxLength={12}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-800 font-semibold text-lg tracking-widest placeholder:font-normal placeholder:tracking-normal placeholder:text-base transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">Solo números, sin puntos ni espacios</p>
              </div>
            </div>

            <div
              className="flex-shrink-0 bg-white border-t border-gray-100 px-5 pt-3 flex gap-3"
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={onClose}
                className="w-24 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep('canvas')}
                disabled={cedula.trim().length < 6}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm
                           shadow-lg shadow-indigo-200/60 disabled:opacity-40 active:scale-95 transition-transform"
              >
                Continuar →
              </button>
            </div>
          </>
        )}

        {/* ── Paso 2: Canvas ─────────────────────────────────────── */}
        {step === 'canvas' && (
          <>
            <div className="px-5 py-2.5 bg-indigo-50 flex-shrink-0 flex items-center justify-between">
              <p className="text-xs text-indigo-600 font-semibold">
                Cédula: <span className="font-extrabold tracking-wider">{cedula}</span>
              </p>
              <button
                onClick={() => { setStep('cedula'); hasDrawnRef.current = false; setHasDrawn(false); }}
                className="text-xs text-indigo-400 underline"
              >
                Cambiar
              </button>
            </div>

            <div className="px-5 pt-4 pb-3 bg-gray-50 flex-shrink-0">
              {/* Canvas con altura fija — no anidado en flex-1 para evitar height:0 */}
              <div
                className="relative w-full bg-white rounded-2xl border-2 border-dashed border-indigo-200 shadow-inner overflow-hidden"
                style={{ height: '200px' }}
              >
                {/* Línea base */}
                <div className="absolute bottom-10 left-6 right-6 border-b border-gray-200 pointer-events-none" />
                <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-gray-300 pointer-events-none select-none">
                  Firma aquí
                </p>

                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-2 opacity-25">
                      <HiPencil className="text-4xl text-indigo-400" />
                      <span className="text-xs text-gray-500 font-medium">Desliza tu dedo aquí</span>
                    </div>
                  </div>
                )}

                {/* Los eventos touch se registran en el useEffect con passive:false */}
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', touchAction: 'none', display: 'block', cursor: 'crosshair' }}
                  onMouseDown={startDrawFn}
                  onMouseMove={drawFn}
                  onMouseUp={stopDrawFn}
                  onMouseLeave={stopDrawFn}
                />
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                {hasDrawn ? '¡Listo! Confirma tu firma cuando estés satisfecho' : 'Usa tu dedo para dibujar la firma'}
              </p>
            </div>

            <div
              className="flex-shrink-0 bg-white border-t border-gray-100 px-5 pt-3 flex gap-3"
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={clearCanvas}
                disabled={!hasDrawn}
                className="w-24 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm
                           disabled:opacity-30 active:scale-95 transition-transform"
              >
                Limpiar
              </button>
              <button
                onClick={confirm}
                disabled={!hasDrawn || isLoading}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm
                           shadow-lg shadow-indigo-200/60 disabled:opacity-40 active:scale-95 transition-transform
                           flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <><HiCheck className="text-base" /> Confirmar firma</>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─── Petition Card ─────────────────────────────────────────────────────────────
const PetitionCard = ({ petition, onSign, onUnsign, userId }) => {
  const [expanded, setExpanded] = useState(false);
  const alreadySigned = petition.signatures?.some(
    s => s.user === userId || s.user?._id === userId
  );
  const pct = Math.min(Math.round((petition.signaturesCount / petition.goal) * 100), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                petition.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {petition.isOpen ? '✅ Abierta' : '🔒 Cerrada'}
              </span>
              {alreadySigned && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center gap-1">
                  <HiCheck className="text-xs" /> Firmada
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-gray-800 text-base leading-snug">{petition.title}</h3>
            <p className="text-xs text-gray-500 mt-1">Para: {petition.recipientTitle} · {petition.city}</p>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-extrabold text-indigo-600">{petition.signaturesCount} firmas</span>
            <span className="text-xs text-gray-400">Meta: {petition.goal}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{pct}% de la meta alcanzada</p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            {expanded ? 'Ver menos' : 'Ver petición'}
          </button>

          {petition.isOpen && !alreadySigned && (
            <button
              onClick={() => onSign(petition)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              ✍️ Firmar
            </button>
          )}
          {petition.isOpen && alreadySigned && (
            <button
              onClick={() => onUnsign(petition._id)}
              className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 text-sm font-semibold border border-red-100 hover:bg-red-100 transition-colors"
            >
              Retirar firma
            </button>
          )}
          {!petition.isOpen && (
            <div className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold flex items-center justify-center gap-1.5">
              <HiLockClosed className="text-sm" /> Cerrada
            </div>
          )}
        </div>
      </div>

      {/* Expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Texto de la petición</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  {petition.body?.split('\n').filter(l => l.trim()).map((line, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
              </div>

              {petition.requests?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Se solicita</p>
                  <div className="space-y-2">
                    {petition.requests.map((req, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed">{req}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {petition.signatures?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Últimas firmas ({petition.signaturesCount})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {petition.signatures.slice(-10).reverse().map((sig, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                        {sig.signatureImage ? (
                          <img
                            src={sig.signatureImage}
                            alt="firma"
                            className="w-12 h-7 object-contain rounded border border-gray-100 bg-white flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase flex-shrink-0">
                            {sig.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{sig.name}</p>
                          <p className="text-xs text-gray-400">{sig.city || 'Sin ciudad'}</p>
                        </div>
                        <span className="text-xs text-gray-300 flex-shrink-0">
                          {new Date(sig.signedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
const PetitionsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [signingPetition, setSigningPetition] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['petitions'],
    queryFn: petitionService.getAll,
  });

  const petitions = data?.petitions || [];

  const signMutation = useMutation({
    mutationFn: ({ id, signatureImage, cedula }) => petitionService.sign(id, signatureImage, cedula),
    onSuccess: (res) => {
      toast.success(res.message || '¡Firma registrada!');
      queryClient.invalidateQueries({ queryKey: ['petitions'] });
      setSigningPetition(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al firmar'),
  });

  const unsignMutation = useMutation({
    mutationFn: petitionService.unsign,
    onSuccess: () => {
      toast.success('Firma retirada');
      queryClient.invalidateQueries({ queryKey: ['petitions'] });
    },
    onError: () => toast.error('Error al retirar la firma'),
  });

  const openCount = petitions.filter(p => p.isOpen).length;

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-4 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/15 backdrop-blur rounded-xl text-white active:scale-95 transition-transform"
            >
              <HiArrowLeft className="text-lg" />
            </button>
            <div className="flex-1">
              <h1 className="text-white text-xl font-extrabold">Peticiones Ciudadanas</h1>
              <p className="text-indigo-200 text-xs mt-0.5">
                {openCount > 0
                  ? `${openCount} petición(es) abiertas para firmar`
                  : 'No hay peticiones activas'}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✍️</span>
              <div>
                <p className="text-white font-bold text-sm">¿Cómo funciona?</p>
                <p className="text-indigo-200 text-xs mt-1 leading-relaxed">
                  Firma las peticiones para apoyar solicitudes formales a las autoridades municipales.
                  Tu nombre quedará registrado en el documento oficial enviado a la Alcaldía.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="px-4 py-4 space-y-3">
          {isLoading && [1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
          ))}

          {!isLoading && petitions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-3">📜</div>
              <p className="font-bold text-gray-700">No hay peticiones disponibles</p>
              <p className="text-gray-400 text-sm mt-1 px-8">
                El administrador aún no ha creado peticiones ciudadanas
              </p>
            </div>
          )}

          {!isLoading && petitions.map(petition => (
            <PetitionCard
              key={petition._id}
              petition={petition}
              userId={user?._id || user?.id}
              onSign={(p) => setSigningPetition(p)}
              onUnsign={(id) => unsignMutation.mutate(id)}
            />
          ))}
        </div>
      </div>

      {/* Signature bottom sheet */}
      <AnimatePresence>
        {signingPetition && (
          <SignatureModal
            key="sig"
            petition={signingPetition}
            isLoading={signMutation.isPending}
            onClose={() => setSigningPetition(null)}
            onConfirm={(id, img, ced) => signMutation.mutate({ id, signatureImage: img, cedula: ced })}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PetitionsPage;
