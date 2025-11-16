import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { firebaseConfig } from './firebase-config.js';

let auth, db, stg;

try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    stg = getStorage(app);
    document.getElementById('cfgBanner').style.display = 'none';
} catch (e) {
    console.error("Firebase initialization failed:", e);
    document.getElementById('cfgBanner').style.display = 'block';
}

export { auth, db, stg };
