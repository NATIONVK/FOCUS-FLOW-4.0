const DB_NAME='focus-flow-pdf-library';
const DB_VERSION=1;
const STORE='documents';
function openDb(){
 return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('এই WebView-তে IndexedDB পাওয়া যাচ্ছে না'));return;}
  const request=indexedDB.open(DB_NAME,DB_VERSION);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('PDF library খুলতে সমস্যা হয়েছে'));
 });
}
function transaction(mode,work){
 return openDb().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
  let result;
  try{result=work(store)}catch(e){reject(e);db.close();return;}
  tx.oncomplete=()=>{db.close();resolve(result?.result??result)};
  tx.onerror=()=>{db.close();reject(tx.error||new Error('PDF library save failed'))};
  tx.onabort=()=>{db.close();reject(tx.error||new Error('PDF library transaction aborted'))};
 }));
}
export async function savePdfToLibrary(blob,name,source='created'){
 const id='pdf-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
 const record={id,name,blob,type:'application/pdf',size:blob.size,source,updatedAt:Date.now()};
 await transaction('readwrite',s=>s.put(record));
 return {id,name,size:blob.size,updatedAt:record.updatedAt};
}
export async function getPdfFromLibrary(id){
 return transaction('readonly',s=>s.get(id));
}
export async function listPdfLibrary(){
 const records=await transaction('readonly',s=>s.getAll());
 return (records||[]).sort((a,b)=>b.updatedAt-a.updatedAt).map(({id,name,size,source,updatedAt})=>({id,name,size,source,updatedAt}));
}
export async function deletePdfFromLibrary(id){
 return transaction('readwrite',s=>s.delete(id));
}
export async function renamePdfInLibrary(id,name){
 name=String(name||'').trim().replace(/[\\/:*?\"<>|]/g,'-').slice(0,180);
 if(!name)throw new Error('A PDF file name is required');
 if(!/\.pdf$/i.test(name))name+='.pdf';
 const record=await getPdfFromLibrary(id);
 if(!record)throw new Error('Saved PDF not found');
 record.name=name;record.updatedAt=Date.now();
 await transaction('readwrite',s=>s.put(record));
 return {id:record.id,name:record.name,size:record.size,updatedAt:record.updatedAt};
}
export function browserDownload(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
}
export async function savePdfOutput(blob,name,{askLocation=true,source='created'}={}){
 let saved=null;try{saved=await savePdfToLibrary(blob,name,source)}catch(error){console.warn('Could not save PDF into in-app library',error)}
 if(askLocation){
  try{
   const {isAndroidGalleryAvailable,saveDevicePdf}=await import('./native-gallery.js');
   if(isAndroidGalleryAvailable())await saveDevicePdf(blob,name);
   else browserDownload(blob,name);
  }catch(error){
   if(error?.code!=='CANCELLED')console.warn('System Save As unavailable; PDF remains in the in-app library',error);
  }
 }
 return saved;
}
