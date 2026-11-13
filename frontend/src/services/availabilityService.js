import api from './api';

export const availabilityService = {
  mine: (params) => api.get('/availability/mine', { params }),
  get: (id) => api.get(`/availability/${id}`),
  forTeacher: (teacherId) => api.get(`/availability/teacher/${teacherId}`),
  create: (body) => api.post('/availability', body),
  update: (id, body) => api.put(`/availability/${id}`, body),
  remove: (id) => api.delete(`/availability/${id}`),
};
