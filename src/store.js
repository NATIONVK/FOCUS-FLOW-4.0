const KEY='focus-flow-v4';
const defaults=()=>({version:4,subjects:[{id:crypto.randomUUID(),name:'General Study',color:'#8b7cff',goalMinutes:120}],sessions:[],tasks:[],notes:[],settings:{light:false}});
export class Store {
  constructor(){this.data=this.load();}
  load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.version===4)return {...defaults(),...d};}catch{}return defaults();}
  save(){localStorage.setItem(KEY,JSON.stringify(this.data));}
  addSubject(name){if(this.data.subjects.some(s=>s.name.toLowerCase()===name.toLowerCase()))throw new Error('Subject already exists');const colors=['#8b7cff','#38d6b0','#ffbd59','#ff6b83','#5ea8ff'];this.data.subjects.push({id:crypto.randomUUID(),name,color:colors[this.data.subjects.length%colors.length],goalMinutes:120});this.save();}
  deleteSubject(id){this.data.subjects=this.data.subjects.filter(s=>s.id!==id);this.save();}
  subjectName(id){return this.data.subjects.find(s=>s.id===id)?.name||'Deleted subject';}
  import(data){if(data?.version!==4||!Array.isArray(data.subjects)||!Array.isArray(data.sessions))throw new Error('Unsupported backup');this.data={...defaults(),...data};this.save();}
}
