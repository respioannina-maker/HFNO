const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const statusEl = $('#status');

// --- μικρό mobile nav & tabs ---
$('#toggleNav')?.addEventListener('click', () => {
  const nav = $('#nav');
  nav.classList.toggle('hidden');
});
$$('.tabbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');
    $$('.tabbtn').forEach(b => b.classList.remove('btn'));
    btn.classList.add('btn');
    $$('[data-tabpanel]').forEach(p => {
      p.classList.toggle('hidden', p.getAttribute('data-tabpanel') !== target && window.innerWidth < 768);
    });
  });
});
// default mobile tab
if (window.innerWidth < 768) {
  const first = document.querySelector('.tabbtn[data-tab="basic"]');
  if (first) first.click();
}

// --- API helpers (GET/POST JSON) ---
async function apiGet(params = {}) {
  const url = new URL(window.API_BASE);
  url.searchParams.set('action', 'fetch');
  Object.entries(params).forEach(([k,v]) => v!=null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'GET' });
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch { throw new Error('Το WebApp δεν επέστρεψε JSON. Έλεγξε ότι είναι το τελικό …/exec και access=Anyone.'); }
}

async function apiSave(payload) {
  const res = await fetch(window.API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', payload })
  });
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch { throw new Error('Η αποθήκευση δεν επέστρεψε JSON. Έλεγξε το deployment (…/exec) & access=Anyone.'); }
}

// --- Φόρμα: insert/update ανά ΝΠΣ ---
const form = document.getElementById('crfForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = {};
  fd.forEach((v,k) => payload[k] = v);
  statusEl.textContent = 'Αποθήκευση...';
  try {
    const json = await apiSave(payload);
    if (!json.ok) throw new Error(json.error || 'Σφάλμα');
    statusEl.textContent = json.result.status === 'updated' ? 'Ενημερώθηκε η εγγραφή' : 'Καταχωρήθηκε νέα εγγραφή';
    await loadRows();
    form.reset();
  } catch (err) {
    statusEl.textContent = 'Σφάλμα: ' + err.message;
  }
});
document.getElementById('resetBtn').addEventListener('click', () => form.reset());

// --- Λίστα (όλα τα rows) ---
const tbody = document.getElementById('rowsTbody');
function renderRows(rows) {
  const arr = Array.isArray(rows) ? rows : [];
  tbody.innerHTML = '';
  arr.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${r['ΝΠΣ']||''}</td>
      <td class="p-2">${[r['Όνομα']||'', r['Επώνυμο']||''].join(' ').trim()}</td>
      <td class="p-2">${r['Ημερομηνία']||''}</td>
      <td class="p-2">${r['Ηλικία']||''}</td>
      <td class="p-2">${r['BMI']||''}</td>
      <td class="p-2">${r['STOP-BANG score']||''}</td>
      <td class="p-2">${r['FEV1 (L)']||''}</td>
      <td class="p-2">${r['FVC (L)']||''}</td>
      <td class="p-2">${r['FEV1/FVC (%)']||''}</td>
      <td class="p-2">${r['ODI4 (1/hr)']||''}</td>
      <td class="p-2">${r['CT90 (=100-Below90)']||''}</td>
      <td class="p-2">${r['CT88 (interp 90–85)']||''}</td>
      <td class="p-2">${r['Mean SpO2 (EBUS)']||''}</td>
    `;
    tbody.appendChild(tr);
  });
}
async function loadRows() {
  try {
    const data = await apiGet();
    renderRows(data);
  } catch (err) {
    statusEl.textContent = 'Σφάλμα φόρτωσης: ' + err.message;
  }
}
loadRows();
