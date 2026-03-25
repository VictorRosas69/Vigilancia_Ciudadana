import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiPaperAirplane, HiShieldCheck, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import messageService from '../services/messageService';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700', 'from-violet-500 to-violet-700',
  'from-green-500 to-green-700', 'from-orange-400 to-orange-600',
];
const getGradient = (name = '') => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });

const MessageItem = ({ msg, onReply, onMarkRead }) => {
  const [expanded, setExpanded] = useState(!msg.adminRead);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const gradient = getGradient(msg.from?.name);
  const firstName = msg.from?.name?.split(' ')[0] || 'Usuario';

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!msg.adminRead) onMarkRead(msg._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        boxShadow: !msg.adminRead
          ? '0 2px 16px rgba(99,102,241,0.15), 0 0 0 1.5px rgba(99,102,241,0.25)'
          : '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header del mensaje */}
      <button onClick={handleExpand} className="w-full p-4 flex items-start gap-3 text-left">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          {msg.from?.avatar?.url ? (
            <img src={msg.from.avatar.url} alt="" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-white font-extrabold text-base">{firstName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-gray-900 truncate">{msg.from?.name}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!msg.adminRead && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
              {expanded ? <HiChevronUp className="text-gray-400 text-sm" /> : <HiChevronDown className="text-gray-400 text-sm" />}
            </div>
          </div>
          <p className="text-xs font-bold text-gray-600 truncate mt-0.5">{msg.subject}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(msg.createdAt)}</p>
        </div>
      </button>

      {/* Contenido expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 flex flex-col gap-3">
              {/* Mensaje original */}
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                  <p className="text-sm text-gray-700 leading-relaxed">{msg.body}</p>
                </div>
              </div>

              {/* Respuestas anteriores */}
              {msg.replies.map((reply, i) => (
                <div key={i} className={`flex ${reply.isAdmin ? 'justify-start' : 'justify-end'}`}>
                  {reply.isAdmin && (
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-3"
                      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <HiShieldCheck className="text-white/80 text-xs" />
                        <span className="text-[10px] font-bold text-white/80">Tú (Admin)</span>
                      </div>
                      <p className="text-sm text-white leading-relaxed">{reply.body}</p>
                      <p className="text-[10px] text-white/60 mt-1">{timeAgo(reply.createdAt)}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Botón responder */}
              {!showReply ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowReply(true)}
                  className="w-full py-2.5 rounded-2xl text-sm font-bold border-2 border-dashed border-indigo-200 text-indigo-500 flex items-center justify-center gap-2"
                >
                  <HiPaperAirplane className="rotate-90" /> Responder
                </motion.button>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowReply(false); setReplyText(''); }}
                      className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { onReply(msg._id, replyText); setShowReply(false); setReplyText(''); }}
                      disabled={!replyText.trim()}
                      className="flex-1 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                    >
                      <HiPaperAirplane className="rotate-90 text-sm" /> Enviar
                    </motion.button>
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

const AdminMessagesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: messageService.getAll,
    staleTime: 0,
  });

  const messages = data?.messages || [];
  const unreadCount = messages.filter(m => !m.adminRead).length;

  const replyMutation = useMutation({
    mutationFn: ({ id, body }) => messageService.reply(id, body),
    onSuccess: () => {
      toast.success('Respuesta enviada');
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
    onError: () => toast.error('Error al responder'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => messageService.markAdminRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
        </div>

        <div className="relative px-5 pt-14 pb-6">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <HiArrowLeft className="text-white text-xl" />
            </motion.button>
            <div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight flex items-center gap-2">
                Mensajes
                {unreadCount > 0 && (
                  <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-blue-200/70 text-sm mt-0.5 font-medium">
                {messages.length} mensaje{messages.length !== 1 ? 's' : ''} de ciudadanos
              </p>
            </div>
          </div>
        </div>

        <div className="h-5 rounded-t-[28px]" style={{ background: 'var(--page-bg)' }} />
      </div>

      <div className="px-4 -mt-1 flex flex-col gap-3">
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl h-20 animate-pulse"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }} />
        ))}

        {!isLoading && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5 text-5xl"
              style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
              💬
            </div>
            <h3 className="text-base font-extrabold text-gray-800">Sin mensajes</h3>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-[200px]">
              Los ciudadanos aún no han enviado mensajes
            </p>
          </motion.div>
        )}

        {!isLoading && messages.map(msg => (
          <MessageItem
            key={msg._id}
            msg={msg}
            onReply={(id, body) => replyMutation.mutate({ id, body })}
            onMarkRead={(id) => markReadMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminMessagesPage;
