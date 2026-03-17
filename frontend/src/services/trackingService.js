import api from './api';

const trackingService = {
  // Crear una acción de veeduría
  create: (data) => api.post('/tracking', data).then(r => r.data),

  // Obtener acciones de un reporte
  getByReport: (reportId, params = {}) =>
    api.get(`/tracking/${reportId}`, { params }).then(r => r.data),

  // Obtener mis acciones
  getMyTrackings: (params = {}) =>
    api.get('/tracking/me', { params }).then(r => r.data),

  // Cancelar una acción
  delete: (id) => api.delete(`/tracking/${id}`).then(r => r.data),
};

export default trackingService;
