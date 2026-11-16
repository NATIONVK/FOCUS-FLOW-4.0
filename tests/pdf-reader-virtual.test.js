import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPdfPage,parsePdfPageRange,getPdfVirtualWindow,restorePdfProgress} from '../src/pdf-reader-virtual.js';

test('PDF page range parser supports individual pages, ranges and de-duplicates',()=>{
 assert.deepEqual(parsePdfPageRange('1-3, 5, 3, 8-9',10),[1,2,3,5,8,9]);
});
test('PDF page range parser rejects malformed and out-of-document ranges',()=>{
 for(const value of ['', '1,,2', '0', '4-2', '1-11', '2;3'])assert.throws(()=>parsePdfPageRange(value,10));
});
test('PDF virtual window stays bounded at document edges',()=>{
 assert.deepEqual(getPdfVirtualWindow(1,100).pages,[1,2,3]);
 assert.deepEqual(getPdfVirtualWindow(50,100).pages,[48,49,50,51,52]);
 assert.deepEqual(getPdfVirtualWindow(100,100).pages,[98,99,100]);
 assert.equal(getPdfVirtualWindow(50,100).pages.length,5);
});
test('PDF progress restoration clamps invalid pages and zoom to safe bounds',()=>{
 assert.deepEqual(restorePdfProgress({page:999,zoom:9},12),{page:12,zoom:3});
 assert.deepEqual(restorePdfProgress({page:-4,zoom:.01},12),{page:1,zoom:.45});
 assert.deepEqual(restorePdfProgress(null,12),{page:1,zoom:1});
});
test('PDF page clamping tolerates missing or non-numeric values',()=>{
 assert.equal(clampPdfPage('not-a-page',8),1);
 assert.equal(clampPdfPage(4.9,8),4);
 assert.equal(clampPdfPage(0,8),1);
});
