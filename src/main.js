import './styles.css';
import { Store } from './store.js';
import { FocusTimer } from './timer.js';
import { Analytics } from './analytics.js';

const $ = (s, root=document) => root.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = new Store();
let page = 'overview';
let timer = new FocusTimer(store, render);
let selectedSubject = store.data.subjects[0]?.id || '';

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
  return ['overview','subjects','tasks','notes','history','settings'].map(p=>`<button class="nav-item ${page===p?'active':''}" data-page="${p}">${p[0].toUpperCase()+p.slice(1)}</button>`).join('');
}
function render() {
  const t=totals(), subjects=store.data.subjects;
  $('#app').innerHTML=`
  <div class="shell">
    <aside class="sidebar"><div class="brand"><span class="brand-orb"></span><div>FOCUS <b>FLOW</b><small>YOUR SPACE TO GROW</small></div></div>
      <nav>${nav()}</nav><div class="side-foot">OFFLINE FIRST · V4.0</div></aside>
    <main class="main">
      <header class="topbar"><div><span class="eyebrow">YOUR PERSONAL STUDY OS</span><h1>${page==='overview'?'Overview':page[0].toUpperCase()+page.slice(1)}</h1></div><div class="status"><i></i> Local data secured</div></header>
      ${page==='overview'?overview(t,subjects):page==='subjects'?subjectPage(subjects):page==='tasks'?taskPage():page==='notes'?notesPage():page==='history'?historyPage():settingsPage()}
    </main>
  </div>`;
  bind();
}
function overview(t,subjects) {
  const week=Analytics.weekly(store.data.sessions);
  return `<section class="welcome"><div><span class="eyebrow">STAY CONSISTENT</span><h2>Small steps. <em>Big progress.</em></h2><p>Your focus journey, one session at a time.</p></div><button class="primary" id="startFocus">Start focus session ↗</button></section>
  <section class="stats"><article class="stat"><span>TODAY'S FOCUS</span><strong>${(t.today/3600).toFixed(1)}<small> hrs</small></strong><small class="muted">Recorded study time</small></article><article class="stat"><span>TOTAL FOCUS</span><strong>${(t.all/3600).toFixed(1)}<small> hrs</small></strong><small class="muted">Across all sessions</small></article><article class="stat"><span>SESSIONS</span><strong>${t.count}</strong><small class="muted">Completed sessions</small></article></section>
  <section class="grid-two"><article class="panel"><div class="panel-head"><div><span class="eyebrow">YOUR ROUTINE</span><h3>Weekly activity</h3></div><span class="muted">Last 7 days</span></div><div class="bars">${week.map(d=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(4,Math.min(100,d.seconds/3600*12))}%"></div><small>${d.label}</small></div>`).join('')}</div></article>
  <article class="panel"><div class="panel-head"><div><span class="eyebrow">YOUR SUBJECTS</span><h3>Study spaces</h3></div><button class="text-btn" data-page="subjects">Manage →</button></div><div class="subject-list">${subjects.slice(0,5).map(s=>`<div class="subject-row"><span class="dot" style="background:${esc(s.color)}"></span><b>${esc(s.name)}</b><span>${(Analytics.subjectSeconds(store.data.sessions,s.id)/3600).toFixed(1)}h</span></div>`).join('')||'<p class="muted">Add your first subject to begin.</p>'}</div></article></section>
  <section class="panel"><div class="panel-head"><div><span class="eyebrow">QUICK START</span><h3>Choose a subject</h3></div><button class="text-btn" data-page="subjects">+ Add subject</button></div><div class="quick-subjects">${subjects.map(s=>`<button class="subject-chip ${selectedSubject===s.id?'chosen':''}" data-subject="${s.id}"><i style="background:${esc(s.color)}"></i>${esc(s.name)}</button>`).join('')||'<span class="muted">Create a subject first.</span>'}</div></section>`;
}
function subjectPage(subjects) {return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">ORGANIZE YOUR LEARNING</span><h3>Subjects</h3></div><button class="primary" id="addSubject">+ New subject</button></div><div class="subject-cards">${subjects.map(s=>`<article class="subject-card"><span class="dot" style="background:${esc(s.color)}"></span><h3>${esc(s.name)}</h3><p>${(Analytics.subjectSeconds(store.data.sessions,s.id)/3600).toFixed(2)} hours focused</p><button class="text-btn" data-delete-subject="${s.id}">Delete</button></article>`).join('')||'<p class="muted">No subjects yet.</p>'}</div></section>`;}
function taskPage(){return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">MAKE IT HAPPEN</span><h3>Tasks</h3></div><button class="primary" id="addTask">+ Add task</button></div><div class="task-list">${store.data.tasks.map(x=>`<label class="task"><input type="checkbox" data-task="${x.id}" ${x.done?'checked':''}><span class="${x.done?'done':''}">${esc(x.title)}</span></label>`).join('')||'<p class="muted">Your task list is clear. Add a small goal.</p>'}</div></section>`;}
function notesPage(){return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">THINK. CAPTURE. REMEMBER.</span><h3>Notes</h3></div><button class="primary" id="addNote">+ New note</button></div><div class="note-list">${store.data.notes.map(n=>`<article class="note"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><small>${new Date(n.updatedAt).toLocaleString()}</small></article>`).join('')||'<p class="muted">No notes saved yet.</p>'}</div></section>`;}
function historyPage(){return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">EVERY MINUTE COUNTS</span><h3>Study history</h3></div><button class="primary" id="exportData">Export backup</button></div><div class="history-list">${[...store.data.sessions].reverse().map(s=>`<div class="history-row"><div><b>${esc(store.subjectName(s.subjectId))}</b><small>${new Date(s.startedAt).toLocaleString()}</small></div><strong>${fmt(s.duration)}</strong></div>`).join('')||'<p class="muted">Completed sessions will appear here.</p>'}</div></section>`;}
function settingsPage(){return `<section class="panel"><span class="eyebrow">YOUR DATA, YOUR CONTROL</span><h3>Settings & backup</h3><p class="muted">Your records are stored locally on this device. Export a backup before changing or reinstalling the app.</p><div class="settings-actions"><button class="primary" id="exportData">Export JSON backup</button><label class="secondary upload">Import backup<input id="importData" type="file" accept="application/json"></label><button class="secondary" id="toggleTheme">Toggle appearance</button></div><p class="muted">Language preference: English interface foundation. Bangla localization is planned.</p></section>`;}
function bind(){
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page=b.dataset.page;render()}));
  document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{selectedSubject=b.dataset.subject;render()}));
  $('#startFocus')?.addEventListener('click',()=>{if(!selectedSubject&&store.data.subjects[0])selectedSubject=store.data.subjects[0].id;if(!selectedSubject){alert('Please add a subject first.');page='subjects';render();return}showTimer();});
  $('#addSubject')?.addEventListener('click',()=>{const name=prompt('Subject name');if(name?.trim()){store.addSubject(name.trim());render()}});
  document.querySelectorAll('[data-delete-subject]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Delete this subject? Past sessions will remain in history.')){store.deleteSubject(b.dataset.deleteSubject);render()}}));
  $('#addTask')?.addEventListener('click',()=>{const title=prompt('What is your task?');if(title?.trim()){store.data.tasks.push({id:crypto.randomUUID(),title:title.trim(),done:false});store.save();render()}});
  document.querySelectorAll('[data-task]').forEach(b=>b.addEventListener('change',()=>{const x=store.data.tasks.find(t=>t.id===b.dataset.task);if(x){x.done=b.checked;store.save()}}));
  $('#addNote')?.addEventListener('click',()=>{const title=prompt('Note title');if(!title?.trim())return;const body=prompt('Note content')||'';store.data.notes.push({id:crypto.randomUUID(),title:title.trim(),body,updatedAt:Date.now()});store.save();render()});
  $('#exportData')?.addEventListener('click',exportBackup);
  $('#importData')?.addEventListener('change',importBackup);
  $('#toggleTheme')?.addEventListener('click',()=>{document.body.classList.toggle('light');store.data.settings.light=document.body.classList.contains('light');store.save()});
}
function showTimer(){
  let elapsed=0;
  const paint=()=>{const e=timer.elapsed();$('#clock').textContent=fmt(e);$('#timer-ring').style.setProperty('--progress',Math.min(1,e/3600));};
  $('#app').innerHTML=`<div class="focus-screen"><button class="exit-focus" id="exitFocus">×</button><div class="space-particles"></div><div class="focus-orbit orbit-a"></div><div class="focus-orbit orbit-b"></div><button class="focus-core" id="timerToggle"><span class="focus-label">FOCUS SESSION</span><strong id="clock">00:00:00</strong><span class="focus-hint">TAP TO PAUSE / RESUME</span></button></div>`;
  timer.start(selectedSubject);paint();
  const tick=setInterval(()=>{if(!$('#clock')){clearInterval(tick);return}paint()},250);
  $('#timerToggle').addEventListener('click',()=>{timer.toggle();});
  $('#exitFocus').addEventListener('click',()=>{clearInterval(tick);if(timer.active)timer.finish();page='overview';render()});
}
function exportBackup(){const blob=new Blob([JSON.stringify(store.data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='focus-flow-backup.json';a.click();URL.revokeObjectURL(a.href)}
function importBackup(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{store.import(JSON.parse(r.result));alert('Backup restored.');render()}catch{alert('Invalid backup file.')}};r.readAsText(f)}
store.data.settings.light&&(document.body.classList.add('light'));
render();
if('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
