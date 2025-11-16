import {
  auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, updateProfile, signOut
} from './firebase.js';

let currentUser = null;
const loginBtn=$('loginBtn'), logoutBtn=$('logoutBtn'), userBadge=$('userBadge'), userPhoneEl=$('userPhone');
const authModal=$('authModal'), authOk=$('authOk'), authClose=$('authClose'), authErr=$('authErr'), phoneInp=$('phone');
const authNote=$('authNote');

function normalizePhone(raw){
  if(!raw) return '';
  let p = String(raw).replace(/\D/g,'');
  if(p.startsWith('00')) p = p.slice(2);
  if(p.startsWith('0'))  p = p.slice(1);
  if(!p.startsWith('98')) p = '98' + p; // ایران
  return '+' + p;
}

function phoneToFakeEmail(phoneE164){
  const local = phoneE164.replace(/\+/g,'plus');
  return `${local}@rasta-phone.user`;
}

function showAuthUI(user){
  if(user){
    userBadge.style.display='inline-flex';
    userPhoneEl.textContent = user.displayName || (user.email ? user.email.replace(/@.*/,'').replace(/^plus/,'+') : 'کاربر');
    loginBtn.style.display='none';
    logoutBtn.style.display='inline-block';
  } else {
    userBadge.style.display='none';
    userPhoneEl.textContent = '';
    loginBtn.style.display='inline-block';
    logoutBtn.style.display='none';
  }
}

function setupAuth(onStateChange) {
  if (authNote) authNote.textContent = 'ورود/ثبت‌نام با موبایل + رمز عبور (بدون پیامک). پس از وارد کردن شماره، رمز پرسیده می‌شود.';

  loginBtn.addEventListener('click', ()=>{
    authModal.style.display='flex';
    authErr.style.display='none';
    phoneInp.value='';
  });

  authOk.onclick = async ()=>{
    const raw = (phoneInp.value||'').trim();
    const digits = raw.replace(/\D+/g,'');
    if(digits.length < 10){ authErr.textContent='شماره معتبر نیست.'; authErr.style.display='block'; return; }

    const phone = normalizePhone(raw);
    const pass = prompt('رمز عبور را وارد کنید (حداقل ۶ کاراکتر):');
    if(!pass || pass.length < 6){ authErr.textContent='رمز عبور حداقل ۶ کاراکتر.'; authErr.style.display='block'; return; }

    const email = phoneToFakeEmail(phone);
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      authModal.style.display='none';
    }catch(e){
      if(e?.code === 'auth/user-not-found'){
        try{
          const { user } = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(user, { displayName: phone });
          authModal.style.display='none';
        }catch(err2){
          authErr.textContent='ثبت‌نام ناموفق: '+(err2.message||err2);
          authErr.style.display='block';
        }
      }else{
        authErr.textContent='ورود ناموفق: '+(e.message||e);
        authErr.style.display='block';
      }
    }
  };

  authClose.onclick = ()=> authModal.style.display='none';
  logoutBtn.onclick = ()=> signOut(auth);

  onAuthStateChanged(auth, (user)=>{
    currentUser = user || null;
    showAuthUI(currentUser);
    onStateChange(currentUser);
  });
}

function getCurrentUser() {
  return currentUser;
}

export { setupAuth, getCurrentUser };
