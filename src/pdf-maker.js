import { isAndroidGalleryAvailable } from './native-gallery.js';
let selected = [];
let nativeGallery = false, galleryOffset = 0, galleryHasMore = false, galleryBusy = false;
const $ = (s, root=document) => root.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sizeBytes(n){return n<1024*1024?(n/1024).toFixed(0)+' KB':(n/1024/1024).toFixed(1)+' MB'}
function paint(){
 const list=$('#pdfImageList');if(!list)return;
 list.innerHTML=selected.map((x,i)=>`<article class="pdf-image-card" draggable="true" data-index="${i}"><img src="${x.url}" alt="Page ${i+1} preview"><div class="pdf-image-meta"><b>Page ${String(i+1).padStart(2,'0')}</b><small>${esc(x.name||x.file?.name||'Photo')} · ${x.file?sizeBytes(x.file.size):'Gallery image'}</small><div class="pdf-order"><button class="secondary" data-up="${i}" ${i===0?'disabled':''}>↑</button><button class="secondary" data-down="${i}" ${i===selected.length-1?'disabled':''}>↓</button><button class="text-btn" data-remove="${i}">Remove</button></div></div></article>`).join('')||'<div class="pdf-empty">ছবি নির্বাচন করলে এখানে পৃষ্ঠাগুলো দেখা যাবে।</div>';
 $('#pdfCount').textContent=selected.length+' page'+(selected.length===1?'':'s');
 $('#makePdf').disabled=!selected.length;$('#clearPdf').disabled=!selected.length;
}
function applyGalleryFilter(){const q=($('#gallerySearch')?.value||'').trim().toLowerCase();document.querySelectorAll('.gallery-thumb').forEach(el=>{el.hidden=!!q&&!el.textContent.toLowerCase().includes(q)});}
function paintGallery(items,append=false){
 const grid=$('#deviceGallery');if(!grid)return;
 const html=items.map(x=>{const chosen=selected.some(s=>s.nativeId===x.id);return `<button class="gallery-thumb ${chosen?'chosen':''}" data-gallery-id="${esc(x.id)}" aria-pressed="${chosen}"><img loading="lazy" src="${x.thumbnail}" alt="${esc(x.name)}"><span class="gallery-check">${chosen?'✓':'+'}</span><small>${esc(x.name||'Image')}</small></button>`}).join('');
 if(append)grid.insertAdjacentHTML('beforeend',html);else grid.innerHTML=html||'<p class="pdf-empty">কোনো ছবি পাওয়া যায়নি।</p>';
}
async function loadDeviceGallery(reset=false){
 const status=$('#galleryStatus'),more=$('#galleryMore');if(galleryBusy)return;galleryBusy=true;
 if(reset){galleryOffset=0;galleryHasMore=false;if($('#deviceGallery'))$('#deviceGallery').innerHTML='';}
 if(status)status.textContent='ফোনের ছবি লোড হচ্ছে…';
 try{
  const {Gallery}=await import('./native-gallery.js');
  const res=await Gallery.listRecentImages({offset:galleryOffset,limit:60});
  nativeGallery=true;paintGallery(res.items||[],!reset);galleryOffset=res.nextOffset||0;galleryHasMore=!!res.hasMore;
  if(status)status.textContent=(galleryOffset||0)+'টি ছবি লোড হয়েছে · নতুন ছবি আগে';
  applyGalleryFilter();
  if(more)more.hidden=!galleryHasMore;
 }catch(err){
  console.warn('Native gallery unavailable',err);
  if(status)status.textContent='এই ডিভাইসে সরাসরি গ্যালারি পাওয়া যাচ্ছে না। Files থেকে ছবি বেছে নাও।';
  if(more)more.hidden=true;
 }
 galleryBusy=false;
}
export function renderPDFPage(){return `<section class="panel pdf-intro"><span class="eyebrow">STUDY TOOLS · DOCUMENTS</span><h3>Image to PDF</h3><p class="muted">প্রথমেই ফোনের Recent Photos দেখাবে। ছবি ট্যাপ করে নির্বাচন করো, অথবা Files থেকে ছবি নাও। তারপর সিরিয়াল সাজিয়ে PDF তৈরি করো।</p><div class="gallery-toolbar"><b>Recent photos</b><div class="gallery-tools"><button class="secondary" id="refreshGallery">↻ Refresh</button><button class="secondary" id="browseFiles">▣ Choose photos from phone</button></div><input id="pdfFiles" class="pdf-native-file-input" type="file" accept="image/*" multiple></div><input id="gallerySearch" class="gallery-search" type="search" placeholder="Search photos by file name…" aria-label="Search photos"><p class="gallery-status" id="galleryStatus">ফোনের ছবি খোঁজা হচ্ছে…</p><div id="deviceGallery" class="device-gallery"><div class="pdf-empty">Gallery লোড হচ্ছে…</div></div><button class="secondary gallery-more" id="galleryMore" hidden>আরও ছবি দেখাও</button><div class="pdf-options"><label>Image quality<select id="pdfImageQuality"><option value="0.95">High · 95%</option><option value="0.82" selected>Balanced · 82%</option><option value="0.65">Small file · 65%</option></select></label><label>Enhancement<select id="pdfImageFilter"><option value="none">Original</option><option value="contrast">Document contrast</option><option value="grayscale">Grayscale scan</option></select></label><label>Page size<select id="pdfSize"><option value="a4">A4</option><option value="letter">Letter</option><option value="fit">Image size</option></select></label><label>Orientation<select id="pdfOrientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><label>Margin<select id="pdfMargin"><option value="10">Normal · 10 mm</option><option value="5">Narrow · 5 mm</option><option value="0">No margin</option></select></label></div><div class="pdf-list-head"><b>Selected pages · drag or move to reorder</b><span id="pdfCount">0 pages</span></div><div id="pdfImageList" class="pdf-image-list"></div><div class="pdf-actions"><button class="secondary" id="clearPdf" disabled>Clear all</button><button class="primary" id="makePdf" disabled>↓ Create PDF</button></div><p class="pdf-help">ছবি নির্বাচন, ক্রম পরিবর্তন, একাধিক পৃষ্ঠা, A4/Letter, Portrait/Landscape ও PDF export—সব ফোনেই করা যাবে।</p></section>`}
export function bindPDFPage(){
 selected.forEach(x=>{if(x.url?.startsWith('blob:'))URL.revokeObjectURL(x.url)});selected=[];paint();
 const input=$('#pdfFiles');
 $('#browseFiles')?.addEventListener('click',()=>input?.click());
 $('#refreshGallery')?.addEventListener('click',()=>loadDeviceGallery(true));
 $('#gallerySearch')?.addEventListener('input',applyGalleryFilter);
 input?.addEventListener('change',()=>{const files=[...input.files||[]].filter(f=>f.type.startsWith('image/'));selected.push(...files.map(file=>({file,name:file.name,url:URL.createObjectURL(file)})));input.value='';paint();});
 $('#deviceGallery')?.addEventListener('click',async e=>{const btn=e.target.closest('[data-gallery-id]');if(!btn)return;const id=btn.dataset.galleryId;const index=selected.findIndex(x=>x.nativeId===id);if(index>=0){selected.splice(index,1);paint();btn.classList.remove('chosen');btn.querySelector('.gallery-check').textContent='+';return}btn.disabled=true;try{const {Gallery}=await import('./native-gallery.js');const result=await Gallery.readImage({id});const item={nativeId:id,name:btn.querySelector('small')?.textContent||'Gallery photo',url:result.dataUrl};selected.push(item);paint();btn.classList.add('chosen');btn.querySelector('.gallery-check').textContent='✓'}catch(err){alert('ছবিটি খোলা যায়নি। আবার চেষ্টা করো।');btn.disabled=false}});
 $('#galleryMore')?.addEventListener('click',()=>loadDeviceGallery(false));
 $('#pdfImageList')?.addEventListener('click',e=>{const up=e.target.closest('[data-up]'),down=e.target.closest('[data-down]'),remove=e.target.closest('[data-remove]');if(up){const i=+up.dataset.up;if(i>0)[selected[i-1],selected[i]]=[selected[i],selected[i-1]];paint()}if(down){const i=+down.dataset.down;if(i<selected.length-1)[selected[i+1],selected[i]]=[selected[i],selected[i+1]];paint()}if(remove){selected.splice(+remove.dataset.remove,1);paint();if(nativeGallery)loadDeviceGallery(true)}});
 $('#pdfImageList')?.addEventListener('dragstart',e=>{const card=e.target.closest('[data-index]');if(card)e.dataTransfer.setData('text/plain',card.dataset.index)});
 $('#pdfImageList')?.addEventListener('dragover',e=>{if(e.target.closest('[data-index]'))e.preventDefault()});
 $('#pdfImageList')?.addEventListener('drop',e=>{const card=e.target.closest('[data-index]');if(!card)return;e.preventDefault();const from=Number(e.dataTransfer.getData('text/plain')),to=Number(card.dataset.index);if(from===to||!Number.isInteger(from))return;const [item]=selected.splice(from,1);selected.splice(to,0,item);paint()});
 $('#clearPdf')?.addEventListener('click',()=>{selected=[];paint();if(nativeGallery)loadDeviceGallery(true)});
 $('#makePdf')?.addEventListener('click',async()=>{if(!selected.length)return;const btn=$('#makePdf');btn.disabled=true;btn.textContent='Preparing…';const status=$('#galleryStatus');try{const {jsPDF}=await import('jspdf');const format=$('#pdfSize').value,orientation=$('#pdfOrientation').value,margin=Number($('#pdfMargin').value),quality=Number($('#pdfImageQuality').value)||.82,filter=$('#pdfImageFilter').value;let doc=null;for(let i=0;i<selected.length;i++){btn.textContent='Creating '+(i+1)+' / '+selected.length+'…';if(status)status.textContent='PDF page '+(i+1)+' of '+selected.length+' তৈরি হচ্ছে';const img=new Image();img.src=selected[i].url;await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});let w,h;if(format==='fit'){w=img.naturalWidth*.264583;h=img.naturalHeight*.264583;if(orientation==='landscape'&&h>w)[w,h]=[h,w];if(orientation==='portrait'&&w>h)[w,h]=[h,w]}else{w=format==='a4'?210:215.9;h=format==='a4'?297:279.4;if(orientation==='landscape')[w,h]=[h,w]}if(!doc)doc=new jsPDF({orientation:w>h?'landscape':'portrait',unit:'mm',format:format==='fit'?[w,h]:format,compress:true});else doc.addPage(format==='fit'?[w,h]:format,w>h?'landscape':'portrait');const pageW=doc.internal.pageSize.getWidth(),pageH=doc.internal.pageSize.getHeight(),scale=Math.min((pageW-2*margin)/img.naturalWidth,(pageH-2*margin)/img.naturalHeight),drawW=img.naturalWidth*scale,drawH=img.naturalHeight*scale;const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');if(filter==='contrast')ctx.filter='contrast(1.35) brightness(1.04)';else if(filter==='grayscale')ctx.filter='grayscale(1) contrast(1.15)';ctx.drawImage(img,0,0);doc.addImage(canvas.toDataURL('image/jpeg',quality),'JPEG',(pageW-drawW)/2,(pageH-drawH)/2,drawW,drawH,undefined,'FAST')}const name='focus-flow-images-'+new Date().toISOString().slice(0,10)+'.pdf';doc.save(name);btn.textContent='PDF saved ✓';if(status)status.textContent='PDF তৈরি হয়েছে · '+selected.length+' pages';}catch(err){console.error(err);if(status)status.textContent='PDF তৈরি করা যায়নি। আবার চেষ্টা করো।';btn.textContent='Try again';}finally{btn.disabled=false;paint()}});
 if(isAndroidGalleryAvailable())loadDeviceGallery(true);else{$('#galleryStatus').textContent='ফোনের Gallery বা Files থেকে ছবি বেছে নাও।';$('#deviceGallery').innerHTML='<div class="pdf-empty">Direct Recent Photos-এর জন্য Android APK ব্যবহার করো।</div>'}
}
