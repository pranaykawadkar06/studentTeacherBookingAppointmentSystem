import api from './api';

export const userService = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  students: (params) => api.get('/users/students', { params }),
  updateMe: (body) => api.put('/users/me', body),
  changePassword: (body) => api.put('/users/me/password', body),
};
