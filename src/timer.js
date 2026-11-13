import { syncNativeFocusTimer, stopNativeFocusTimer } from './native-focus-timer.js';
const ACTIVE='focus-flow-active-session';

export class FocusTimer {
  constructor(store,onChange=()=>{}) {
    this.store=store; this.onChange=onChange;
    this.active=false; this.paused=false; this.startedAt=0;
    this.segmentStartedAt=0; this.accumulated=0; this.subjectId=null; this.sessionId=null;
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
        &&typeof s.paused==='boolean'
        &&(s.sessionId===undefined||typeof s.sessionId==='string');
      if(!valid){
        globalThis.localStorage?.removeItem(ACTIVE);
        console.warn('Discarded an invalid active focus session snapshot');
        return;
      }
      this.subjectId=s.subjectId; this.startedAt=s.startedAt;
      this.segmentStartedAt=s.segmentStartedAt;
      this.accumulated=s.accumulated;
      this.paused=s.paused; this.sessionId=s.sessionId||`session-${s.startedAt}-${s.subjectId}`;this.active=true;
    } catch(error) {
      console.warn('Unable to restore active focus session',error);
      try { globalThis.localStorage?.removeItem(ACTIVE); } catch {}
    }
  }
  persist() {
    const storage=globalThis.localStorage;
    if(!storage||typeof storage.setItem!=='function'||typeof storage.getItem!=='function')throw new Error('এই ডিভাইসে Timer Restore-এর জন্য Storage পাওয়া যাচ্ছে না।');
    const snapshot=JSON.stringify({sessionId:this.sessionId,subjectId:this.subjectId,startedAt:this.startedAt,segmentStartedAt:this.segmentStartedAt,accumulated:this.accumulated,paused:this.paused});
    storage.setItem(ACTIVE,snapshot);
    if(storage.getItem(ACTIVE)!==snapshot)throw new Error('Active timer snapshot verification failed.');
    return true;
  }
  elapsed() {
    return this.accumulated+(this.active&&!this.paused?Math.max(0,Date.now()-this.segmentStartedAt)/1000:0);
  }
  start(subjectId) {
    if(this.active) return false;
    if(!subjectId) throw new Error('A subject is required to start a focus session.');
    this.subjectId=subjectId; this.startedAt=Date.now(); this.segmentStartedAt=this.startedAt;
    this.accumulated=0; this.paused=false; this.sessionId=globalThis.crypto?.randomUUID?.()||`session-${this.startedAt}-${Math.random().toString(36).slice(2)}`;this.active=true;
    try{this.persist();}catch(error){this.active=false;this.subjectId=null;this.startedAt=0;this.segmentStartedAt=0;this.accumulated=0;this.sessionId=null;throw error;}
    this.onChange(); syncNativeFocusTimer(this,this.store.subjectName(this.subjectId));
    return true;
  }
  toggle() {
    if(!this.active) return false;
    const previous={paused:this.paused,segmentStartedAt:this.segmentStartedAt,accumulated:this.accumulated};
    if(this.paused) { this.segmentStartedAt=Date.now(); this.paused=false; }
    else { this.accumulated=this.elapsed(); this.paused=true; }
    try{this.persist();}catch(error){Object.assign(this,previous);throw error;}
    this.onChange(); syncNativeFocusTimer(this,this.store.subjectName(this.subjectId)); return true;
  }
  finish() {
    if(!this.active) return null;
    const duration=this.elapsed();
    const session=duration>=1?{id:this.sessionId||`session-${this.startedAt}-${this.subjectId}`,subjectId:this.subjectId,startedAt:new Date(this.startedAt).toISOString(),endedAt:new Date().toISOString(),duration:Math.floor(duration)}:null;
    if(session&&!this.store.data.sessions.some(item=>item.id===session.id)) this.store.data.sessions.push(session);
    try {
      this.store.save();
    } catch(error) {
      // Roll back the in-memory append so retrying Finish cannot duplicate a session.
      if(session) this.store.data.sessions=this.store.data.sessions.filter(item=>item.id!==session.id);
      throw error;
    }
    try { const storage=globalThis.localStorage;if(!storage)throw new Error('Storage unavailable');storage.removeItem(ACTIVE);if(storage.getItem(ACTIVE)!==null)throw new Error('Active timer snapshot could not be cleared'); }
    catch(error){throw new Error('Session History-তে Save হয়েছে, কিন্তু Active Timer Snapshot clear হয়নি। আবার Finish চাপুন; Duplicate Session তৈরি হবে না।');}
    stopNativeFocusTimer();
    this.active=false; this.paused=false; this.startedAt=0; this.segmentStartedAt=0; this.accumulated=0; this.subjectId=null;this.sessionId=null;
    this.onChange(); return session?.duration??0;
  }
}
