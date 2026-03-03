import api from './api';

const reportService = {
  getAll: async (params = {}) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  create: async (formData) => {
    const response = await api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/reports/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  toggleLike: async (id) => {
    const response = await api.post(`/reports/${id}/like`);
    return response.data;
  },

  updateStatus: async (id, status, rejectionReason) => {
    const response = await api.patch(`/reports/${id}/status`, { status, rejectionReason });
    return response.data;
  },
};

export default reportService;