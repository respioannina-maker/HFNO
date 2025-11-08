const $ = (s) => document.querySelector(s);
const statusEl = $('#status');

async function apiFetch(action, params = {}) {
  const url = new URL(window.API_BASE);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k,v]) => v!=null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'GET' });
  return res.json();
}
async function apiSave(payload) {
  const res = await fetch(window.API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', payload })
  });
  return res.json();
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
$('#resetBtn').addEventListener('click', () => form.reset());

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
