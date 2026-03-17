import api from './api';

const petitionService = {
  getAll: async () => {
    const response = await api.get('/petitions');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/petitions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/petitions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/petitions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/petitions/${id}`);
    return response.data;
  },

  sign: async (id, signatureImage, cedula) => {
    const response = await api.post(`/petitions/${id}/sign`, { signatureImage, cedula });
    return response.data;
  },

  unsign: async (id) => {
    const response = await api.delete(`/petitions/${id}/sign`);
    return response.data;
  },
};

export default petitionService;
