/* Smart Traders World — Register + Payment + Auto Approval + Image Verification (Name + Amount + Account, 5-min wait) */

const CONFIG = {
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSe6Fd_jNCnZ22220UmBNYqUhZeKCo66RInk3l2kd59DY3SSAw/viewform?usp=header',
  conversionRate: 1500,
  usdAmount: 9,
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

/* ---------------- Human Verification ---------------- */

let humanVerifiedLogin = false;
let humanVerifiedReg = false;

document.getElementById('humanCheckLogin').addEventListener('change', function(){
  const msg = document.getElementById('humanMsgLogin');
  const btn = document.getElementById('btnLogin');
  if(this.checked){
    msg.style.color = '#7cff8d';
    msg.textContent = '⏳ Verifying... please wait 5 seconds';
    btn.disabled = true;
    setTimeout(()=>{
      msg.textContent = '✅ Verified!';
      humanVerifiedLogin = true;
      btn.disabled = false;
    },5000);
  } else {
    msg.textContent='';
    humanVerifiedLogin=false;
  }
});

document.getElementById('humanCheckReg').addEventListener('change', function(){
  const msg = document.getElementById('humanMsgReg');
  const btn = document.getElementById('submitRegister');
  if(this.checked){
    msg.style.color = '#7cff8d';
    msg.textContent = '⏳ Verifying... please wait 5 seconds';
    btn.disabled = true;
    setTimeout(()=>{
      msg.textContent = '✅ Verified!';
      humanVerifiedReg = true;
      btn.disabled = false;
    },5000);
  } else {
    msg.textContent='';
    humanVerifiedReg=false;
  }
});

/* ---------------- Register ---------------- */

document.getElementById('submitRegister').addEventListener('click', async ()=>{

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const proofFile = document.getElementById('proofFile').files[0];
  const msgEl = document.getElementById('regMessage');

  if(!humanVerifiedReg){
    msgEl.style.color='red';
    msgEl.textContent='⚠️ Please verify you are human first.';
    return;
  }

  if(!name || !email || !password){
    msgEl.style.color='red';
    msgEl.textContent='Please fill name, email and password.';
    return;
  }

  if(!proofFile){
    msgEl.style.color='red';
    msgEl.textContent='Please upload payment screenshot.';
    return;
  }

  msgEl.style.color='gold';
  msgEl.textContent='🔍 Verifying payment screenshot... please wait';

  try{

    const result = await Tesseract.recognize(proofFile,'eng');
    const cleanText = result.data.text.toLowerCase().replace(/\s/g,'');

    const nameCheck = cleanText.includes('abdullahimuhammad');
    const accountCheck = cleanText.includes('8122294546');
    const amountCheck = /13500|13,500|₦13500|n13500|\$9/.test(cleanText);

    if(!nameCheck || !accountCheck || !amountCheck){
      msgEl.style.color='red';
      msgEl.innerHTML =
        '❌ Invalid payment proof.<br><br>' +
        '<b>Must show:</b><br>' +
        'Name: Abdullahi Muhammad<br>' +
        'Account: 8122294546<br>' +
        'Amount: ₦13,500 or $9';
      return;
    }

    const imgData = await fileToDataUrl(proofFile);

    const payments = load(PAYMENTS_KEY);
    payments.push({
      email,
      name,
      imageData: imgData,
      status:'pending',
      time: new Date().toISOString()
    });
    save(PAYMENTS_KEY,payments);

    const users = load(USERS_KEY);
    users.push({
      name,
      email,
      password,
      active:false,
      regTime: Date.now()
    });
    save(USERS_KEY,users);

    msgEl.style.color='#7cff8d';
    msgEl.textContent='✅ Payment verified! Please wait 5 minutes for activation.';

    document.getElementById('regPassword').value='';
    document.getElementById('proofFile').value='';

  }catch(err){
    msgEl.style.color='red';
    msgEl.textContent='OCR failed. Upload a clear screenshot.';
    console.error(err);
  }

});

/* ---------------- Auto Approve After 5 Minutes ---------------- */

setInterval(()=>{
  const users = load(USERS_KEY);
  let updated=false;
  const now = Date.now();

  users.forEach(u=>{
    if(!u.active && now - u.regTime >= 5*60*1000){
      u.active=true;
      updated=true;
    }
  });

  if(updated) save(USERS_KEY,users);
},10000);

/* ---------------- Login ---------------- */

document.getElementById('btnLogin').addEventListener('click',()=>{

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');

  if(!humanVerifiedLogin){
    msg.style.color='red';
    msg.textContent='⚠️ Verify you are human.';
    return;
  }

  const users = load(USERS_KEY);
  const user = users.find(u=>u.email===email);

  if(!user){
    msg.style.color='red';
    msg.textContent='Account not found.';
    return;
  }

  if(user.password!==password){
    msg.style.color='red';
    msg.textContent='Wrong password.';
    return;
  }

  if(!user.active){
    msg.style.color='orange';
    msg.textContent='Please wait 5 minutes for activation.';
    return;
  }

  msg.style.color='#7cff8d';
  msg.textContent='Login successful... redirecting';

  setTimeout(()=> window.location.href=CONFIG.googleFormUrl,1500);

});
