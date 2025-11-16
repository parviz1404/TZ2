import { setupUI } from './ui.js';
import { setupAuth } from './auth.js';
import { db, stg } from './firebase.js';
import { on, compressImage, dataURLtoBlob, toNumber } from './helpers.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


document.addEventListener('DOMContentLoaded', () => {
    const ui = setupUI();
    let currentUser = null;
    let unsub = null;
    let cache = [];
    let FEED = 'public';

    const auth = setupAuth(ui, (user) => {
        currentUser = user;
        bindFeed();
    });

    function render() {
        let list = cache.slice();
        const queryStr = document.querySelector('#q').value.trim().toLowerCase();
        if(queryStr) list = list.filter(x=>(x.title||'').toLowerCase().includes(queryStr) || (x.desc||'').toLowerCase().includes(queryStr));

        const mode = document.querySelector('#sort').value;
        if(mode==='price_asc') list.sort((a,b)=>a.price-b.price);
        else if(mode==='price_desc') list.sort((a,b)=>b.price-a.price);
        else if(mode==='title') list.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
        else list.sort((a,b)=> (b.ts?.toMillis?.() ?? b.ts) - (a.ts?.toMillis?.() ?? a.ts));

        ui.renderItems(list, currentUser);
    }

    function bindFeed() {
        if (unsub) {
            unsub();
            unsub = null;
        }
        cache = [];
        render();

        let qy;
        const itemsCollection = collection(db, 'items');

        if (FEED === 'public') {
            qy = query(itemsCollection, where('status', '==', 'public'), orderBy('ts', 'desc'));
        } else {
            if (!currentUser) {
                cache = [];
                render();
                return;
            }
            qy = query(itemsCollection, where('uid', '==', currentUser.uid), orderBy('ts', 'desc'));
        }

        unsub = onSnapshot(qy, (snap) => {
            cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            render();
        }, (error) => {
            console.error("Error fetching data from Firestore:", error);
            ui.showError("خطا در دریافت اطلاعات از سرور.");
        });
    }

    on('#addBtn', 'click', async () => {
        if (!currentUser) {
            ui.showError('برای ثبت آگهی، ابتدا وارد شوید.');
            return;
        }

        const formValues = ui.getFormValues();
        const priceNum = toNumber(formValues.price);

        if (!formValues.title || !isFinite(priceNum) || priceNum <= 0 || !formValues.photo) {
            ui.showError('لطفاً عنوان، قیمت معتبر و عکس را وارد کنید.');
            return;
        }

        try {
            const dataURL = await compressImage(formValues.photo);
            const blob = await dataURLtoBlob(dataURL);

            const itemId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
            const path = `users/${currentUser.uid}/items/${itemId}.jpg`;
            const fileRef = ref(stg, path);

            await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
            const url = await getDownloadURL(fileRef);

            await addDoc(collection(db, 'items'), {
                uid: currentUser.uid,
                title: formValues.title,
                price: priceNum,
                desc: formValues.desc,
                photoURL: url,
                status: formValues.isPublic ? 'public' : 'private',
                ts: serverTimestamp()
            });

            ui.clearForm();
        } catch (e) {
            ui.showError('خطا در ثبت آگهی: ' + (e.message || e));
        }
    });

    function refreshTabsUI(){
        document.querySelector('#tabPublic').classList.toggle('btn', FEED==='public');
        document.querySelector('#tabPublic').classList.toggle('btn-outline', FEED!=='public');
        document.querySelector('#tabMine').classList.toggle('btn', FEED==='mine');
        document.querySelector('#tabMine').classList.toggle('btn-outline', FEED!=='mine');
    }

    on('#tabPublic', 'click', () => {
        FEED = 'public';
        refreshTabsUI();
        bindFeed();
    });

    on('#tabMine', 'click', () => {
        if (!currentUser) {
            ui.showModal();
            return;
        }
        FEED = 'mine';
        refreshTabsUI();
        bindFeed();
    });

    on('#q', 'input', render);
    on('#sort', 'change', render);

    document.getElementById('grid').addEventListener('click', async (e) => {
        if (e.target.matches('[data-del]')) {
            const id = e.target.getAttribute('data-del');
            if (!id || !currentUser) return;
            if (confirm('آیا از حذف این آگهی مطمئن هستید؟')) {
                try {
                    await deleteDoc(doc(db, 'items', id));
                } catch (error) {
                    ui.showError('خطا در حذف آگهی.');
                }
            }
        }
    });

    refreshTabsUI();
    bindFeed();
});
