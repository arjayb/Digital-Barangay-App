// gateway.js — single authentication entry point for resident and staff roles
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const requestedMode = params.get('mode') === 'admin' ? 'admin' : 'member';
  const next = params.get('next');
  const ALLOWED_DESTINATIONS = ['member-dashboard.html', 'admin-dashboard.html'];

  let mode = requestedMode;

  const form = document.getElementById('login-form');
  const heading = document.getElementById('login-heading');
  const context = document.getElementById('login-context');
  const submit = document.getElementById('login-submit');
  const switchBtn = document.getElementById('mode-switch');
  const registerRow = document.getElementById('register-row');
  const errorBox = document.getElementById('login-error');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  function routeForRole(role, nextParam) {
    const dest = role === 'admin' ? 'admin-dashboard.html' : 'member-dashboard.html';
    const safeNext = ALLOWED_DESTINATIONS.includes(nextParam) && nextParam === dest ? nextParam : null;
    location.replace(safeNext || dest);
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isAdmin = mode === 'admin';
    heading.textContent = isAdmin ? 'Admin Login' : 'Member Login';
    context.textContent = isAdmin
      ? 'Barangay staff access only.'
      : 'Sign in to access barangay services.';
    submit.textContent = isAdmin ? 'Sign in as Admin' : 'Sign in';
    switchBtn.textContent = isAdmin ? 'Member Login' : 'Admin Login';
    switchBtn.setAttribute('aria-label', isAdmin ? 'Switch to member login' : 'Switch to admin login');
    registerRow.hidden = isAdmin;
    errorBox.hidden = true;
    errorBox.textContent = '';

    const url = new URL(location.href);
    if (isAdmin) url.searchParams.set('mode', 'admin');
    else url.searchParams.delete('mode');
    history.replaceState(null, '', url);
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  switchBtn.addEventListener('click', () => {
    setMode(mode === 'admin' ? 'member' : 'admin');
    emailInput.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = 'Signing in…';

    try {
      const result = await loginUser(emailInput.value.trim(), passwordInput.value);
      const token = result.token;
      const user = result.user;

      if (!token || !user) throw new Error('Login response was incomplete.');

      if (mode === 'admin' && user.role !== 'admin') {
        showError('This account does not have staff access.');
        return;
      }

      if (mode === 'member' && user.role !== 'resident') {
        showError('This account is for barangay staff. Please use Admin Login.');
        return;
      }

      setSession(token, user);
      routeForRole(user.role, next);
    } catch (err) {
      showError(err.message || 'Unable to sign in.');
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });

  // If already signed in, only skip the gateway when the cached role matches
  // the mode the visitor is trying to enter. Guards will revalidate the token.
  const existingToken = getToken();
  const existingUser = getCurrentUser();
  if (existingToken && existingUser) {
    const matchesMode =
      (mode === 'admin' && existingUser.role === 'admin') ||
      (mode === 'member' && existingUser.role === 'resident');
    if (matchesMode) {
      routeForRole(existingUser.role, next);
      return;
    }
  }

  setMode(mode);
})();
