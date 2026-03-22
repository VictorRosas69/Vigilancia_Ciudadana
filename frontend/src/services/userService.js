import api from './api';

const userService = {
  getProfile: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

export default userService;
