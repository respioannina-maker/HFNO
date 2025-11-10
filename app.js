const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const statusEl = $('#status');

// Mobile nav & tabs
$('#toggleNav')?.addEventListener('click', () => $('#nav').classList.toggle('hidden'));
$$('.tabbtn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const target=btn.getAttribute('data-tab');
    $$('.tabbtn').forEach(b=>b.classList.remove('btn'));
    btn.classList.add('btn');
    $$('[data-tabpanel]').forEach(p=>{
      p.classList.toggle('hidden', p.getAttribute('data-tabpanel')!==target && window.innerWidth<768);
    });
  });
});
if (window.innerWidth<768) document.querySelector('.tabbtn[data-tab="basic"]')?.click();

// JSONP helper
function jsonp(url, params = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k,v]) => v!=null && u.searchParams.set(k, v));
    const cb = '__cb' + Math.random().toString(36).slice(2);
    u.searchParams.set('callback', cb);

    const script = document.createElement('script');
    script.src = u.toString();
    script.async = true;

    const cleanup = () => { delete window[cb]; script.remove(); };
    const timer = setTimeout(()=>{ cleanup(); reject(new Error('JSONP timeout')); }, 15000);

    window[cb] = (data) => { clearTimeout(timer); cleanup(); resolve(data); };
    script.onerror = () => { clearTimeout(timer); cleanup(); reject(new Error('JSONP network error')); };

    document.body.appendChild(script);
  });
}

// API via JSONP
function apiFetchAll(){ return jsonp(window.API_BASE, { action: 'fetch' }); }
function apiSave(payload){
  return jsonp(window.API_BASE, {
    action: 'save',
    payload: encodeURIComponent(JSON.stringify(payload))
  });
}

// Submit
const form = document.getElementById('crfForm');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const payload = {};
  fd.forEach((v,k)=>payload[k]=v);
  statusEl.textContent='Αποθήκευση...';
  try{
    const json = await apiSave(payload);
    if(!json || json.ok!==true) throw new Error((json && json.error) || 'Σφάλμα');
    statusEl.textContent = json.result.status==='updated' ? 'Ενημερώθηκε η εγγραφή' : 'Καταχωρήθηκε νέα εγγραφή';
    await loadRows();
    form.reset();
  }catch(err){
    statusEl.textContent='Σφάλμα: '+err.message;
  }
});
document.getElementById('resetBtn').addEventListener('click', ()=>form.reset());

// List
const tbody = document.getElementById('rowsTbody');
function renderRows(rows){
  const arr = Array.isArray(rows) ? rows : [];
  tbody.innerHTML='';
  arr.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
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
async function loadRows(){
  try{
    const data=await apiFetchAll();
    renderRows(data);
  }catch(err){
    statusEl.textContent='Σφάλμα φόρτωσης: '+err.message;
  }
}
loadRows();
