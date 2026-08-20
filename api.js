/**
 * api.js — shared API client + session storage for the Digital Barangay App.
 *
 * TODO: set this to your deployed Render backend URL, e.g.
 *   const API_BASE_URL = 'https://digital-barangay-backend.onrender.com';
 * Leave the /api suffix off — it's added per-call below.
 */
const API_BASE_URL = 'https://YOUR-RENDER-APP.onrender.com';

const SESSION_KEY = 'db_session'; // { token, user: { id, fullName, email, role } }

/* ---------- low-level request helper ---------- */

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const session = getSession();
    if (session && session.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}

/* ---------- auth endpoints ---------- */

function login(email, password) {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

function fetchMe() {
  return apiRequest('/auth/me', { auth: true });
}

/* ---------- session storage ---------- */

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isLoggedInAs(role) {
  const session = getSession();
  return !!(session && session.token && session.user && session.user.role === role);
}
