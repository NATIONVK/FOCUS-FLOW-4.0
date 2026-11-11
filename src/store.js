const KEY='focus-flow-v4';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaults=()=>({version:4,subjects:[{id:makeId(),name:'General Study',color:'#8b7cff',goalMinutes:120}],sessions:[],tasks:[],notes:[],settings:{light:false,dailyGoalMinutes:120}});
const text=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function normalize(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==4)throw new Error('Unsupported backup version');
  const d=defaults();
  if(!Array.isArray(data.subjects)||!Array.isArray(data.sessions)||!Array.isArray(data.tasks??[])||!Array.isArray(data.notes??[]))throw new Error('Invalid backup structure');
  const subjects=data.subjects.map(s=>({id:text(s?.id,100)||makeId(),name:text(s?.name,80),color:/^#[0-9a-f]{6}$/i.test(s?.color||'')?s.color:'#8b7cff',goalMinutes:Number.isFinite(Number(s?.goalMinutes))?Math.max(1,Math.min(1440,Number(s.goalMinutes))):120})).filter(s=>s.name);
  const sessions=data.sessions.map(s=>({id:text(s?.id,100)||makeId(),subjectId:text(s?.subjectId,100),startedAt:validDate(s?.startedAt)?s.startedAt:new Date().toISOString(),endedAt:validDate(s?.endedAt)?s.endedAt:new Date().toISOString(),duration:Number.isFinite(Number(s?.duration))?Math.max(0,Math.floor(Number(s.duration))):0})).filter(s=>s.duration>0);
  const tasks=(data.tasks??[]).map(t=>({id:text(t?.id,100)||makeId(),title:text(t?.title,300),done:!!t?.done,priority:['low','medium','high'].includes(t?.priority)?t.priority:'medium',dueDate:typeof t?.dueDate==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(t.dueDate)?t.dueDate:''})).filter(t=>t.title);
  const notes=(data.notes??[]).map(n=>({id:text(n?.id,100)||makeId(),title:text(n?.title,160),body:typeof n?.body==='string'?n.body.slice(0,20000):'',updatedAt:Number.isFinite(Number(n?.updatedAt))?Number(n.updatedAt):Date.now()})).filter(n=>n.title);
  const settings=data.settings&&typeof data.settings==='object'&&!Array.isArray(data.settings)?data.settings:{};
  return {version:4,subjects:subjects.length?subjects:d.subjects,sessions,tasks,notes,settings:{...d.settings,light:!!settings.light,dailyGoalMinutes:Number.isFinite(Number(settings.dailyGoalMinutes))?Math.max(1,Math.min(1440,Number(settings.dailyGoalMinutes))):120}};
}
export class Store {
  constructor(){this.data=this.load();}
  load(){try{const raw=globalThis.localStorage?.getItem(KEY);if(!raw)return defaults();return normalize(JSON.parse(raw));}catch{return defaults();}}
  save(){try{globalThis.localStorage?.setItem(KEY,JSON.stringify(this.data));return true;}catch(error){console.error('FOCUS FLOW could not save local data',error);throw new Error('ডিভাইসে জায়গা বা storage permission পরীক্ষা করুন। ডেটা সংরক্ষণ করা যায়নি।');}}
  addSubject(name){name=text(name,80);if(!name)throw new Error('Subject name is required');if(this.data.subjects.some(s=>s.name.toLowerCase()===name.toLowerCase()))throw new Error('Subject already exists');const colors=['#8b7cff','#38d6b0','#ffbd59','#ff6b83','#5ea8ff'];this.data.subjects.push({id:makeId(),name,color:colors[this.data.subjects.length%colors.length],goalMinutes:120});this.save();}
  editSubject(id,name){name=text(name,80);if(!name)throw new Error('Subject name is required');if(this.data.subjects.some(s=>s.id!==id&&s.name.toLowerCase()===name.toLowerCase()))throw new Error('Subject already exists');const s=this.data.subjects.find(x=>x.id===id);if(!s)throw new Error('Subject not found');s.name=name;this.save();}
  deleteSubject(id){if(!this.data.subjects.some(s=>s.id===id))return;this.data.subjects=this.data.subjects.filter(s=>s.id!==id);this.save();}
  addTask(title,priority='medium',dueDate=''){title=text(title,300);if(!title)throw new Error('Task title is required');if(!['low','medium','high'].includes(priority))throw new Error('Invalid task priority');if(dueDate&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(dueDate))throw new Error('Invalid due date');this.data.tasks.push({id:makeId(),title,done:false,priority,dueDate});this.save();}
  updateTask(id,patch={}){const t=this.data.tasks.find(x=>x.id===id);if(!t)throw new Error('Task not found');if(patch.title!==undefined){const title=text(patch.title,300);if(!title)throw new Error('Task title is required');t.title=title;}if(patch.priority!==undefined){if(!['low','medium','high'].includes(patch.priority))throw new Error('Invalid task priority');t.priority=patch.priority;}if(patch.dueDate!==undefined){if(patch.dueDate&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(patch.dueDate))throw new Error('Invalid due date');t.dueDate=patch.dueDate;}this.save();}
  toggleTask(id,done){const t=this.data.tasks.find(x=>x.id===id);if(!t)return;t.done=!!done;this.save();}
  deleteTask(id){this.data.tasks=this.data.tasks.filter(x=>x.id!==id);this.save();}
  addNote(title,body=''){title=text(title,160);if(!title)throw new Error('Note title is required');this.data.notes.push({id:makeId(),title,body:String(body).slice(0,20000),updatedAt:Date.now()});this.save();}
  editNote(id,title,body){const n=this.data.notes.find(x=>x.id===id);if(!n)throw new Error('Note not found');n.title=text(title,160);if(!n.title)throw new Error('Note title is required');n.body=String(body).slice(0,20000);n.updatedAt=Date.now();this.save();}
  deleteNote(id){this.data.notes=this.data.notes.filter(x=>x.id!==id);this.save();}
  deleteSession(id){this.data.sessions=this.data.sessions.filter(x=>x.id!==id);this.save();}
  subjectName(id){return this.data.subjects.find(s=>s.id===id)?.name||'Deleted subject';}
  setDailyGoal(minutes){const value=Number(minutes);if(!Number.isFinite(value)||value<1||value>1440)throw new Error('Daily goal must be between 1 and 1440 minutes');this.data.settings.dailyGoalMinutes=Math.round(value);this.save();}
  import(data){const clean=normalize(data);this.data=clean;this.save();}
}