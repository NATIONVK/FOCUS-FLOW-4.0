// Small promise queue for ordering asynchronous native bridge commands.
export function createSerialQueue(){
 let tail=Promise.resolve();
 return function enqueue(task){
  if(typeof task!=='function')return Promise.reject(new TypeError('Queue task must be a function.'));
  const result=tail.then(()=>task(),()=>task());
  tail=result.catch(()=>undefined);
  return result;
 };
}
