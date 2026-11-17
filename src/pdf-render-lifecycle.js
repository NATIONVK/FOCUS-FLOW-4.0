// Tracks every in-flight PDF.js page task so page jumps and document changes cannot leave stale canvases rendering.
export function createPdfRenderLifecycle(){
 let generation=0;
 const active=new Set();
 const release=entry=>{
  if(!active.delete(entry))return;
  try{entry.cleanup?.()}catch{}
 };
 function track(task,cleanup=()=>{}){
  if(!task||!task.promise||typeof task.promise.then!=='function')throw new TypeError('A PDF render task with a promise is required.');
  const entry={task,cleanup};
  active.add(entry);
  Promise.resolve(task.promise).then(()=>release(entry),()=>release(entry));
  return task;
 }
 async function cancelActive(){
  const pending=[];
  for(const entry of [...active]){
   try{entry.task.cancel?.()}catch{}
   pending.push(Promise.resolve(entry.task.promise).then(()=>undefined,()=>undefined));
  }
  await Promise.all(pending);
 }
 return {
  async begin(){
   const token=++generation;
   await cancelActive();
   return token;
  },
  isCurrent(token){return token===generation;},
  track,
  async cancel(){
   generation++;
   await cancelActive();
  },
  get activeCount(){return active.size;}
 };
}
