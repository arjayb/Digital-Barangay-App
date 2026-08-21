/**
 * webmaster-guard.js — drop this <script> (after api.js) on the top of
 * webmaster-dashboard.html, BEFORE any page content is meant to render.
 *
 * Mirrors admin-guard.js exactly, scoped to role === 'webmaster'. Re-checks
 * the token against the server on every load so a revoked/expired token
 * can't keep viewing the Webmaster portal just because localStorage still
 * has data.
 */
(async function guardWebmasterPage() {
  const session = getSession();
  if (!session || !session.token || !session.user || session.user.role !== 'webmaster') { redirectToLogin(); return; }
  try {
    const { user } = await fetchMe();
    if (user.role !== 'webmaster') { clearSession(); redirectToLogin(); return; }
    setSession(session.token, user);
    document.dispatchEvent(new CustomEvent('webmaster-auth-ready', { detail: { user } }));
  } catch (err) { clearSession(); redirectToLogin(); }
  function redirectToLogin() {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`index.html?mode=admin&next=${next}`);
  }
})();
