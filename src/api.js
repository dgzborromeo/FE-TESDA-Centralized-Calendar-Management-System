/**
 * API client - uses proxy in dev (/api -> backend:3001)
 */
const BASE = import.meta.env.VITE_API_BASE_URL;
function getToken() {
  return localStorage.getItem('token');
}

export async function api(url, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const auth = {
  login: (email, password, remember) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, remember }) }),
  register: (name, email, password) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me: () => api('/auth/me'),
  verifyEmail: (token) => api(`/auth/verify-email?token=${token}`),
  resendVerification: () => api('/auth/resend-verification', { method: 'POST' }),
};

export const events = {
  list: (params) => {
    const q = new URLSearchParams(params).toString();
    return api(`/events${q ? `?${q}` : ''}`);
  },
  get: (id) => api(`/events/${id}`),
  create: (body) =>
    api('/events', {
      method: 'POST',
      body: typeof FormData !== 'undefined' && body instanceof FormData ? body : JSON.stringify(body),
    }),
  update: (id, body) => api(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/events/${id}`, { method: 'DELETE' }),
  rsvp: (id, body) => api(`/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify(body) }),
  cancel: (id, body) => api(`/events/${id}/cancel`, { method: 'POST', body: JSON.stringify(body) }),
  uploadPostDocument: (id, file) => {
    const form = new FormData();
    form.append('attachment', file);
    return api(`/events/${id}/post-document`, { method: 'POST', body: form });
  },
  conflicts: () => api('/events/conflicts'),
  conflictsList: () => api('/events/conflicts/list'),
  checkConflict: (body) => api('/events/check-conflict', { method: 'POST', body: JSON.stringify(body) }),
};

export const invitations = {
  list: () => api('/invitations'),
};

export const users = {
  list: () => api('/users'),
  legend: () => api('/users/legend'),
  legendClusters: () => api('/users/legend/clusters'),
};


// ... existing exports (auth, events, users, etc.) ...

export const profiles = {
  // Para sa profile ng kasalukuyang user
  getMe: () => api('/profile/me'),
  
  // Para sa profile ng ibang user (kung kailangan)
  getById: (userId) => api(`/profile/${userId}`),
  
  // Para sa pag-save/update na may kasamang image upload
  save: (formData) => api('/profile/save', {
    method: 'POST',
    body: formData, // FormData ito dahil may image file
  }),
  
  // Pag-delete ng profile
  remove: () => api('/profile/remove', { method: 'DELETE' }),
};

export const config = {
  // Offices
  getOffices: () => api('/get-offices'),
  getOffice: (id) => api(`/get-office${id}`),
  addOffice: (body) => api('/add-office', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updateOffice: (id, body) => api(`/update-office/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deleteOffice: (id) => api(`/delete-office/${id}`, { 
    method: 'DELETE' 
  }),

  // Divisions
  getDivisions: () => api('/get-divisions'),
  getDivision: (id) => api(`/get-division/${id}`),
  addDivision: (body) => api('/add-division', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updateDivision: (id, body) => api(`/update-division/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deleteDivision: (id) => api(`/delete-division/${id}`, { 
    method: 'DELETE' 
  }),

  //Positions
  getPositions: () => api('/get-positions'),
  getPosition: (id) => api(`/get-position/${id}`),
  addPosition: (body) => api('/add-position', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updatePosition: (id, body) => api(`/update-position/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deletePosition: (id) => api(`/delete-position/${id}`, { 
    method: 'DELETE' 
  }),

  //SETUP POSITION
  // Config Positions (Assignments)
  getConfigPositions: () => api('/get-config-positions'),
  getConfigPosition: (id) => api(`/get-config-position/${id}`),
  setupPosition: (body) => api('/setup-position', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updateConfigPosition: (id, body) => api(`/update-config-position/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deleteConfigPosition: (id) => api(`/delete-config-position/${id}`, { 
    method: 'DELETE' 
  }),

  getCategories: () => api('/categories'),
  getCategory: (id) => api(`/category/${id}`),
  addCategory: (body) => api('/category', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updateCategory: (id, body) => api(`/category/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deleteCategory: (id) => api(`/category/${id}`, { 
    method: 'DELETE' 
  }),

    getFocals: () => api('/focals'),
  getFocal: (id) => api(`/focal/${id}`),
  addFocal: (body) => api('/focal', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updateFocal: (id, body) => api(`/focal/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deleteFocal: (id) => api(`/focal/${id}`, { 
    method: 'DELETE' 
  }),

      getSchedules: () => api('/schedules'),
  getSchedule: (id) => api(`/schedule/${id}`),
  addSchedule: (formData) => api('/schedule', { 
    method: 'POST', 
    body: formData
  }),
  updateSchedule: (id, formData) => api(`/schdeule/${id}`, { 
    method: 'POST', 
    body: formData
  }),
  deleteSchedule: (id) => api(`/schedule/${id}`, { 
    method: 'DELETE' 
  }),


    getFocalships: () => api('/focalship'),
  getFocalship: (id) => api(`/focalship/${id}`),
  getProvinces: (regionId) => api(`/provinces/${regionId}`),
  addFocalship: (body) => api('/focalship', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  updateFocalship: (id, body) => api(`/focalship/${id}`, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  deleteFocalship: (id) => api(`/focalship/${id}`, { 
    method: 'DELETE' 
  }),

  getClusters: () => api('/clusters'),
  getRegions: () => api('/regions'),
};