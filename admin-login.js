(function () {
  const form = document.getElementById('admin-login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  // If we're already holding a valid admin session, skip straight through.
  const existing = getSession();
  if (existing && existing.user && existing.user.role === 'admin') {
    goToNext();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    setLoading(true);
    try {
      const { token, user } = await login(email, password);

      if (user.role !== 'admin') {
        // Backend authenticated them fine (valid resident account) — but
        // this portal is admin-only, so don't create a session here.
        showError('This account does not have staff access.');
        return;
      }

      setSession(token, user);
      goToNext();
    } catch (err) {
      showError(err.status === 401 ? 'Incorrect email or password.' : err.message);
    } finally {
      setLoading(false);
    }
  });

  function goToNext() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    location.replace(next || 'admin-dashboard.html');
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideError() {
    errorBox.hidden = true;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Signing in…' : 'Sign in';
  }
})();
