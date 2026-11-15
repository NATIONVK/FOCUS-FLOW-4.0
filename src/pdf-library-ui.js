import { renamePdfInLibrary } from './pdf-storage.js';

const formatSize = bytes => bytes < 1024 * 1024
  ? (bytes / 1024).toFixed(0) + ' KB'
  : (bytes / 1024 / 1024).toFixed(1) + ' MB';

export function renderPdfLibrary(root, documents, { onOpen, onDelete, onRefresh } = {}) {
  if (!root) return;
  const docs = [...(documents || [])];
  root.replaceChildren();

  const toolbar = document.createElement('div');
  toolbar.className = 'pdf-library-toolbar';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search PDF by file name…';
  search.setAttribute('aria-label', 'Search saved PDFs');
  const sort = document.createElement('select');
  sort.setAttribute('aria-label', 'Sort saved PDFs');
  [['recent','Recently added'],['name','Name A–Z'],['size','Largest first'],['oldest','Oldest first']].forEach(([value,label]) => {
    const option = document.createElement('option');
    option.value = value; option.textContent = label; sort.append(option);
  });
  const summary = document.createElement('small');
  summary.className = 'pdf-library-summary';
  toolbar.append(search, sort, summary);
  root.append(toolbar);

  const list = document.createElement('div');
  list.className = 'pdf-library-list';
  root.append(list);

  function paint() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = docs.filter(doc => String(doc.name).toLocaleLowerCase().includes(query));
    const mode = sort.value;
    visible.sort((a,b) => mode === 'name' ? a.name.localeCompare(b.name)
      : mode === 'size' ? b.size-a.size
      : mode === 'oldest' ? a.updatedAt-b.updatedAt
      : b.updatedAt-a.updatedAt);
    summary.textContent = visible.length + ' of ' + docs.length + ' PDFs · ' +
      formatSize(docs.reduce((sum,doc)=>sum+(Number(doc.size)||0),0)) + ' stored';
    list.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'pdf-empty-state';
      empty.textContent = docs.length ? 'No PDF matches this search.' : 'No saved PDFs yet. Create or import a PDF first.';
      list.append(empty);
      return;
    }
    for (const doc of visible) {
      const row = document.createElement('article');
      row.className = 'pdf-library-row';
      const info = document.createElement('div');
      info.className = 'pdf-library-info';
      const name = document.createElement('strong');
      name.textContent = doc.name;
      const meta = document.createElement('small');
      meta.textContent = formatSize(doc.size) + ' · ' + new Date(doc.updatedAt).toLocaleString();
      info.append(name,meta);
      const actions = document.createElement('div');
      actions.className = 'pdf-library-actions';
      const button = (label, action, style='') => {
        const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.action=action;b.dataset.id=doc.id;
        if(style)b.className=style;return b;
      };
      actions.append(button('Open','open','pdf-link'),button('Rename','rename','pdf-link'),button('Delete','delete','pdf-link'));
      row.append(info,actions);list.append(row);
    }
  }
  search.addEventListener('input',paint);
  sort.addEventListener('change',paint);
  list.addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action]');
    if(!button)return;
    const {action,id}=button.dataset;
    if(action==='open'){onOpen?.(id);return;}
    if(action==='delete'){onDelete?.(id);return;}
    if(action==='rename'){
      const current=docs.find(doc=>doc.id===id);
      const next=window.prompt('Rename PDF',current?.name||'document.pdf');
      if(next===null)return;
      try{await renamePdfInLibrary(id,next);if(onRefresh)await onRefresh();else{const doc=docs.find(x=>x.id===id);if(doc)doc.name=next;paint();}}
      catch(error){window.alert(error.message||'Could not rename this PDF.');}
    }
  });
  paint();
}
