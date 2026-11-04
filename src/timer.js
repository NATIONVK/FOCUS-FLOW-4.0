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
      const s=JSON.parse(localStorage.getItem(ACTIVE));
      if(!s || !s.subjectId || !Number.isFinite(s.startedAt)) return;
      this.subjectId=s.subjectId; this.startedAt=s.startedAt;
      this.segmentStartedAt=Number(s.segmentStartedAt)||0;
      this.accumulated=Math.max(0,Number(s.accumulated)||0);
      this.paused=!!s.paused; this.active=true;
    } catch { localStorage.removeItem(ACTIVE); }
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
    this.accumulated=0; this.paused=false; this.active=true; this.persist(); this.onChange();
    return true;
  }
  toggle() {
    if(!this.active) return false;
    if(this.paused) { this.segmentStartedAt=Date.now(); this.paused=false; }
    else { this.accumulated=this.elapsed(); this.paused=true; }
    this.persist(); this.onChange(); return true;
  }
  finish() {
    if(!this.active) return null;
    const duration=this.elapsed();
    const session=duration>=1?{id:crypto.randomUUID(),subjectId:this.subjectId,startedAt:new Date(this.startedAt).toISOString(),endedAt:new Date().toISOString(),duration:Math.floor(duration)}:null;
    if(session) this.store.data.sessions.push(session);
    this.store.save(); localStorage.removeItem(ACTIVE);
    this.active=false; this.paused=false; this.startedAt=0; this.segmentStartedAt=0; this.accumulated=0; this.subjectId=null;
    this.onChange(); return session?.duration??0;
  }
}
