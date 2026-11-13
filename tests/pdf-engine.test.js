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
