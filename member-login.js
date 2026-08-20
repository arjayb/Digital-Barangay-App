(function () {
  const form = document.getElementById('member-login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  // Already signed in? Skip straight through.
  const existing = getSession();
  if (existing && existing.user) {
    goToNext();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('member-email').value.trim();
    const password = document.getElementById('member-password').value;

    setLoading(true);
    try {
      const { token, user } = await login(email, password);

      // Any authenticated account (resident or admin) may use the member
      // area — admins just also happen to have the extra portal. No role
      // check needed here; the admin portal is the one that's restrictive.
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
    location.replace(next || 'index.html');
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
