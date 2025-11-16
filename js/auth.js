import { on, normalizePhone, phoneToFakeEmail } from './helpers.js';
import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let currentUser = null;

export function setupAuth(ui, onAuthChange) {
  on('#loginBtn', 'click', () => ui.showModal());
  on('#logoutBtn', 'click', () => signOut(auth));
  on('#authClose', 'click', () => ui.hideModal());

  on('#authOk', 'click', async () => {
    const phoneInput = document.querySelector('#phone');
    const raw = phoneInput.value.trim();
    const digits = raw.replace(/\D+/g,'');

    if(digits.length < 10){
        ui.showAuthError('شماره معتبر نیست.');
        return;
    }

    const phone = normalizePhone(raw);
    const pass = prompt('رمز عبور را وارد کنید (حداقل ۶ کاراکتر):');

    if(!pass || pass.length < 6){
        ui.showAuthError('رمز عبور حداقل ۶ کاراکتر.');
        return;
    }

    const email = phoneToFakeEmail(phone);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      ui.hideModal();
    } catch(e) {
      if(e?.code === 'auth/user-not-found'){
        try {
          const { user } = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(user, { displayName: phone });
          ui.hideModal();
        } catch(err2) {
          ui.showAuthError('ثبت‌نام ناموفق: '+(err2.message||err2));
        }
      } else {
        ui.showAuthError('ورود ناموفق: '+(e.message||e));
      }
    }
  });

  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    ui.updateLoginState(currentUser);
    onAuthChange(currentUser);
  });

  return {
    getUser: () => currentUser
  };
}
