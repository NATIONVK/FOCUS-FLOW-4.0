import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, degrees, rgb } from 'pdf-lib';

test('PDF engine creates and reloads multi-page documents',async()=>{
 const doc=await PDFDocument.create();doc.addPage([595,842]);doc.addPage([842,595]);
 const bytes=await doc.save();const reopened=await PDFDocument.load(bytes);
 assert.equal(reopened.getPageCount(),2);
 assert.deepEqual(reopened.getPage(0).getSize(),{width:595,height:842});
});
test('PDF page editor operations support rotate, crop, text and watermark overlays',async()=>{
 const doc=await PDFDocument.create();const page=doc.addPage([595,842]);const font=await doc.embedFont('Helvetica');
 page.setRotation(degrees(90));page.setCropBox(20,20,555,802);
 page.drawText('PDF MASTER STUDIO',{x:40,y:80,size:18,font,color:rgb(0.2,0.2,0.2)});
 page.drawText('CONFIDENTIAL',{x:120,y:400,size:30,font,opacity:0.2,rotate:degrees(35)});
 const out=await PDFDocument.load(await doc.save());
 assert.equal(out.getPageCount(),1);assert.equal(out.getPage(0).getRotation().angle,90);
 assert.equal(out.getPage(0).getCropBox().width,555);
});
test('PDF pages can be duplicated, removed, and reordered into a new document',async()=>{
 const source=await PDFDocument.create();source.addPage([100,200]);source.addPage([200,300]);source.addPage([300,400]);
 const [copy]=await source.copyPages(source,[1]);source.insertPage(2,copy);
 assert.equal(source.getPageCount(),4);
 source.removePage(0);assert.equal(source.getPageCount(),3);
 const reordered=await PDFDocument.create();
 (await reordered.copyPages(source,[2,0,1])).forEach(p=>reordered.addPage(p));
 assert.deepEqual(reordered.getPages().map(p=>p.getSize().width),[200,200,300]);
});
test('PDF merge engine copies pages from multiple documents',async()=>{
 const a=await PDFDocument.create();a.addPage([100,100]);
 const b=await PDFDocument.create();b.addPage([200,200]);b.addPage([300,300]);
 const merged=await PDFDocument.create();
 for(const src of [a,b]) (await merged.copyPages(src,src.getPageIndices())).forEach(p=>merged.addPage(p));
 assert.equal(merged.getPageCount(),3);
});
