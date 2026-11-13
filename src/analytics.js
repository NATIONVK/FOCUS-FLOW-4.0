export class Analytics {
  static dateKey(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
  static subjectSeconds(sessions,id){return sessions.filter(s=>s.subjectId===id).reduce((n,s)=>n+s.duration,0);}
  static weekly(sessions,now=new Date()){return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);const seconds=sessions.filter(s=>new Date(s.startedAt).toDateString()===d.toDateString()).reduce((n,s)=>n+s.duration,0);return {label:d.toLocaleDateString(undefined,{weekday:'short'}),seconds};});}

  static subjectRanking(sessions,subjects=[]){
    const total=sessions.reduce((sum,s)=>sum+Math.max(0,Number(s.duration)||0),0);
    return subjects.map(subject=>({id:subject.id,name:subject.name,color:subject.color,seconds:this.subjectSeconds(sessions,subject.id),share:total?Math.round(this.subjectSeconds(sessions,subject.id)/total*100):0}))
      .filter(item=>item.seconds>0).sort((a,b)=>b.seconds-a.seconds);
  }
  static rangeSeconds(sessions,start,end){
    return sessions.reduce((sum,s)=>{const time=new Date(s.startedAt).getTime();return Number.isFinite(time)&&time>=start.getTime()&&time<end.getTime()?sum+Math.max(0,Number(s.duration)||0):sum;},0);
  }
  static periodComparison(sessions,now=new Date()){
    const today=new Date(now);today.setHours(0,0,0,0);
    const weekStart=new Date(today);weekStart.setDate(weekStart.getDate()-6);
    const previousWeekStart=new Date(weekStart);previousWeekStart.setDate(previousWeekStart.getDate()-7);
    const previousWeekEnd=new Date(weekStart);
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
    const previousMonthStart=new Date(now.getFullYear(),now.getMonth()-1,1);
    const elapsedDays=today.getDate();
    const previousMonthEnd=new Date(previousMonthStart);previousMonthEnd.setDate(Math.min(elapsedDays,new Date(previousMonthStart.getFullYear(),previousMonthStart.getMonth()+1,0).getDate())+1);
    const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
    const compare=(current,previous)=>({current,previous,change:previous?Math.round((current-previous)/previous*100):null});
    return {week:compare(this.rangeSeconds(sessions,weekStart,tomorrow),this.rangeSeconds(sessions,previousWeekStart,previousWeekEnd)),month:compare(this.rangeSeconds(sessions,monthStart,tomorrow),this.rangeSeconds(sessions,previousMonthStart,previousMonthEnd))};
  }
  static monthly(sessions,year=new Date().getFullYear(),month=new Date().getMonth()){return sessions.filter(s=>{const d=new Date(s.startedAt);return d.getFullYear()===year&&d.getMonth()===month;}).reduce((n,s)=>n+s.duration,0);}

  static monthlyDays(sessions,year=new Date().getFullYear(),month=new Date().getMonth(),now=new Date()){
    const daysInMonth=new Date(year,month+1,0).getDate();
    const currentMonth=year===now.getFullYear()&&month===now.getMonth();
    const count=currentMonth?now.getDate():daysInMonth;
    return Array.from({length:count},(_,i)=>{
      const date=new Date(year,month,i+1);
      return {date,key:this.dateKey(date),day:i+1,seconds:this.dailySeconds(sessions,date)};
    });
  }
  static consistency(sessions,goalMinutes=120,now=new Date()){
    const goal=Math.max(1,Number(goalMinutes)||120)*60;
    const days=this.monthlyDays(sessions,now.getFullYear(),now.getMonth(),now);
    const met=days.filter(d=>d.seconds>=goal).length;
    return {score:days.length?Math.round(met/days.length*100):0,met,elapsed:days.length};
  }
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
