/**
 * member-portal.js — drives member-dashboard.html, the resident portal.
 *
 * One shared app shell, six nav destinations (Dashboard, Request Document,
 * My Requests, Report Concern, My Concerns, Directory & Notices). Requests
 * and concerns are each fetched once per refresh and reused by both the
 * Dashboard summary and their full-table view, so there is exactly one
 * implementation of "my requests" and one of "my concerns" — not one per
 * screen that shows them.
 */

const REQUEST_STATUS_LABEL = {
  pending: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  ready_for_pickup: 'Ready for pickup',
  completed: 'Completed',
};
const CONCERN_STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

let requestsCache = [];
let concernsCache = [];
let currentUser = null;

/* ---------------------------------------------------------------- utils */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-PH');
}
function badge(status, labelMap) {
  const key = String(status || '').toLowerCase();
  return `<span class="badge badge--${esc(key)}">${esc(labelMap[key] || status || 'Pending')}</span>`;
}
function showPageAlert(message, tone) {
  const box = document.getElementById('portal-alert');
  box.textContent = message;
  box.className = `page-alert page-alert--${tone}`;
  box.hidden = false;
  clearTimeout(showPageAlert._t);
  showPageAlert._t = setTimeout(() => { box.hidden = true; }, 4500);
}

/* ---------------------------------------------------------- tab routing */

function goToTab(tabId) {
  document.querySelectorAll('.portal-nav__item').forEach((item) => {
    const active = item.dataset.tab === tabId;
    item.classList.toggle('portal-nav__item--active', active);
    item.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.portal-panel').forEach((panel) => {
    panel.hidden = panel.id !== `panel-${tabId}`;
  });
  history.replaceState(null, '', `#${tabId}`);
}

function initNav() {
  document.querySelectorAll('.portal-nav__item').forEach((item) => {
    item.addEventListener('click', () => goToTab(item.dataset.tab));
  });
  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => goToTab(el.dataset.goto));
  });
  const initial = location.hash.replace('#', '');
  goToTab(initial || 'dashboard');
}

/* ------------------------------------------------------------ data load */

async function loadRequestsAndConcerns() {
  const [requestsData, concernsData] = await Promise.all([getMyRequests(), getMyConcerns()]);
  requestsCache = requestsData?.requests || [];
  concernsCache = concernsData?.concerns || [];
  renderDashboard();
  renderRequestsTable();
  renderConcernsTable();
}

function renderDashboard() {
  const activeRequests = requestsCache.filter((r) => !['completed', 'rejected'].includes(r.status));
  const openConcerns = concernsCache.filter((c) => c.status !== 'resolved');

  document.getElementById('metric-requests').textContent = requestsCache.length;
  document.getElementById('metric-active-requests').textContent = activeRequests.length;
  document.getElementById('metric-open-concerns').textContent = openConcerns.length;

  const attention = [
    ...activeRequests.slice(0, 3).map((r) => ({
      label: `${r.documentType} — ${REQUEST_STATUS_LABEL[r.status] || r.status}`,
      meta: `Filed ${fmtDate(r.createdAt)} · ${r.trackingNumber || r.id}`,
      goto: 'requests',
    })),
    ...openConcerns.slice(0, 3).map((c) => ({
      label: `${c.category} — ${CONCERN_STATUS_LABEL[c.status] || c.status}`,
      meta: `Reported ${fmtDate(c.createdAt)} · ${c.location || 'No location given'}`,
      goto: 'concerns',
    })),
  ].slice(0, 4);

  const attentionEl = document.getElementById('attention-list');
  attentionEl.innerHTML = attention.length
    ? attention.map((a) => `<div class="attention-item"><div><span class="attention-item__label">${esc(a.label)}</span><span class="attention-item__meta">${esc(a.meta)}</span></div><button type="button" class="btn btn--ghost" data-goto="${a.goto}">View</button></div>`).join('')
    : '<p class="hint">Nothing needs your attention right now — everything on file is closed out.</p>';
  attentionEl.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => goToTab(el.dataset.goto)));
}

function renderRequestsTable() {
  const body = document.getElementById('requests-body');
  body.innerHTML = requestsCache.length
    ? requestsCache.map((r) => {
        const rejectionNote = getRejectionNote(r);
        const action = r.status === 'ready_for_pickup'
          ? `<div class="quick-actions">
               <button type="button" class="btn btn--ghost" data-download-stub="${esc(r.id)}">Download Claim Stub</button>
               <button type="button" class="btn btn--green" data-claim="${esc(r.id)}">Claimed</button>
             </div>`
          : '—';
        return `<tr>
          <td><strong>${esc(r.documentType)}</strong></td>
          <td>${esc(r.purpose)}</td>
          <td>${fmtDateTime(r.createdAt)}</td>
          <td>${badge(r.status, REQUEST_STATUS_LABEL)}</td>
          <td>${esc(r.trackingNumber || r.id || '—')}</td>
          <td>${rejectionNote ? esc(rejectionNote) : '—'}</td>
          <td>${action}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" class="empty-row">You have not submitted any document requests yet.</td></tr>';
}

function renderConcernsTable() {
  const body = document.getElementById('concerns-body');
  body.innerHTML = concernsCache.length
    ? concernsCache.map((c) => {
        const action = c.status === 'resolved'
          ? `<button type="button" class="btn btn--green" data-confirm-resolved="${esc(c.id)}">Confirm Resolved</button>`
          : '—';
        return `<tr>
          <td>${esc(c.category)}</td>
          <td>${esc(c.location || '—')}</td>
          <td>${esc(c.description)}</td>
          <td>${fmtDateTime(c.createdAt)}</td>
          <td>${badge(c.status, CONCERN_STATUS_LABEL)}</td>
          <td>${action}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" class="empty-row">You have not reported any concerns yet.</td></tr>';
}

// v1.1.0 — decision/history helpers. Reads only from the `history` array
// the backend now includes on getMyRequests/getMyConcerns (already scoped
// to the authenticated resident's own records — see requestController.js).
function getRejectionNote(request) {
  const entry = (request.history || []).slice().reverse().find((h) => h.toStatus === 'rejected');
  return entry?.note || null;
}
function getReadyForPickupEvent(request) {
  return (request.history || []).slice().reverse().find((h) => h.toStatus === 'ready_for_pickup') || null;
}

async function refreshAll() {
  try {
    await loadRequestsAndConcerns();
  } catch (err) {
    if (err.status === 401) { clearSession(); location.replace('index.html?expired=1'); return; }
    showPageAlert(err.message, 'error');
  }
}

/* ----------------------------------------------------------- directory */

async function renderOfficials() {
  const target = document.getElementById('officials-grid');
  try {
    const data = await getOfficials();
    const officials = data?.officials || [];
    target.innerHTML = officials.length
      ? officials.map((o) => `<article class="id-card"><div class="id-card__role">${esc(o.position || o.title || o.role || '')}</div><div class="id-card__name">${esc(o.name || o.fullName || '')}</div><div class="id-card__contact">${esc(o.contactNumber || o.contact || '')}</div></article>`).join('')
      : '<p class="hint">No officials have been published yet.</p>';
  } catch {
    target.innerHTML = '<p class="hint">The directory is temporarily unavailable.</p>';
  }
}

async function renderNotices() {
  const target = document.getElementById('notices-board');
  try {
    const data = await getNotices();
    const notices = data?.notices || [];
    target.innerHTML = notices.length
      ? notices.map((n, i) => `<article class="notice notice--${i % 3 === 0 ? 'green' : i % 3 === 1 ? 'orange' : 'gold'}"><div class="notice__title">${esc(n.title)}</div><div class="notice__body">${esc(n.body || n.content || '')}</div><span class="notice__date">Posted ${fmtDate(n.publishedAt || n.createdAt)}</span></article>`).join('')
      : '<p class="hint">No notices have been published yet.</p>';
  } catch {
    target.innerHTML = '<p class="hint">The notice board is temporarily unavailable.</p>';
  }
}

/* ---------------------------------------------------------------- forms */

function renderStub(request) {
  document.getElementById('stub-placeholder').hidden = true;
  document.getElementById('stub-output').innerHTML = `<div class="stub"><div class="stub__eyebrow">Claim stub</div><div class="stub__doc">${esc(request.documentType)}</div><div class="stub__row"><span>Purpose</span><span>${esc(request.purpose)}</span></div><div class="stub__row"><span>Tracking No.</span><span class="stub__tracking">${esc(request.trackingNumber || request.id)}</span></div><div class="stub__row"><span>Date filed</span><span>${fmtDate(request.createdAt)}</span></div></div><p class="hint">Keep your tracking number — present it at the window when you claim your document.</p>`;
}

function initForms() {
  document.getElementById('request-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Submitting…';
    try {
      const response = await createRequest({
        documentType: document.getElementById('doc-type').value,
        purpose: document.getElementById('doc-purpose').value.trim(),
      });
      renderStub(response?.request || response);
      await refreshAll();
      event.target.reset();
    } catch (err) {
      showPageAlert(err.message || 'Unable to submit your request.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Submit request';
    }
  });

  document.getElementById('report-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Submitting…';
    try {
      await createConcern({
        category: document.getElementById('report-type').value,
        location: document.getElementById('report-location').value.trim(),
        description: document.getElementById('report-desc').value.trim(),
      });
      showPageAlert('Concern reported. You can track it under My Concerns.', 'ok');
      await refreshAll();
      event.target.reset();
    } catch (err) {
      showPageAlert(err.message || 'Unable to submit your concern.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Submit report';
    }
  });
}

/* -------------------------------------------------------- claim actions */

// v1.1.0 §19 — client-generated PNG, no server-side PDF infrastructure.
// Downloading this causes no status transition by itself; only the
// separate "Claimed" button (handleClaimed below) calls the API.
function generateClaimStubCanvas(request) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F8F5EE';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1F5C43';
  ctx.fillRect(0, 0, canvas.width, 110);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Georgia, serif';
  ctx.fillText('Barangay San Isidro', 40, 48);
  ctx.font = '600 15px Arial';
  ctx.fillStyle = '#DDEFE6';
  ctx.fillText('DOCUMENT CLAIM STUB', 40, 78);

  const readyEvent = getReadyForPickupEvent(request);
  const rows = [
    ['Resident name', currentUser?.fullName || '—'],
    ['Document type', request.documentType],
    ['Tracking number', request.trackingNumber || request.id],
    ['Date filed', fmtDate(request.createdAt)],
    ['Ready for pickup', readyEvent ? fmtDate(readyEvent.createdAt) : '—'],
    ['Processing Staff ID', readyEvent?.actorStaffId || '—'],
  ];

  let y = 165;
  rows.forEach(([label, value]) => {
    ctx.font = '600 12px Arial';
    ctx.fillStyle = '#5B6570';
    ctx.fillText(label.toUpperCase(), 40, y);
    ctx.font = '600 20px Arial';
    ctx.fillStyle = '#1B1F23';
    ctx.fillText(String(value), 40, y + 26);
    y += 58;
  });

  ctx.font = 'italic 13px Arial';
  ctx.fillStyle = '#5B6570';
  wrapCanvasText(ctx, 'Present this stub (digital or printed) at the barangay hall window when claiming your document.', 40, y + 14, 820, 18);

  return canvas;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  words.forEach((word) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  ctx.fillText(line, x, y);
}

function downloadClaimStub(request) {
  const canvas = generateClaimStubCanvas(request);
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${request.trackingNumber || request.id}-claim-stub.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

async function handleClaimed(id, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Confirming…';
  try {
    await confirmRequestClaimed(id);
    showPageAlert('Claim confirmed — request marked completed.', 'ok');
    await refreshAll();
  } catch (err) {
    showPageAlert(err.message || 'Unable to confirm claim.', 'error');
    button.disabled = false;
    button.textContent = original;
  }
}

async function handleConfirmResolved(id, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Confirming…';
  try {
    await confirmConcernResolved(id);
    showPageAlert('Thanks — concern marked closed.', 'ok');
    await refreshAll();
  } catch (err) {
    showPageAlert(err.message || 'Unable to confirm resolution.', 'error');
    button.disabled = false;
    button.textContent = original;
  }
}

document.addEventListener('click', async (e) => {
  const downloadBtn = e.target.closest('[data-download-stub]');
  const claimBtn = e.target.closest('[data-claim]');
  const resolveBtn = e.target.closest('[data-confirm-resolved]');

  if (downloadBtn) {
    const request = requestsCache.find((r) => r.id === downloadBtn.dataset.downloadStub);
    if (request) downloadClaimStub(request);
  }
  if (claimBtn) await handleClaimed(claimBtn.dataset.claim, claimBtn);
  if (resolveBtn) await handleConfirmResolved(resolveBtn.dataset.confirmResolved, resolveBtn);
});

/* --------------------------------------------------------------- init */

document.getElementById('logout-btn').addEventListener('click', () => { clearSession(); location.replace('index.html'); });

initNav();
initForms();
renderOfficials();
renderNotices();

document.addEventListener('member-auth-ready', (e) => {
  const user = e.detail.user;
  currentUser = user;
  document.getElementById('welcome-name').textContent = user.fullName;
  document.getElementById('resident-email').textContent = user.email;
  refreshAll();
});
