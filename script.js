const REQUEST_STATUS = { pending: 'Pending', ready: 'Ready', claimed: 'Claimed' };
const REPORT_STATUS = { received: 'Received', in_progress: 'In Progress', resolved: 'Resolved' };

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusLabel(status, map) {
  return map[String(status || '').toLowerCase()] || status || 'Pending';
}

function requireMemberAuth() {
  const session = getSession();
  if (!session?.token || session?.user?.role === 'admin') {
    window.location.href = 'member-login.html?returnTo=index.html';
    return false;
  }
  return true;
}

function showMessage(container, message, type = 'error') {
  if (!container) return;
  container.hidden = false;
  container.className = `form-alert form-alert--${type}`;
  container.textContent = message;
}

async function renderOfficials() {
  const target = document.getElementById('officials-grid');
  try {
    const data = await getOfficials();
    const officials = data?.officials || [];
    target.innerHTML = officials.length ? officials.map((official) => `
      <article class="id-card">
        <div class="id-card__role">${escapeHtml(official.title || official.role || official.position || '')}</div>
        <div class="id-card__name">${escapeHtml(official.name || official.fullName || '')}</div>
        <div class="id-card__contact">${escapeHtml(official.contact || official.contactNumber || '')}</div>
      </article>
    `).join('') : '<p class="hint">No officials have been published yet.</p>';
  } catch {
    target.innerHTML = '<p class="hint">The directory is temporarily unavailable.</p>';
  }
}

async function renderNotices() {
  const target = document.getElementById('notices-board');
  try {
    const data = await getNotices();
    const notices = data?.notices || [];
    target.innerHTML = notices.length ? notices.map((notice, index) => `
      <article class="notice notice--${index % 3 === 0 ? 'green' : index % 3 === 1 ? 'orange' : 'gold'}">
        <div class="notice__title">${escapeHtml(notice.title)}</div>
        <div class="notice__body">${escapeHtml(notice.body || notice.content || '')}</div>
        <span class="notice__date">Posted ${formatDate(notice.publishedAt || notice.createdAt)}</span>
      </article>
    `).join('') : '<p class="hint">No notices have been published yet.</p>';
  } catch {
    target.innerHTML = '<p class="hint">The notice board is temporarily unavailable.</p>';
  }
}

function renderStub(request) {
  document.getElementById('stub-placeholder').hidden = true;
  document.getElementById('stub-output').innerHTML = `
    <div class="stub">
      <div class="stub__eyebrow">Claim stub</div>
      <div class="stub__doc">${escapeHtml(request.documentType)}</div>
      <div class="stub__row"><span>Purpose</span><span>${escapeHtml(request.purpose)}</span></div>
      <div class="stub__row"><span>Tracking No.</span><span class="stub__tracking">${escapeHtml(request.id)}</span></div>
      <div class="stub__row"><span>Date filed</span><span>${formatDate(request.createdAt)}</span></div>
    </div>
    <p class="hint">Keep your tracking number — present it at the window when you claim your document.</p>
  `;
}

function renderRequestList(requests) {
  const target = document.getElementById('request-list-items');
  if (!requests.length) {
    target.innerHTML = '<p class="hint">No requests yet.</p>';
    return;
  }
  target.innerHTML = requests.map((request) => {
    const status = statusLabel(request.status, REQUEST_STATUS);
    return `
      <div class="mini-stub">
        <div class="mini-stub__info">
          <span class="mini-stub__doc">${escapeHtml(request.documentType)}</span>
          <span class="mini-stub__meta">${escapeHtml(request.id)} · filed ${formatDate(request.createdAt)}</span>
        </div>
        <span class="status-badge status-${status.replaceAll(' ', '-')}">${escapeHtml(status)}</span>
      </div>
    `;
  }).join('');
}

function renderReportList(reports) {
  const target = document.getElementById('report-list-items');
  if (!reports.length) {
    target.innerHTML = '<p class="hint">No reports yet.</p>';
    return;
  }
  target.innerHTML = reports.map((report) => {
    const status = statusLabel(report.status, REPORT_STATUS);
    return `
      <div class="slip">
        <div class="slip__info">
          <span class="slip__type">${escapeHtml(report.category)}</span>
          <span class="slip__meta">${escapeHtml(report.id)} · ${escapeHtml(report.location || 'Location not supplied')}</span>
        </div>
        <span class="status-badge status-${status.replaceAll(' ', '-')}">${escapeHtml(status)}</span>
      </div>
    `;
  }).join('');
}

async function refreshResidentData() {
  if (!getSession()?.token) return;
  try {
    const [requestsData, concernsData] = await Promise.all([getMyRequests(), getMyConcerns()]);
    const requests = requestsData?.requests || [];
    const concerns = concernsData?.concerns || [];
    renderRequestList(requests);
    renderReportList(concerns);
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      window.location.href = 'member-login.html?returnTo=index.html';
      return;
    }
    renderRequestList([]);
    renderReportList([]);
  }
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => {
      item.classList.toggle('tab--active', item === tab);
      item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
    });
    document.querySelectorAll('.panel').forEach((panel) => {
      panel.hidden = panel.id !== tab.dataset.tab;
      panel.classList.toggle('panel--active', panel.id === tab.dataset.tab);
    });
  });
});

document.getElementById('request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireMemberAuth()) return;
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Submitting…';
  try {
    const request = await createRequest({
      documentType: document.getElementById('doc-type').value,
      purpose: document.getElementById('doc-purpose').value.trim(),
    });
    renderStub(request?.request || request);
    await refreshResidentData();
    form.reset();
  } catch (error) {
    alert(error.message || 'Unable to submit your request.');
  } finally {
    button.disabled = false;
    button.textContent = 'Submit request';
  }
});

const anonCheckbox = document.getElementById('report-anon');
const contactWrap = document.getElementById('report-contact-wrap');
anonCheckbox.addEventListener('change', () => { contactWrap.hidden = anonCheckbox.checked; });

document.getElementById('report-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireMemberAuth()) return;
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Submitting…';
  try {
    await createConcern({
      category: document.getElementById('report-type').value,
      location: document.getElementById('report-location').value.trim(),
      description: document.getElementById('report-desc').value.trim(),
    });
    await refreshResidentData();
    form.reset();
    contactWrap.hidden = false;
  } catch (error) {
    alert(error.message || 'Unable to submit your concern.');
  } finally {
    button.disabled = false;
    button.textContent = 'Submit report';
  }
});

renderOfficials();
renderNotices();
refreshResidentData();
