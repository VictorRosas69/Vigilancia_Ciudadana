import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiPaperAirplane, HiShieldCheck, HiPencilAlt,
} from 'react-icons/hi';
import messageService from '../services/messageService';
import useAuthStore from '../store/authStore';

const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });

const fmt = (date) =>
  new Date(date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

// ─── Burbuja de mensaje ────────────────────────────────────────────────────────
const Bubble = ({ body, isAdmin, createdAt, name, avatar }) => {
  const avatarUrl = typeof avatar === 'string' ? avatar : avatar?.url;
  return (
    <div className={`flex items-end gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      {isAdmin && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mb-1"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}>
          <HiShieldCheck className="text-white text-sm" />
        </div>
      )}
      <div className={`max-w-[78%] ${isAdmin ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
        {isAdmin && (
          <span className="text-[10px] font-bold text-violet-400 px-1">Administrador</span>
        )}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isAdmin ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-tr-sm text-white'
          }`}
          style={isAdmin
            ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', backdropFilter: 'blur(8px)' }
            : { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }
          }
        >
          {body}
        </div>
        <span className="text-[10px] text-slate-500 px-1">{fmt(createdAt)}</span>
      </div>
      {!isAdmin && avatarUrl ? (
        <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1 ring-2 ring-blue-500/30" alt="" />
      ) : !isAdmin ? (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mb-1"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
          <span className="text-white text-xs font-bold">{name?.[0]?.toUpperCase()}</span>
        </div>
      ) : null}
    </div>
  );
};

// ─── Vista de chat de un hilo ──────────────────────────────────────────────────
const ChatView = ({ thread, onBack, currentUser, onReply }) => {
  const bottomRef   = useRef(null);
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  const allMessages = [
    { body: thread.body, from: thread.from, isAdmin: false, createdAt: thread.createdAt },
    ...(thread.replies || []).map(r => ({ ...r, isAdmin: r.isAdmin })),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const replyMut = useMutation({
    mutationFn: (body) => messageService.citizenReply(thread._id, body),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
      onReply();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al enviar'),
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    replyMut.mutate(trimmed);
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <HiArrowLeft className="text-white text-lg" />
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.5)' }}>
          <HiShieldCheck className="text-white text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white truncate">Administrador</p>
          <p className="text-xs text-blue-300/70 truncate">{thread.subject}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
          <span className="text-[10px] text-green-400 font-semibold">En línea</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}>
        {allMessages.map((m, i) => (
          <Bubble
            key={i}
            body={m.body}
            isAdmin={m.isAdmin}
            createdAt={m.createdAt}
            name={currentUser?.name}
            avatar={currentUser?.avatar}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 flex items-end gap-2"
        style={{
          paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 88px), 96px)',
          background: 'rgba(15,23,42,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Escribe un mensaje..."
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          style={{
            maxHeight: 120,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={replyMut.isPending || !text.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.5)' }}
        >
          {replyMut.isPending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <HiPaperAirplane className="text-white text-base rotate-90" />
          }
        </motion.button>
      </div>
    </div>
  );
};

// ─── Tarjeta de hilo en la lista ───────────────────────────────────────────────
const ThreadCard = ({ thread, onClick }) => {
  const lastReply  = thread.replies?.[thread.replies.length - 1];
  const lastMsg    = lastReply || { body: thread.body, createdAt: thread.createdAt };
  const hasUnread  = !thread.read && thread.replies?.length > 0;
  const totalMsgs  = 1 + (thread.replies?.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        boxShadow: hasUnread
          ? '0 2px 16px rgba(99,102,241,0.15), 0 0 0 1.5px rgba(99,102,241,0.2)'
          : '0 1px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
        <HiShieldCheck className="text-white text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
            {thread.subject}
          </p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(lastMsg.createdAt)}</span>
        </div>
        <p className={`text-xs truncate ${hasUnread ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
          {lastReply?.isAdmin ? '🛡️ Admin: ' : 'Tú: '}{lastMsg.body}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {hasUnread && (
          <span className="min-w-[18px] h-[18px] bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            ●
          </span>
        )}
        <span className="text-[10px] text-gray-300">{totalMsgs}</span>
      </div>
    </motion.div>
  );
};

// ─── Formulario de nuevo mensaje ──────────────────────────────────────────────
const ComposeForm = ({ onClose, onSent }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ subject: '', body: '' });

  const mut = useMutation({
    mutationFn: () => messageService.send(form),
    onSuccess: () => {
      toast.success('Mensaje enviado');
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
      onSent();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al enviar'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    mut.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-3xl p-5 mx-4"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <HiShieldCheck className="text-white text-lg" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900">Nuevo mensaje</p>
            <p className="text-xs text-gray-400">El admin responderá a la brevedad</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 text-sm font-bold px-2 py-1">✕</button>
      </div>
      <form onSubmit={handleSend} className="flex flex-col gap-3">
        <input
          value={form.subject}
          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
          placeholder="Asunto"
          maxLength={100}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
        />
        <textarea
          value={form.body}
          onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
          placeholder="Escribe tu mensaje..."
          rows={4}
          maxLength={2000}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all resize-none"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={mut.isPending}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
        >
          {mut.isPending
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
            : <><HiPaperAirplane className="rotate-90" /> Enviar mensaje</>
          }
        </motion.button>
      </form>
    </motion.div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const MessagesPage = () => {
  const { user } = useAuthStore();
  const [selected, setSelected]     = useState(null);
  const [showCompose, setShowCompose] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey:      ['my-messages'],
    queryFn:       messageService.getMine,
    refetchInterval: 8000,
    staleTime:     0,
  });

  const messages = data?.messages || [];
  const unread   = messages.filter(m => !m.read && m.replies?.length > 0).length;

  // Si el hilo seleccionado se actualizó, sincronizar
  useEffect(() => {
    if (selected) {
      const updated = messages.find(m => m._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [messages]); // eslint-disable-line

  // Vista de chat
  if (selected) {
    return (
      <ChatView
        thread={selected}
        onBack={() => setSelected(null)}
        currentUser={user}
        onReply={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--page-bg)' }}>

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg,#0f172a 0%,#1e3a8a 45%,#2563eb 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.3) 0%,transparent 70%)' }} />
        </div>
        <div className="relative px-5 pt-14 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Mensajes</h1>
            <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
              {unread > 0 ? `${unread} respuesta${unread !== 1 ? 's' : ''} nueva${unread !== 1 ? 's' : ''}` : 'Contacta al administrador'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCompose(!showCompose)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: showCompose ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <HiPencilAlt className={showCompose ? 'text-blue-700 text-xl' : 'text-white text-xl'} />
          </motion.button>
        </div>
        <div className="h-5 rounded-t-[28px]" style={{ background: 'var(--page-bg)' }} />
      </div>

      <div className="-mt-1 flex flex-col gap-3 pt-2">

        {/* Compose */}
        <AnimatePresence>
          {showCompose && (
            <ComposeForm onClose={() => setShowCompose(false)} onSent={() => setShowCompose(false)} />
          )}
        </AnimatePresence>

        {/* Skeletons */}
        {isLoading && [1, 2].map(i => (
          <div key={i} className="mx-4 bg-white rounded-2xl h-16 animate-pulse"
            style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }} />
        ))}

        {/* Lista de hilos */}
        {!isLoading && messages.length > 0 && (
          <div className="px-4 flex flex-col gap-2.5">
            {messages.map(msg => (
              <ThreadCard key={msg._id} thread={msg} onClick={() => setSelected(msg)} />
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && messages.length === 0 && !showCompose && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="relative mb-6 w-28 h-28">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-0 bottom-0 w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', boxShadow: '0 12px 40px rgba(37,99,235,0.35)' }}
              >
                <span className="text-3xl">💬</span>
              </motion.div>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute left-0 top-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}
              >
                <span className="text-xl">🛡️</span>
              </motion.div>
            </div>
            <h3 className="text-lg font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>Buzón vacío</h3>
            <p className="text-sm leading-relaxed max-w-[220px] mb-6" style={{ color: 'var(--text-2)' }}>
              Envía un mensaje al administrador sobre una incidencia o consulta
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 text-white font-bold text-sm px-6 py-3.5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 6px 20px rgba(37,99,235,0.38)' }}
            >
              <HiPencilAlt /> Redactar mensaje
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
