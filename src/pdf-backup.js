export const PDF_BACKUP_FORMAT='focus-flow-pdf-library';
export const PDF_BACKUP_VERSION=1;
export const MAX_PDF_BACKUP_BYTES=80*1024*1024;
export const MAX_PDF_BACKUP_DOCUMENTS=100;
function safeName(value){const name=String(value||'document.pdf').replace(/[\\/:*?"<>|]/g,'-').trim().slice(0,180);return /\.pdf$/i.test(name)?name:name+'.pdf'}
function bytesToBase64(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));return btoa(binary)}
function base64ToBytes(value){if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new Error('PDF backup contains invalid encoded data.');const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes}
function hasPdfHeader(bytes){const limit=Math.min(bytes.length,1024);for(let i=0;i<limit-4;i++)if(bytes[i]===37&&bytes[i+1]===80&&bytes[i+2]===68&&bytes[i+3]===70&&bytes[i+4]===45)return true;return false}
export async function createPdfBackupPayload(records){
 if(!Array.isArray(records)||records.length>MAX_PDF_BACKUP_DOCUMENTS)throw new Error('PDF backup supports up to 100 documents.');
 let total=0;const documents=[];
 for(const record of records){
  if(!record?.blob||typeof record.blob.arrayBuffer!=='function')throw new Error('A saved PDF could not be read for backup.');
  const bytes=new Uint8Array(await record.blob.arrayBuffer());total+=bytes.byteLength;
  if(total>MAX_PDF_BACKUP_BYTES)throw new Error('PDF Library backup exceeds the 80 MB limit. Export smaller groups of documents.');
  if(!hasPdfHeader(bytes))throw new Error('A saved document is not a valid PDF: '+safeName(record.name));
  documents.push({backupId:String(record.backupId||record.id||''),name:safeName(record.name),size:bytes.byteLength,updatedAt:Number(record.updatedAt)||Date.now(),data:bytesToBase64(bytes)});
 }
 return {format:PDF_BACKUP_FORMAT,version:PDF_BACKUP_VERSION,createdAt:new Date().toISOString(),documents};
}
export function parsePdfBackupPayload(payload){
 if(!payload||typeof payload!=='object'||payload.format!==PDF_BACKUP_FORMAT||payload.version!==PDF_BACKUP_VERSION||!Array.isArray(payload.documents))throw new Error('Unsupported or invalid PDF Library backup.');
 if(payload.documents.length>MAX_PDF_BACKUP_DOCUMENTS)throw new Error('PDF backup contains more than 100 documents.');
 let total=0;const ids=new Set();
 const documents=payload.documents.map(item=>{
  if(!item||typeof item!=='object'||typeof item.data!=='string'||!item.data||item.data.length>Math.ceil(MAX_PDF_BACKUP_BYTES*4/3)+4)throw new Error('PDF backup contains an invalid document record.');
  const backupId=String(item.backupId||'');if(!backupId||backupId.length>200||ids.has(backupId))throw new Error('PDF backup contains a missing or duplicate document ID.');ids.add(backupId);
  const bytes=base64ToBytes(item.data);total+=bytes.byteLength;
  if(total>MAX_PDF_BACKUP_BYTES)throw new Error('PDF backup exceeds the 80 MB restore limit.');
  if(!Number.isSafeInteger(Number(item.size))||Number(item.size)!==bytes.byteLength||!hasPdfHeader(bytes))throw new Error('PDF backup contains a damaged or mismatched PDF file.');
  return {backupId,name:safeName(item.name),size:bytes.byteLength,updatedAt:Number(item.updatedAt)||Date.now(),bytes};
 });
 return {createdAt:String(payload.createdAt||''),documents,totalBytes:total};
}
export async function readPdfBackupFile(file){
 if(!file||typeof file.text!=='function')throw new Error('Choose a PDF Library backup JSON file.');
 if(file.size>MAX_PDF_BACKUP_BYTES*1.5)throw new Error('Backup file is too large to restore on this device.');
 let payload;try{payload=JSON.parse(await file.text())}catch{throw new Error('Backup file is not valid JSON.')}
 return parsePdfBackupPayload(payload);
}
