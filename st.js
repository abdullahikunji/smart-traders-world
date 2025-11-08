
/* Smart Traders World — Register + Payment + Supabase Connection (No Auto Approval) */

const CONFIG = {
  supabaseUrl: 'https://onjrfjvrosjkysvxnqyh.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uanJmanZyb3Nqa3lzdnhucXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDcwNTMsImV4cCI6MjA3NzA4MzA1M30.5FUtOYN3Mhz_LB6fKDHqdEq8JiHugN8ODbFz94ObQLk',
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSe6Fd_jNCnZ22220UmBNYqUhZeKCo66RInk3l2kd59DY3SSAw/viewform?usp=header',
  conversionRate: 1500,
  usdAmount: 5,
  nairaAmount() { return this.conversionRate * this.usdAmount },
  usdtWallet: 'TYiqwUuwwU6Me8ezkoLJZkuKNkdefHQYVa',
  adminEmail: 'abdullahikunji@gmail.com',
  adminPass: 'abdullahi090@1'
};

// Supabase init
const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

// Helper
function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    if (!file) return res(null);
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = e => rej(e);
    reader.readAsDataURL(file);
  });
}

// ---------------- Tabs ----------------
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tabcontent').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
  });
});

// ---------------- Human Verification ----------------
let humanVerifiedLogin = false, humanVerifiedReg = false;

document.getElementById('humanCheckLogin').addEventListener('change', (e)=>{
  const msg = document.getElementById('humanMsgLogin');
  if(e.target.checked){
    msg.textContent = '⏳ Verifying... please wait 5 seconds';
    msg.style.color = '#7cff8d';
    document.getElementById('btnLogin').disabled = true;
    setTimeout(()=>{ msg.textContent='✅ Verified!'; humanVerifiedLogin=true; document.getElementById('btnLogin').disabled=false; }, 5000);
  } else { msg.textContent=''; humanVerifiedLogin=false; }
});

document.getElementById('humanCheckReg').addEventListener('change', (e)=>{
  const msg = document.getElementById('humanMsgReg');
  if(e.target.checked){
    msg.textContent = '⏳ Verifying... please wait 5 seconds';
    msg.style.color = '#7cff8d';
    document.getElementById('submitRegister').disabled = true;
    setTimeout(()=>{ msg.textContent='✅ Verified!'; humanVerifiedReg=true; document.getElementById('submitRegister').disabled=false; }, 5000);
  } else { msg.textContent=''; humanVerifiedReg=false; }
});

// ---------------- Register ----------------
document.getElementById('submitRegister').addEventListener('click', async ()=>{
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value.trim();
  const proofFile = document.getElementById('proofFile').files[0];
  const msgEl = document.getElementById('regMessage');

  if(!humanVerifiedReg){ msgEl.style.color='red'; msgEl.textContent='⚠️ Please verify you are human first.'; return; }
  if(!name || !email || !password){ msgEl.style.color='red'; msgEl.textContent='Please fill name, email and password.'; return; }
  if(!proofFile){ msgEl.style.color='red'; msgEl.textContent='Please upload your payment proof.'; return; }

  const { data: existing } = await supabase.from('users').select('email').eq('email', email);
  if(existing && existing.length>0){ msgEl.style.color='red'; msgEl.textContent='Email already registered.'; return; }

  const imgData = await fileToDataUrl(proofFile);

  // Save user and payment
  await supabase.from('users').insert([{ name, email, password, active: false }]);
  await supabase.from('payments').insert([{ email, name, imageData: imgData, status: 'pending', time: new Date().toISOString() }]);

  msgEl.style.color = '#7cff8d';
  msgEl.innerHTML = '✅ Payment proof submitted. Please wait for admin approval.';
  document.getElementById('regPassword').value='';
  document.getElementById('proofFile').value='';
});

// ---------------- Login ----------------
document.getElementById('btnLogin').addEventListener('click', async ()=>{
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value.trim();
  const msg = document.getElementById('loginMsg');

  if(!humanVerifiedLogin){ msg.style.color='red'; msg.textContent='⚠️ Please verify you are human first.'; return; }
  if(!email || !password){ msg.style.color='red'; msg.textContent='Fill email and password.'; return; }

  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

  if(!user){ msg.style.color='red'; msg.textContent='No account found. Register first.'; return; }
  if(user.password !== password){ msg.style.color='red'; msg.textContent='Wrong password.'; return; }
  if(!user.active){ msg.style.color='orange'; msg.textContent='Account not approved yet. Please wait for admin approval.'; return; }

  msg.style.color='#7cff8d';
  msg.textContent='✅ Login successful — redirecting...';
  setTimeout(()=> window.location.href = CONFIG.googleFormUrl, 1500);
});

// ---------------- Admin ----------------
let adminLogged = false;

document.getElementById('adminBtn').addEventListener('click', async ()=>{
  if(adminLogged){ openAdminPanel(); return; }

  const email = prompt('Admin email:'); if(email===null) return;
  const pass = prompt('Admin password:'); if(pass===null) return;

  if(email.trim()===CONFIG.adminEmail && pass===CONFIG.adminPass){
    adminLogged=true; openAdminPanel();
  } else alert('Wrong admin credentials.');
});

document.getElementById('adminLogout').addEventListener('click', ()=>{
  adminLogged=false;
  document.getElementById('adminPanel').style.display='none';
  alert('Admin logged out.');
});

async function openAdminPanel(){
  document.getElementById('adminPanel').style.display='block';
  renderAdminLists();
  document.getElementById('adminPanel').scrollIntoView({behavior:'smooth'});
}

async function renderAdminLists(){
  const pendingEl = document.getElementById('pendingList');
  const approvedEl = document.getElementById('approvedList');
  pendingEl.innerHTML=''; approvedEl.innerHTML='';

  const { data: payments } = await supabase.from('payments').select('*');
  if(!payments) return;

  const pendingPayments = payments.filter(p=>p.status==='pending');
  const approvedPayments = payments.filter(p=>p.status==='approved');

  if(pendingPayments.length===0) pendingEl.innerHTML='<div class="muted">No pending payments.</div>';
  pendingPayments.forEach(p=>{
    const row = document.createElement('div'); row.className='user-row';
    row.innerHTML = `
      <div><strong>${p.name}</strong><div class="small">${p.email}</div><div class="small">Time: ${new Date(p.time).toLocaleString()}</div></div>
      <div>
        <button class="btn-small btn-approve" onclick="approvePayment('${p.email}')">Approve</button>
        <button class="btn-small btn-reject" onclick="rejectPayment('${p.email}')">Reject</button>
      </div>`;
    pendingEl.appendChild(row);
  });

  if(approvedPayments.length===0) approvedEl.innerHTML='<div class="muted">No approved members yet.</div>';
  approvedPayments.forEach(p=>{
    const row = document.createElement('div'); row.className='user-row';
    row.innerHTML = `<div><strong>${p.name}</strong><div class="small">${p.email}</div></div><div><span style="color:#7cff8d;font-weight:700">APPROVED</span></div>`;
    approvedEl.appendChild(row);
  });
}

async function approvePayment(email){
  await supabase.from('payments').update({ status: 'approved' }).eq('email', email);
  await supabase.from('users').update({ active: true }).eq('email', email);
  alert('Payment approved and user activated.');
  renderAdminLists();
}

async function rejectPayment(email){
  await supabase.from('payments').delete().eq('email', email);
  await supabase.from('users').delete().eq('email', email);
  alert('Registration rejected and removed.');
  renderAdminLists();
}
