export function on(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

export function sanitize(str) {
  // A simple sanitizer. In a real app, use a library like DOMPurify.
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const fa=/[۰-۹]/g, ar=/[٠-٩]/g;
const maps={fa:{'۰':0,'۱':1,'۲':2,'۳':3,'۴':4,'۵':5,'۶':6,'۷':7,'۸':8,'۹':9}, ar:{'٠':0,'١':1,'٢':2,'٣':3,'٤':4,'٥':5,'٦':6,'٧':7,'٨':8,'٩':9}};
export function toNumber(v){ if(v==null) return NaN; let s=String(v).trim().replace(/\s+/g,'').replace(/,/g,'').replace(/٬/g,''); s=s.replace(fa,d=>maps.fa[d]).replace(ar,d=>maps.ar[d]); return Number(s); }

export function compressImage(file, maxW=1200, quality=0.82){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{ const img=new Image(); img.onload=()=>{
      const scale=Math.min(1, maxW/img.width), w=Math.round(img.width*scale), h=Math.round(img.height*scale);
      const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      let url; try{ url=canvas.toDataURL('image/jpeg', quality);}catch(e){url=canvas.toDataURL();}
      resolve(url);
    }; img.onerror=()=>reject(new Error('bad image')); img.src=reader.result; };
    reader.onerror=()=>reject(new Error('read error')); reader.readAsDataURL(file);
  });
}

export async function dataURLtoBlob(dataURL){
    const res=await fetch(dataURL);
    return await res.blob();
}

export function normalizePhone(raw){
  if(!raw) return '';
  let p = String(raw).replace(/\D/g,'');
  if(p.startsWith('00')) p = p.slice(2);
  if(p.startsWith('0'))  p = p.slice(1);
  if(!p.startsWith('98')) p = '98' + p; // ایران
  return '+' + p;
}

export function phoneToFakeEmail(phoneE164){
  const local = phoneE164.replace(/\+/g,'plus');
  return `${local}@rasta-phone.user`;
}
