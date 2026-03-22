import api from './api';

const messageService = {
  send: async (data) => {
    const response = await api.post('/messages', data);
    return response.data;
  },
  getMine: async () => {
    const response = await api.get('/messages/mine');
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/messages');
    return response.data;
  },
  getAdminUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },
  reply: async (id, body) => {
    const response = await api.post(`/messages/${id}/reply`, { body });
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`/messages/${id}/read`);
    return response.data;
  },
  markAdminRead: async (id) => {
    const response = await api.patch(`/messages/${id}/admin-read`);
    return response.data;
  },
};

export default messageService;
