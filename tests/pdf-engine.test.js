import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

test('PDF engine creates and reloads multi-page documents',async()=>{
 const doc=await PDFDocument.create();
 doc.addPage([595,842]);
 doc.addPage([842,595]);
 const bytes=await doc.save();
 const reopened=await PDFDocument.load(bytes);
 assert.equal(reopened.getPageCount(),2);
 assert.equal(reopened.getPage(0).getSize().width,595);
 assert.equal(reopened.getPage(1).getSize().height,595);
});
test('PDF engine merges pages from multiple source documents',async()=>{
 const a=await PDFDocument.create();a.addPage([100,100]);
 const b=await PDFDocument.create();b.addPage([200,200]);b.addPage([300,300]);
 const merged=await PDFDocument.create();
 for(const src of [a,b]){
  const pages=await merged.copyPages(src,src.getPageIndices());
  pages.forEach(page=>merged.addPage(page));
 }
 assert.equal(merged.getPageCount(),3);
 assert.deepEqual(merged.getPages().map(page=>page.getSize().width),[100,200,300]);
});

test('PDF page operations preserve order, rotation and extraction',async()=>{
 const source=await PDFDocument.create();
 source.addPage([100,200]);
 source.addPage([200,300]);
 source.addPage([300,400]);
 source.getPages()[1].setRotation({type:'degrees',angle:90});
 const reordered=await PDFDocument.create();
 const pages=await reordered.copyPages(source,[2,0,1]);
 pages.forEach(page=>reordered.addPage(page));
 assert.deepEqual(reordered.getPages().map(page=>page.getSize().width),[300,100,200]);
 assert.equal(reordered.getPages()[2].getRotation().angle,90);
 const extracted=await PDFDocument.create();
 (await extracted.copyPages(reordered,[0,2])).forEach(page=>extracted.addPage(page));
 assert.equal(extracted.getPageCount(),2);
 assert.deepEqual(extracted.getPages().map(page=>page.getSize().width),[300,200]);
});

import {createPdfBackupPayload,parsePdfBackupPayload,PDF_BACKUP_FORMAT} from '../src/pdf-backup.js';
const pdfBlob=(text='%PDF-1.7\nTest')=>new Blob([text],{type:'application/pdf'});
test('PDF Library backup round-trips multiple valid PDFs',async()=>{
 const payload=await createPdfBackupPayload([{id:'doc-1',name:'notes',blob:pdfBlob(),updatedAt:123},{id:'doc-2',name:'class.pdf',blob:pdfBlob('%PDF-1.4\nSecond'),updatedAt:456}]);
 const parsed=parsePdfBackupPayload(payload);
 assert.equal(payload.format,PDF_BACKUP_FORMAT);assert.equal(parsed.documents.length,2);assert.equal(parsed.documents[0].name,'notes.pdf');assert.equal(parsed.documents[1].size,15);
});
test('PDF Library backup rejects altered bytes and mismatched sizes',async()=>{
 const payload=await createPdfBackupPayload([{id:'doc-1',name:'valid.pdf',blob:pdfBlob(),updatedAt:1}]);
 payload.documents[0].data='bm90IGEgcGRm';
 assert.throws(()=>parsePdfBackupPayload(payload),/damaged or mismatched PDF/i);
});
test('PDF Library backup rejects duplicate ids and unsupported versions',async()=>{
 const payload=await createPdfBackupPayload([{id:'doc-1',name:'a.pdf',blob:pdfBlob(),updatedAt:1}]);
 payload.documents.push({...payload.documents[0]});
 assert.throws(()=>parsePdfBackupPayload(payload),/duplicate document ID/i);
 payload.version=99;assert.throws(()=>parsePdfBackupPayload(payload),/unsupported or invalid/i);
});
test('PDF Library backup rejects non-PDF content and excessive record counts',async()=>{
 await assert.rejects(()=>createPdfBackupPayload([{id:'bad',name:'bad.pdf',blob:new Blob(['hello'])}]),/not a valid PDF/i);
 assert.throws(()=>parsePdfBackupPayload({format:PDF_BACKUP_FORMAT,version:1,documents:Array(101).fill({})}),/more than 100/i);
});


test('PDF Library backup checks declared size before reading a large blob',async()=>{
 let read=false;
 const oversized={size:20*1024*1024+1,arrayBuffer:async()=>{read=true;return new ArrayBuffer(0)}};
 await assert.rejects(()=>createPdfBackupPayload([{id:'large',name:'large.pdf',blob:oversized}]),/20 MB limit/i);
 assert.equal(read,false,'oversized PDF bytes must not be materialized in memory');
});
test('PDF Library backup export rejects duplicate or missing document IDs',async()=>{
 await assert.rejects(()=>createPdfBackupPayload([
  {id:'same',name:'one.pdf',blob:pdfBlob()},
  {id:'same',name:'two.pdf',blob:pdfBlob()}
 ]),/duplicate document ID/i);
 await assert.rejects(()=>createPdfBackupPayload([{name:'missing-id.pdf',blob:pdfBlob()}]),/missing or duplicate document ID/i);
});
test('PDF Library backup rejects invalid base64 before accepting a PDF record',async()=>{
 const payload=await createPdfBackupPayload([{id:'doc-1',name:'valid.pdf',blob:pdfBlob()}]);
 payload.documents[0].data='%%%not-base64%%%';
 assert.throws(()=>parsePdfBackupPayload(payload),/invalid encoded data/i);
});
test('PDF Library restore rejects an oversized JSON file before reading it',async()=>{
 let read=false;
 const file={size:30*1024*1024+1,text:async()=>{read=true;return '{}'}};
 const {readPdfBackupFile}=await import('../src/pdf-backup.js');
 await assert.rejects(()=>readPdfBackupFile(file),/too large/i);
 assert.equal(read,false,'oversized backup text must not be loaded into memory');
});
test('PDF Library backup supports an empty library and keeps a stable versioned envelope',async()=>{
 const payload=await createPdfBackupPayload([]);
 const parsed=parsePdfBackupPayload(payload);
 assert.equal(payload.version,1);
 assert.equal(parsed.documents.length,0);
 assert.equal(parsed.totalBytes,0);
});

test('PDF Library restore rejects cumulative decoded size before allocating the next document',async()=>{
 const payload=await createPdfBackupPayload([
  {id:'first',name:'first.pdf',blob:pdfBlob(),updatedAt:1},
  {id:'second',name:'second.pdf',blob:pdfBlob(),updatedAt:2}
 ]);
 const originalAtob=globalThis.atob;
 let decodeCalls=0;
 globalThis.atob=value=>{decodeCalls++;return originalAtob(value)};
 try{
  assert.throws(()=>parsePdfBackupPayload(payload,{maxBytes:20}),/20 MB restore limit/i);
  assert.equal(decodeCalls,1,'the second document must be rejected before Base64 decoding');
 }finally{globalThis.atob=originalAtob;}
});
