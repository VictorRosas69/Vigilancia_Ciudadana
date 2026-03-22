import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiPaperAirplane, HiChevronDown, HiChevronUp, HiShieldCheck } from 'react-icons/hi';
import messageService from '../services/messageService';
import useAuthStore from '../store/authStore';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700', 'from-violet-500 to-violet-700',
  'from-green-500 to-green-700', 'from-orange-400 to-orange-600',
];
const getGradient = (name = '') => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });

const MessageThread = ({ msg, currentUserId }) => {
  const [expanded, setExpanded] = useState(!msg.read && msg.replies?.length > 0);
  const hasReplies = msg.replies?.length > 0;
  const lastReply = msg.replies?.[msg.replies.length - 1];
  const hasUnread = !msg.read && hasReplies;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        boxShadow: hasUnread
          ? '0 2px 16px rgba(99,102,241,0.15), 0 0 0 1.5px rgba(99,102,241,0.2)'
          : '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {/* Tu mensaje */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-extrabold text-gray-900 truncate">{msg.subject}</p>
              {hasUnread && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-400">{timeAgo(msg.createdAt)}</p>
          </div>
          {hasReplies && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0"
            >
              {msg.replies.length} resp.
              {expanded ? <HiChevronUp /> : <HiChevronDown />}
            </button>
          )}
        </div>

        {/* Tu mensaje (burbuja derecha) */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <p className="text-sm text-white leading-relaxed">{msg.body}</p>
          </div>
        </div>

        {/* Preview última respuesta */}
        {hasReplies && !expanded && lastReply && (
          <div className="flex justify-start mt-2">
            <div className="max-w-[85%] bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <HiShieldCheck className="text-violet-500 text-xs" />
                <span className="text-[10px] font-bold text-violet-600">Admin</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{lastReply.body}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hilo completo expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 flex flex-col gap-2.5">
              {msg.replies.map((reply, i) => (
                <div key={i} className={`flex ${reply.isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    reply.isAdmin
                      ? 'bg-gray-50 border border-gray-100 rounded-tl-sm'
                      : 'rounded-tr-sm'
                  }`}
                    style={!reply.isAdmin ? { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' } : {}}
                  >
                    {reply.isAdmin && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <HiShieldCheck className="text-violet-500 text-xs" />
                        <span className="text-[10px] font-bold text-violet-600">Admin</span>
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${reply.isAdmin ? 'text-gray-700' : 'text-white'}`}>
                      {reply.body}
                    </p>
                    <p className={`text-[10px] mt-1 ${reply.isAdmin ? 'text-gray-400' : 'text-white/60'}`}>
                      {timeAgo(reply.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['my-messages'],
    queryFn: messageService.getMine,
    staleTime: 0,
  });

  const messages = data?.messages || [];
  const unreadCount = messages.filter(m => !m.read && m.replies?.length > 0).length;

  const sendMutation = useMutation({
    mutationFn: () => messageService.send(form),
    onSuccess: () => {
      toast.success('Mensaje enviado al administrador');
      setForm({ subject: '', body: '' });
      setShowCompose(false);
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al enviar'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f8fafc' }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-8 -left-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(-1)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <HiArrowLeft className="text-white text-xl" />
              </motion.button>
              <div>
                <h1 className="text-white text-2xl font-extrabold tracking-tight">Mensajes</h1>
                <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
                  {unreadCount > 0 ? `${unreadCount} respuesta${unreadCount !== 1 ? 's' : ''} nueva${unreadCount !== 1 ? 's' : ''}` : 'Contacta al administrador'}
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowCompose(!showCompose)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: showCompose ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <span className={showCompose ? 'text-blue-700' : 'text-white'}>✏️</span>
            </motion.button>
          </div>
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: '#f8fafc' }} />
      </div>

      <div className="px-4 -mt-1 flex flex-col gap-3">

        {/* Compose form */}
        <AnimatePresence>
          {showCompose && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white rounded-3xl p-5"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                  <HiShieldCheck className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900">Nuevo mensaje</p>
                  <p className="text-xs text-gray-400">El administrador responderá a la brevedad</p>
                </div>
              </div>
              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <input
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Asunto"
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <textarea
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Escribe tu mensaje..."
                  rows={4}
                  maxLength={2000}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
                >
                  {sendMutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><HiPaperAirplane className="rotate-90 text-base" /> Enviar mensaje</>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && [1, 2].map(i => (
          <div key={i} className="bg-white rounded-3xl h-24 animate-pulse"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }} />
        ))}

        {/* Empty */}
        {!isLoading && messages.length === 0 && !showCompose && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5 text-5xl"
              style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
              💬
            </div>
            <h3 className="text-base font-extrabold text-gray-800">Sin mensajes</h3>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-[200px]">
              Toca el lápiz ✏️ para enviar un mensaje al administrador
            </p>
          </motion.div>
        )}

        {/* Messages */}
        {!isLoading && messages.map(msg => (
          <MessageThread key={msg._id} msg={msg} currentUserId={user?.id} />
        ))}
      </div>
    </div>
  );
};

export default MessagesPage;
