/* ============ TAB SWITCHING ============ */
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected', 'false'); });
    panels.forEach(p => p.classList.remove('panel--active'));

    tab.classList.add('tab--active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(tab.dataset.tab).classList.add('panel--active');
  });
});

/* ============ STORAGE HELPERS ============ */
const STORE = {
  requests: 'barangay_requests',
  reports: 'barangay_reports',
  seeded: 'barangay_seeded'
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Could not save', e);
  }
}

/* ============ SEED DATA (first run only) ============ */
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

function seedIfNeeded() {
  if (localStorage.getItem(STORE.seeded)) return;

  save(STORE.requests, [
    { id: genTrackingId(), doc: 'Barangay Clearance', purpose: 'Job application', name: 'Sample Resident', contact: '0917 000 0000', status: 'Ready', date: shortDate() }
  ]);
  save(STORE.reports, [
    { id: genTrackingId(), type: 'Street light / infrastructure', location: 'Purok 4, near basketball court', desc: 'Street light has been out for a week.', anon: false, contact: '0917 000 0000', status: 'In Progress', date: shortDate() }
  ]);

  localStorage.setItem(STORE.seeded, '1');
}

/* ============ UTILITIES ============ */
function genTrackingId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return 'BSI-' + new Date().getFullYear() + '-' + n;
}

function shortDate() {
  return new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/* ============ RENDER: DIRECTORY ============ */
function renderOfficials() {
  const grid = document.getElementById('officials-grid');
  grid.innerHTML = OFFICIALS.map(o => `
    <div class="id-card">
      <div class="id-card__role">${o.role}</div>
      <div class="id-card__name">${o.name}</div>
      <div class="id-card__contact">${o.contact}</div>
    </div>
  `).join('');
}

function renderNotices() {
  const board = document.getElementById('notices-board');
  board.innerHTML = NOTICES.map(n => `
    <div class="notice notice--${n.color}">
      <div class="notice__title">${n.title}</div>
      <div class="notice__body">${n.body}</div>
      <span class="notice__date">Posted ${n.date}</span>
    </div>
  `).join('');
}

/* ============ REQUEST FORM ============ */
const requestForm = document.getElementById('request-form');
const stubOutput = document.getElementById('stub-output');
const stubPlaceholder = document.getElementById('stub-placeholder');

requestForm.addEventListener('submit', e => {
  e.preventDefault();

  const entry = {
    id: genTrackingId(),
    doc: document.getElementById('doc-type').value,
    purpose: document.getElementById('doc-purpose').value,
    name: document.getElementById('doc-name').value,
    contact: document.getElementById('doc-contact').value,
    status: 'Pending',
    date: shortDate()
  };

  const all = load(STORE.requests);
  all.unshift(entry);
  save(STORE.requests, all);

  renderStub(entry);
  renderRequestList();
  requestForm.reset();
});

function renderStub(entry) {
  stubPlaceholder.style.display = 'none';
  stubOutput.innerHTML = `
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
  const wrap = document.getElementById('request-list-items');
  const all = load(STORE.requests);

  if (all.length === 0) {
    wrap.innerHTML = '<p class="hint">No requests yet.</p>';
    return;
  }

  wrap.innerHTML = all.map(r => `
    <div class="mini-stub">
      <div class="mini-stub__info">
        <span class="mini-stub__doc">${r.doc}</span>
        <span class="mini-stub__meta">${r.id} · filed ${r.date}</span>
      </div>
      <button class="status-badge status-${r.status.replace(' ', '-')}" data-id="${r.id}" data-kind="request">${r.status}</button>
    </div>
  `).join('');
}

/* ============ REPORT FORM ============ */
const reportForm = document.getElementById('report-form');
const anonCheckbox = document.getElementById('report-anon');
const contactWrap = document.getElementById('report-contact-wrap');

anonCheckbox.addEventListener('change', () => {
  contactWrap.style.display = anonCheckbox.checked ? 'none' : 'block';
});

reportForm.addEventListener('submit', e => {
  e.preventDefault();

  const entry = {
    id: genTrackingId(),
    type: document.getElementById('report-type').value,
    location: document.getElementById('report-location').value,
    desc: document.getElementById('report-desc').value,
    anon: anonCheckbox.checked,
    contact: anonCheckbox.checked ? '' : document.getElementById('report-contact').value,
    status: 'Received',
    date: shortDate()
  };

  const all = load(STORE.reports);
  all.unshift(entry);
  save(STORE.reports, all);

  renderReportList();
  reportForm.reset();
  contactWrap.style.display = 'block';
});

function renderReportList() {
  const wrap = document.getElementById('report-list-items');
  const all = load(STORE.reports);

  if (all.length === 0) {
    wrap.innerHTML = '<p class="hint">No reports yet.</p>';
    return;
  }

  wrap.innerHTML = all.map(r => `
    <div class="slip">
      <div class="slip__info">
        <span class="slip__type">${r.type}</span>
        <span class="slip__meta">${r.id} · ${r.location}</span>
      </div>
      <button class="status-badge status-${r.status.replace(' ', '-')}" data-id="${r.id}" data-kind="report">${r.status}</button>
    </div>
  `).join('');
}

/* ============ STATUS CYCLING (simulated staff action) ============ */
const REQUEST_FLOW = ['Pending', 'Ready', 'Claimed'];
const REPORT_FLOW = ['Received', 'In Progress', 'Resolved'];

document.addEventListener('click', e => {
  const btn = e.target.closest('.status-badge');
  if (!btn) return;

  const kind = btn.dataset.kind;
  const id = btn.dataset.id;
  const key = kind === 'request' ? STORE.requests : STORE.reports;
  const flow = kind === 'request' ? REQUEST_FLOW : REPORT_FLOW;

  const all = load(key);
  const item = all.find(x => x.id === id);
  if (!item) return;

  const nextIndex = (flow.indexOf(item.status) + 1) % flow.length;
  item.status = flow[nextIndex];
  save(key, all);

  kind === 'request' ? renderRequestList() : renderReportList();
});

/* ============ INIT ============ */
seedIfNeeded();
renderOfficials();
renderNotices();
renderRequestList();
renderReportList();
