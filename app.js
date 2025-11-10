const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const statusEl = $('#status');

// Προαιρετικό κουμπί "Άνοιγμα Google Sheet"
const openBtn = $('#openSheetBtn');
if (openBtn && window.SHEET_URL && window.SHEET_URL.startsWith('http')) {
  openBtn.href = window.SHEET_URL;
  openBtn.classList.remove('hidden');
}

// Mobile tabs
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

// API via JSONP (only save used here)
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
    statusEl.textContent = json.result.status==='updated' ? 'Ενημερώθηκε η εγγραφή' : 'Καταχωρήθηκε νέα εγγραφή (κορυφή)';
    form.reset();
  }catch(err){
    statusEl.textContent='Σφάλμα: '+err.message;
  }
});
$('#resetBtn').addEventListener('click', ()=>form.reset());
