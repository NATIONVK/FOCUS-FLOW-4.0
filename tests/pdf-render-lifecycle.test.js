import test from 'node:test';
import assert from 'node:assert/strict';
import {createPdfRenderLifecycle} from '../src/pdf-render-lifecycle.js';

function deferred(){
 let resolve,reject;
 const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
 return {promise,resolve,reject};
}

test('tracked render tasks release their resources after successful rendering',async()=>{
 const lifecycle=createPdfRenderLifecycle(),gate=deferred();
 let cleaned=0;
 const task={promise:gate.promise,cancel(){}};
 lifecycle.track(task,()=>cleaned++);
 assert.equal(lifecycle.activeCount,1);
 gate.resolve();
 await gate.promise;
 await Promise.resolve();
 assert.equal(lifecycle.activeCount,0);
 assert.equal(cleaned,1);
});

test('starting a new render cancels and awaits every older page task',async()=>{
 const lifecycle=createPdfRenderLifecycle(),gate=deferred();
 let cancelled=0,cleaned=0;
 lifecycle.track({promise:gate.promise,cancel(){cancelled++;gate.reject(Object.assign(new Error('cancelled'),{name:'RenderingCancelledException'}));}},()=>cleaned++);
 const token=await lifecycle.begin();
 assert.equal(cancelled,1);
 assert.equal(cleaned,1);
 assert.equal(lifecycle.activeCount,0);
 assert.equal(lifecycle.isCurrent(token),true);
});

test('overlapping render generations leave only the newest generation current',async()=>{
 const lifecycle=createPdfRenderLifecycle();
 const first=lifecycle.begin();
 const second=lifecycle.begin();
 const [a,b]=await Promise.all([first,second]);
 assert.equal(lifecycle.isCurrent(a),false);
 assert.equal(lifecycle.isCurrent(b),true);
});

test('explicit cancellation invalidates the current generation and releases tasks',async()=>{
 const lifecycle=createPdfRenderLifecycle(),gate=deferred();
 let cleaned=0;
 lifecycle.track({promise:gate.promise,cancel(){gate.reject(new Error('cancelled'));}},()=>cleaned++);
 const token=await lifecycle.begin();
 const cancellation=lifecycle.cancel();
 await cancellation;
 assert.equal(lifecycle.isCurrent(token),false);
 assert.equal(lifecycle.activeCount,0);
 assert.equal(cleaned,1);
});
