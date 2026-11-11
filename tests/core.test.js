import test from 'node:test';
import assert from 'node:assert/strict';
import { Analytics } from '../src/analytics.js';
import { FocusTimer } from '../src/timer.js';

function memory(){const data={subjects:[],sessions:[],tasks:[],notes:[],settings:{}};return {data,save(){},subjectName(){return 'Test'}}}
test('subject totals sum only matching sessions',()=>{const s=[{subjectId:'a',duration:30},{subjectId:'b',duration:50},{subjectId:'a',duration:20}];assert.equal(Analytics.subjectSeconds(s,'a'),50)});
test('monthly analytics filters by month and year',()=>{const sessions=[{startedAt:'2026-11-02T10:00:00Z',duration:100},{startedAt:'2026-10-02T10:00:00Z',duration:50}];assert.equal(Analytics.monthly(sessions,2026,10),100)});
test('timer persists active session and records completion',()=>{const old=globalThis.localStorage;const map=new Map();globalThis.localStorage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)||null,removeItem:k=>map.delete(k)};try{const s=memory();const timer=new FocusTimer(s);timer.start('x');timer.segmentStartedAt=Date.now()-5000;assert.ok(timer.elapsed()>=5);timer.finish();assert.equal(s.data.sessions.length,1);assert.ok(s.data.sessions[0].duration>=5)}finally{globalThis.localStorage=old}});
test('weekly analytics always returns seven days',()=>assert.equal(Analytics.weekly([]).length,7));

test('timer pause and resume excludes paused time and keeps original start',()=>{const old=globalThis.localStorage;const map=new Map();globalThis.localStorage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)||null,removeItem:k=>map.delete(k)};try{const s=memory();const timer=new FocusTimer(s);const original=Date.now()-10000;timer.start('x');timer.startedAt=original;timer.segmentStartedAt=original;timer.toggle();const paused=timer.elapsed();assert.equal(timer.paused,true);timer.toggle();assert.equal(timer.paused,false);timer.segmentStartedAt=Date.now()-2000;assert.ok(timer.elapsed()>=paused+1);timer.finish();assert.equal(s.data.sessions[0].startedAt,new Date(original).toISOString());}finally{globalThis.localStorage=old}});
test('restored paused timer does not accrue time while paused',()=>{const old=globalThis.localStorage;const map=new Map();globalThis.localStorage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)||null,removeItem:k=>map.delete(k)};try{map.set('focus-flow-active-session',JSON.stringify({subjectId:'x',startedAt:1000,segmentStartedAt:1000,accumulated:42,paused:true}));const timer=new FocusTimer(memory());assert.equal(timer.active,true);assert.equal(timer.elapsed(),42);}finally{globalThis.localStorage=old}});

import { Store } from '../src/store.js';

test('store merges safe defaults and rejects malformed backup data',()=>{const old=globalThis.localStorage;const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};try{const store=new Store();assert.equal(store.data.settings.dailyGoalMinutes,120);assert.throws(()=>store.import({version:4,subjects:'bad',sessions:[]}));assert.throws(()=>store.import({version:4,subjects:[],sessions:[],tasks:{},notes:[]}));}finally{globalThis.localStorage=old}});
test('store supports subject, task, note and history CRUD',()=>{const old=globalThis.localStorage;const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};try{const store=new Store();const subject=store.data.subjects[0];store.editSubject(subject.id,'Updated subject');assert.equal(store.subjectName(subject.id),'Updated subject');store.addTask('Read chapter');const task=store.data.tasks[0];store.toggleTask(task.id,true);assert.equal(task.done,true);store.deleteTask(task.id);assert.equal(store.data.tasks.length,0);store.addNote('Draft','First');const note=store.data.notes[0];store.editNote(note.id,'Final','Second');assert.equal(note.body,'Second');store.deleteNote(note.id);assert.equal(store.data.notes.length,0);store.data.sessions.push({id:'session-1',subjectId:subject.id,duration:60,startedAt:new Date().toISOString(),endedAt:new Date().toISOString()});store.deleteSession('session-1');assert.equal(store.data.sessions.length,0);}finally{globalThis.localStorage=old}});

test('goal streak counts consecutive days meeting the daily target',()=>{
  const now=new Date(2026,10,11,12,0,0);
  const day=(offset,seconds)=>{const d=new Date(now);d.setDate(d.getDate()+offset);return {startedAt:d.toISOString(),duration:seconds};};
  const sessions=[day(-2,3600),day(-1,3600),day(0,3600)];
  assert.equal(Analytics.streak(sessions,60,now),3);
});
test('goal streak continues from yesterday when today has not met the target',()=>{
  const now=new Date(2026,10,11,12,0,0);
  const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
  assert.equal(Analytics.streak([{startedAt:yesterday.toISOString(),duration:3600}],60,now),1);
});
test('goal streak resets after a missed day',()=>{
  const now=new Date(2026,10,11,12,0,0);
  const twoDaysAgo=new Date(now);twoDaysAgo.setDate(twoDaysAgo.getDate()-2);
  assert.equal(Analytics.streak([{startedAt:twoDaysAgo.toISOString(),duration:3600}],60,now),0);
});
test('store validates and persists daily study target',()=>{
  const old=globalThis.localStorage;const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  try{const store=new Store();store.setDailyGoal(90);assert.equal(store.data.settings.dailyGoalMinutes,90);assert.throws(()=>store.setDailyGoal(0));}finally{globalThis.localStorage=old}
});
