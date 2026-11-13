import api from './api';

export const messageService = {
  list: (params) => api.get('/messages', { params }),
  send: (body) => api.post('/messages', body),
  markRead: (id) => api.patch(`/messages/${id}/read`),
};
