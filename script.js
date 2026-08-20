const STORE = {
  requests: 'barangay_requests',
  reports: 'barangay_reports',
  seeded: 'barangay_seeded'
};

const REQUEST_FLOW = ['Pending', 'Ready', 'Claimed'];
const REPORT_FLOW = ['Received', 'In Progress', 'Resolved'];

const OFFICIALS = [
  { role: 'Barangay Captain', name: 'Hon. Ramon Villareal', contact: '0917 200 1188' },
  { role: 'Kagawad — Peace & Order', name: 'Hon. Teresa Ocampo', contact: '0918 344 7712' },
  { role: 'Kagawad — Health', name: 'Hon. Manuel Sison', contact: '0920 561 0034' },
  { role: 'SK Chairperson', name: 'Nico Fernandez', contact: '0995 122 8890' },
  { role: 'Barangay Tanod Head', name: 'Danilo Reyes', contact: '0917 655 3321' },
  { role: 'Barangay Secretary', name: 'Marites Aquino', contact: '0929 810 4456' }
];

const NOTICES = [
  { title: 'Free Anti-Rabies Vaccination', body: 'Bring your dogs and cats to the covered court this Saturday, 8AM–12NN. Free of charge.', date: 'Aug 22, 2026', color: 'green' },
  { title: 'Road Closure — Purok 3', body: 'Main road will be closed for drainage repair from Aug 24–26. Please use the Purok 2 detour.', date: 'Aug 20, 2026', color: 'orange' },
  { title: 'Barangay Assembly', body: 'Quarterly assembly this Sunday, 2PM at the covered court. Attendance is per household.', date: 'Aug 18, 2026', color: 'gold' }
];

function load(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function genTrackingId() {
  return `BSI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function shortDate() {
  return new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function seedIfNeeded() {
  if (localStorage.getItem(STORE.seeded)) return;
  save(STORE.requests, [{
    id: genTrackingId(), doc: 'Barangay Clearance', purpose: 'Job application',
    name: 'Sample Resident', contact: '0917 000 0000', status: 'Ready', date: shortDate()
  }]);
  save(STORE.reports, [{
    id: genTrackingId(), type: 'Street light / infrastructure',
    location: 'Purok 4, near basketball court', desc: 'Street light has been out for a week.',
    anon: false, contact: '0917 000 0000', status: 'In Progress', date: shortDate()
  }]);
  localStorage.setItem(STORE.seeded, '1');
}

function renderOfficials() {
  document.getElementById('officials-grid').innerHTML = OFFICIALS.map((official) => `
    <article class="id-card">
      <div class="id-card__role">${official.role}</div>
      <div class="id-card__name">${official.name}</div>
      <div class="id-card__contact">${official.contact}</div>
    </article>
  `).join('');
}

function renderNotices() {
  document.getElementById('notices-board').innerHTML = NOTICES.map((notice) => `
    <article class="notice notice--${notice.color}">
      <div class="notice__title">${notice.title}</div>
      <div class="notice__body">${notice.body}</div>
      <span class="notice__date">Posted ${notice.date}</span>
    </article>
  `).join('');
}

function renderStub(entry) {
  document.getElementById('stub-placeholder').hidden = true;
  document.getElementById('stub-output').innerHTML = `
    <div class="stub">
      <div class="stub__eyebrow">Claim stub</div>
      <div class="stub__doc">${entry.doc}</div>
      <div class="stub__row"><span>Name</span><span>${entry.name}</span></div>
      <div class="stub__row"><span>Purpose</span><span>${entry.purpose}</span></div>
      <div class="stub__row"><span>Tracking No.</span><span class="stub__tracking">${entry.id}</span></div>
      <div class="stub__row"><span>Date filed</span><span>${entry.date}</span></div>
    </div>
    <p class="hint">Keep your tracking number — present it at the window when you claim your document.</p>
  `;
}

function renderRequestList() {
  const requests = load(STORE.requests);
  const target = document.getElementById('request-list-items');
  if (!requests.length) {
    target.innerHTML = '<p class="hint">No requests yet.</p>';
    return;
  }
  target.innerHTML = requests.map((request) => `
    <div class="mini-stub">
      <div class="mini-stub__info">
        <span class="mini-stub__doc">${request.doc}</span>
        <span class="mini-stub__meta">${request.id} · filed ${request.date}</span>
      </div>
      <button class="status-badge status-${request.status.replaceAll(' ', '-')}" data-id="${request.id}" data-kind="request">${request.status}</button>
    </div>
  `).join('');
}

function renderReportList() {
  const reports = load(STORE.reports);
  const target = document.getElementById('report-list-items');
  if (!reports.length) {
    target.innerHTML = '<p class="hint">No reports yet.</p>';
    return;
  }
  target.innerHTML = reports.map((report) => `
    <div class="slip">
      <div class="slip__info">
        <span class="slip__type">${report.type}</span>
        <span class="slip__meta">${report.id} · ${report.location}</span>
      </div>
      <button class="status-badge status-${report.status.replaceAll(' ', '-')}" data-id="${report.id}" data-kind="report">${report.status}</button>
    </div>
  `).join('');
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

document.getElementById('request-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = {
    id: genTrackingId(),
    doc: document.getElementById('doc-type').value,
    purpose: document.getElementById('doc-purpose').value.trim(),
    name: document.getElementById('doc-name').value.trim(),
    contact: document.getElementById('doc-contact').value.trim(),
    status: 'Pending',
    date: shortDate()
  };
  const requests = load(STORE.requests);
  requests.unshift(entry);
  save(STORE.requests, requests);
  renderStub(entry);
  renderRequestList();
  event.target.reset();
});

const anonCheckbox = document.getElementById('report-anon');
const contactWrap = document.getElementById('report-contact-wrap');

anonCheckbox.addEventListener('change', () => {
  contactWrap.hidden = anonCheckbox.checked;
});

document.getElementById('report-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = {
    id: genTrackingId(),
    type: document.getElementById('report-type').value,
    location: document.getElementById('report-location').value.trim(),
    desc: document.getElementById('report-desc').value.trim(),
    anon: anonCheckbox.checked,
    contact: anonCheckbox.checked ? '' : document.getElementById('report-contact').value.trim(),
    status: 'Received',
    date: shortDate()
  };
  const reports = load(STORE.reports);
  reports.unshift(entry);
  save(STORE.reports, reports);
  renderReportList();
  event.target.reset();
  contactWrap.hidden = false;
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('.status-badge');
  if (!button) return;
  const key = button.dataset.kind === 'request' ? STORE.requests : STORE.reports;
  const flow = button.dataset.kind === 'request' ? REQUEST_FLOW : REPORT_FLOW;
  const items = load(key);
  const item = items.find((entry) => entry.id === button.dataset.id);
  if (!item) return;
  item.status = flow[(flow.indexOf(item.status) + 1) % flow.length];
  save(key, items);
  button.dataset.kind === 'request' ? renderRequestList() : renderReportList();
});

seedIfNeeded();
renderOfficials();
renderNotices();
renderRequestList();
renderReportList();