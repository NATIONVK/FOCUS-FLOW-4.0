import './styles.css';
import { Store } from './store.js';
import { FocusTimer } from './timer.js';
import { Analytics } from './analytics.js';
import { renderPDFPage, bindPDFPage } from './pdf-maker.js';

const $ = (s, root=document) => root.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = new Store();
let page = 'overview';
let timer = new FocusTimer(store, () => { if ($('#clock')) paintTimer(); });
let selectedSubject = store.data.subjects[0]?.id || '';
let taskFilter = 'all';
let plannerDay = new Date().getDay();
let dashboardCustomize = false;
let dashboardChartType = store.data.settings.dashboardChartType || 'bar';

function paintTimer() {
  const clock=$('#clock'); if(!clock)return;
  const elapsed=Math.floor(timer.elapsed());
  const hours=String(Math.floor(elapsed/3600)).padStart(2,'0');
  const minutes=String(Math.floor(elapsed%3600/60)).padStart(2,'0');
  const seconds=String(elapsed%60).padStart(2,'0');
  clock.innerHTML=`<span class="time-main">${hours}:${minutes}:</span><span class="time-seconds">${seconds}</span>`;
  $('#timerToggle')?.classList.toggle('paused',timer.paused);
  const scene=$('#blackholeScene');
  scene?.classList.toggle('is-paused',timer.paused);
  scene?.style.setProperty('--bh-energy',String(Math.min(1,0.25+elapsed/7200)));
  const level=Math.min(5,Math.floor(elapsed/600));
  scene?.setAttribute('data-focus-level',String(level+1));
  scene?.setAttribute('data-second-step',String(Math.floor((elapsed%60)/5)));
}
function fmt(seconds) {
  const n=Math.max(0,Math.floor(seconds));
  return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':');
}
function totals() {
  const sessions=store.data.sessions;
  const today=new Date().toDateString();
  const todaySec=sessions.filter(s=>new Date(s.startedAt).toDateString()===today).reduce((a,s)=>a+s.duration,0);
  return {today:todaySec,all:sessions.reduce((a,s)=>a+s.duration,0),count:sessions.length};
}
function nav() {
  return ['overview','dashboard','subjects','tasks','planner','notes','history','statistics','pdf-maker','settings'].map(p=>`<button class="nav-item ${page===p?'active':''}" data-page="${p}">${p==='pdf-maker'?'PDF Maker':p[0].toUpperCase()+p.slice(1)}</button>`).join('');
}
function toast(message,type='info'){let el=document.querySelector('#appToast');if(!el){el=document.createElement('div');el.id='appToast';el.className='app-toast';document.body.appendChild(el);}el.textContent=message;el.dataset.type=type;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600);}
function askText(title,placeholder,initial='',maxLength=300,multiline=false){return new Promise(resolve=>{const wrap=document.createElement('div');wrap.className='dialog-backdrop';const dialog=document.createElement('form');dialog.className='app-dialog';const heading=document.createElement('h3');heading.textContent=title;const input=document.createElement(multiline?'textarea':'input');input.className='dialog-input';input.placeholder=placeholder||'';input.value=initial||'';input.maxLength=maxLength;if(multiline)input.rows=7;input.setAttribute('aria-label',title);const actions=document.createElement('div');actions.className='dialog-actions';const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Cancel';const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Save';actions.append(cancel,save);dialog.append(heading,input,actions);wrap.append(dialog);document.body.append(wrap);input.focus();const close=v=>{wrap.remove();resolve(v)};cancel.onclick=()=>close(null);wrap.onclick=e=>{if(e.target===wrap)close(null)};dialog.onsubmit=e=>{e.preventDefault();close(input.value.trim())};});}
function askConfirm(message){return new Promise(resolve=>{const wrap=document.createElement('div');wrap.className='dialog-backdrop';const dialog=document.createElement('div');dialog.className='app-dialog';const h=document.createElement('h3');h.textContent='Are you sure?';const p=document.createElement('p');p.textContent=message;const actions=document.createElement('div');actions.className='dialog-actions';const no=document.createElement('button');no.className='secondary';no.textContent='Cancel';const yes=document.createElement('button');yes.className='primary';yes.textContent='Continue';actions.append(no,yes);dialog.append(h,p,actions);wrap.append(dialog);document.body.append(wrap);const close=v=>{wrap.remove();resolve(v)};no.onclick=()=>close(false);yes.onclick=()=>close(true);wrap.onclick=e=>{if(e.target===wrap)close(false)};});}
function mobileNav(){const primary=['overview','subjects','tasks','pdf-maker'];const extra=['dashboard','planner','notes','history','statistics','settings'];const labels={overview:'Home',dashboard:'Dashboard',subjects:'Subjects',tasks:'Tasks','pdf-maker':'PDF'};return primary.map(p=>'<button class="mobile-tab '+(page===p?'active':'')+'" data-page="'+p+'"><span>'+(labels[p]==='Home'?'⌂':labels[p]==='Subjects'?'◈':labels[p]==='Tasks'?'✓':labels[p]==='Dashboard'?'▥':'▤')+'</span><small>'+labels[p]+'</small></button>').join('')+'<button class="mobile-tab '+(extra.includes(page)?'active':'')+'" id="moreNavToggle"><span>•••</span><small>More</small></button><div class="mobile-more" id="mobileMore" hidden>'+extra.map(p=>'<button data-page="'+p+'">'+p[0].toUpperCase()+p.slice(1)+'</button>').join('')+'</div>';}
function render() {
  const t=totals(), subjects=store.data.subjects;
  $('#app').innerHTML=`
  <div class="shell">
    <aside class="sidebar"><div class="brand"><img class="brand-logo" src="./icon.svg" alt="FOCUS FLOW logo"><div>FOCUS <b>FLOW</b><small>YOUR SPACE TO GROW</small></div></div>
      <nav>${nav()}</nav><div class="side-foot"><i class="online-dot"></i> OFFLINE FIRST<br><small>NATIONVK · FOCUS FLOW 5.0</small></div></aside><nav class="mobile-nav">${mobileNav()}</nav>
    <main class="main">
      <header class="topbar"><div><span class="eyebrow">YOUR PERSONAL STUDY OS</span><h1>${page==='overview'?'Overview':page==='dashboard'?'Dashboard':page==='pdf-maker'?'PDF Maker':page[0].toUpperCase()+page.slice(1)}</h1></div><div class="status"><i></i> Local data secured</div></header>
      ${page==='overview'?overview(t,subjects):page==='dashboard'?dashboardPage(t,subjects):page==='subjects'?subjectPage(subjects):page==='tasks'?taskPage():page==='planner'?plannerPage():page==='notes'?notesPage():page==='history'?historyPage():page==='statistics'?statisticsPage():page==='pdf-maker'?renderPDFPage():settingsPage()}
    </main>
  </div>`;
  if(page==='overview') applyDashboardLayout();
  bind();
}
const DASH_WIDGETS=[['hero','Welcome'],['kpis','Quick stats'],['week','Weekly focus & plan'],['month','Monthly progress'],['insights','Smart insights'],['lower','Subjects & tasks'],['recent','Recent sessions']];
function applyDashboardLayout(){
  const main=$('.main');if(!main)return;
  const widgets=[...main.querySelectorAll('[data-dashboard-widget]')];
  const settings=store.data.settings.dashboardLayout||{order:[],hidden:[]};
  const order=[...settings.order.filter(id=>DASH_WIDGETS.some(x=>x[0]===id)),...DASH_WIDGETS.map(x=>x[0]).filter(id=>!settings.order.includes(id))];
  order.forEach(id=>{const el=widgets.find(x=>x.dataset.dashboardWidget===id);if(el)main.appendChild(el);});
  const hidden=new Set(settings.hidden||[]);
  widgets.forEach(el=>{el.hidden=hidden.has(el.dataset.dashboardWidget);});
  const toolbar=document.createElement('section');toolbar.className='dash-custom-toolbar';
  toolbar.innerHTML='<div><b>Dashboard layout</b><small>Arrange your cards and hide the ones you do not need.</small></div><button class="dash-custom-toggle" id="customizeDashboard">'+(dashboardCustomize?'Done':'Customize')+'</button>';
  if(dashboardCustomize){
    const restore=document.createElement('div');restore.className='dash-restore-list';
    (settings.hidden||[]).forEach(id=>{const item=DASH_WIDGETS.find(x=>x[0]===id);if(item){const b=document.createElement('button');b.className='dash-restore-btn';b.dataset.restoreWidget=id;b.textContent='+ '+item[1];restore.appendChild(b);}});
    toolbar.appendChild(restore);
    widgets.forEach(el=>{
      if(hidden.has(el.dataset.dashboardWidget))return;
      const id=el.dataset.dashboardWidget;const title=DASH_WIDGETS.find(x=>x[0]===id)?.[1]||id;
      const controls=document.createElement('div');controls.className='dash-widget-controls';
      controls.innerHTML='<span>'+title+'</span><button type="button" data-dash-move="-1" aria-label="Move '+title+' up">↑</button><button type="button" data-dash-move="1" aria-label="Move '+title+' down">↓</button><button type="button" data-dash-hide="'+id+'">Hide</button>';
      el.prepend(controls);
    });
  }
  const header=main.querySelector('.topbar');header?.after(toolbar);
}
function saveDashboardLayout(order,hidden){store.setDashboardLayout({order,hidden});}
function overview(t,subjects) {
  const sessions=store.data.sessions;
  const week=Analytics.weekly(sessions);
  const goal=Math.max(1,Number(store.data.settings.dailyGoalMinutes)||120)*60;
  const progress=Math.min(100,Math.round(t.today/goal*100));
  const remaining=Math.max(0,goal-t.today);
  const streak=Analytics.streak(sessions,goal/60);
  const today=new Date();
  const todayKey=today.toDateString();
  const todayTasks=store.data.tasks.filter(x=>!x.done);
  const overdue=todayTasks.filter(x=>x.dueDate&&x.dueDate<Analytics.dateKey(today));
  const completed=store.data.tasks.filter(x=>x.done).length;
  const todayPlans=(store.data.plans||[]).filter(p=>p.weekday===today.getDay());
  const plannedMinutes=todayPlans.reduce((n,p)=>n+p.minutes,0);
  const actualPlanned=todayPlans.length?sessions.filter(s=>new Date(s.startedAt).toDateString()===todayKey&&todayPlans.some(p=>p.subjectId===s.subjectId)).reduce((n,s)=>n+s.duration,0):0;
  const planProgress=plannedMinutes?Math.min(100,Math.round(actualPlanned/(plannedMinutes*60)*100)):0;
  const subjectStats=subjects.map(s=>({subject:s,seconds:Analytics.subjectSeconds(sessions,s.id)})).sort((a,b)=>b.seconds-a.seconds);
  const topSubject=subjectStats[0];
  const maxSubject=Math.max(1,...subjectStats.map(x=>x.seconds));
  const weekTotal=week.reduce((n,d)=>n+d.seconds,0);
  const goalDays=week.filter(d=>d.seconds>=goal).length;
  const monthDays=Analytics.monthlyDays(sessions,today.getFullYear(),today.getMonth(),today);
  const monthTotal=Analytics.monthly(sessions,today.getFullYear(),today.getMonth());
  const monthTarget=goal*monthDays.length;
  const monthProgress=monthTarget?Math.min(100,Math.round(monthTotal/monthTarget*100)):0;
  const monthConsistency=Analytics.consistency(sessions,goal/60,today);
  const monthStartOffset=new Date(today.getFullYear(),today.getMonth(),1).getDay();
  const activeDays=week.filter(d=>d.seconds>0).length;
  const timeBuckets=[{label:'Morning',range:'05:00–11:59',test:h=>h>=5&&h<12,seconds:0},{label:'Afternoon',range:'12:00–16:59',test:h=>h>=12&&h<17,seconds:0},{label:'Evening',range:'17:00–21:59',test:h=>h>=17&&h<22,seconds:0},{label:'Night',range:'22:00–04:59',test:h=>h>=22||h<5,seconds:0}];
  sessions.forEach(s=>{const hour=new Date(s.startedAt).getHours();const bucket=timeBuckets.find(x=>x.test(hour));if(bucket)bucket.seconds+=Math.max(0,Number(s.duration)||0);});
  const bestPeriod=[...timeBuckets].sort((a,b)=>b.seconds-a.seconds)[0];
  const hasTimePattern=bestPeriod?.seconds>0;
  const subjectShare=topSubject&&t.all?Math.round(topSubject.seconds/t.all*100):0;
  const bestDay=week.reduce((a,b)=>b.seconds>a.seconds?b:a,week[0]||{label:'—',seconds:0});
  const recent=[...sessions].sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt)).slice(0,3);
  const taskPriorityRank={high:0,medium:1,low:2};
  const nextTasks=[...todayTasks].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')||(taskPriorityRank[a.priority||'medium']-taskPriorityRank[b.priority||'medium'])||a.title.localeCompare(b.title)).slice(0,4);
  const greeting=today.getHours()<12?'Good morning':today.getHours()<17?'Good afternoon':'Good evening';
  return `
  <section class="dash-hero" data-dashboard-widget="hero">
    <div class="dash-hero-copy"><span class="eyebrow">YOUR PERSONAL STUDY OS · ${today.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</span><h2>${greeting}. <em>Ready to focus?</em></h2><p>Small, consistent sessions build remarkable progress. Make this session count.</p>
      <div class="dash-actions"><button class="primary" id="startFocus">▶ Start focus session</button><button class="dash-secondary" data-page="planner">View today's plan ↗</button></div>
      <div class="dash-hero-meta"><span><i class="online-dot"></i> Offline-first · Your data stays on this device</span><span>🔥 ${streak} day streak</span></div>
    </div>
    <div class="dash-goal-ring" role="progressbar" aria-label="Daily focus goal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-valuetext="${progress}% of daily goal; ${fmt(t.today)} focused" style="--goal-progress:${progress}%"><div><strong>${progress}%</strong><small>DAILY GOAL</small><span>${fmt(remaining)} left</span></div></div>
  </section>
  <section class="dash-kpis" data-dashboard-widget="kpis">
    <article class="dash-kpi"><span class="kpi-icon violet">◷</span><div><small>FOCUS TODAY</small><strong>${(t.today/3600).toFixed(1)} <i>hrs</i></strong><span>${fmt(t.today)} focused</span></div></article>
    <article class="dash-kpi"><span class="kpi-icon mint">◎</span><div><small>THIS WEEK</small><strong>${(weekTotal/3600).toFixed(1)} <i>hrs</i></strong><span>Last 7 days</span></div></article>
    <article class="dash-kpi"><span class="kpi-icon amber">✓</span><div><small>TASKS LEFT</small><strong>${todayTasks.length}</strong><span>${overdue.length?overdue.length+' overdue':'Stay on track'}</span></div></article>
    <article class="dash-kpi"><span class="kpi-icon blue">✦</span><div><small>ALL-TIME SESSIONS</small><strong>${t.count}</strong><span>${(t.all/3600).toFixed(1)} total hours</span></div></article>
  </section>
  <section class="dash-main-grid" data-dashboard-widget="week">
    <article class="panel dash-week-panel"><div class="panel-head"><div><span class="eyebrow">CONSISTENCY TRACKER</span><h3>Your focus rhythm</h3></div><span class="dash-period">LAST 7 DAYS</span></div>
      <div class="dash-week-summary"><div><strong>${(weekTotal/3600).toFixed(1)}h</strong><small>Total focused this week</small></div><div><strong>${(weekTotal/7/3600).toFixed(1)}h</strong><small>Daily average</small></div><div><strong>${goalDays}/7</strong><small>Daily goals met</small></div><div><strong>${bestDay.seconds?bestDay.label:'—'}</strong><small>Most productive day</small></div></div>
      <div class="dash-chart" role="img" aria-label="Daily focus hours: ${week.map(d=>`${d.label} ${(d.seconds/3600).toFixed(1)} hours`).join(", ")}">${week.map(d=>{const h=(d.seconds/3600).toFixed(1);const height=d.seconds?Math.max(5,Math.round(d.seconds/Math.max(1,...week.map(x=>x.seconds))*100)):0;return `<div class="dash-chart-col"><span class="dash-chart-value">${h==='0.0'?'':h+'h'}</span><div class="dash-chart-track ${d.seconds>=goal?'goal-met':''}"><i style="height:${height}%"></i></div><small>${d.label}</small></div>`}).join('')}</div>
      <div class="dash-chart-foot"><span><i></i> Daily focus time · ${activeDays}/7 active days</span><button class="text-btn" data-page="statistics">Full analytics ↗</button></div>
    </article>
    <article class="panel dash-plan-panel"><div class="panel-head"><div><span class="eyebrow">TODAY'S ROADMAP</span><h3>Study plan</h3></div><button class="text-btn" data-page="planner">Manage ↗</button></div>
      ${todayPlans.length?`<div class="dash-plan-progress"><div><b>${fmt(actualPlanned)}</b><span> / ${fmt(plannedMinutes*60)} planned</span><strong>${planProgress}%</strong></div><div class="progress-track" role="progressbar" aria-label="Today study plan progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${planProgress}"><i style="width:${planProgress}%"></i></div></div><div class="dash-plan-list">${todayPlans.slice(0,4).map(p=>{const s=subjects.find(x=>x.id===p.subjectId);return `<div class="dash-plan-item"><i style="background:${esc(s?.color||'#8b7cff')}"></i><span>${esc(store.subjectName(p.subjectId))}</span><b>${p.minutes}m</b><button data-start-plan="${p.id}" aria-label="Start ${esc(store.subjectName(p.subjectId))}">Start</button></div>`}).join('')}</div>`:'<div class="dash-empty"><span>◷</span><b>No study blocks planned</b><small>Give your day a simple structure.</small><button class="primary" data-page="planner">Create today’s plan</button></div>'}
    </article>
  </section>
  <section class="panel dash-month-panel" data-dashboard-widget="month">
    <div class="panel-head"><div><span class="eyebrow">MONTHLY PERFORMANCE</span><h3>${today.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h3></div><span class="dash-period">${monthDays.length} DAYS ELAPSED</span></div>
    <div class="dash-month-metrics">
      <div><strong>${(monthTotal/3600).toFixed(1)}h</strong><small>Focused this month</small></div>
      <div><strong>${monthProgress}%</strong><small>Monthly goal progress</small></div>
      <div><strong>${monthConsistency.score}/100</strong><small>Consistency score</small></div>
    </div>
    <div class="dash-month-track" role="progressbar" aria-label="Monthly focus goal progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${monthProgress}"><i style="width:${monthProgress}%"></i></div>
    <div class="dash-heatmap-head"><b>Study calendar</b><span>Gold = daily goal reached</span></div>
    <div class="dash-heatmap" role="img" aria-label="Monthly study calendar. ${monthConsistency.met} of ${monthConsistency.elapsed} elapsed days met the daily goal.">${[...Array(monthStartOffset).fill(null),...monthDays].map(d=>d?`<span class="dash-heat-cell ${d.seconds>=goal?'met':d.seconds>0?'partial':'empty'}" title="${d.key}: ${fmt(d.seconds)} focused" aria-label="${d.key}: ${fmt(d.seconds)} focused">${d.day}</span>`:`<span class="dash-heat-cell blank" aria-hidden="true"></span>`).join('')}</div>
    <p class="dash-insight-note">${monthConsistency.met} goal days out of ${monthConsistency.elapsed} elapsed days this month. Score = goal days ÷ elapsed days; it updates as the month progresses.</p>
  </section>
  <section class="panel dash-insights-panel" data-dashboard-widget="insights">
    <div class="panel-head"><div><span class="eyebrow">YOUR STUDY PATTERNS</span><h3>Smart productivity insights</h3></div><span class="dash-period">BASED ON YOUR SESSIONS</span></div>
    <div class="dash-insights-grid">
      <div class="dash-insight-card"><span class="dash-insight-icon">◷</span><small>YOUR PEAK PERIOD</small><strong>${hasTimePattern?bestPeriod.label:'Not enough data'}</strong><span>${hasTimePattern?bestPeriod.range+' · '+(bestPeriod.seconds/3600).toFixed(1)+'h recorded':'Complete sessions to discover your strongest time'}</span></div>
      <div class="dash-insight-card"><span class="dash-insight-icon">✦</span><small>TOP SUBJECT</small><strong>${topSubject&&topSubject.seconds?esc(topSubject.subject.name):'No sessions yet'}</strong><span>${topSubject&&topSubject.seconds?subjectShare+'% of all recorded focus time':'Start a session to build your subject profile'}</span></div>
      <div class="dash-insight-card"><span class="dash-insight-icon">▥</span><small>AVERAGE ON ACTIVE DAYS</small><strong>${activeDays?(weekTotal/activeDays/3600).toFixed(1)+'h':'—'}</strong><span>${activeDays?activeDays+' active days in the last 7':'No focus time recorded this week'}</span></div>
    </div>
    <p class="dash-insight-note">Insights use your saved session start times and durations on this device. They describe your recorded history, not a prediction.</p>
  </section>
  <section class="dash-lower-grid" data-dashboard-widget="lower">
    <article class="panel"><div class="panel-head"><div><span class="eyebrow">YOUR LEARNING AREAS</span><h3>Subject breakdown</h3></div><button class="text-btn" data-page="subjects">All subjects ↗</button></div>
      <div class="dash-subject-list">${subjectStats.slice(0,5).map(({subject,seconds})=>`<div class="dash-subject"><div class="dash-subject-heading"><span><i style="background:${esc(subject.color)}"></i><b>${esc(subject.name)}</b></span><strong>${(seconds/3600).toFixed(1)}h</strong></div><div class="progress-track" role="progressbar" aria-label="${esc(subject.name)} focus share" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(seconds/maxSubject*100)}"><i style="width:${Math.round(seconds/maxSubject*100)}%;background:${esc(subject.color)}"></i></div></div>`).join('')||'<p class="muted">Add a subject to see your learning breakdown.</p>'}</div>
      ${topSubject&&topSubject.seconds?'<div class="dash-insight">✦ Most studied: <b>'+esc(topSubject.subject.name)+'</b> · '+(topSubject.seconds/3600).toFixed(1)+' hours recorded</div>':''}
    </article>
    <article class="panel"><div class="panel-head"><div><span class="eyebrow">STAY IN CONTROL</span><h3>Task priorities</h3></div><button class="text-btn" data-page="tasks">View all ↗</button></div>
      <div class="dash-task-summary"><div><strong>${todayTasks.length}</strong><small>Remaining</small></div><div><strong>${completed}</strong><small>Completed</small></div><div><strong>${overdue.length}</strong><small>Overdue</small></div></div>
      <div class="dash-task-list">${nextTasks.map(x=>`<label class="dash-task-row"><input type="checkbox" data-task="${x.id}"><span>${esc(x.title)}<small>${x.dueDate?'Due '+new Date(x.dueDate+'T00:00:00').toLocaleDateString():'No deadline'}</small></span><i class="priority ${x.priority||'medium'}">${(x.priority||'medium').toUpperCase()}</i></label>`).join('')||'<p class="muted">You are all caught up. Add a task when you need one.</p>'}</div>
      <button class="dash-add-task" id="addTask">＋ Add a task</button>
    </article>
  </section>
  <section class="panel dash-recent-panel" data-dashboard-widget="recent"><div class="panel-head"><div><span class="eyebrow">YOUR RECENT WINS</span><h3>Latest focus sessions</h3></div><button class="text-btn" data-page="history">Study history ↗</button></div>
    <div class="dash-recent-list">${recent.map(s=>`<div class="dash-recent-row"><span class="dash-recent-icon">◷</span><div><b>${esc(store.subjectName(s.subjectId))}</b><small>${new Date(s.startedAt).toLocaleString()}</small></div><strong>${fmt(s.duration)}</strong></div>`).join('')||'<p class="muted">Your completed focus sessions will appear here.</p>'}</div>
  </section>`;
}
function dashboardPage(t,subjects){
  const sessions=store.data.sessions,week=Analytics.weekly(sessions),total=week.reduce((n,d)=>n+d.seconds,0);
  const taskTotal=store.data.tasks.length,taskDone=store.data.tasks.filter(x=>x.done).length,taskPct=taskTotal?Math.round(taskDone/taskTotal*100):0;
  const subjectData=subjects.map(sub=>({name:sub.name,color:sub.color,seconds:Analytics.subjectSeconds(sessions,sub.id)})).filter(x=>x.seconds>0).sort((a,b)=>b.seconds-a.seconds);
  const max=Math.max(1,...week.map(x=>x.seconds));
  const points=week.map((d,i)=>({x:40+i*85,y:170-(d.seconds/max)*125,label:d.label,value:d.seconds}));
  const line=points.map((p,i)=>(i?'L':'M')+` ${p.x} ${p.y}`).join(' ');
  const pieTotal=Math.max(1,subjectData.reduce((n,x)=>n+x.seconds,0));let pieAt=0;
  const pieStops=subjectData.map(x=>{const from=pieAt;pieAt+=x.seconds/pieTotal*100;return `${x.color} ${from}% ${pieAt}%`;}).join(',');
  const chart=dashboardChartType==='pie'
    ? `<div class="dash-pie-layout"><div class="dash-pie" style="background:conic-gradient(${pieStops||'#34394b 0 100%'})"></div><div class="dash-pie-legend">${subjectData.map(x=>`<div><i style="background:${esc(x.color)}"></i><span>${esc(x.name)}</span><b>${(x.seconds/3600).toFixed(1)}h</b></div>`).join('')||'<small class="muted">No subject sessions yet</small>'}</div></div>`
    : dashboardChartType==='line'||dashboardChartType==='area'
      ? `<svg class="dashboard-svg" viewBox="0 0 640 210" role="img" aria-label="Daily focus time line chart">${[45,85,125,165].map(y=>`<line x1="30" y1="${y}" x2="620" y2="${y}" class="chart-gridline"/>`).join('')}${dashboardChartType==='area'?`<path d="${line} L 550 180 L 40 180 Z" class="chart-area"/>`:''}<path d="${line}" class="chart-line"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-point"><title>${p.label}: ${(p.value/3600).toFixed(2)} hours</title></circle><text x="${p.x}" y="202" text-anchor="middle" class="chart-label">${p.label}</text>`).join('')}</svg>`
      : `<div class="dashboard-bars">${week.map(d=>`<div class="dashboard-bar-col"><b>${d.seconds?(d.seconds/3600).toFixed(1)+'h':''}</b><div><i style="height:${Math.max(3,d.seconds/max*100)}%"></i></div><small>${d.label}</small></div>`).join('')}</div>`;
  return `<section class="dash-hero dashboard-hero"><div class="dash-hero-copy"><span class="eyebrow">FOCUS FLOW ANALYTICS</span><h2>Your <em>Dashboard.</em></h2><p>A dedicated view of your focus patterns, subject distribution and task completion.</p><div class="dash-hero-meta"><span>Updated from your on-device records</span></div></div><div class="dash-goal-ring" style="--goal-progress:${taskPct}%" role="progressbar" aria-valuenow="${taskPct}" aria-valuemin="0" aria-valuemax="100"><div><strong>${taskPct}%</strong><small>TASKS DONE</small><span>${taskDone}/${taskTotal} tasks</span></div></div></section>
  <section class="dash-kpis"><article class="dash-kpi"><span class="kpi-icon violet">◷</span><div><small>FOCUS TODAY</small><strong>${(t.today/3600).toFixed(1)} <i>hrs</i></strong><span>${fmt(t.today)}</span></div></article><article class="dash-kpi"><span class="kpi-icon mint">◎</span><div><small>LAST 7 DAYS</small><strong>${(total/3600).toFixed(1)} <i>hrs</i></strong><span>Weekly focus time</span></div></article><article class="dash-kpi"><span class="kpi-icon amber">✓</span><div><small>TASK COMPLETION</small><strong>${taskPct}%</strong><span>${taskDone} completed · ${taskTotal-taskDone} left</span></div></article><article class="dash-kpi"><span class="kpi-icon blue">✦</span><div><small>SESSIONS</small><strong>${t.count}</strong><span>${(t.all/3600).toFixed(1)} total hours</span></div></article></section>
  <section class="panel dashboard-chart-panel"><div class="panel-head"><div><span class="eyebrow">VISUAL ANALYTICS</span><h3>Charts & performance</h3></div><select id="dashboardChartType" class="chart-select"><option value="bar" ${dashboardChartType==='bar'?'selected':''}>Bar chart</option><option value="line" ${dashboardChartType==='line'?'selected':''}>Line chart</option><option value="area" ${dashboardChartType==='area'?'selected':''}>Area chart</option><option value="pie" ${dashboardChartType==='pie'?'selected':''}>Pie chart · Subjects</option></select></div><p class="muted">Weekly focus trend and subject-wise time distribution.</p>${chart}</section>
  <section class="panel dashboard-task-panel"><div class="panel-head"><div><span class="eyebrow">GOALS IN MOTION</span><h3>Task completion</h3></div><button class="text-btn" data-page="tasks">Manage tasks ↗</button></div><div class="task-progress-head"><span>${taskDone} completed out of ${taskTotal}</span><b>${taskPct}%</b></div><div class="progress-track task-progress"><i style="width:${taskPct}%"></i></div><div class="dashboard-task-breakdown"><span>Completed <b>${taskDone}</b></span><span>Remaining <b>${taskTotal-taskDone}</b></span></div></section>`;
}
function subjectPage(subjects) {return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">ORGANIZE YOUR LEARNING</span><h3>Subjects</h3></div><button class="primary" id="addSubject">+ New subject</button></div><div class="subject-cards">${subjects.map(s=>`<article class="subject-card"><span class="dot" style="background:${esc(s.color)}"></span><h3>${esc(s.name)}</h3><p>${(Analytics.subjectSeconds(store.data.sessions,s.id)/3600).toFixed(2)} hours focused</p><button class="text-btn" data-edit-subject="${s.id}">Edit</button><button class="text-btn" data-delete-subject="${s.id}">Delete</button></article>`).join('')||'<p class="muted">No subjects yet.</p>'}</div></section>`;}
function taskPage(){
  const tasks=store.data.tasks.filter(x=>taskFilter==='all'||(taskFilter==='active'&&!x.done)||(taskFilter==='done'&&x.done)||(taskFilter==='overdue'&&!x.done&&x.dueDate&&x.dueDate<Analytics.dateKey(new Date())));
  const rank={high:0,medium:1,low:2};
  tasks.sort((a,b)=>(a.done-b.done)||((a.dueDate||'9999').localeCompare(b.dueDate||'9999'))||(rank[a.priority||'medium']-rank[b.priority||'medium']));
  const today=Analytics.dateKey(new Date());
  const progressOf=t=>{const subs=t.subtasks||[];return subs.length?Math.round(subs.filter(x=>x.done).length/subs.length*100):(t.done?100:0)};
  return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">MAKE IT HAPPEN</span><h3>Tasks <small class="task-count">${store.data.tasks.filter(x=>!x.done).length} remaining</small></h3></div><button class="primary" id="addTask">+ Add task</button></div><div class="task-toolbar"><label for="taskFilter">Show tasks</label><select id="taskFilter"><option value="all" ${taskFilter==='all'?'selected':''}>All tasks</option><option value="active" ${taskFilter==='active'?'selected':''}>Active</option><option value="done" ${taskFilter==='done'?'selected':''}>Completed</option><option value="overdue" ${taskFilter==='overdue'?'selected':''}>Overdue</option></select></div><div class="task-list">${tasks.map(x=>{const due=x.dueDate?new Date(x.dueDate+'T00:00:00').toLocaleDateString():'';const overdue=!x.done&&x.dueDate&&x.dueDate<today;const subs=x.subtasks||[];const pct=progressOf(x);return `<article class="task task-card"><div class="task-main"><label><input type="checkbox" data-task="${x.id}" ${x.done?'checked':''}><span class="${x.done?'done':''}">${esc(x.title)}<small class="task-meta"><i class="priority ${x.priority||'medium'}">${(x.priority||'medium').toUpperCase()}</i>${due?'<i class="due '+(overdue?'overdue':'')+'">'+(overdue?'Overdue · ':'Due · ')+due+'</i>':'<i class="due">No deadline</i>'}</small></span></label><div class="task-actions"><button class="text-btn" data-add-subtask="${x.id}">+ Sub-task</button><button class="text-btn" data-edit-task="${x.id}">Edit</button><button class="text-btn" data-delete-task="${x.id}">Delete</button></div></div><div class="task-progress-head"><span>Progress ${subs.length?'· '+subs.filter(st=>st.done).length+'/'+subs.length+' subtasks':''}</span><b>${pct}%</b></div><div class="progress-track task-progress"><i style="width:${pct}%"></i></div>${subs.length?`<div class="subtask-list">${subs.map(st=>`<div class="subtask-row"><label><input type="checkbox" data-subtask-task="${x.id}" data-subtask="${st.id}" ${st.done?'checked':''}><span class="${st.done?'done':''}">${esc(st.title)}</span></label><button type="button" class="text-btn subtask-delete" data-delete-subtask-task="${x.id}" data-delete-subtask="${st.id}" aria-label="Delete sub-task">×</button></div>`).join('')}</div>`:''}</article>`}).join('')||'<p class="muted">No tasks in this view. Add a task or change the filter.</p>'}</div></section>`;
}
function askTaskForm(task=null){return new Promise(resolve=>{const wrap=document.createElement('div');wrap.className='dialog-backdrop';const form=document.createElement('form');form.className='app-dialog task-dialog';const title=document.createElement('h3');title.textContent=task?'Edit task':'Create task';const name=document.createElement('input');name.className='dialog-input';name.placeholder='What do you want to finish?';name.maxLength=300;name.required=true;name.value=task?.title||'';name.setAttribute('aria-label','Task title');const priorityLabel=document.createElement('label');priorityLabel.textContent='Priority';const priority=document.createElement('select');priority.className='dialog-input';priority.setAttribute('aria-label','Priority');[['low','Low'],['medium','Medium'],['high','High']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;priority.append(o)});priority.value=task?.priority||'medium';const dateLabel=document.createElement('label');dateLabel.textContent='Due date (optional)';const date=document.createElement('input');date.type='date';date.className='dialog-input';date.value=task?.dueDate||'';date.setAttribute('aria-label','Due date');const actions=document.createElement('div');actions.className='dialog-actions';const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Cancel';const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=task?'Update task':'Add task';actions.append(cancel,save);form.append(title,name,priorityLabel,priority,dateLabel,date,actions);wrap.append(form);document.body.append(wrap);name.focus();const close=v=>{wrap.remove();resolve(v)};cancel.onclick=()=>close(null);wrap.onclick=e=>{if(e.target===wrap)close(null)};form.onsubmit=e=>{e.preventDefault();close({title:name.value.trim(),priority:priority.value,dueDate:date.value})};});}
const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function plannerPage(){
 const selected=plannerDay;
 const plans=(store.data.plans||[]).filter(p=>p.weekday===selected);
 const today=new Date().getDay();
 const planned=plans.reduce((n,p)=>n+p.minutes,0);
 const todayKey=new Date().toDateString();
 const actual=selected===today?store.data.sessions.filter(s=>new Date(s.startedAt).toDateString()===todayKey&&plans.some(p=>p.subjectId===s.subjectId)).reduce((n,s)=>n+s.duration,0):0;
 const progress=planned?Math.min(100,Math.round(actual/(planned*60)*100)):0;
 return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">PLAN YOUR WEEK</span><h3>Weekly study planner</h3></div><button class="primary" id="addPlan">+ Add study block</button></div><div class="planner-days">${WEEKDAYS.map((d,i)=>`<button class="planner-day ${selected===i?'active':''} ${today===i?'today':''}" data-planner-day="${i}"><b>${d.slice(0,3)}</b><small>${(store.data.plans||[]).filter(p=>p.weekday===i).length} blocks</small></button>`).join('')}</div><div class="planner-summary"><b>${WEEKDAYS[selected]}</b><span>${planned>=60?(planned/60).toFixed(1)+' hours':planned+' minutes'} planned</span></div>${selected===today&&planned?`<div class="planner-progress"><div><b>Today's planned focus</b><strong>${fmt(actual)} / ${fmt(planned*60)} · ${progress}%</strong></div><div class="progress-track"><i style="width:${progress}%"></i></div></div>`:''}<div class="planner-list">${plans.map(p=>`<article class="planner-item"><span class="dot" style="background:${esc(store.data.subjects.find(s=>s.id===p.subjectId)?.color||'#8b7cff')}"></span><div><b>${esc(store.subjectName(p.subjectId))}</b><small>${p.minutes} minutes</small></div><div class="task-actions"><button class="text-btn" data-start-plan="${p.id}">Start</button><button class="text-btn" data-edit-plan="${p.id}">Edit</button><button class="text-btn" data-delete-plan="${p.id}">Remove</button></div></article>`).join('')||'<p class="muted">No study blocks planned for this day. Add one to build your routine.</p>'}</div></section>`;
}
function askPlanForm(plan=null){return new Promise(resolve=>{const wrap=document.createElement('div');wrap.className='dialog-backdrop';const form=document.createElement('form');form.className='app-dialog task-dialog';const h=document.createElement('h3');h.textContent=plan?'Edit study block':'Add study block';const makeSelect=(label,options,value)=>{const l=document.createElement('label');l.textContent=label;const s=document.createElement('select');s.className='dialog-input';options.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o)});s.value=String(value);form.append(l,s);return s};const day=makeSelect('Weekday',WEEKDAYS.map((d,i)=>[i,d]),plan?.weekday??plannerDay);const subject=makeSelect('Subject',store.data.subjects.map(s=>[s.id,s.name]),plan?.subjectId??store.data.subjects[0]?.id);const l=document.createElement('label');l.textContent='Target duration (minutes)';const mins=document.createElement('input');mins.type='number';mins.min='5';mins.max='1440';mins.step='5';mins.required=true;mins.value=plan?.minutes??60;mins.className='dialog-input';form.append(l,mins);const actions=document.createElement('div');actions.className='dialog-actions';const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Cancel';const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=plan?'Update':'Add block';actions.append(cancel,save);form.prepend(h);form.append(actions);wrap.append(form);document.body.append(wrap);mins.focus();const close=v=>{wrap.remove();resolve(v)};cancel.onclick=()=>close(null);wrap.onclick=e=>{if(e.target===wrap)close(null)};form.onsubmit=e=>{e.preventDefault();close({weekday:Number(day.value),subjectId:subject.value,minutes:Number(mins.value)})};});}
function notesPage(){return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">THINK. CAPTURE. REMEMBER.</span><h3>Notes</h3></div><button class="primary" id="addNote">+ New note</button></div><div class="note-list">${store.data.notes.map(n=>`<article class="note"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><small>${new Date(n.updatedAt).toLocaleString()}</small><div class="row-actions"><button class="text-btn" data-edit-note="${n.id}">Edit</button><button class="text-btn" data-delete-note="${n.id}">Delete</button></div></article>`).join('')||'<p class="muted">No notes saved yet.</p>'}</div></section>`;}
function historyPage(){return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">EVERY MINUTE COUNTS</span><h3>Study history</h3></div><button class="primary" id="exportData">Export backup</button></div><div class="history-list">${[...store.data.sessions].reverse().map(s=>`<div class="history-row"><div><b>${esc(store.subjectName(s.subjectId))}</b><small>${new Date(s.startedAt).toLocaleString()}</small></div><strong>${fmt(s.duration)}</strong><button class="text-btn" data-delete-session="${s.id}">Delete</button></div>`).join('')||'<p class="muted">Completed sessions will appear here.</p>'}</div></section>`;}
function statisticsPage(){const sessions=store.data.sessions;const month=Analytics.monthly(sessions);const week=Analytics.weekly(sessions);const total=sessions.reduce((n,s)=>n+s.duration,0);return `<section class="stats"><article class="stat"><span>THIS MONTH</span><strong>${(month/3600).toFixed(1)}<small> hrs</small></strong></article><article class="stat"><span>ALL-TIME FOCUS</span><strong>${(total/3600).toFixed(1)}<small> hrs</small></strong></article><article class="stat"><span>COMPLETED SESSIONS</span><strong>${sessions.length}</strong></article><article class="stat"><span>AVERAGE SESSION</span><strong>${sessions.length?(total/sessions.length/60).toFixed(0):0}<small> min</small></strong></article></section><section class="panel"><div class="panel-head"><div><span class="eyebrow">CONSISTENCY</span><h3>Last 7 days</h3></div></div><div class="bars">${week.map(d=>`<div class="bar-wrap"><div class="bar" title="${fmt(d.seconds)}" style="height:${Math.max(4,Math.min(100,d.seconds/3600*12))}%"></div><small>${d.label}</small></div>`).join('')}</div></section><section class="panel"><span class="eyebrow">WHERE YOUR TIME GOES</span><h3>Subject breakdown</h3><div class="subject-list">${store.data.subjects.map(s=>`<div class="subject-row"><span class="dot" style="background:${esc(s.color)}"></span><b>${esc(s.name)}</b><span>${(Analytics.subjectSeconds(sessions,s.id)/3600).toFixed(2)}h</span></div>`).join('')||'<p class="muted">No subjects yet.</p>'}</div></section>`;}
function settingsPage(){return `<section class="panel"><span class="eyebrow">YOUR DATA, YOUR CONTROL</span><h3>Settings & backup</h3><p class="muted">Your records are stored locally on this device. Export a backup before changing or reinstalling the app.</p><div class="goal-setting"><label for="dailyGoalSelect">Daily study target</label><select id="dailyGoalSelect">${[30,45,60,90,120,150,180,240,300,360,480].map(n=>`<option value="${n}" ${Number(store.data.settings.dailyGoalMinutes)===n?"selected":""}>${n<60?n+" minutes":n/60+" hour"+(n===60?"":"s")}</option>`).join("")}</select><small class="muted">Your dashboard progress and goal streak use this target.</small></div><div class="settings-actions"><button class="primary" id="exportData">Export JSON backup</button><label class="secondary upload">Import backup<input id="importData" type="file" accept="application/json"></label><button class="secondary" id="toggleTheme">Toggle appearance</button></div><p class="muted">Language preference: English interface foundation. Bangla localization is planned.</p></section>`;}
function bind(){
  $('#customizeDashboard')?.addEventListener('click',()=>{dashboardCustomize=!dashboardCustomize;render();});
  $('.main')?.addEventListener('click',e=>{
    const move=e.target.closest('[data-dash-move]');
    const hide=e.target.closest('[data-dash-hide]');
    const restore=e.target.closest('[data-restore-widget]');
    const layout=store.data.settings.dashboardLayout||{order:[],hidden:[]};
    const widgets=[...$('.main').querySelectorAll('[data-dashboard-widget]')];
    const order=widgets.map(x=>x.dataset.dashboardWidget);
    const hidden=[...(layout.hidden||[])];
    if(move){
      const el=move.closest('[data-dashboard-widget]');const index=order.indexOf(el?.dataset.dashboardWidget);const next=index+Number(move.dataset.dashMove);
      if(index<0||next<0||next>=order.length)return;
      [order[index],order[next]]=[order[next],order[index]];
      saveDashboardLayout(order,hidden);render();
    }else if(hide){
      const id=hide.dataset.dashHide;if(!hidden.includes(id))hidden.push(id);
      saveDashboardLayout(order,hidden);render();
    }else if(restore){
      const id=restore.dataset.restoreWidget;saveDashboardLayout(order,hidden.filter(x=>x!==id));render();
    }
  });
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page=b.dataset.page;render()}));
  $('#moreNavToggle')?.addEventListener('click',()=>{const menu=$('#mobileMore');menu.hidden=!menu.hidden;});
  document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{selectedSubject=b.dataset.subject;render()}));
  $('#startFocus')?.addEventListener('click',()=>{if(!selectedSubject&&store.data.subjects[0])selectedSubject=store.data.subjects[0].id;if(!selectedSubject){alert('Please add a subject first.');page='subjects';render();return}showTimer();});
  $('#addSubject')?.addEventListener('click',async()=>{const name=await askText('Add a subject','e.g. Statistics');if(name){try{store.addSubject(name);render();toast('Subject added','success')}catch(e){toast(e.message,'error')}}});
  document.querySelectorAll('[data-edit-subject]').forEach(b=>b.addEventListener('click',async()=>{const s=store.data.subjects.find(x=>x.id===b.dataset.editSubject);const name=await askText('Edit subject name','Subject name',s?.name||'');if(name){try{store.editSubject(s.id,name);render();toast('Subject updated','success')}catch(e){toast(e.message,'error')}}}));
  document.querySelectorAll('[data-delete-subject]').forEach(b=>b.addEventListener('click',async()=>{if(await askConfirm('Delete this subject? Past sessions will remain in history.')){store.deleteSubject(b.dataset.deleteSubject);if(selectedSubject===b.dataset.deleteSubject)selectedSubject=store.data.subjects[0]?.id||'';render()}}));
  $('#addPlan')?.addEventListener('click',async()=>{if(!store.data.subjects.length){toast('Add a subject first','error');return;}const value=await askPlanForm();if(value){try{store.addPlan(value.weekday,value.subjectId,value.minutes);plannerDay=value.weekday;render();toast('Study block added','success')}catch(e){toast(e.message,'error')}}});
  document.querySelectorAll('[data-planner-day]').forEach(b=>b.addEventListener('click',()=>{plannerDay=Number(b.dataset.plannerDay);render()}));
  document.querySelectorAll('[data-start-plan]').forEach(b=>b.addEventListener('click',()=>{const plan=store.data.plans.find(p=>p.id===b.dataset.startPlan);if(!plan)return;selectedSubject=plan.subjectId;showTimer()}));
  document.querySelectorAll('[data-edit-plan]').forEach(b=>b.addEventListener('click',async()=>{const p=store.data.plans.find(x=>x.id===b.dataset.editPlan);if(!p)return;const value=await askPlanForm(p);if(value){try{store.updatePlan(p.id,value);plannerDay=value.weekday;render();toast('Study block updated','success')}catch(e){toast(e.message,'error')}}}));
  document.querySelectorAll('[data-delete-plan]').forEach(b=>b.addEventListener('click',()=>{store.deletePlan(b.dataset.deletePlan);render();toast('Study block removed','success')}));
  $('#addTask')?.addEventListener('click',async()=>{const value=await askTaskForm();if(value){try{store.addTask(value.title,value.priority,value.dueDate);render();toast('Task added','success')}catch(e){toast(e.message,'error')}}});
  $('#dashboardChartType')?.addEventListener('change',e=>{try{store.setDashboardChartType(e.target.value);dashboardChartType=store.data.settings.dashboardChartType;render();toast('Chart preference saved','success')}catch(error){e.target.value=dashboardChartType;toast(error.message,'error')}});
  document.querySelectorAll('[data-add-subtask]').forEach(b=>b.addEventListener('click',async()=>{const title=await askText('Add sub-task','What is the next small step?');if(title){try{store.addSubtask(b.dataset.addSubtask,title);render();toast('Sub-task added','success')}catch(e){toast(e.message,'error')}}}));
  document.querySelectorAll('[data-subtask]').forEach(b=>b.addEventListener('change',()=>{store.toggleSubtask(b.dataset.subtaskTask,b.dataset.subtask,b.checked);render()}));
  document.querySelectorAll('[data-delete-subtask]').forEach(b=>b.addEventListener('click',()=>{store.deleteSubtask(b.dataset.deleteSubtaskTask,b.dataset.deleteSubtask);render();toast('Sub-task removed','success')}));
  $('#taskFilter')?.addEventListener('change',e=>{taskFilter=e.target.value;render()});
  document.querySelectorAll('[data-task]').forEach(b=>b.addEventListener('change',()=>{const x=store.data.tasks.find(t=>t.id===b.dataset.task);if(x){store.toggleTask(x.id,b.checked);render()}}));
  document.querySelectorAll('[data-edit-task]').forEach(b=>b.addEventListener('click',async()=>{const task=store.data.tasks.find(t=>t.id===b.dataset.editTask);if(!task)return;const value=await askTaskForm(task);if(value){try{store.updateTask(task.id,value);render();toast('Task updated','success')}catch(e){toast(e.message,'error')}}}));
  document.querySelectorAll('[data-delete-task]').forEach(b=>b.addEventListener('click',()=>{store.deleteTask(b.dataset.deleteTask);render()}));
  $('#addNote')?.addEventListener('click',async()=>{const title=await askText('New note title','Give your note a title');if(!title)return;const body=await askText('Write your note','Write a short note','',20000,true);if(body===null)return;store.addNote(title,body);render();toast('Note saved','success')});
  document.querySelectorAll('[data-edit-note]').forEach(b=>b.addEventListener('click',async()=>{const n=store.data.notes.find(x=>x.id===b.dataset.editNote);if(!n)return;const title=await askText('Edit note title','Note title',n.title);if(title===null)return;const body=await askText('Edit note content','Note content',n.body,20000,true);if(body===null)return;try{store.editNote(n.id,title,body);render();toast('Note updated','success')}catch(e){toast(e.message,'error')}}));
  document.querySelectorAll('[data-delete-note]').forEach(b=>b.addEventListener('click',async()=>{if(await askConfirm('Delete this note?')){store.deleteNote(b.dataset.deleteNote);render()}}));
  document.querySelectorAll('[data-delete-session]').forEach(b=>b.addEventListener('click',async()=>{if(await askConfirm('Delete this study record?')){store.deleteSession(b.dataset.deleteSession);render()}}));
  $('#dailyGoalSelect')?.addEventListener('change',e=>{try{store.setDailyGoal(e.target.value);render();toast('Daily target updated','success')}catch(err){toast(err.message,'error')}});
  $('#exportData')?.addEventListener('click',exportBackup);
  $('#importData')?.addEventListener('change',importBackup);
  $('#toggleTheme')?.addEventListener('click',()=>{store.data.settings.light=!store.data.settings.light;document.body.classList.toggle('light',store.data.settings.light);store.save()});
  if(page==='pdf-maker') bindPDFPage(render);
}
function showTimer(){
  if(!timer.active) timer.start(selectedSubject);
  $('#app').innerHTML=`<div class="focus-screen"><div class="space-particles" aria-hidden="true"></div><div class="focus-nebula" aria-hidden="true"></div><div class="focus-orbit orbit-a" aria-hidden="true"></div><div class="focus-orbit orbit-b" aria-hidden="true"></div><div class="blackhole-scene ${timer.paused?'is-paused':''}" id="blackholeScene"><div class="bh-starfield" aria-hidden="true"></div><div class="bh-lensing" aria-hidden="true"></div><div class="bh-lensing-arc bh-lensing-arc-a" aria-hidden="true"></div><div class="bh-lensing-arc bh-lensing-arc-b" aria-hidden="true"></div><div class="bh-light-beams" aria-hidden="true"><i></i><i></i><i></i></div><div class="bh-energy-waves" aria-hidden="true"><i></i><i></i><i></i></div><div class="bh-disk bh-disk-outer" aria-hidden="true"></div><div class="bh-disk bh-disk-inner" aria-hidden="true"></div><div class="bh-corona" aria-hidden="true"></div><button class="focus-core" id="timerToggle" aria-label="Pause or resume focus timer"><strong id="clock" aria-live="off">00:00:00</strong></button><span class="bh-particle bh-particle-a" aria-hidden="true"></span><span class="bh-particle bh-particle-b" aria-hidden="true"></span><span class="bh-particle bh-particle-c" aria-hidden="true"></span></div></div>`;
  paintTimer();
  const tick=setInterval(()=>{if(!$('#clock')){clearInterval(tick);return}paintTimer()},250);
  $('#timerToggle').addEventListener('click',()=>{timer.toggle();});

}
function exportBackup(){const blob=new Blob([JSON.stringify(store.data,null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='focus-flow-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup export started','success')}
function importBackup(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{store.import(JSON.parse(r.result));render();toast('Backup restored successfully','success')}catch{toast('Invalid backup file. Choose a valid Focus Flow backup.','error')}};r.readAsText(f)}
store.data.settings.light&&(document.body.classList.add('light'));
if(timer.active){selectedSubject=timer.subjectId||selectedSubject;showTimer();}else{render();}
if(store.recoveryAvailable) toast('A damaged local-data snapshot was preserved for recovery. Check device storage before continuing.','error');
if('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
