/**
 * API client - uses proxy in dev (/api -> backend:3001)
 */
const BASE = '/api';

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