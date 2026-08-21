/**
 * gateway.js — drives index.html, the single authentication gateway.
 *
 * The Member/Admin toggle is only an interface mode selector: it decides
 * which heading/hint is shown and which role a successful login is
 * expected to match. It does not grant access on its own — actual
 * authorization still comes entirely from the backend's login response
 * and role validation (see authorize() calls the API already performs).
 */
(function () {
  // Same-app pages a `next` value is allowed to point at. Anything else
  // (a different host, a path outside this list, an absolute/protocol-
  // relative URL) is ignored — see routeForRole().
  const ALLOWED_DESTINATIONS = ['member-dashboard.html', 'admin-dashboard.html'];

  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  let mode = params.get('mode') === 'admin' ? 'admin' : 'member';

  const form = document.getElementById('gateway-form');
  const heading = document.getElementById('gateway-heading');
  const hint = document.getElementById('gateway-hint');
  const emailInput = document.getElementById('gateway-email');
  const passwordInput = document.getElementById('gateway-password');
  const errorBox = document.getElementById('gateway-error');
  const submitBtn = document.getElementById('gateway-submit');
  const switchBtn = document.getElementById('gateway-switch');
  const registerRow = document.getElementById('gateway-register-row');

  const existing = getSession();
  if (
    existing?.token && existing?.user &&
    ((mode === 'admin' && existing.user.role === 'admin') ||
      (mode === 'member' && existing.user.role === 'resident'))
  ) {
    routeForRole(existing.user.role, next);
    return;
  }

  applyMode(mode, { skipHistory: true });
  switchBtn.addEventListener('click', () => { applyMode(mode === 'member' ? 'admin' : 'member'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
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
      showError(err.status === 401 ? 'Incorrect email or password.' : err.message);
    } finally {
      setLoading(false);
    }
  });

  function applyMode(nextMode, opts = {}) {
    mode = nextMode;
    const isAdmin = mode === 'admin';
    heading.textContent = isAdmin ? 'Admin sign in' : 'Resident sign in';
    hint.textContent = isAdmin
      ? 'This login is for barangay staff only. Residents should use the resident sign-in instead.'
      : "Use the account you registered with the barangay front desk.";
    switchBtn.textContent = isAdmin ? 'Member Login' : 'Admin Login';
    registerRow.hidden = isAdmin;
    passwordInput.value = '';
    hideError();
    if (!opts.skipHistory) {
      const url = new URL(location.href);
      if (isAdmin) url.searchParams.set('mode', 'admin');
      else url.searchParams.delete('mode');
      history.replaceState(null, '', url);
    }
    emailInput.focus();
  }

  function routeForRole(role, nextParam) {
    const dest = role === 'admin' ? 'admin-dashboard.html' : 'member-dashboard.html';
    const safeNext = ALLOWED_DESTINATIONS.includes(nextParam) && nextParam === dest ? nextParam : null;
    location.replace(safeNext || dest);
  }
  function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
  function hideError() { errorBox.hidden = true; }
  function setLoading(isLoading) { submitBtn.disabled = isLoading; submitBtn.textContent = isLoading ? 'Signing in…' : 'Sign in'; }
})();
