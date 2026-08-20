/** Shared API client for the GitHub Pages frontend. */
const API_BASE_URL = 'https://digital-barangay-backend.onrender.com';
const SESSION_KEY = 'db_session';
async function apiRequest(path, { method = 'GET', body, auth = false, formData = false } = {}) {
  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json';
  if (auth) { const session = getSession(); if (session?.token) headers.Authorization = `Bearer ${session.token}`; }
  let response;
  try { response = await fetch(`${API_BASE_URL}/api${path}`, { method, headers, body: formData ? body : (body ? JSON.stringify(body) : undefined) }); }
  catch { throw new Error('Could not reach the server. Check your connection and try again.'); }
  let data = null; try { data = await response.json(); } catch {}
  if (!response.ok) { const error = new Error(data?.message || `Request failed (${response.status})`); error.status = response.status; throw error; }
  return data;
}
function login(email, password) { return apiRequest('/auth/login', { method: 'POST', body: { email, password } }); }
function registerUser(fullName, email, password) { return apiRequest('/auth/register', { method: 'POST', body: { fullName, email, password } }); }
function fetchMe() { return apiRequest('/auth/me', { auth: true }); }
function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
function setSession(token, user) { localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user })); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function isLoggedInAs(role) { const s = getSession(); return !!(s?.token && s?.user?.role === role); }
function getMyRequests() { return apiRequest('/requests', { auth: true }); }
function createRequest({ documentType, purpose, attachments = [] }) {
  if (!attachments.length) return apiRequest('/requests', { method: 'POST', body: { documentType, purpose }, auth: true });
  const form = new FormData(); form.append('documentType', documentType); form.append('purpose', purpose); attachments.forEach(file => form.append('attachments', file));
  return apiRequest('/requests', { method: 'POST', body: form, auth: true, formData: true });
}
function getMyConcerns() { return apiRequest('/concerns', { auth: true }); }
function createConcern({ category, description, location = '', attachments = [] }) {
  if (!attachments.length) return apiRequest('/concerns', { method: 'POST', body: { category, description, location }, auth: true });
  const form = new FormData(); form.append('category', category); form.append('description', description); form.append('location', location); attachments.forEach(file => form.append('attachments', file));
  return apiRequest('/concerns', { method: 'POST', body: form, auth: true, formData: true });
}
function getOfficials() { return apiRequest('/officials'); }
function getNotices() { return apiRequest('/notices'); }
function toQuery(params = {}) { const q = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, v); }); const s = q.toString(); return s ? `?${s}` : ''; }
function getAdminSummary() { return apiRequest('/admin/reports/summary', { auth: true }); }
function getAdminRequests(params = {}) { return apiRequest(`/admin/requests${toQuery(params)}`, { auth: true }); }
function updateRequestStatus(id, status, note = '') { return apiRequest(`/admin/requests/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status, note }, auth: true }); }
function getAdminConcerns(params = {}) { return apiRequest(`/admin/concerns${toQuery(params)}`, { auth: true }); }
function updateConcernStatus(id, status) { return apiRequest(`/admin/concerns/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status }, auth: true }); }
function getAdminUsers(params = {}) { return apiRequest(`/admin/users${toQuery(params)}`, { auth: true }); }
