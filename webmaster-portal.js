/**
 * webmaster-portal.js — drives webmaster-dashboard.html.
 *
 * Scope is deliberately narrow: credential governance only (BUILD-SPEC-
 * DBA-001 §25). No request/concern processing lives here — that stays on
 * admin-dashboard.html and requires the `admin` role specifically.
 */

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

function showAlert(message, tone) {
  const box = document.getElementById('webmaster-alert');
  box.textContent = message;
  box.className = `page-alert page-alert--${tone}`;
  box.hidden = false;
  clearTimeout(showAlert._t);
  showAlert._t = setTimeout(() => { box.hidden = true; }, 4500);
}

async function loadApplications() {
  const loading = document.getElementById('applications-loading');
  loading.hidden = false;
  try {
    const data = await getAdminApplications();
    const applications = data.applications || [];
    const pending = applications.filter((a) => a.status === 'pending');
    document.getElementById('metric-pending').textContent = pending.length;

    document.getElementById('applications-body').innerHTML = applications.length
      ? applications.map((a) => `
        <tr>
          <td>${esc(a.applicantName)}</td>
          <td>${esc(a.email)}</td>
          <td><span class="badge badge--${a.status === 'pending' ? 'pending' : a.status === 'approved' ? 'approved' : 'rejected'}">${esc(a.status)}</span></td>
          <td>${fmt(a.createdAt)}</td>
          <td>${esc(a.reviewNote || '—')}</td>
          <td>${a.status === 'pending'
            ? `<div class="quick-actions">
                 <button class="btn btn--green" data-approve="${esc(a.id)}">Approve</button>
                 <button class="btn btn--red" data-reject="${esc(a.id)}">Reject</button>
               </div>`
            : ''}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="empty-row">No Admin applications yet.</td></tr>';
  } catch (e) {
    showAlert(e.message, 'error');
  } finally {
    loading.hidden = true;
  }
}

async function loadAdmins() {
  const loading = document.getElementById('admins-loading');
  loading.hidden = false;
  try {
    const data = await getWebmasterAdmins();
    const admins = data.admins || [];
    document.getElementById('metric-active-admins').textContent = admins.filter((a) => a.accountStatus === 'active').length;
    document.getElementById('metric-suspended-admins').textContent = admins.filter((a) => a.accountStatus === 'suspended').length;

    document.getElementById('admins-body').innerHTML = admins.length
      ? admins.map((a) => `
        <tr>
          <td>${esc(a.staffId || '—')}</td>
          <td>${esc(a.fullName)}</td>
          <td>${esc(a.email)}</td>
          <td><span class="badge badge--${a.accountStatus === 'active' ? 'approved' : a.accountStatus === 'suspended' ? 'rejected' : 'pending'}">${esc(a.accountStatus)}</span></td>
          <td>${a.accountStatus === 'active'
            ? `<button class="btn btn--red" data-suspend="${esc(a.id)}">Suspend</button>`
            : a.accountStatus === 'suspended'
              ? `<button class="btn btn--green" data-reactivate="${esc(a.id)}">Reactivate</button>`
              : ''}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="empty-row">No admins yet.</td></tr>';
  } catch (e) {
    showAlert(e.message, 'error');
  } finally {
    loading.hidden = true;
  }
}

async function loadHistory() {
  const loading = document.getElementById('history-loading');
  loading.hidden = false;
  try {
    const data = await getCredentialHistory();
    const events = data.events || [];
    document.getElementById('history-body').innerHTML = events.length
      ? events.map((e) => `
        <tr>
          <td><span class="badge badge--${e.type === 'approved' || e.type === 'reactivated' ? 'approved' : e.type === 'rejected' || e.type === 'suspended' ? 'rejected' : 'pending'}">${esc(e.type)}</span></td>
          <td>${esc(e.subject)}${e.subjectStaffId ? ` (${esc(e.subjectStaffId)})` : ''}</td>
          <td>${esc(e.performedBy)}</td>
          <td>${esc(e.note || '—')}</td>
          <td>${fmt(e.timestamp)}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="empty-row">No credentialing actions yet.</td></tr>';
  } catch (e) {
    showAlert(e.message, 'error');
  } finally {
    loading.hidden = true;
  }
}

async function loadAll() {
  await Promise.all([loadApplications(), loadAdmins(), loadHistory()]);
}

document.addEventListener('click', async (e) => {
  const approveBtn = e.target.closest('[data-approve]');
  const rejectBtn = e.target.closest('[data-reject]');
  const suspendBtn = e.target.closest('[data-suspend]');
  const reactivateBtn = e.target.closest('[data-reactivate]');

  try {
    if (approveBtn) {
      approveBtn.disabled = true;
      await approveAdminApplication(approveBtn.dataset.approve);
      showAlert('Application approved.', 'ok');
      await loadAll();
    }
    if (rejectBtn) {
      const note = prompt('Reason for rejecting this application (required):');
      if (note === null) return; // cancelled
      if (!note.trim()) { showAlert('A reason is required to reject an application.', 'error'); return; }
      rejectBtn.disabled = true;
      await rejectAdminApplication(rejectBtn.dataset.reject, note.trim());
      showAlert('Application rejected.', 'ok');
      await loadAll();
    }
    if (suspendBtn) {
      suspendBtn.disabled = true;
      await suspendAdminAccount(suspendBtn.dataset.suspend);
      showAlert('Admin suspended.', 'ok');
      await loadAll();
    }
    if (reactivateBtn) {
      reactivateBtn.disabled = true;
      await reactivateAdminAccount(reactivateBtn.dataset.reactivate);
      showAlert('Admin reactivated.', 'ok');
      await loadAll();
    }
  } catch (err) {
    showAlert(err.message, 'error');
    await loadAll();
  }
});

document.getElementById('refresh-btn').addEventListener('click', loadAll);
document.getElementById('logout-btn').addEventListener('click', () => { clearSession(); location.replace('index.html?mode=admin'); });
document.addEventListener('webmaster-auth-ready', (e) => {
  document.getElementById('welcome-name').textContent = e.detail.user.fullName;
  loadAll();
});
