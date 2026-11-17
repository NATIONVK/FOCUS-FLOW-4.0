import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPdfPage,parsePdfPageRange,getPdfVirtualWindow,restorePdfProgress,getPdfCanvasScale,getPdfRenderProfile,shouldRefreshPdfWindow} from '../src/pdf-reader-virtual.js';

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

test('PDF canvas scale respects pixel and device-ratio budgets',()=>{
 const ratio=getPdfCanvasScale(2000,3000,3);
 assert.ok(ratio<=1.5);
 assert.ok(2000*3000*ratio*ratio<=4000000+1);
 assert.equal(getPdfCanvasScale(0,100,2),1);
 assert.equal(getPdfCanvasScale(100,100,2,1000000,1.5),1.5);
});
test('PDF virtual window refreshes near current boundaries only',()=>{
 assert.equal(shouldRefreshPdfWindow(11,10,14),true);
 assert.equal(shouldRefreshPdfWindow(13,10,14),true);
 assert.equal(shouldRefreshPdfWindow(12,10,14),false);
 assert.equal(shouldRefreshPdfWindow(3,10,14),true);
});


test('PDF render profile scales canvas memory budget for device memory tiers',()=>{
 assert.deepEqual(getPdfRenderProfile(2),{maxPixels:900000,maxRatio:1.1});
 assert.deepEqual(getPdfRenderProfile(4),{maxPixels:1400000,maxRatio:1.2});
 assert.deepEqual(getPdfRenderProfile(6),{maxPixels:1800000,maxRatio:1.3});
 assert.deepEqual(getPdfRenderProfile(8),{maxPixels:2400000,maxRatio:1.5});
 assert.deepEqual(getPdfRenderProfile(undefined),getPdfRenderProfile(4));
 assert.deepEqual(getPdfRenderProfile(0),getPdfRenderProfile(4));
});

test('PDF canvas scale uses a low-memory profile to reduce backing pixels',()=>{
 const profile=getPdfRenderProfile(4);
 const ratio=getPdfCanvasScale(2000,3000,3,profile.maxPixels,profile.maxRatio);
 assert.ok(2000*3000*ratio*ratio<=profile.maxPixels+1);
 assert.ok(ratio<=profile.maxRatio);
});
