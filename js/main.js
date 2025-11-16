import { db, stg, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase.js';
import { toNumber, formatPrice, escapeHtml, compressImage, dataURLtoBlob } from './utils.js';
import { setupAuth, getCurrentUser } from './auth.js';

/* ===== DOM refs ===== */
const $=id=>document.getElementById(id);
const inpTitle=$('title'), inpPrice=$('price'), inpPhoto=$('photo'), inpDesc=$('desc'), isPublic=$('isPublic');
const addBtn=$('addBtn'), err=$('err');
const q=$('q'), sort=$('sort'), grid=$('grid'), emptyNote=$('emptyNote');
const tabPublic=$('tabPublic'), tabMine=$('tabMine');

/* ===== Feed (public | mine) ===== */
let FEED = 'public';
let unsub = null;
let cache = [];

function refreshTabsUI(){
  tabPublic.classList.toggle('btn', FEED==='public');
  tabPublic.classList.toggle('btn-outline', FEED!=='public');
  tabMine.classList.toggle('btn', FEED==='mine');
  tabMine.classList.toggle('btn-outline', FEED!=='mine');
}

function bindFeed(){
  if(unsub){ unsub(); unsub=null; }
  cache = [];
  render();

  const currentUser = getCurrentUser();

  if(FEED === 'public'){
    const col = collection(db, 'items');
    const qy  = query(col, where('status','==','public'), orderBy('ts','desc'));
    unsub = onSnapshot(qy, (snap)=>{
      cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    });
  }else{
    if(!currentUser){ cache=[]; render(); return; }
    const col = collection(db, 'items');
    const qy  = query(col, where('uid','==', currentUser.uid), orderBy('ts','desc'));
    unsub = onSnapshot(qy, (snap)=>{
      cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    });
  }
}

tabPublic.addEventListener('click', ()=>{ FEED='public'; refreshTabsUI(); bindFeed(); });
tabMine.addEventListener('click',   ()=>{ FEED='mine';   refreshTabsUI(); bindFeed(); });

/* ===== Render ===== */
function filteredSorted(){
  let list = cache.slice();
  const queryStr = q.value.trim().toLowerCase();
  if(queryStr) list = list.filter(x=>(x.title||'').toLowerCase().includes(queryStr) || (x.desc||'').toLowerCase().includes(queryStr));
  const mode = sort.value;
  if(mode==='price_asc') list.sort((a,b)=>a.price-b.price);
  else if(mode==='price_desc') list.sort((a,b)=>b.price-a.price);
  else if(mode==='title') list.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
  else list.sort((a,b)=> (b.ts?.toMillis?.() ?? b.ts) - (a.ts?.toMillis?.() ?? a.ts));
  return list;
}

function render(){
  const list = filteredSorted();
  grid.innerHTML='';
  emptyNote.style.display = list.length ? 'none' : 'block';
  const currentUser = getCurrentUser();
  list.forEach(it=>{
    const dateStr = (it.ts?.toDate?.() ? it.ts.toDate() : new Date(it.ts)).toLocaleDateString('fa-IR');
    const isOwner = currentUser && it.uid === currentUser.uid;
    const el=document.createElement('div'); el.className='item';
    el.innerHTML = `
      <img class="thumb" alt="photo" src="${it.photoURL}">
      <div class="content">
        <h3>${it.title? escapeHtml(it.title) : 'بدون عنوان'}</h3>
        <div class="meta">
          <div class="price">${formatPrice(it.price)} <span class="badge">تومان</span></div>
          <div class="badge">${dateStr}</div>
        </div>
        ${it.desc ? `<p class="note" style="margin-top:8px">${escapeHtml(it.desc)}</p>` : ``}
        <div class="controls">
          ${isOwner ? `<button class="btn-outline" data-del="${it.id}">حذف</button>` : ``}
          <a class="btn-outline" href="${it.photoURL}" download="photo.jpg">دانلود عکس</a>
        </div>
      </div>`;
    grid.appendChild(el);
  });

  grid.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.getAttribute('data-del');
      const currentUser = getCurrentUser();
      if(!id || !currentUser) return;
      await deleteDoc(doc(db, 'items', id));
    });
  });
}

q.addEventListener('input', render);
sort.addEventListener('change', render);

/* ===== Add new item ===== */
addBtn.addEventListener('click', async ()=>{
  err.style.display='none';
  const currentUser = getCurrentUser();
  if(!currentUser){ err.textContent='ابتدا وارد شوید.'; err.style.display='block'; return; }

  const file = inpPhoto.files && inpPhoto.files[0];
  const priceNum = toNumber(inpPrice.value);
  if(!file || !isFinite(priceNum) || priceNum<=0){
    err.textContent='عکس و قیمت الزامی است.'; err.style.display='block'; return;
  }
  try{
    const dataURL = await compressImage(file);
    const blob    = await dataURLtoBlob(dataURL);

    const itemId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random());
    const path   = `users/${currentUser.uid}/items/${itemId}.jpg`;
    const r      = ref(stg, path);
    await uploadBytes(r, blob, { contentType: 'image/jpeg' });
    const url    = await getDownloadURL(r);

    await addDoc(collection(db, 'items'), {
      uid: currentUser.uid,
      title: (inpTitle.value||'').trim(),
      price: Math.round(priceNum),
      desc: (inpDesc.value||'').trim(),
      photoURL: url,
      status: isPublic.checked ? 'public' : 'private',
      ts: serverTimestamp()
    });

    inpTitle.value=''; inpPrice.value=''; inpDesc.value=''; inpPhoto.value='';
  }catch(e){
    err.textContent='خطا در ثبت آگهی: '+(e.message||e);
    err.style.display='block';
  }
});

/* ===== Auth state change handler ===== */
function onAuthStateChange(user) {
  bindFeed();
}

/* ===== boot ===== */
setupAuth(onAuthStateChange);
refreshTabsUI();
bindFeed();
