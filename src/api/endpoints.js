import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  me: () => api.get('/me'),
  updateProfile: (data) => api.put('/me', data),
};

export const dashboardApi = {
  get: () => api.get('/admin/dashboard'),
};

export const customersApi = {
  list: (params) => api.get('/admin/customers', { params }),
  get: (id) => api.get(`/admin/customers/${id}`),
  setStatus: (id, status) => api.patch(`/admin/customers/${id}/status`, { status }),
};

export const vendorsApi = {
  list: (params) => api.get('/admin/vendors', { params }),
  stats: () => api.get('/admin/vendors/stats'),
  get: (id) => api.get(`/admin/vendors/${id}`),
  create: (data) => api.post('/admin/vendors', data),
  update: (id, data) => api.put(`/admin/vendors/${id}`, data),
  approve: (id) => api.post(`/admin/vendors/${id}/approve`),
  reject: (id, reason) => api.post(`/admin/vendors/${id}/reject`, { reason }),
  setStatus: (id, status) => api.patch(`/admin/vendors/${id}/status`, { status }),
  assignments: (id) => api.get(`/admin/vendors/${id}/assignments`),
};

export const requestsApi = {
  list: (params) => api.get('/admin/requests', { params }),
  stats: () => api.get('/admin/requests/stats'),
  get: (id) => api.get(`/admin/requests/${id}`),
  create: (data) => api.post('/admin/requests', data),
  assign: (id, data) => api.post(`/admin/requests/${id}/assign`, data),
  setStatus: (id, data) => api.patch(`/admin/requests/${id}/status`, data),
  close: (id, note) => api.post(`/admin/requests/${id}/close`, { note }),
  escalate: (id, note) => api.post(`/admin/requests/${id}/escalate`, { note }),
  remove: (id) => api.delete(`/admin/requests/${id}`),
};

export const quotationsApi = {
  list: (params) => api.get('/admin/quotations', { params }),
  get: (id) => api.get(`/admin/quotations/${id}`),
  review: (id, data) => api.post(`/admin/quotations/${id}/review`, data),
  create: (data) => api.post('/admin/quotations', data),
};

export const jobsApi = {
  list: (params) => api.get('/admin/jobs', { params }),
  stats: () => api.get('/admin/jobs/stats'),
  get: (id) => api.get(`/admin/jobs/${id}`),
  setStage: (id, data) => api.patch(`/admin/jobs/${id}/stage`, data),
  create: (data) => api.post('/admin/jobs', data),
};

export const sosApi = {
  list: (params) => api.get('/admin/sos', { params }),
  stats: () => api.get('/admin/sos/stats'),
  get: (id) => api.get(`/admin/sos/${id}`),
  setStatus: (id, data) => api.post(`/admin/sos/${id}/status`, data),
};

export const servicesApi = {
  modules: () => api.get('/admin/services/modules'),
  createModule: (data) => api.post('/admin/services/modules', data),
  updateModule: (id, data) => api.put(`/admin/services/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/admin/services/modules/${id}`),
  categories: (params) => api.get('/admin/services/categories', { params }),
  createCategory: (data) => api.post('/admin/services/categories', data),
  updateCategory: (id, data) => api.put(`/admin/services/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/services/categories/${id}`),
};

export const propertiesApi = {
  list: (params) => api.get('/admin/properties', { params }),
  get: (id) => api.get(`/admin/properties/${id}`),
  create: (data) => api.post('/admin/properties', data),
  update: (id, data) => api.put(`/admin/properties/${id}`, data),
  remove: (id) => api.delete(`/admin/properties/${id}`),
  removeMedia: (mediaId) => api.delete(`/admin/properties/media/${mediaId}`),
  stats: () => api.get('/admin/properties/stats'),
  builders: () => api.get('/admin/properties/builders'),
  createBuilder: (data) => api.post('/admin/properties/builders', data),
  updateBuilder: (id, data) => api.put(`/admin/properties/builders/${id}`, data),
  deleteBuilder: (id) => api.delete(`/admin/properties/builders/${id}`),
  projects: (params) => api.get('/admin/properties/projects', { params }),
  createProject: (data) => api.post('/admin/properties/projects', data),
  updateProject: (id, data) => api.put(`/admin/properties/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/admin/properties/projects/${id}`),
  areas: () => api.get('/admin/properties/areas'),
  createArea: (data) => api.post('/admin/properties/areas', data),
  updateArea: (id, data) => api.put(`/admin/properties/areas/${id}`, data),
  deleteArea: (id) => api.delete(`/admin/properties/areas/${id}`),
  enquiries: (params) => api.get('/admin/properties/enquiries/all', { params }),
  setEnquiryStatus: (id, data) => api.patch(`/admin/properties/enquiries/${id}/status`, data),
};

export const hrApi = {
  employees: (params) => api.get('/admin/hr/employees', { params }),
  createEmployee: (data) => api.post('/admin/hr/employees', data),
  updateEmployee: (id, data) => api.put(`/admin/hr/employees/${id}`, data),
  attendance: (params) => api.get('/admin/hr/attendance', { params }),
  markAttendance: (data) => api.post('/admin/hr/attendance', data),
  attendanceSummary: (params) => api.get('/admin/hr/attendance/summary', { params }),
  leaves: (params) => api.get('/admin/hr/leaves', { params }),
  reviewLeave: (id, data) => api.post(`/admin/hr/leaves/${id}/review`, data),
};

export const notificationsApi = {
  templates: () => api.get('/admin/notifications/templates'),
  updateTemplate: (id, data) => api.put(`/admin/notifications/templates/${id}`, data),
  recent: () => api.get('/admin/notifications/recent'),
  broadcast: (data) => api.post('/admin/notifications/broadcast', data),
};

export const reportsApi = {
  overview: () => api.get('/admin/reports/overview'),
  get: (type, params) => api.get(`/admin/reports/${type}`, { params }),
  csvUrl: (type) => `${api.defaults.baseURL}/admin/reports/${type}?format=csv`,
};

export const rolesApi = {
  list: () => api.get('/admin/roles'),
  create: (data) => api.post('/admin/roles', data),
  update: (id, data) => api.put(`/admin/roles/${id}`, data),
  remove: (id) => api.delete(`/admin/roles/${id}`),
};

export const staffApi = {
  list: (params) => api.get('/admin/staff', { params }),
  create: (data) => api.post('/admin/staff', data),
  update: (id, data) => api.put(`/admin/staff/${id}`, data),
  remove: (id) => api.delete(`/admin/staff/${id}`),
};

export const supportApi = {
  list: (params) => api.get('/admin/support', { params }),
  reply: (id, data) => api.post(`/admin/support/${id}/reply`, data),
  setStatus: (id, status) => api.patch(`/admin/support/${id}/status`, { status }),
};

export const auditApi = {
  list: (params) => api.get('/admin/audit', { params }),
};

export const settingsApi = {
  get: () => api.get('/admin/settings'),
  update: (settings) => api.put('/admin/settings', { settings }),
};

export const myNotificationsApi = {
  list: (params) => api.get('/customer/notifications', { params }),
  markRead: (ids) => api.post('/customer/notifications/read', { ids }),
  clear: () => api.delete('/customer/notifications'),
};
