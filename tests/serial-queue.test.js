import test from 'node:test';
import assert from 'node:assert/strict';
import { createSerialQueue } from '../src/serial-queue.js';

test('serial queue preserves command order when operations overlap', async()=>{
 const enqueue=createSerialQueue();
 const order=[];
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 const first=enqueue(async()=>{order.push('start');await gate;order.push('started')});
 const second=enqueue(async()=>{order.push('stop')});
 await Promise.resolve();
 assert.deepEqual(order,['start']);
 release();
 await Promise.all([first,second]);
 assert.deepEqual(order,['start','started','stop']);
});

test('a failed native command does not block later commands',async()=>{
 const enqueue=createSerialQueue();
 await assert.rejects(enqueue(()=>{throw new Error('bridge failed')}),/bridge failed/);
 const result=await enqueue(()=>42);
 assert.equal(result,42);
});

test('queue rejects non-function tasks without corrupting its chain',async()=>{
 const enqueue=createSerialQueue();
 await assert.rejects(enqueue(null),/must be a function/);
 assert.equal(await enqueue(()=> 'ready'),'ready');
});
