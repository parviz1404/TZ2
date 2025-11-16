export function setupUI() {
  const q = (sel) => document.querySelector(sel);

  return {
    showModal() {
      q('#authModal').style.display = 'flex';
    },
    hideModal() {
      q('#authModal').style.display = 'none';
    },
    showAuthError(msg) {
      q('#authErr').textContent = msg;
      q('#authErr').style.display = 'block';
    },
    updateLoginState(user) {
      if (user) {
        q('#userPhone').textContent = user.displayName || (user.email ? user.email.replace(/@.*/,'').replace(/^plus/,'+') : 'کاربر');
        q('#userBadge').style.display = 'inline-flex';
        q('#loginBtn').style.display = 'none';
        q('#logoutBtn').style.display = 'block';
      } else {
        q('#userBadge').style.display = 'none';
        q('#loginBtn').style.display = 'block';
        q('#logoutBtn').style.display = 'none';
      }
    },
    renderItems(items, currentUser) {
      const grid = q('#grid');
      grid.innerHTML = ''; // Clear existing items
      if (items.length === 0) {
        q('#emptyNote').style.display = 'block';
        return;
      }
      q('#emptyNote').style.display = 'none';

      items.forEach(item => {
        const isOwner = currentUser && item.uid === currentUser.uid;
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        itemEl.innerHTML = `
          <img src="${item.photoURL}" class="thumb" loading="lazy">
          <div class="content">
            <h3>${item.title}</h3>
            <p class="desc">${item.desc}</p>
            <div class="meta">
              <span class="price">${(item.price || 0).toLocaleString('fa-IR')} <small>تومان</small></span>
              <span class="badge">${item.status === 'public' ? 'عمومی' : 'خصوصی'}</span>
            </div>
            <div class="controls">
                ${isOwner ? `<button class="btn-outline" data-del="${item.id}">حذف</button>` : ''}
                <a class="btn-outline" href="${item.photoURL}" download="photo.jpg">دانلود عکس</a>
            </div>
          </div>
        `;
        grid.appendChild(itemEl);
      });
    },
    showError(msg) {
      const errEl = q('#err');
      errEl.textContent = msg;
      errEl.style.display = 'block';
      setTimeout(() => {
        errEl.style.display = 'none';
      }, 3000);
    },
    getFormValues() {
      return {
        title: q('#title').value.trim(),
        price: q('#price').value.trim(),
        photo: q('#photo').files[0],
        desc: q('#desc').value.trim(),
        isPublic: q('#isPublic').checked,
      };
    },
    clearForm() {
        q('#title').value = '';
        q('#price').value = '';
        q('#photo').value = '';
        q('#desc').value = '';
        q('#isPublic').checked = true;
    }
  };
}
