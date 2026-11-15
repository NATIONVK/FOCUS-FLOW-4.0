function hasPdfHeader(bytes){
 const limit=Math.min(bytes.length,1024);
 for(let i=0;i<limit-4;i++)if(bytes[i]===37&&bytes[i+1]===80&&bytes[i+2]===68&&bytes[i+3]===70&&bytes[i+4]===45)return true;
 return false;
}

export async function inspectPdfLibraryRecords(records){
 if(!Array.isArray(records))throw new Error('PDF Library records must be a list.');
 const seenIds=new Set(),seenBackupIds=new Set(),issues=[];
 let healthy=0;
 for(const record of records){
  const problems=[];
  const id=typeof record?.id==='string'?record.id:'';
  const name=typeof record?.name==='string'?record.name:'Unknown PDF';
  if(!id)problems.push('Missing document ID');
  else if(seenIds.has(id))problems.push('Duplicate document ID');
  else seenIds.add(id);
  if(!name||name==='Unknown PDF')problems.push('Missing file name');
  if(record?.backupId){
   const backupId=String(record.backupId);
   if(seenBackupIds.has(backupId))problems.push('Duplicate backup ID');
   else seenBackupIds.add(backupId);
  }
  const blob=record?.blob;
  if(!blob||typeof blob.slice!=='function'||typeof blob.size!=='number'||typeof blob.arrayBuffer!=='function'){
   problems.push('PDF data is missing or unreadable');
  }else{
   if(Number(record.size)!==blob.size)problems.push('Stored file size does not match PDF data');
   try{
    const header=new Uint8Array(await blob.slice(0,1024).arrayBuffer());
    if(!hasPdfHeader(header))problems.push('PDF header is missing or damaged');
   }catch{
    problems.push('PDF data could not be read');
   }
  }
  if(problems.length)issues.push({id,name,problems});
  else healthy++;
 }
 return {total:records.length,healthy,damaged:issues.length,issues};
}
