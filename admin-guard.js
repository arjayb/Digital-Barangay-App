/**
 * admin-guard.js — drop this <script> (after api.js) on the top of every
 * admin-only page, BEFORE any page content is meant to render.
 *
 * It re-checks the token against the server on every load (not just the
 * locally-cached role) so a revoked/expired token or a demoted account
 * can't keep viewing admin pages just because localStorage still has data.
 */
(async function guardAdminPage() {
  const session = getSession();

  if (!session || !session.token || !session.user || session.user.role !== 'admin') {
    redirectToLogin();
    return;
  }

  try {
    const { user } = await fetchMe(); // throws on invalid/expired token
    if (user.role !== 'admin') {
      clearSession();
      redirectToLogin();
      return;
    }
    // keep the cached copy fresh in case fullName/email changed
    setSession(session.token, user);
    document.dispatchEvent(new CustomEvent('admin-auth-ready', { detail: { user } }));
  } catch (err) {
    clearSession();
    redirectToLogin();
  }

  function redirectToLogin() {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`admin-login.html?next=${next}`);
  }
})();
