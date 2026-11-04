export class Analytics {
  static subjectSeconds(sessions,id){return sessions.filter(s=>s.subjectId===id).reduce((n,s)=>n+s.duration,0);}
  static weekly(sessions,now=new Date()){return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);const seconds=sessions.filter(s=>new Date(s.startedAt).toDateString()===d.toDateString()).reduce((n,s)=>n+s.duration,0);return {label:d.toLocaleDateString(undefined,{weekday:'short'}),seconds};});}
  static monthly(sessions,year=new Date().getFullYear(),month=new Date().getMonth()){return sessions.filter(s=>{const d=new Date(s.startedAt);return d.getFullYear()===year&&d.getMonth()===month;}).reduce((n,s)=>n+s.duration,0);}
}
