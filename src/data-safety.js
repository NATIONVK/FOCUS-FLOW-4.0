const FORMAT='focus-flow-backup';
const SCHEMA_VERSION=1;
const fnv1a=value=>{let hash=0x811c9dc5;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,0x01000193)}return(hash>>>0).toString(16).padStart(8,'0')};
const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

export function createBackup(data){
  if(!isObject(data)||data.version!==4)throw new Error('Current app data is not a supported version.');
  const payload=JSON.parse(JSON.stringify(data));
  const canonical=JSON.stringify(payload);
  return {format:FORMAT,schemaVersion:SCHEMA_VERSION,createdAt:new Date().toISOString(),appVersion:'5.5.6',integrity:{algorithm:'fnv1a-32',checksum:fnv1a(canonical)},data:payload};
}
export function inspectBackup(value){
  if(!isObject(value))throw new Error('Backup file must contain a JSON object.');
  let data=value;
  let legacy=true;
  if(value.format===FORMAT){
    legacy=false;
    if(value.schemaVersion!==SCHEMA_VERSION)throw new Error('This backup format version is not supported.');
    if(!isObject(value.data)||!isObject(value.integrity)||value.integrity.algorithm!=='fnv1a-32')throw new Error('Backup envelope is incomplete.');
    const actual=fnv1a(JSON.stringify(value.data));
    if(actual!==value.integrity.checksum)throw new Error('Backup integrity check failed. The file may be damaged or modified.');
    data=value.data;
  }else if(value.format!==undefined){
    throw new Error('This is not a recognized FOCUS FLOW backup.');
  }
  if(data.version!==4)throw new Error('Unsupported app data version. Expected version 4.');
  for(const key of ['subjects','sessions','tasks','plans','notes'])if(data[key]!==undefined&&!Array.isArray(data[key]))throw new Error('Invalid backup: '+key+' must be a list.');
  for(const key of ['subjects','sessions','tasks','notes'])if(!Array.isArray(data[key]))throw new Error('Backup is missing required data list: '+key+'.');
  if(!Array.isArray(data.subjects)||!Array.isArray(data.sessions)||!Array.isArray(data.tasks??[])||!Array.isArray(data.notes??[]))throw new Error('Backup is missing required data lists.');
  if(data.subjects.length>1000||data.sessions.length>200000||(data.tasks??[]).length>50000||(data.notes??[]).length>50000||((data.plans||[]).length>20000))throw new Error('Backup contains an unusually large number of records.');
  const ids=new Set();
  for(const s of data.subjects){if(!isObject(s)||typeof s.name!=='string'||!s.name.trim())throw new Error('Backup contains an invalid subject.');if(s.id){if(ids.has(s.id))throw new Error('Duplicate subject IDs detected.');ids.add(s.id)}}
  for(const s of data.sessions){if(!isObject(s)||!Number.isFinite(Number(s.duration))||Number(s.duration)<0||!Number.isFinite(Date.parse(s.startedAt)))throw new Error('Backup contains an invalid study session.');}
  for(const p of data.plans??[])if(!isObject(p)||!Number.isInteger(p.weekday)||p.weekday<0||p.weekday>6||!Number.isFinite(Number(p.minutes))||Number(p.minutes)<5||Number(p.minutes)>1440||!data.subjects.some(s=>s.id===p.subjectId))throw new Error('Backup contains an invalid study plan.');
  for(const t of data.tasks??[]){if(!isObject(t)||typeof t.title!=='string'||!t.title.trim())throw new Error('Backup contains an invalid task.');if(t.subtasks!==undefined&&!Array.isArray(t.subtasks))throw new Error('Backup task sub-tasks must be a list.');for(const st of t.subtasks??[])if(!isObject(st)||typeof st.title!=='string'||!st.title.trim())throw new Error('Backup contains an invalid sub-task.');}
  for(const n of data.notes??[])if(!isObject(n)||typeof n.title!=='string'||!n.title.trim())throw new Error('Backup contains an invalid note.');
  const count={subjects:data.subjects.length,sessions:data.sessions.length,tasks:(data.tasks||[]).length,plans:(data.plans||[]).length,notes:(data.notes||[]).length};
  return {data,count,legacy,createdAt:value.createdAt||null,checksum:legacy?null:value.integrity.checksum};
}
export async function inspectBackupFile(file,{maxBytes=20*1024*1024}={}){
  if(!file)throw new Error('Choose a backup file first.');
  if(file.size>maxBytes)throw new Error('Backup is larger than the 20 MB safety limit.');
  const text=await file.text();
  if(!text.trim())throw new Error('Backup file is empty.');
  let parsed;try{parsed=JSON.parse(text)}catch{throw new Error('Backup JSON is invalid or incomplete.')}
  return inspectBackup(parsed);
}
export async function buildVerifiedBackupBlob(data){
  const envelope=createBackup(data);
  const serialized=JSON.stringify(envelope,null,2);
  const blob=new Blob([serialized],{type:'application/json'});
  const readBack=await blob.text();
  const checked=inspectBackup(JSON.parse(readBack));
  if(checked.checksum!==envelope.integrity.checksum)throw new Error('Backup export verification failed.');
  return {blob,filename:'focus-flow-backup-'+new Date().toISOString().slice(0,10)+'.json',count:checked.count,checksum:checked.checksum};
}
export async function getStorageHealth(){
  const result={localStorage:false,indexedDB:false,estimate:null,persisted:null};
  try{const storage=globalThis.localStorage;const key='__ff_health_probe__';storage.setItem(key,'ok');result.localStorage=storage.getItem(key)==='ok';storage.removeItem(key)}catch{}
  try{
    if(globalThis.indexedDB){
      await new Promise((resolve,reject)=>{
        let settled=false;
        const finish=(callback,value)=>{if(settled)return;settled=true;callback(value)};
        const request=globalThis.indexedDB.open('__ff_health_probe__',1);
        request.onsuccess=()=>{
          const db=request.result;
          if(settled){db.close();return;}
          db.close();
          try{globalThis.indexedDB.deleteDatabase('__ff_health_probe__')}catch{}
          result.indexedDB=true;
          finish(resolve);
        };
        request.onerror=()=>finish(reject,request.error||new Error('IndexedDB health check failed'));
        request.onblocked=()=>finish(reject,new Error('IndexedDB health check was blocked'));
      });
    }
  }catch{}
  try{if(globalThis.navigator?.storage?.estimate)result.estimate=await globalThis.navigator.storage.estimate()}catch{}
  try{if(globalThis.navigator?.storage?.persisted)result.persisted=await globalThis.navigator.storage.persisted()}catch{}
  return result;
}

export async function requestPersistentStorage(){try{if(!globalThis.navigator?.storage?.persist)return false;return await navigator.storage.persist()}catch{return false}}
