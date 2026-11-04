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
