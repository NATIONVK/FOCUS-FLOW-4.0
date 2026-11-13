const KEY='focus-flow-v4';
const RECOVERY_KEY='focus-flow-v4-recovery';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaults=()=>({version:4,subjects:[{id:makeId(),name:'General Study',color:'#8b7cff',goalMinutes:120}],sessions:[],tasks:[],plans:[],notes:[],settings:{light:false,dailyGoalMinutes:120,dashboardLayout:{order:[],hidden:[]},dashboardChartType:'bar'}});
const text=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function normalize(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==4)throw new Error('Unsupported backup version');
  const d=defaults();
  if(!Array.isArray(data.subjects)||!Array.isArray(data.sessions)||!Array.isArray(data.tasks??[])||!Array.isArray(data.notes??[]))throw new Error('Invalid backup structure');
  const subjects=data.subjects.map(s=>({id:text(s?.id,100)||makeId(),name:text(s?.name,80),color:/^#[0-9a-f]{6}$/i.test(s?.color||'')?s.color:'#8b7cff',goalMinutes:Number.isFinite(Number(s?.goalMinutes))?Math.max(1,Math.min(1440,Number(s.goalMinutes))):120})).filter(s=>s.name);
  const sessions=data.sessions.map(s=>({id:text(s?.id,100)||makeId(),subjectId:text(s?.subjectId,100),startedAt:validDate(s?.startedAt)?s.startedAt:new Date().toISOString(),endedAt:validDate(s?.endedAt)?s.endedAt:new Date().toISOString(),duration:Number.isFinite(Number(s?.duration))?Math.max(0,Math.floor(Number(s.duration))):0})).filter(s=>s.duration>0);
  const plans=(data.plans??[]).map(p=>({id:text(p?.id,100)||makeId(),weekday:Number.isInteger(p?.weekday)&&p.weekday>=0&&p.weekday<=6?p.weekday:0,subjectId:text(p?.subjectId,100),minutes:Number.isFinite(Number(p?.minutes))?Math.max(5,Math.min(1440,Math.round(Number(p.minutes)))):60})).filter(p=>subjects.some(sub=>sub.id===p.subjectId));
  const tasks=(data.tasks??[]).map(t=>({id:text(t?.id,100)||makeId(),title:text(t?.title,300),done:!!t?.done,priority:['low','medium','high'].includes(t?.priority)?t.priority:'medium',dueDate:typeof t?.dueDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)?t.dueDate:'',subtasks:Array.isArray(t?.subtasks)?t.subtasks.map(st=>({id:text(st?.id,100)||makeId(),title:text(st?.title,200),done:!!st?.done})).filter(st=>st.title).slice(0,100):[]})).filter(t=>t.title);
  const notes=(data.notes??[]).map(n=>({id:text(n?.id,100)||makeId(),title:text(n?.title,160),body:typeof n?.body==='string'?n.body.slice(0,20000):'',updatedAt:Number.isFinite(Number(n?.updatedAt))?Number(n.updatedAt):Date.now()})).filter(n=>n.title);
  const settings=data.settings&&typeof data.settings==='object'&&!Array.isArray(data.settings)?data.settings:{};
  const allowedWidgets=['hero','kpis','week','month','insights','lower','recent'];const layout=settings.dashboardLayout&&typeof settings.dashboardLayout==='object'?settings.dashboardLayout:{};const dashboardLayout={order:Array.isArray(layout.order)?layout.order.filter((x,i,a)=>allowedWidgets.includes(x)&&a.indexOf(x)===i):[],hidden:Array.isArray(layout.hidden)?layout.hidden.filter((x,i,a)=>allowedWidgets.includes(x)&&a.indexOf(x)===i):[]};
  const dashboardChartType=['bar','line','area','pie'].includes(settings.dashboardChartType)?settings.dashboardChartType:'bar';
  return {version:4,subjects:subjects.length?subjects:d.subjects,sessions,tasks,plans,notes,settings:{...d.settings,light:!!settings.light,dailyGoalMinutes:Number.isFinite(Number(settings.dailyGoalMinutes))?Math.max(1,Math.min(1440,Number(settings.dailyGoalMinutes))):120,dashboardLayout,dashboardChartType}};
}
export class Store {
  constructor(){this.recoveryAvailable=false;this.storageAvailable=false;this.storageError='';this.onStorageStatusChange=null;this.data=this.load();}
  notifyStorageStatus(){this.onStorageStatusChange?.({available:this.storageAvailable,error:this.storageError});}
  load(){
    let raw=null;let storageReadable=false;
    try{
      const storage=globalThis.localStorage;
      if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new Error('Browser storage is unavailable');
      raw=storage.getItem(KEY);storageReadable=true;
      this.storageAvailable=true;this.storageError='';
      if(!raw){const safe=defaults();this.lastSavedSnapshot=JSON.stringify(safe);return safe;}
      const clean=normalize(JSON.parse(raw));
      this.lastSavedSnapshot=JSON.stringify(clean);
      return clean;
    }catch(error){
      this.storageAvailable=storageReadable;this.storageError=storageReadable?'Saved data was invalid; a recovery copy was attempted':(error?.message||'Storage unavailable');
      if(typeof raw==='string'&&raw.length){
        try{
          const storage=globalThis.localStorage;
          if(storage&&!storage.getItem(RECOVERY_KEY))storage.setItem(RECOVERY_KEY,raw);
          this.recoveryAvailable=!!storage?.getItem(RECOVERY_KEY);
        }catch(recoveryError){
          console.error('FOCUS FLOW could not preserve a recovery copy',recoveryError);
        }
      }
      console.error('FOCUS FLOW loaded safe defaults after a data validation error',error);
      const safe=defaults();
      this.lastSavedSnapshot=JSON.stringify(safe);
      return safe;
    }
  }
  save(){
    try{
      const storage=globalThis.localStorage;
      if(!storage||typeof storage.setItem!=='function'||typeof storage.getItem!=='function')throw new Error('Browser storage is unavailable');
      const serialized=JSON.stringify(this.data);
      storage.setItem(KEY,serialized);
      if(storage.getItem(KEY)!==serialized)throw new Error('Storage write verification failed');
      this.lastSavedSnapshot=serialized;
      this.storageAvailable=true;this.storageError='';this.notifyStorageStatus();
      return true;
    }catch(error){
      // Restore the last known-good snapshot so failed writes never leave phantom in-memory changes.
      try{if(this.lastSavedSnapshot)this.data=normalize(JSON.parse(this.lastSavedSnapshot));}catch(restoreError){console.error('FOCUS FLOW could not restore its last saved snapshot',restoreError);}
      this.storageAvailable=false;this.storageError=error?.message||'Storage write failed';this.notifyStorageStatus();
      console.error('FOCUS FLOW could not save local data',error);
      throw new Error('ডিভাইসের Storage unavailable বা full। ডেটা সংরক্ষণ হয়নি—Backup Export করে রাখুন।');
    }
  }
  addSubject(name){name=text(name,80);if(!name)throw new Error('Subject name is required');if(this.data.subjects.some(s=>s.name.toLowerCase()===name.toLowerCase()))throw new Error('Subject already exists');const colors=['#8b7cff','#38d6b0','#ffbd59','#ff6b83','#5ea8ff'];this.data.subjects.push({id:makeId(),name,color:colors[this.data.subjects.length%colors.length],goalMinutes:120});this.save();}
  editSubject(id,name){name=text(name,80);if(!name)throw new Error('Subject name is required');if(this.data.subjects.some(s=>s.id!==id&&s.name.toLowerCase()===name.toLowerCase()))throw new Error('Subject already exists');const s=this.data.subjects.find(x=>x.id===id);if(!s)throw new Error('Subject not found');s.name=name;this.save();}
  deleteSubject(id){if(!this.data.subjects.some(s=>s.id===id))return;this.data.subjects=this.data.subjects.filter(s=>s.id!==id);this.data.plans=(this.data.plans||[]).filter(p=>p.subjectId!==id);this.save();}
  addTask(title,priority='medium',dueDate=''){title=text(title,300);if(!title)throw new Error('Task title is required');if(!['low','medium','high'].includes(priority))throw new Error('Invalid task priority');if(dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw new Error('Invalid due date');this.data.tasks.push({id:makeId(),title,done:false,priority,dueDate});this.save();}
  addPlan(weekday,subjectId,minutes=60){weekday=Number(weekday);minutes=Number(minutes);if(!Number.isInteger(weekday)||weekday<0||weekday>6)throw new Error('Choose a valid weekday');if(!this.data.subjects.some(s=>s.id===subjectId))throw new Error('Choose a valid subject');if(!Number.isFinite(minutes)||minutes<5||minutes>1440)throw new Error('Study time must be 5 to 1440 minutes');const plan={id:makeId(),weekday,subjectId,minutes:Math.round(minutes)};this.data.plans.push(plan);this.save();return plan;}
  updatePlan(id,patch={}){const p=this.data.plans.find(x=>x.id===id);if(!p)throw new Error('Plan not found');if(patch.weekday!==undefined){const n=Number(patch.weekday);if(!Number.isInteger(n)||n<0||n>6)throw new Error('Choose a valid weekday');p.weekday=n;}if(patch.subjectId!==undefined){if(!this.data.subjects.some(s=>s.id===patch.subjectId))throw new Error('Choose a valid subject');p.subjectId=patch.subjectId;}if(patch.minutes!==undefined){const n=Number(patch.minutes);if(!Number.isFinite(n)||n<5||n>1440)throw new Error('Study time must be 5 to 1440 minutes');p.minutes=Math.round(n);}this.save();}
  deletePlan(id){this.data.plans=this.data.plans.filter(p=>p.id!==id);this.save();}
  updateTask(id,patch={}){const t=this.data.tasks.find(x=>x.id===id);if(!t)throw new Error('Task not found');if(patch.title!==undefined){const title=text(patch.title,300);if(!title)throw new Error('Task title is required');t.title=title;}if(patch.priority!==undefined){if(!['low','medium','high'].includes(patch.priority))throw new Error('Invalid task priority');t.priority=patch.priority;}if(patch.dueDate!==undefined){if(patch.dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(patch.dueDate))throw new Error('Invalid due date');t.dueDate=patch.dueDate;}this.save();}
  toggleTask(id,done){const t=this.data.tasks.find(x=>x.id===id);if(!t)return;t.done=!!done;if(t.done)t.subtasks=(t.subtasks||[]).map(x=>({...x,done:true}));else if((t.subtasks||[]).length)t.subtasks=t.subtasks.map(x=>({...x,done:false}));this.save();}
  addSubtask(taskId,title){const t=this.data.tasks.find(x=>x.id===taskId);if(!t)throw new Error('Task not found');title=text(title,200);if(!title)throw new Error('Sub-task title is required');t.subtasks=t.subtasks||[];if(t.subtasks.length>=100)throw new Error('A task can contain up to 100 sub-tasks');t.subtasks.push({id:makeId(),title,done:false});t.done=false;this.save();}
  toggleSubtask(taskId,subtaskId,done){const t=this.data.tasks.find(x=>x.id===taskId);const sub=t?.subtasks?.find(x=>x.id===subtaskId);if(!sub)return;sub.done=!!done;t.done=t.subtasks.length>0&&t.subtasks.every(x=>x.done);this.save();}
  deleteSubtask(taskId,subtaskId){const t=this.data.tasks.find(x=>x.id===taskId);if(!t)return;t.subtasks=(t.subtasks||[]).filter(x=>x.id!==subtaskId);t.done=t.subtasks.length>0&&t.subtasks.every(x=>x.done);this.save();}
  deleteTask(id){this.data.tasks=this.data.tasks.filter(x=>x.id!==id);this.save();}
  addNote(title,body=''){title=text(title,160);if(!title)throw new Error('Note title is required');this.data.notes.push({id:makeId(),title,body:String(body).slice(0,20000),updatedAt:Date.now()});this.save();}
  editNote(id,title,body){const n=this.data.notes.find(x=>x.id===id);if(!n)throw new Error('Note not found');n.title=text(title,160);if(!n.title)throw new Error('Note title is required');n.body=String(body).slice(0,20000);n.updatedAt=Date.now();this.save();}
  deleteNote(id){this.data.notes=this.data.notes.filter(x=>x.id!==id);this.save();}
  deleteSession(id){this.data.sessions=this.data.sessions.filter(x=>x.id!==id);this.save();}
  subjectName(id){return this.data.subjects.find(s=>s.id===id)?.name||'Deleted subject';}
  setDashboardLayout(layout={}){const allowed=['hero','kpis','week','month','insights','lower','recent'];const clean=list=>Array.isArray(list)?[...new Set(list.filter(x=>allowed.includes(x)))]:[];this.data.settings.dashboardLayout={order:clean(layout.order),hidden:clean(layout.hidden)};this.save();}
  setDashboardChartType(type){if(!['bar','line','area','pie'].includes(type))throw new Error('Invalid dashboard chart type');this.data.settings.dashboardChartType=type;this.save();}
  setDailyGoal(minutes){const value=Number(minutes);if(!Number.isFinite(value)||value<1||value>1440)throw new Error('Daily goal must be between 1 and 1440 minutes');this.data.settings.dailyGoalMinutes=Math.round(value);this.save();}
  import(data){const clean=normalize(data);const previous=this.data;this.data=clean;try{this.save();}catch(error){this.data=previous;throw error;}}
}