import api from './api';

export const teacherService = {
  list: (params) => api.get('/teachers', { params }),
  get: (id) => api.get(`/teachers/${id}`),
  departments: () => api.get('/teachers/departments'),
};
