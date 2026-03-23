import api from './api';

const notificationService = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  subscribePush: async (subscription) => {
    const response = await api.post('/notifications/push/subscribe', { subscription });
    return response.data;
  },

  unsubscribePush: async (endpoint) => {
    const response = await api.post('/notifications/push/unsubscribe', { endpoint });
    return response.data;
  },
};

export default notificationService;
