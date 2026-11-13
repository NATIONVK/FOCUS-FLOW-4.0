import { syncNativeFocusTimer, stopNativeFocusTimer } from './native-focus-timer.js';
const ACTIVE='focus-flow-active-session';

export class FocusTimer {
  constructor(store,onChange=()=>{}) {
    this.store=store; this.onChange=onChange;
    this.active=false; this.paused=false; this.startedAt=0;
    this.segmentStartedAt=0; this.accumulated=0; this.subjectId=null;
    this.restore();
  }
  restore() {
    try {
      const raw=globalThis.localStorage?.getItem(ACTIVE);
      if(!raw)return;
      const s=JSON.parse(raw);
      const valid=s&&typeof s==='object'&&!Array.isArray(s)
        &&typeof s.subjectId==='string'&&s.subjectId.trim().length>0
        &&Number.isFinite(s.startedAt)&&s.startedAt>0
        &&Number.isFinite(s.segmentStartedAt)&&s.segmentStartedAt>0
        &&Number.isFinite(s.accumulated)&&s.accumulated>=0
        &&typeof s.paused==='boolean';
      if(!valid){
        globalThis.localStorage?.removeItem(ACTIVE);
        console.warn('Discarded an invalid active focus session snapshot');
        return;
      }
      this.subjectId=s.subjectId; this.startedAt=s.startedAt;
      this.segmentStartedAt=s.segmentStartedAt;
      this.accumulated=s.accumulated;
      this.paused=s.paused; this.active=true;
    } catch(error) {
      console.warn('Unable to restore active focus session',error);
      try { globalThis.localStorage?.removeItem(ACTIVE); } catch {}
    }
  }
  persist() {
    try { localStorage.setItem(ACTIVE,JSON.stringify({subjectId:this.subjectId,startedAt:this.startedAt,segmentStartedAt:this.segmentStartedAt,accumulated:this.accumulated,paused:this.paused})); }
    catch(error) { console.error('Unable to persist active timer',error); }
  }
  elapsed() {
    return this.accumulated+(this.active&&!this.paused?Math.max(0,Date.now()-this.segmentStartedAt)/1000:0);
  }
  start(subjectId) {
    if(this.active) return false;
    if(!subjectId) throw new Error('A subject is required to start a focus session.');
    this.subjectId=subjectId; this.startedAt=Date.now(); this.segmentStartedAt=this.startedAt;
    this.accumulated=0; this.paused=false; this.active=true; this.persist(); this.onChange(); syncNativeFocusTimer(this,this.store.subjectName(this.subjectId));
    return true;
  }
  toggle() {
    if(!this.active) return false;
    if(this.paused) { this.segmentStartedAt=Date.now(); this.paused=false; }
    else { this.accumulated=this.elapsed(); this.paused=true; }
    this.persist(); this.onChange(); syncNativeFocusTimer(this,this.store.subjectName(this.subjectId)); return true;
  }
  finish() {
    if(!this.active) return null;
    const duration=this.elapsed();
    const session=duration>=1?{id:globalThis.crypto?.randomUUID?.()||`session-${Date.now()}-${Math.random().toString(36).slice(2)}`,subjectId:this.subjectId,startedAt:new Date(this.startedAt).toISOString(),endedAt:new Date().toISOString(),duration:Math.floor(duration)}:null;
    if(session) this.store.data.sessions.push(session);
    this.store.save(); try { globalThis.localStorage?.removeItem(ACTIVE); } catch(error) { console.warn('Unable to clear active timer snapshot',error); } stopNativeFocusTimer();
    this.active=false; this.paused=false; this.startedAt=0; this.segmentStartedAt=0; this.accumulated=0; this.subjectId=null;
    this.onChange(); return session?.duration??0;
  }
}
