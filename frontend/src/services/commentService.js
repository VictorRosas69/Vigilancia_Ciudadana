import api from './api';

const commentService = {
  getByReport: async (reportId) => {
    const response = await api.get(`/comments/${reportId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/comments', data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};

export default commentService;