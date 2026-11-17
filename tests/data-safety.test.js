import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, inspectBackup } from '../src/data-safety.js';

const sample=()=>({version:4,subjects:[{id:'s1',name:'Statistics',color:'#8b7cff',goalMinutes:120}],sessions:[{id:'x1',subjectId:'s1',startedAt:'2026-01-01T10:00:00.000Z',endedAt:'2026-01-01T11:00:00.000Z',duration:3600}],tasks:[{id:'t1',title:'Read chapter',done:false}],plans:[{id:'p1',weekday:1,subjectId:'s1',minutes:60}],notes:[{id:'n1',title:'Probability',body:'Events',updatedAt:1}],settings:{}});

test('creates an integrity-protected backup and previews record counts',()=>{
 const backup=createBackup(sample());
 const result=inspectBackup(backup);
 assert.equal(result.legacy,false);
 assert.equal(backup.appVersion,'5.5.6');
 assert.deepEqual(result.count,{subjects:1,sessions:1,tasks:1,plans:1,notes:1});
 assert.equal(result.data.subjects[0].name,'Statistics');
});

test('rejects a modified backup payload',()=>{
 const backup=createBackup(sample());
 backup.data.tasks[0].title='Modified';
 assert.throws(()=>inspectBackup(backup),/integrity check failed/i);
});

test('accepts supported legacy version-4 JSON backups',()=>{
 const result=inspectBackup(sample());
 assert.equal(result.legacy,true);
 assert.equal(result.count.sessions,1);
});

test('rejects unsupported versions and malformed record collections',()=>{
 assert.throws(()=>inspectBackup({version:3,subjects:[],sessions:[],tasks:[],notes:[]}),/unsupported app data version/i);
 assert.throws(()=>inspectBackup({version:4,subjects:{},sessions:[],tasks:[],notes:[]}),/must be a list/i);
});

test('rejects duplicate subject identifiers',()=>{
 const data=sample();data.subjects.push({...data.subjects[0],name:'Mathematics'});
 assert.throws(()=>inspectBackup(data),/duplicate subject ids/i);
});


test('rejects non-list study plans and malformed task subtasks',()=>{
  const invalidPlans=sample();invalidPlans.plans={weekday:1};
  assert.throws(()=>inspectBackup(invalidPlans),/plans must be a list/i);
  const invalidSubtasks=sample();invalidSubtasks.tasks[0].subtasks=[{title:'   '}];
  assert.throws(()=>inspectBackup(invalidSubtasks),/invalid sub-task/i);
});

test('rejects study plans that point to missing subjects',()=>{
  const data=sample();data.plans[0].subjectId='missing';
  assert.throws(()=>inspectBackup(data),/invalid study plan/i);
});


test('storage health check settles when IndexedDB is blocked and closes a late connection',async()=>{
 const oldIndexedDB=globalThis.indexedDB;
 let request,closed=false;
 globalThis.indexedDB={
  open(){request={};queueMicrotask(()=>request.onblocked?.());return request;},
  deleteDatabase(){return {}}
 };
 try{
  const health=await (await import('../src/data-safety.js')).getStorageHealth();
  assert.equal(health.indexedDB,false);
  request.result={close(){closed=true}};
  request.onsuccess();
  assert.equal(closed,true,'a connection that opens after a blocked result must be closed');
 }finally{
  if(oldIndexedDB===undefined)delete globalThis.indexedDB;
  else globalThis.indexedDB=oldIndexedDB;
 }
});
