/* ===== Firebase SDK (v10 modular) ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ===== تنظیمات Firebase ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDO7WjiVituiRULoORMrv5R_mVa14JhrgQ",
  authDomain: "rasta-bazar-57d80.firebaseapp.com",
  projectId: "rasta-bazar-57d80",
  storageBucket: "rasta-bazar-57d80.appspot.com",
  messagingSenderId: "826759050427",
  appId: "1:826759050427:web:985fc4895993db7e56259e",
  measurementId: "G-ZZ0MM9S0N2"
};

const cfgBanner = document.getElementById('cfgBanner');
if (!firebaseConfig || !firebaseConfig.apiKey) {
  cfgBanner.style.display = 'block';
  throw new Error('Firebase config missing');
}

/* ===== Init ===== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const stg = getStorage(app);

export {
  auth, db, stg,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged,
  updateProfile, signOut,
  collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp,
  ref, uploadBytes, getDownloadURL
};
