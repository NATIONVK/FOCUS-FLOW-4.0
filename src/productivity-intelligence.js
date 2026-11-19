const DAY=86400000;
const validDate=value=>{const n=new Date(value).getTime();return Number.isFinite(n)?n:null;};
const dayStart=date=>{const d=new Date(date);d.setHours(0,0,0,0);return d;};
const keyOf=date=>{const d=new Date(date);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const safeSessions=sessions=>(Array.isArray(sessions)?sessions:[]).map(s=>({id:typeof s?.id==="string"?s.id:"",subjectId:typeof s?.subjectId==="string"?s.subjectId:"",startedAt:validDate(s?.startedAt),duration:Number(s?.duration)})).filter(s=>s.startedAt!==null&&Number.isFinite(s.duration)&&s.duration>0&&s.duration<=86400);
function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;}
function slope(values){if(values.length<2)return 0;const xMean=(values.length-1)/2,yMean=mean(values);let top=0,bottom=0;values.forEach((y,x)=>{top+=(x-xMean)*(y-yMean);bottom+=(x-xMean)**2;});return bottom?top/bottom:0;}
function totalsByDay(sessions,start,count){const map=new Map();for(let i=0;i<count;i++){const d=new Date(start.getTime()+i*DAY);map.set(keyOf(d),0);}for(const s of sessions){const key=keyOf(s.startedAt);if(map.has(key))map.set(key,map.get(key)+s.duration);}return [...map].map(([date,seconds])=>({date,seconds}));}
export class ProductivityIntelligence{
 static analyze(rawSessions,options={}){
  const now=options.now instanceof Date?new Date(options.now):new Date();
  const sessions=safeSessions(rawSessions);
  const today=dayStart(now),year=now.getFullYear(),yearStart=new Date(year,0,1),yearDays=Math.round((new Date(year+1,0,1)-yearStart)/DAY);
  const allSeconds=sessions.reduce((n,s)=>n+s.duration,0);
  const days30=totalsByDay(sessions,new Date(today.getTime()-29*DAY),30);
  const days7=days30.slice(-7),weekSeconds=days7.reduce((n,d)=>n+d.seconds,0);
  const previous7=days30.slice(-14,-7).reduce((n,d)=>n+d.seconds,0);
  const dailyMean=mean(days30.map(d=>d.seconds));
  const last14=days30.slice(-14).map(d=>d.seconds);
  const trendPerDay=slope(last14);
  const elapsedWeek=Math.min(7,now.getDay()===0?7:now.getDay());
  const weeklyProjection=weekSeconds/Math.max(1,elapsedWeek)*7;
  const monthStart=new Date(year,now.getMonth(),1);
  const monthElapsed=now.getDate();
  const monthDays=totalsByDay(sessions,monthStart,monthElapsed);
  const monthSeconds=monthDays.reduce((n,d)=>n+d.seconds,0);
  const monthProjection=monthSeconds/Math.max(1,monthElapsed)*new Date(year,now.getMonth()+1,0).getDate();
  const goalMinutes=clamp(Number(options.dailyGoalMinutes)||120,1,1440);
  const goalSeconds=goalMinutes*60;
  const weekdayTotals=Array.from({length:7},(_,day)=>({day,seconds:0,sessions:0}));
  const hourTotals=Array.from({length:24},(_,hour)=>({hour,seconds:0,sessions:0}));
  const histogram=[0,0,0,0,0,0];
  const bins=[15,30,45,60,90,Infinity];
  for(const s of sessions){const d=new Date(s.startedAt),w=weekdayTotals[d.getDay()],h=hourTotals[d.getHours()];w.seconds+=s.duration;w.sessions++;h.seconds+=s.duration;h.sessions++;const min=s.duration/60;const index=bins.findIndex(max=>min<=max);histogram[index<0?5:index]++;}
  const weekdaySamples=weekdayTotals.filter(x=>x.sessions>0),hourSamples=hourTotals.filter(x=>x.sessions>0);
  const bestWeekday=weekdaySamples.sort((a,b)=>b.seconds-a.seconds)[0]||null;
  const bestHour=hourSamples.sort((a,b)=>b.seconds-a.seconds)[0]||null;
  const avgSession=sessions.length?allSeconds/sessions.length:0;
  const sorted=[...sessions].sort((a,b)=>b.duration-a.duration);
  const currentStreak=(()=>{let cursor=new Date(today);let count=0;const todayTotal=days7.at(-1)?.seconds||0;if(todayTotal<goalSeconds)cursor.setDate(cursor.getDate()-1);for(let i=0;i<366;i++){const found=days30.find(d=>d.date===keyOf(cursor));let seconds=found?.seconds||0;if(cursor<new Date(today.getTime()-29*DAY)){seconds=sessions.filter(s=>keyOf(s.startedAt)===keyOf(cursor)).reduce((n,s)=>n+s.duration,0);}if(seconds<goalSeconds)break;count++;cursor.setDate(cursor.getDate()-1);}return count;})();
  const yearHeatmap=totalsByDay(sessions,yearStart,yearDays).map(d=>({...d,level:d.seconds===0?0:d.seconds<1800?1:d.seconds<3600?2:d.seconds<7200?3:4,missing:d.date<keyOf(today)&&d.seconds===0,future:d.date>keyOf(today)}));
  const activeDays=yearHeatmap.filter(d=>d.seconds>0).length;
  const goalDays=days30.filter(d=>d.seconds>=goalSeconds).length;
  const consistency=days30.length?Math.round(goalDays/days30.length*100):0;
  const goalProbability=clamp(Math.round((dailyMean/Math.max(1,goalSeconds))*100),0,100);
  const predictions={weeklySeconds:Math.round(weeklyProjection),monthlySeconds:Math.round(monthProjection),dailyTargetProbability:goalProbability,trendPerDay:Math.round(trendPerDay),trendLabel:trendPerDay>30?"rising":trendPerDay< -30?"declining":"stable",isEstimate:true};
  const dna={consistency:Math.round(consistency),averageSessionSeconds:Math.round(avgSession),activeDays,sessionCount:sessions.length,preferredWeekday:bestWeekday?.day??null,preferredHour:bestHour?.hour??null,stability:Math.round(clamp(100-(Math.abs(trendPerDay)/Math.max(60,dailyMean))*100,0,100)),focusIntensity:Math.round(clamp(dailyMean/goalSeconds*100,0,200))};
  const recommendations=[];
  const add=(id,priority,reason,evidence,action)=>recommendations.push({id,priority,reason,evidence,action});
  if(sessions.length>=4&&predictions.trendLabel==="declining")add("decline","high","Your focus time is trending downward",`Recent daily trend: ${predictions.trendPerDay} seconds/day`,"Try one short, scheduled focus session today.");
  if(sessions.length>=3&&consistency<35)add("consistency","medium","Your daily target is being met inconsistently",`${goalDays} of the last ${days30.length} days reached your target`,"Set a smaller minimum session and build consistency.");
  if(weekSeconds<previous7&&previous7>0)add("weekly-drop","medium","This week is behind the previous seven days",`${Math.round(weekSeconds/60)} min vs ${Math.round(previous7/60)} min`,"Schedule one realistic session before the week ends.");
  if(Number(options.pendingTasks)>0)add("pending-tasks","medium","You still have unfinished tasks",`${Number(options.pendingTasks)} pending tasks recorded`,"Choose the nearest deadline or highest-priority task.");
  if(monthProjection>=Number(options.monthlyGoalMinutes||Infinity)*60&&Number.isFinite(Number(options.monthlyGoalMinutes)))add("goal-near","low","Your current pace is on track for the monthly goal",`Projected ${Math.round(monthProjection/60)} min this month`,"Keep your current routine steady.");
  if(!sessions.length)add("empty","low","Your productivity history is just getting started","No completed focus sessions are recorded yet","Complete your first focus session to unlock meaningful insights.");
  return {generatedAt:now.toISOString(),dataQuality:{validSessions:sessions.length,ignoredRecords:(Array.isArray(rawSessions)?rawSessions.length:0)-sessions.length},summary:{allSeconds,weekSeconds,previous7Seconds:previous7,monthSeconds,dailyMeanSeconds:Math.round(dailyMean),averageSessionSeconds:Math.round(avgSession),longestSessionSeconds:sorted[0]?.duration||0,sessionCount:sessions.length,goalDays,consistency,currentStreak},patterns:{bestWeekday,bestHour,weekdayTotals,hourTotals,histogram,histogramLabels:["0–15 min","16–30 min","31–45 min","46–60 min","61–90 min","90+ min"]},predictions,dna,heatmap:yearHeatmap,recommendations};
 }
 static filterSessions(rawSessions,filters={}){const sessions=safeSessions(rawSessions);const from=filters.from?validDate(filters.from):null;const to=filters.to?validDate(filters.to):null;const min=Number.isFinite(Number(filters.minMinutes))?Math.max(0,Number(filters.minMinutes))*60:0;const max=Number.isFinite(Number(filters.maxMinutes))?Math.max(0,Number(filters.maxMinutes))*60:Infinity;const query=String(filters.query||"").trim().toLowerCase();return sessions.filter(s=>(from===null||s.startedAt>=from)&&(to===null||s.startedAt<=to)&&s.duration>=min&&s.duration<=max&&(!query||s.subjectId.toLowerCase().includes(query)||s.id.toLowerCase().includes(query))).sort((a,b)=>b.startedAt-a.startedAt);}
 static csvRows(report){return [["date","focus_seconds"],...(report?.heatmap||[]).map(d=>[d.date,d.seconds])];}
}
