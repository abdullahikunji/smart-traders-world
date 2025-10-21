/* Smart Traders World — Register + Payment + Admin Approval
   Uses localStorage (demo). Admin credentials supplied by user.
   After admin approves, user can login and will be redirected to Google Form.
*/

// CONFIG
const CONFIG = {
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSe6Fd_jNCnZ22220UmBNYqUhZeKCo66RInk3l2kd59DY3SSAw/viewform?usp=header',
  conversionRate: 1500, // NGN per $1
  usdAmount: 5,
  nairaAmount() { return this.conversionRate * this.usdAmount; },
  usdtWallet: 'TYiqwUuwwU6Me8ezkoLJZkuKNkdefHQYVa',
  // ADMIN CREDENTIALS as requested
  adminEmail: 'abdullahikunji@gmail.com',
  adminPass: 'abdullahi090@1'
};

// STORAGE KEYS
const USERS_KEY = 'st_users';     // stores array of user objects
const PAYMENTS_KEY = 'st_payments'; // stores payments

// init storage if missing
if(!localStorage.getItem(USERS_KEY)) {
  // optional example user - active true (you can remove if you want)
  const defaultUsers = [
    { name: 'Abdullahi', email: 'abdullahikunji@gmail.com', password: 'abdullahi090@1', active:true }
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
}
if(!localStorage.getItem(PAYMENTS_KEY)) localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));

// helper load/save
function load(key){ try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch(e){ return []; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// Tabs logic
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tabcontent').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-tab');
    document.getElementById(tab).classList.add('active');
  });
});

// Convert file to base64 (data URL)
function fileToDataUrl(file){
  return new Promise((res, rej)=>{
    if(!file) return res(null);
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = e => rej(e);
    reader.readAsDataURL(file);
  });
}

// Register & submit payment
document.getElementById('submitRegister').addEventListener('click', async ()=>{
  const name = (document.getElementById('regName').value||'').trim();
  const email = (document.getElementById('regEmail').value||'').trim().toLowerCase();
  const password = document.getElementById('regPassword').value||'';
  const txid = (document.getElementById('txid').value||'').trim();
  const proofFile = document.getElementById('proofFile').files[0];
  const msgEl = document.getElementById('regMessage');

  msgEl.style.color = CONFIG.usdtWallet ? '#ffd966' : '#fff';

  if(!name || !email || !password) { msgEl.style.color='red'; msgEl.textContent='Please fill name, email and password.'; return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ msgEl.style.color='red'; msgEl.textContent='Invalid email format.'; return; }

  const users = load(USERS_KEY);
  if(users.find(u=>u.email===email)){ msgEl.style.color='red'; msgEl.textContent='Email already registered.'; return; }

  // require proof or txid
  const imgData = await fileToDataUrl(proofFile);
  if(!imgData && !txid) { msgEl.style.color='red'; msgEl.textContent='Please upload proof image or enter TXID'; return; }

  // create payment record
  const payments = load(PAYMENTS_KEY);
  const payment = {
    email, name, method: imgData? 'image' : 'txid', txid: txid||null, imageData: imgData||null, status:'pending', time: new Date().toISOString()
  };
  payments.push(payment);
  save(PAYMENTS_KEY, payments);

  // create user (inactive)
  users.push({ name, email, password, active:false });
  save(USERS_KEY, users);

  msgEl.style.color = '#7cff8d';
  msgEl.innerHTML = '✅ Payment proof submitted. Account is <strong>pending approval</strong>. You will be able to login after admin approves.';

  // clear some fields
  document.getElementById('regPassword').value='';
  document.getElementById('proofFile').value='';
  document.getElementById('txid').value='';
});

// Login (user)
document.getElementById('btnLogin').addEventListener('click', ()=>{
  const email = (document.getElementById('loginEmail').value||'').trim().toLowerCase();
  const password = document.getElementById('loginPassword').value||'';
  const msg = document.getElementById('loginMsg');

  if(!email || !password){ msg.style.color='red'; msg.textContent='Fill email and password.'; return; }
  const users = load(USERS_KEY);
  const user = users.find(u=>u.email===email);
  if(!user){ msg.style.color='red'; msg.textContent='No account found. Register & upload proof first.'; return; }
  if(user.password !== password){ msg.style.color='red'; msg.textContent='Wrong password.'; return; }
  if(!user.active){ msg.style.color='orange'; msg.textContent='Account not approved yet. Please wait for admin approval.'; return; }

  // success — redirect to Google Form (lessons)
  msg.style.color='#7cff8d'; msg.textContent='✅ Login successful — redirecting to lessons...';
  setTimeout(()=> window.location.href = CONFIG.googleFormUrl, 900);
});

// Admin logic
let adminLogged = false;
document.getElementById('adminBtn').addEventListener('click', ()=>{
  if(adminLogged){ openAdminPanel(); return; }
  // simple prompt login
  const email = prompt('Admin email: (enter admin email)');
  if(email === null) return;
  const pass = prompt('Admin password: (enter admin password)');
  if(pass === null) return;

  if(email.trim() === CONFIG.adminEmail && pass === CONFIG.adminPass){
    adminLogged = true;
    openAdminPanel();
  } else {
    alert('Wrong admin credentials.');
  }
});

function openAdminPanel(){
  document.getElementById('adminPanel').style.display = 'block';
  renderAdminLists();
  // scroll to admin panel
  document.getElementById('adminPanel').scrollIntoView({behavior:'smooth'});
}

document.getElementById('adminLogout').addEventListener('click', ()=>{
  adminLogged = false;
  document.getElementById('adminPanel').style.display = 'none';
  alert('Admin logged out.');
});

// render lists
function renderAdminLists(){
  const pendingEl = document.getElementById('pendingList');
  const approvedEl = document.getElementById('approvedList');
  pendingEl.innerHTML = '';
  approvedEl.innerHTML = '';

  const payments = load(PAYMENTS_KEY);
  const users = load(USERS_KEY);

  const pendingPayments = payments.filter(p=>p.status==='pending');
  const approvedPayments = payments.filter(p=>p.status==='approved');

  if(pendingPayments.length===0) pendingEl.innerHTML = '<div class="muted">No pending payments.</div>';
  pendingPayments.forEach((p, idx)=>{
    const row = document.createElement('div'); row.className='user-row';
    const left = document.createElement('div');
    left.innerHTML = `<div><strong>${escapeHtml(p.name)}</strong></div><div class="small">${escapeHtml(p.email)}</div><div class="small">Time: ${new Date(p.time).toLocaleString()}</div>
                      <div style="margin-top:6px"><b>TXID:</b> ${p.txid?escapeHtml(p.txid):'<span class="muted">none</span>'}</div>`;
    const right = document.createElement('div');
    if(p.imageData){
      const img = document.createElement('img'); img.src = p.imageData; img.style.maxWidth='120px'; img.style.borderRadius='8px'; img.style.display='block'; img.style.marginBottom='8px';
      right.appendChild(img);
    }
    const approveBtn = document.createElement('button'); approveBtn.className='btn-small btn-approve'; approveBtn.textContent='Approve';
    approveBtn.onclick = ()=> { approvePayment(p.email, p.time); };
    const rejectBtn = document.createElement('button'); rejectBtn.className='btn-small btn-reject'; rejectBtn.textContent='Reject';
    rejectBtn.onclick = ()=> { rejectPayment(p.email, p.time); };
    right.appendChild(approveBtn); right.appendChild(rejectBtn);

    row.appendChild(left); row.appendChild(right);
    pendingEl.appendChild(row);
  });

  if(approvedPayments.length===0) approvedEl.innerHTML = '<div class="muted">No approved members yet.</div>';
  approvedPayments.forEach(p=>{
    const row = document.createElement('div'); row.className='user-row';
    row.innerHTML = `<div><strong>${escapeHtml(p.name)}</strong><div class="small">${escapeHtml(p.email)}</div></div>
                     <div><span style="color:#7cff8d;font-weight:700">APPROVED</span></div>`;
    approvedEl.appendChild(row);
  });
}

// approve: set payment.status = 'approved' and set user.active = true
function approvePayment(email, time){
  const payments = load(PAYMENTS_KEY);
  const idx = payments.findIndex(x=>x.email===email && x.time===time && x.status==='pending');
  if(idx === -1){ alert('Payment not found'); return; }
  payments[idx].status = 'approved';
  save(PAYMENTS_KEY, payments);

  const users = load(USERS_KEY);
  const ui = users.findIndex(u=>u.email===email);
  if(ui !== -1){ users[ui].active = true; save(USERS_KEY, users); }

  alert('Payment approved and user activated.');
  renderAdminLists();
}

// reject: remove payment and user
function rejectPayment(email, time){
  let payments = load(PAYMENTS_KEY);
  payments = payments.filter(x=> !(x.email===email && x.time===time && x.status==='pending') );
  save(PAYMENTS_KEY, payments);

  let users = load(USERS_KEY);
  users = users.filter(u=>u.email !== email);
  save(USERS_KEY, users);

  alert('Registration rejected and removed.');
  renderAdminLists();
}

// simple helper escape
function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
