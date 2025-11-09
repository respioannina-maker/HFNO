const $ = (s) => document.querySelector(s);
const statusEl = $('#status');

async function apiFetch(action, params = {}) {
  const url = new URL(window.API_BASE);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k,v]) => v!=null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'GET' });
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch { throw new Error("Το WebApp δεν επέστρεψε JSON (ήρθε HTML). Έλεγξε ότι το URL είναι το …/exec και το deployment είναι Public (Anyone)."); }
}

async function apiSave(payload) {
  // Χρήση GET για αποθήκευση ώστε να αποφεύγεται preflight/CORS σε GitHub Pages
  const url = new URL(window.API_BASE);
  url.searchParams.set('action', 'save');
  url.searchParams.set('payload', encodeURIComponent(JSON.stringify(payload)));
  const res = await fetch(url.toString(), { method: 'GET' });
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch { throw new Error("Αποθήκευση: δεν ήρθε JSON (μάλλον HTML). Έλεγξε το …/exec και το access=Anyone."); }
}

// Φόρμα
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

// Λίστα
const tbody = document.getElementById('rowsTbody');
function renderRows(rows) {
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${r['ΝΠΣ']||''}</td>
      <td class="p-2">${[r['Όνομα']||'', r['Επώνυμο']||''].join(' ').trim()}</td>
      <td class="p-2">${r['Ημερομηνία']||''}</td>
      <td class="p-2">${r['FEV1 (L)']||''}</td>
      <td class="p-2">${r['FEV1 (% προβλ.)']||''}</td>
      <td class="p-2">${r['FVC (L)']||''}</td>
      <td class="p-2">${r['FEV1/FVC (%)']||''}</td>
      <td class="p-2">${r['pCO2 (mmHg)']||''}</td>
      <td class="p-2">${r['pH']||''}</td>
      <td class="p-2">${r['ODI4 (1/hr)']||''}</td>
      <td class="p-2">${r['CT90 (=100-Below90)']||''}</td>
      <td class="p-2">${r['CT88 (interp 90–85)']||''}</td>
      <td class="p-2">${r['Mean SpO2 (EBUS)']||''}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadRows() {
  const nps = document.getElementById('filterNps').value.trim();
  const json = await apiFetch('fetch', nps ? { nps } : {});
  renderRows(Array.isArray(json) ? json : []);
}
document.getElementById('searchBtn').addEventListener('click', loadRows);
loadRows();
