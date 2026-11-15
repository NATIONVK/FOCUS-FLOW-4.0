import { registerPlugin, Capacitor } from '@capacitor/core';

export const Gallery = registerPlugin('Gallery');
export const isAndroidGalleryAvailable = () => Capacitor.getPlatform() === 'android';

export async function pickDeviceImages() {
  if (!isAndroidGalleryAvailable()) return [];
  const result = await Gallery.pickImages();
  return result.items || [];
}
export async function pickDevicePdf() {
  if (!isAndroidGalleryAvailable()) return null;
  return Gallery.pickPdf();
}
export async function saveDevicePdf(blob, name) {
  if (!isAndroidGalleryAvailable()) return false;
  if (blob.size > 18 * 1024 * 1024) throw new Error('এই PDF ১৮ MB-এর বেশি। অ্যাপের Files লাইব্রেরিতে সেভ হয়েছে; Android Save As-এর জন্য ছোট কপি ব্যবহার করো।');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  await Gallery.savePdf({name,base64:btoa(binary)});
  return true;
}

export async function saveDeviceFile(blob,name,mimeType='application/json') {
  if(!isAndroidGalleryAvailable())return false;
  if(blob.size>30*1024*1024)throw new Error('এই backup ৩০ MB-এর বেশি। ছোট PDF batch দিয়ে backup তৈরি করো।');
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  const safeName=String(name||'focus-flow-backup.json').replace(/[\\/:*?"<>|]/g,'-').slice(0,180);
  await Gallery.saveFile({name:safeName,mimeType,base64:btoa(binary)});
  return true;
}
