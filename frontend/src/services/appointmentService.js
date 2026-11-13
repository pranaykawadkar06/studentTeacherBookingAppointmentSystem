import api from './api';

export const appointmentService = {
  create: (body) => api.post('/appointments', body),
  list: (params) => api.get('/appointments', { params }),
  approve: (id, body = {}) => api.patch(`/appointments/${id}/approve`, body),
  reject: (id, body = {}) => api.patch(`/appointments/${id}/reject`, body),
  cancel: (id, body = {}) => api.patch(`/appointments/${id}/cancel`, body),
};
