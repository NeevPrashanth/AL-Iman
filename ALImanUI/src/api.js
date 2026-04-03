import axios from 'axios';

const isLocalHostname = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const defaultApiBaseUrl = isLocalHostname
  ? 'http://localhost:8090/api'
  : 'https://taapi.neevinfra.uk/api';

const normalizeApiBaseUrl = (rawBaseUrl) => {
  if (!rawBaseUrl) return rawBaseUrl;
  const trimmed = rawBaseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/taapi')) {
    return `${trimmed}/api`;
  }
  return trimmed;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) || defaultApiBaseUrl,
});

const authHeaders = (token, userId) => ({
  ...(token ? { Authorization: token } : {}),
  ...(userId ? { 'X-User-Id': userId } : {}),
});

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  const token = `Basic ${btoa(`${email}:${password}`)}`;
  return {
    token,
    role: data.role,
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
  };
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    /* ignore */
  }
};

export const changePassword = async (currentPassword, newPassword, token) =>
  api.post('/auth/change-password', { currentPassword, newPassword }, { headers: authHeaders(token) }).then(r => r.data);

export const fetchContractors = (q, token) => api.get('/contractors', { params: { q }, headers: authHeaders(token) }).then(r => r.data);
export const createContractor = (payload, token) => api.post('/contractors', payload, { headers: authHeaders(token) }).then(r => r.data);
export const updateContractor = (id, payload, token) => api.put(`/contractors/${id}`, payload, { headers: authHeaders(token) }).then(r => r.data);
export const fetchRoles = (token) => api.get('/roles', { headers: authHeaders(token) }).then(r => r.data);

export const fetchReleases = (token) => api.get('/releases', { headers: authHeaders(token) }).then(r => r.data);
export const releaseTimesheet = (payload, token, userId) =>
  api.post('/releases', payload, { headers: authHeaders(token, userId) }).then(r => r.data);

export const submitTimesheet = (payload, token) => api.post('/timesheets/submit', payload, { headers: authHeaders(token) }).then(r => r.data);
export const decideTimesheet = (payload, token, userId) => api.post('/timesheets/decision', payload, { headers: authHeaders(token, userId) }).then(r => r.data);
export const fetchTimesheetsForContractor = (contractorId, token) =>
  api.get(`/timesheets/contractor/${contractorId}`, { headers: authHeaders(token) }).then(r => r.data);
export const fetchApprovedTimesheetDownloads = (token) =>
  api.get('/doc-downloads/timesheets/approved', { headers: authHeaders(token) }).then(r => r.data);
export const downloadApprovedTimesheetPdf = (timesheetId, token) =>
  api.get(`/doc-downloads/timesheets/${timesheetId}/pdf`, {
    headers: authHeaders(token),
    responseType: 'blob',
  });
export const fetchPendingApprovals = (token) =>
  api.get('/line-manager/timesheets/pending', { headers: authHeaders(token) }).then(r => r.data);
export const decidePendingTimesheet = (payload, token) =>
  api.post('/line-manager/timesheets/decision', payload, { headers: authHeaders(token) }).then(r => r.data);

export const fetchEvents = (token) => api.get('/events', { headers: authHeaders(token) }).then(r => r.data);
export const createEvent = (payload, token, userId) => api.post('/events', payload, { headers: authHeaders(token, userId) }).then(r => r.data);
export const updateEvent = (id, payload, token, userId) =>
  api.put(`/events/${id}`, payload, { headers: authHeaders(token, userId) }).then(r => r.data);
export const deleteEvent = (id, token, userId) =>
  api.delete(`/events/${id}`, { headers: authHeaders(token, userId) }).then(r => r.data);
