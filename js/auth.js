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

  const q = (sel) => document.querySelector(sel);

  on('#continueBtn', 'click', () => {
    const raw = q('#phone').value.trim();
    const digits = raw.replace(/\D+/g,'');

    if(digits.length < 10){
        ui.showAuthError('شماره موبایل معتبر وارد کنید.');
        return;
    }

    q('#phone-step').style.display = 'none';
    q('#password-step').style.display = 'block';
    q('#continueBtn').style.display = 'none';
    q('#loginSubmitBtn').style.display = 'block';
    q('#password').focus();
    ui.showAuthError(''); // Clear previous errors
  });

  on('#loginSubmitBtn', 'click', async () => {
    const phone = normalizePhone(q('#phone').value.trim());
    const pass = q('#password').value.trim();

    if (pass.length < 6) {
        ui.showAuthError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
        return;
    }

    const email = phoneToFakeEmail(phone);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        ui.hideModal();
        resetModal();
    } catch (e) {
        if (e?.code === 'auth/user-not-found') {
            try {
                const { user } = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(user, { displayName: phone });
                ui.hideModal();
                resetModal();
            } catch (err2) {
                ui.showAuthError(`خطا در ثبت‌نام: ${err2.code}`);
            }
        } else {
            ui.showAuthError(`خطا در ورود: ${e.code}`);
        }
    }
  });

  function resetModal() {
    q('#phone-step').style.display = 'block';
    q('#password-step').style.display = 'none';
    q('#continueBtn').style.display = 'block';
    q('#loginSubmitBtn').style.display = 'none';
    q('#phone').value = '';
    q('#password').value = '';
    ui.showAuthError('');
  }

  // Also reset modal on close
  on('#authClose', 'click', resetModal);

  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    ui.updateLoginState(currentUser);
    onAuthChange(currentUser);
  });

  return {
    getUser: () => currentUser
  };
}
