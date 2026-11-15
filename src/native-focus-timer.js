import { registerPlugin, Capacitor } from '@capacitor/core';
const NativeFocusTimer = registerPlugin('FocusTimer');
export async function syncNativeFocusTimer(timer, subjectName='Focus session', requestPermission=false) {
 if(Capacitor.getPlatform()!=='android') return;
 try {
  if(!timer?.active){await NativeFocusTimer.stopTimer();return;}
  if(requestPermission)await NativeFocusTimer.requestNotificationPermission();
  await NativeFocusTimer.startTimer({subject:subjectName,elapsedMs:Math.floor(timer.elapsed()*1000),paused:timer.paused});
 } catch(e){console.warn('Focus notification unavailable',e);}
}
export async function stopNativeFocusTimer(){if(Capacitor.getPlatform()==='android'){try{await NativeFocusTimer.stopTimer();}catch(e){console.warn(e);}}}