import { registerPlugin, Capacitor } from '@capacitor/core';
import { createSerialQueue } from './serial-queue.js';

const NativeFocusTimer = registerPlugin('FocusTimer');
const enqueueNativeCommand = createSerialQueue();

// Android bridge calls are asynchronous. Serializing them guarantees that a
// delayed START cannot arrive after a later STOP (or overwrite a newer session).
export function syncNativeFocusTimer(timer, subjectName='Focus session', requestPermission=false) {
 if(Capacitor.getPlatform()!=='android') return Promise.resolve();
 return enqueueNativeCommand(async()=>{
  if(!timer?.active){await NativeFocusTimer.stopTimer();return;}
  if(requestPermission)await NativeFocusTimer.requestNotificationPermission();
  await NativeFocusTimer.startTimer({subject:subjectName,sessionId:timer.sessionId||'',elapsedMs:Math.floor(timer.elapsed()*1000),paused:timer.paused});
 }).catch(error=>{console.warn('Focus notification unavailable',error);});
}
export function stopNativeFocusTimer(){
 if(Capacitor.getPlatform()!=='android')return Promise.resolve();
 return enqueueNativeCommand(()=>NativeFocusTimer.stopTimer()).catch(error=>{console.warn('Unable to stop native focus notification',error);});
}
