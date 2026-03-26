import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiPaperAirplane, HiShieldCheck, HiChat,
} from 'react-icons/hi';
import messageService from '../services/messageService';

const timeAgo = (d) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: es });
const fmt     = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const GRADS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
];
const gradFor = (name = '') => GRADS[(name.charCodeAt(0) || 0) % GRADS.length];

// ─── Burbuja ──────────────────────────────────────────────────────────────────
const Bubble = ({ body, isAdmin, createdAt, citizenName, citizenAvatar }) => {
  const avatarUrl = typeof citizenAvatar === 'string' ? citizenAvatar : citizenAvatar?.url;
  return (
    <div className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      {!isAdmin && (
        avatarUrl
          ? <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1 ring-2 ring-white/10" alt="" />
          : <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mb-1"
              style={{ background: gradFor(citizenName), boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {initials(citizenName)}
            </div>
      )}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
        {!isAdmin && (
          <span className="text-[10px] font-bold text-slate-400 px-1">{citizenName}</span>
        )}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isAdmin ? 'rounded-2xl rounded-br-sm text-white' : 'rounded-2xl rounded-bl-sm'
          }`}
          style={isAdmin
            ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }
            : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', backdropFilter: 'blur(8px)' }
          }
        >
          {body}
        </div>
        <span className="text-[10px] text-slate-500 px-1">{fmt(createdAt)}</span>
      </div>
      {isAdmin && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mb-1"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 2px 8px rgba(79,70,229,0.5)' }}>
          <HiShieldCheck className="text-white text-sm" />
        </div>
      )}
    </div>
  );
};

// ─── Vista de chat individual ─────────────────────────────────────────────────
const ChatView = ({ thread, onBack }) => {
  const bottomRef   = useRef(null);
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  const allMessages = [
    { body: thread.body, isAdmin: false, createdAt: thread.createdAt },
    ...(thread.replies || []).map(r => ({ body: r.body, isAdmin: r.isAdmin, createdAt: r.createdAt })),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  useEffect(() => {
    if (!thread.adminRead) {
      messageService.markAdminRead(thread._id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-msg-count'] });
    }
  }, [thread._id]); // eslint-disable-line

  const replyMut = useMutation({
    mutationFn: (body) => messageService.reply(thread._id, body),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al enviar'),
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    replyMut.mutate(trimmed);
  };

  const citizen = thread.from;
  const citizenAvatarUrl = typeof citizen?.avatar === 'string' ? citizen.avatar : citizen?.avatar?.url;

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          background: 'linear-gradient(135deg,#0f172a 0%,#3b0764 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <HiArrowLeft className="text-white text-lg" />
        </button>
        {citizenAvatarUrl
          ? <img src={citizenAvatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-violet-500/40" alt="" />
          : <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
              style={{ background: gradFor(citizen?.name), boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {initials(citizen?.name)}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white truncate">{citizen?.name}</p>
          <p className="text-xs text-violet-300/70 truncate">{thread.subject}</p>
        </div>
        {citizen?.city && (
          <span className="text-[10px] text-slate-400 flex-shrink-0 bg-white/8 px-2 py-1 rounded-lg">{citizen.city}</span>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}>
        {allMessages.map((m, i) => (
          <Bubble key={i} body={m.body} isAdmin={m.isAdmin} createdAt={m.createdAt}
            citizenName={citizen?.name} citizenAvatar={citizenAvatarUrl} />
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
          placeholder="Responder al ciudadano..."
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
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
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.5)' }}
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

// ─── Tarjeta de conversación ──────────────────────────────────────────────────
const ConvCard = ({ thread, onClick }) => {
  const lastReply = thread.replies?.[thread.replies.length - 1];
  const lastMsg   = lastReply || { body: thread.body, createdAt: thread.createdAt };
  const hasUnread = !thread.adminRead;
  const citizen   = thread.from;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        boxShadow: hasUnread
          ? '0 2px 16px rgba(79,70,229,0.18), 0 0 0 1.5px rgba(79,70,229,0.2)'
          : '0 1px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {citizen?.avatar
        ? <img src={citizen.avatar} className="w-11 h-11 rounded-full object-cover flex-shrink-0" alt="" />
        : <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
            style={{ background: gradFor(citizen?.name) }}>
            {initials(citizen?.name)}
          </div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
            {citizen?.name}
          </p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(lastMsg.createdAt)}</span>
        </div>
        <p className="text-xs text-gray-400 truncate mb-0.5">{thread.subject}</p>
        <p className={`text-xs truncate ${hasUnread ? 'text-violet-600 font-semibold' : 'text-gray-400'}`}>
          {lastReply?.isAdmin ? '🛡️ Tú: ' : `${citizen?.name?.split(' ')[0]}: `}{lastMsg.body}
        </p>
      </div>
      {hasUnread && <span className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" />}
    </motion.div>
  );
};

// ─── Página principal admin ───────────────────────────────────────────────────
const AdminMessagesPage = () => {
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey:        ['admin-messages'],
    queryFn:         messageService.getAll,
    refetchInterval: 6000,
    staleTime:       0,
  });

  const messages = data?.messages || [];
  const unread   = messages.filter(m => !m.adminRead).length;

  useEffect(() => {
    if (selected) {
      const updated = messages.find(m => m._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [messages]); // eslint-disable-line

  if (selected) {
    return <ChatView thread={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--page-bg)' }}>

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg,#0f172a 0%,#3b0764 50%,#4f46e5 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(124,58,237,0.35) 0%,transparent 70%)' }} />
        </div>
        <div className="relative px-5 pt-14 pb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <HiChat className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Mensajes</h1>
            <p className="text-violet-200/70 text-sm mt-0.5 font-medium">
              {unread > 0 ? `${unread} sin leer` : `${messages.length} conversación${messages.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>
        <div className="h-5 rounded-t-[28px]" style={{ background: 'var(--page-bg)' }} />
      </div>

      <div className="-mt-1 px-4 pt-2 flex flex-col gap-2.5">
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-16 animate-pulse"
            style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }} />
        ))}

        <AnimatePresence>
          {!isLoading && messages.map(msg => (
            <ConvCard key={msg._id} thread={msg} onClick={() => setSelected(msg)} />
          ))}
        </AnimatePresence>

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 12px 40px rgba(79,70,229,0.3)' }}>
              <HiChat className="text-white text-4xl" />
            </div>
            <h3 className="text-base font-extrabold mb-1" style={{ color: 'var(--text-1)' }}>Sin mensajes</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Los ciudadanos aún no han enviado mensajes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;
