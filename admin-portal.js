/**
 * admin-portal.js — drives admin-dashboard.html.
 *
 * v1.1.0: the status dropdowns only ever offer the current status plus its
 * backend-approved next steps (mirrored from src/utils/stateMachine.js on
 * the server) — this is a UI convenience, not the actual authorization.
 * The backend re-validates every transition independently and will reject
 * anything this list doesn't also allow, so this frontend list can never
 * be the thing that grants a transition.
 */

// Mirrors src/utils/stateMachine.js — kept here only so the dropdown can
// hide obviously-invalid options. Source of truth stays on the server.
const REQUEST_TRANSITIONS = {
  pending: ['under_review'],
  under_review: ['approved', 'rejected'],
  approved: ['ready_for_pickup'],
};
const CONCERN_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved'],
};

const REQUEST_STATUS_LABEL = {
  pending: 'Pending', under_review: 'Under review', approved: 'Approved',
  rejected: 'Rejected', ready_for_pickup: 'Ready for pickup', completed: 'Completed',
};
const CONCERN_STATUS_LABEL = {
  open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed',
};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

function showAlert(message, tone) {
  const box = document.getElementById('admin-alert');
  box.textContent = message;
  box.className = `page-alert page-alert--${tone}`;
  box.hidden = false;
  clearTimeout(showAlert._t);
  showAlert._t = setTimeout(() => { box.hidden = true; }, 4000);
}

// Builds <option>s for "current status (unchanged)" + whatever the state
// machine allows next. A status with no admin-side next step (completed,
// ready_for_pickup, rejected, resolved) ends up with exactly one option —
// itself — which is the honest way to say "no admin transition available".
function transitionOptions(current, transitions, labelMap) {
  const next = transitions[current] || [];
  const values = [current, ...next];
  return values.map((v) => `<option value="${esc(v)}">${esc(labelMap[v] || v)}</option>`).join('');
}

function historyDetails(history, labelMap) {
  const entries = history || [];
  if (!entries.length) return '<span class="hint" style="margin:0">No history yet</span>';
  const rows = entries.map((h) => {
    const who = h.actorType === 'system' ? 'System (v1.0.0 import)' : `${h.actorType}${h.actorStaffId ? ` · ${esc(h.actorStaffId)}` : ''}`;
    const from = h.fromStatus ? (labelMap[h.fromStatus] || h.fromStatus) : 'created';
    const to = labelMap[h.toStatus] || h.toStatus;
    return `<div style="padding:6px 0;border-bottom:1px solid var(--line)">
      <strong>${esc(from)} → ${esc(to)}</strong><br>
      <span class="hint" style="margin:0">${esc(who)} · ${fmt(h.createdAt)}</span>
      ${h.note ? `<br><span class="hint" style="margin:0">"${esc(h.note)}"</span>` : ''}
    </div>`;
  }).join('');
  return `<details><summary>${entries.length} event${entries.length === 1 ? '' : 's'}</summary><div style="margin-top:8px;max-width:280px">${rows}</div></details>`;
}

async function loadDashboard() {
  try {
    document.getElementById('requests-loading').hidden = false;
    document.getElementById('concerns-loading').hidden = false;
    const [summary, requests, concerns] = await Promise.all([getAdminSummary(), getAdminRequests(), getAdminConcerns()]);
    const s = summary.summary || {};
    const req = s.requestsByStatus || [];
    const con = s.concernsByStatus || [];
    document.getElementById('metric-users').textContent = s.totalUsers ?? 0;
    document.getElementById('metric-requests').textContent = req.reduce((a, x) => a + x.count, 0);
    document.getElementById('metric-pending').textContent = req.find((x) => x._id === 'pending')?.count || 0;
    document.getElementById('metric-concerns').textContent = con.filter((x) => x._id !== 'resolved').reduce((a, x) => a + x.count, 0);
    renderRequests(requests.requests || []);
    renderConcerns(concerns.concerns || []);
  } catch (e) {
    if (e.status === 401 || e.status === 403) clearSession();
    showAlert(e.message, 'error');
  } finally {
    document.getElementById('requests-loading').hidden = true;
    document.getElementById('concerns-loading').hidden = true;
  }
}

function renderRequests(rows) {
  document.getElementById('requests-body').innerHTML = rows.length
    ? rows.map((r) => `
      <tr>
        <td>${esc(r.requestor?.fullName || 'Unknown')}<br><span class="hint" style="margin:0">${esc(r.requestor?.email || '')}</span></td>
        <td>${esc(r.documentType)}</td>
        <td>${esc(r.purpose)}</td>
        <td>${fmt(r.createdAt)}</td>
        <td><select class="status-control" data-request-status="${esc(r.id)}" data-current="${esc(r.status)}">${transitionOptions(r.status, REQUEST_TRANSITIONS, REQUEST_STATUS_LABEL)}</select></td>
        <td><input class="status-note" data-request-note="${esc(r.id)}" placeholder="Note (required if rejecting)"></td>
        <td>${historyDetails(r.history, REQUEST_STATUS_LABEL)}</td>
        <td><button type="button" class="btn btn--green" data-save-request="${esc(r.id)}">Save</button></td>
      </tr>`).join('')
    : '<tr><td colspan="8" class="empty-row">No document requests yet.</td></tr>';
}

function renderConcerns(rows) {
  document.getElementById('concerns-body').innerHTML = rows.length
    ? rows.map((c) => `
      <tr>
        <td>${esc(c.reporter?.fullName || 'Unknown')}<br><span class="hint" style="margin:0">${esc(c.reporter?.email || '')}</span></td>
        <td>${esc(c.category)}</td>
        <td>${esc(c.location)}</td>
        <td>${esc(c.description)}</td>
        <td>${fmt(c.createdAt)}</td>
        <td><select class="status-control" data-concern-status="${esc(c.id)}" data-current="${esc(c.status)}">${transitionOptions(c.status, CONCERN_TRANSITIONS, CONCERN_STATUS_LABEL)}</select></td>
        <td>${historyDetails(c.history, CONCERN_STATUS_LABEL)}</td>
        <td><button type="button" class="btn btn--green" data-save-concern="${esc(c.id)}">Save</button></td>
      </tr>`).join('')
    : '<tr><td colspan="7" class="empty-row">No concerns yet.</td></tr>';
}

async function loadUsers() {
  try {
    const data = await getAdminUsers();
    const rows = data?.users || data?.results || (Array.isArray(data) ? data : []);
    document.getElementById('users-body').innerHTML = rows.length
      ? rows.map((u) => `<tr><td>${esc(u.fullName || u.name || '—')}</td><td>${esc(u.email || '—')}</td><td>${esc(u.role || '—')}</td><td>${fmt(u.createdAt)}</td></tr>`).join('')
      : '<tr><td colspan="4" class="empty-row">No residents on file yet.</td></tr>';
  } catch {
    document.getElementById('users-error').hidden = false;
  } finally {
    document.getElementById('users-loading').hidden = true;
  }
}

document.addEventListener('click', async (e) => {
  const rb = e.target.closest('[data-save-request]');
  const cb = e.target.closest('[data-save-concern]');
  try {
    if (rb) {
      const id = rb.dataset.saveRequest;
      const select = document.querySelector(`[data-request-status="${CSS.escape(id)}"]`);
      const status = select.value;
      const current = select.dataset.current;
      const note = document.querySelector(`[data-request-note="${CSS.escape(id)}"]`).value.trim();

      if (status === current) {
        showAlert('Choose a next status before saving.', 'error');
        return;
      }
      if (current === 'under_review' && status === 'rejected' && !note) {
        showAlert('A reason is required when rejecting a request.', 'error');
        return;
      }

      rb.disabled = true;
      await updateRequestStatus(id, status, note);
      showAlert('Request status updated.', 'ok');
      await loadDashboard();
    }
    if (cb) {
      const id = cb.dataset.saveConcern;
      const select = document.querySelector(`[data-concern-status="${CSS.escape(id)}"]`);
      const status = select.value;
      const current = select.dataset.current;

      if (status === current) {
        showAlert('Choose a next status before saving.', 'error');
        return;
      }

      cb.disabled = true;
      await updateConcernStatus(id, status);
      showAlert('Concern status updated.', 'ok');
      await loadDashboard();
    }
  } catch (err) {
    showAlert(err.message, 'error');
    await loadDashboard();
  }
});

document.getElementById('refresh-btn').addEventListener('click', () => { loadDashboard(); loadUsers(); });
document.getElementById('logout-btn').addEventListener('click', () => { clearSession(); location.replace('index.html?mode=admin'); });
document.addEventListener('admin-auth-ready', (e) => {
  const user = e.detail.user;
  document.getElementById('welcome-name').textContent = user.fullName;
  document.getElementById('welcome-staffid').textContent = user.staffId || '—';
  document.getElementById('welcome-staffid-inline').textContent = user.staffId || '—';
  loadDashboard();
  loadUsers();
});
