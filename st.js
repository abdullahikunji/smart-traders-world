/* Smart Traders World — Register + Payment + Auto Approval after 5 Minutes */

const CONFIG = {
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSe6Fd_jNCnZ22220UmBNYqUhZeKCo66RInk3l2kd59DY3SSAw/viewform?usp=header',
  conversionRate: 1500,
  usdAmount: 5,
  nairaAmount() { return this.conversionRate * this.usdAmount; },
  usdtWallet: 'TYiqwUuwwU6Me8ezkoLJZkuKNkdefHQYVa',
  adminEmail: 'abdullahikunji@gmail.com',
  adminPass: 'abdullahi090@1'
};

const USERS_KEY = 'st_users';
const PAYMENTS_KEY = 'st_payments';

if(!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify([]));
if(!localStorage.getItem(PAYMENTS_KEY)) localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));

function load(key){ try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch(e){ return []; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tabcontent').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
  });
});

function fileToDataUrl(file){
  return new Promise((res, rej)=>{
    if(!file) return res(null);
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = e => rej(e);
    reader.readAsDataURL(file);
  });
}

// ---------------- Human Verification --------------------
const humanCheckLogin = document.getElementById('humanCheckLogin');
const humanMsgLogin = document.getElementById('humanMsgLogin');
let humanVerifiedLogin = false;

humanCheckLogin.addEventListener('change', ()=>{
  if(humanCheckLogin.checked){
    humanMsgLogin.style.color = '#7cff8d';
    humanMsgLogin.textContent = '⏳ Verifying... please wait 5 seconds';
    humanVerifiedLogin = false;
    document.getElementById('btnLogin').disabled = true;
    setTimeout(()=>{
      humanMsgLogin.textContent = '✅ Verified!';
      humanVerifiedLogin = true;
      document.getElementById('btnLogin').disabled = false;
    },5000);
  } else { humanMsgLogin.style.color='var(--muted)'; humanMsgLogin.textContent=''; humanVerifiedLogin=false; }
});

const humanCheckReg = document.getElementById('humanCheckReg');
const humanMsgReg = document.getElementById('humanMsgReg');
let humanVerifiedReg = false;

humanCheckReg.addEventListener('change', ()=>{
  if(humanCheckReg.checked){
    humanMsgReg.style.color = '#7cff8d';
    humanMsgReg.textContent = '⏳ Verifying... please wait 5 seconds';
    humanVerifiedReg = false;
    document.getElementById('submitRegister').disabled = true;
    setTimeout(()=>{
      humanMsgReg.textContent = '✅ Verified!';
      humanVerifiedReg = true;
      document.getElementById('submitRegister').disabled = false;
    },5000);
  } else { humanMsgReg.style.color='var(--muted)'; humanMsgReg.textContent=''; humanVerifiedReg=false; }
});

// ---------------- Register --------------------
document.getElementById('submitRegister').addEventListener('click', async ()=>{
  const name = (document.getElementById('regName').value||'').trim();
  const email = (document.getElementById('regEmail').value||'').trim().toLowerCase();
  const password = document.getElementById('regPassword').value||'';
  const proofFile = document.getElementById('proofFile').files[0];
  const msgEl = document.getElementById('regMessage');

  if(!humanVerifiedReg){ msgEl.style.color='red'; msgEl.textContent='⚠️ Please verify you are human first.'; return; }
  if(!name || !email || !password){ msgEl.style.color='red'; msgEl.textContent='Please fill name, email and password.'; return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ msgEl.style.color='red'; msgEl.textContent='Invalid email format.'; return; }

  const users = load(USERS_KEY);
  if(users.find(u=>u.email===email)){ msgEl.style.color='red'; msgEl.textContent='Email already registered.'; return; }

  const imgData = await fileToDataUrl(proofFile);
  if(!imgData){ msgEl.style.color='red'; msgEl.textContent='Please upload your payment proof image.'; return; }

  const payments = load(PAYMENTS_KEY);
  const payment = { email, name, method:'image', imageData:imgData, status:'pending', time:new Date().toISOString() };
  payments.push(payment); save(PAYMENTS_KEY, payments);

  users.push({ name, email, password, active:false, regTime: Date.now() }); save(USERS_KEY, users);

  msgEl.style.color = '#7cff8d';
  msgEl.innerHTML = '✅ Payment proof submitted. Please wait a few minutes while admin verifies your account...';

  document.getElementById('regPassword').value='';
  document.getElementById('proofFile').value='';
});

// ---------------- Auto-approve after 5 minutes --------------------
setInterval(()=>{
  const users = load(USERS_KEY);
  let updated = false;
  const now = Date.now();
  users.forEach(u=>{
    if(!u.active && u.regTime && now - u.regTime >= 5*60*1000){ u.active = true; updated = true; }
  });
  if(updated) save(USERS_KEY, users);
},10000);

// ---------------- Login --------------------
document.getElementById('btnLogin').addEventListener('click', ()=>{
  const email = (document.getElementById('loginEmail').value||'').trim().toLowerCase();
  const password = document.getElementById('loginPassword').value||'';
  const msg = document.getElementById('loginMsg');

  if(!humanVerifiedLogin){ msg.style.color='red'; msg.textContent='⚠️ Please verify you are human first.'; return; }
  if(!email || !password){ msg.style.color='red'; msg.textContent='Fill email and password.'; return; }

  const users = load(USERS_KEY);
  const user = users.find(u=>u.email===email);
  if(!user){ msg.style.color='red'; msg.textContent='No account found. Register & upload proof first.'; return; }
  if(user.password !== password){ msg.style.color='red'; msg.textContent='Wrong password.'; return; }
  if(!user.active){ msg.style.color='orange'; msg.textContent='Account not approved yet. Please wait a few minutes...'; return; }

  msg.style.color='#7cff8d'; msg.textContent='✅ Login successful — redirecting...';
  setTimeout(()=> window.location.href = CONFIG.googleFormUrl, 1500);
});

// ---------------- Admin --------------------
let adminLogged = false;
document.getElementById('adminBtn').addEventListener('click', ()=>{
  if(adminLogged){ openAdminPanel(); return; }
  const email = prompt('Admin email:'); if(email===null) return;
  const pass = prompt('Admin password:'); if(pass===null) return;

  if(email.trim()===CONFIG.adminEmail && pass===CONFIG.adminPass){ adminLogged=true; openAdminPanel(); }
  else alert('Wrong admin credentials.');
});

document.getElementById('adminLogout').addEventListener('click', ()=>{
  adminLogged=false;
  document.getElementById('adminPanel').style.display='none';
  alert('Admin logged out.');
});

function openAdminPanel(){ document.getElementById('adminPanel').style.display='block'; renderAdminLists(); document.getElementById('adminPanel').scrollIntoView({behavior:'smooth'}); }

function renderAdminLists(){
  const pendingEl = document.getElementById('pendingList');
  const approvedEl = document.getElementById('approvedList');
  pendingEl.innerHTML=''; approvedEl.innerHTML='';

  const payments = load(PAYMENTS_KEY);
  const users = load(USERS_KEY);

  const pendingPayments = payments.filter(p=>p.status==='pending');
  const approvedPayments = payments.filter(p=>p.status==='approved');

  if(pendingPayments.length===0) pendingEl.innerHTML='<div class="muted">No pending payments.</div>';
  pendingPayments.forEach(p=>{
    const row = document.createElement('div'); row.className='user-row';
    const left = document.createElement('div');
    left.innerHTML = `<div><strong>${p.name}</strong></div><div class="small">${p.email}</div><div class="small">Time: ${new Date(p.time).toLocaleString()}</div>`;
    const right = document.createElement('div');
    const approveBtn = document.createElement('button'); approveBtn.className='btn-small btn-approve'; approveBtn.textContent='Approve';
    approveBtn.onclick = ()=>approvePayment(p.email, p.time);
    const rejectBtn = document.createElement('button'); rejectBtn.className='btn-small btn-reject'; rejectBtn.textContent='Reject';
    rejectBtn.onclick = ()=>rejectPayment(p.email, p.time);
    right.appendChild(approveBtn); right.appendChild(rejectBtn);
    row.appendChild(left); row.appendChild(right);
    pendingEl.appendChild(row);
  });

  if(approvedPayments.length===0) approvedEl.innerHTML='<div class="muted">No approved members yet.</div>';
  approvedPayments.forEach(p=>{
    const row = document.createElement('div'); row.className='user-row';
    row.innerHTML = `<div><strong>${p.name}</strong><div class="small">${p.email}</div></div><div><span style="color:#7cff8d;font-weight:700">APPROVED</span></div>`;
    approvedEl.appendChild(row);
  });
}

function approvePayment(email, time){
  const payments = load(PAYMENTS_KEY);
  const idx = payments.findIndex(x=>x.email===email && x.time===time && x.status==='pending');
  if(idx===-1){ alert('Payment not found'); return; }
  payments[idx].status='approved'; save(PAYMENTS_KEY, payments);

  const users = load(USERS_KEY);
  const ui = users.findIndex(u=>u.email===email);
  if(ui!==-1){ users[ui].active=true; save(USERS_KEY, users); }

  alert('Payment approved and user activated.');
  renderAdminLists();
}

function rejectPayment(email, time){
  let payments = load(PAYMENTS_KEY);
  payments = payments.filter(x=> !(x.email===email && x.time===time));
  save(PAYMENTS_KEY, payments);

  let users = load(USERS_KEY);
  users = users.filter(u=>u.email!==email);
  save(USERS_KEY, users);

  alert('Registration rejected and removed.');
  renderAdminLists();
}
