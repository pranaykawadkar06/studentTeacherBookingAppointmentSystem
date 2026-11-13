import api from './api';

export const adminService = {
  createTeacher: (body) => api.post('/admin/teachers', body),
  updateTeacher: (id, body) => api.put(`/admin/teachers/${id}`, body),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`),
  setStudentStatus: (id, status) => api.patch(`/admin/students/${id}/status`, { status }),
};
