const ACTIVE='focus-flow-active-session';
export class FocusTimer {
  constructor(store,onChange=()=>{}){this.store=store;this.onChange=onChange;this.active=false;this.paused=false;this.startedAt=0;this.accumulated=0;this.subjectId=null;this.restore();}
  restore(){try{const s=JSON.parse(localStorage.getItem(ACTIVE));if(s){this.subjectId=s.subjectId;this.startedAt=s.startedAt;this.accumulated=s.accumulated||0;this.paused=!!s.paused;this.active=true;}}catch{}}
  persist(){localStorage.setItem(ACTIVE,JSON.stringify({subjectId:this.subjectId,startedAt:this.startedAt,accumulated:this.accumulated,paused:this.paused}));}
  elapsed(){return this.accumulated+(this.active&&!this.paused?Math.max(0,Math.floor((Date.now()-this.startedAt)/1000)):0);}
  start(subjectId){if(this.active)return;this.subjectId=subjectId;this.startedAt=Date.now();this.accumulated=0;this.paused=false;this.active=true;this.persist();}
  toggle(){if(!this.active)return;if(this.paused){this.startedAt=Date.now();this.paused=false;}else{this.accumulated=this.elapsed();this.paused=true;}this.persist();this.onChange();}
  finish(){if(!this.active)return null;const duration=this.elapsed();if(duration>=1)this.store.data.sessions.push({id:crypto.randomUUID(),subjectId:this.subjectId,startedAt:new Date(Date.now()-duration*1000).toISOString(),endedAt:new Date().toISOString(),duration});this.store.save();localStorage.removeItem(ACTIVE);this.active=false;this.paused=false;this.accumulated=0;this.onChange();return duration;}
}
