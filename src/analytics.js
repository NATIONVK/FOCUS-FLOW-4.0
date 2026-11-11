export class Analytics {
  static subjectSeconds(sessions,id){return sessions.filter(s=>s.subjectId===id).reduce((n,s)=>n+s.duration,0);}
  static weekly(sessions,now=new Date()){return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);const seconds=sessions.filter(s=>new Date(s.startedAt).toDateString()===d.toDateString()).reduce((n,s)=>n+s.duration,0);return {label:d.toLocaleDateString(undefined,{weekday:'short'}),seconds};});}
  static monthly(sessions,year=new Date().getFullYear(),month=new Date().getMonth()){return sessions.filter(s=>{const d=new Date(s.startedAt);return d.getFullYear()===year&&d.getMonth()===month;}).reduce((n,s)=>n+s.duration,0);}

  static dailySeconds(sessions,date=new Date()){
    const key=date.toDateString();
    return sessions.filter(s=>new Date(s.startedAt).toDateString()===key).reduce((n,s)=>n+s.duration,0);
  }
  static streak(sessions,goalMinutes=120,now=new Date()){
    const goal=Math.max(1,Number(goalMinutes)||120)*60;
    const today=new Date(now);today.setHours(0,0,0,0);
    const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
    const todayMet=this.dailySeconds(sessions,today)>=goal;
    const yesterdayMet=this.dailySeconds(sessions,yesterday)>=goal;
    if(!todayMet&&!yesterdayMet)return 0;
    const cursor=new Date(todayMet?today:yesterday);
    let count=0;
    while(this.dailySeconds(sessions,cursor)>=goal){count++;cursor.setDate(cursor.getDate()-1);}
    return count;
  }
}
