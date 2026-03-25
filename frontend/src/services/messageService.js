import api from './api';

const messageService = {
  send:               async (data)    => (await api.post('/messages', data)).data,
  getMine:            async ()        => (await api.get('/messages/mine')).data,
  citizenReply:       async (id, body)=> (await api.post(`/messages/${id}/citizen-reply`, { body })).data,
  getAll:             async ()        => (await api.get('/messages')).data,
  getAdminUnreadCount:async ()        => (await api.get('/messages/unread-count')).data,
  reply:              async (id, body)=> (await api.post(`/messages/${id}/reply`, { body })).data,
  markAsRead:         async (id)      => (await api.patch(`/messages/${id}/read`)).data,
  markAdminRead:      async (id)      => (await api.patch(`/messages/${id}/admin-read`)).data,
};

export default messageService;
