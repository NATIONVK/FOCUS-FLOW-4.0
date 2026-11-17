export function clampPdfPage(value,total){
 const count=Math.max(1,Math.floor(Number(total)||1));
 const page=Number(value);
 return Number.isFinite(page)?Math.min(count,Math.max(1,Math.floor(page))):1;
}

export function parsePdfPageRange(value,total){
 const count=Math.max(1,Math.floor(Number(total)||1));
 const raw=String(value??'').trim();
 if(!raw)throw new Error('Enter a page range, for example 1-3, 5, 8-10.');
 const pages=new Set();
 for(const part of raw.split(',')){
  const match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!match)throw new Error('Use page ranges such as 1-3, 5, 8-10.');
  const first=Number(match[1]),last=Number(match[2]||match[1]);
  if(first<1||last<first||last>count)throw new Error('A page range is outside this document (1-'+count+').');
  for(let page=first;page<=last;page++)pages.add(page);
 }
 return [...pages].sort((a,b)=>a-b);
}

export function getPdfVirtualWindow(current,total,radius=2){
 const count=Math.max(0,Math.floor(Number(total)||0));
 if(!count)return {start:0,end:-1,pages:[]};
 const center=clampPdfPage(current,count);
 const size=Math.max(0,Math.min(8,Math.floor(Number(radius)||0)));
 const start=Math.max(1,center-size),end=Math.min(count,center+size);
 return {start,end,pages:Array.from({length:end-start+1},(_,i)=>start+i)};
}

export function restorePdfProgress(value,total){
 const page=clampPdfPage(value?.page,total);
 const rawZoom=Number(value?.zoom);
 const zoom=Number.isFinite(rawZoom)?Math.min(3,Math.max(.45,rawZoom)):1;
 return {page,zoom};
}

export function getPdfCanvasScale(width,height,devicePixelRatio=1,maxPixels=4000000,maxRatio=1.5){
 const w=Number(width),h=Number(height),dpr=Number(devicePixelRatio),budget=Number(maxPixels),cap=Number(maxRatio);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return 1;
 const safeBudget=Number.isFinite(budget)&&budget>0?budget:4000000;
 const safeCap=Number.isFinite(cap)&&cap>0?cap:1.5;
 const safeDpr=Number.isFinite(dpr)&&dpr>0?dpr:1;
 return Math.max(.1,Math.min(safeDpr,safeCap,Math.sqrt(safeBudget/(w*h))));
}
export function shouldRefreshPdfWindow(page,start,end,buffer=1){
 const p=Number(page),a=Number(start),b=Number(end),margin=Math.max(0,Math.floor(Number(buffer)||0));
 if(!Number.isFinite(p)||!Number.isFinite(a)||!Number.isFinite(b)||a>b)return true;
 return p<=a+margin||p>=b-margin;
}


export function getPdfRenderProfile(deviceMemory){
 const memory=Number(deviceMemory);
 const tier=Number.isFinite(memory)&&memory>0?memory:4;
 if(tier<=2)return {maxPixels:900000,maxRatio:1.1};
 if(tier<=4)return {maxPixels:1400000,maxRatio:1.2};
 if(tier<=6)return {maxPixels:1800000,maxRatio:1.3};
 return {maxPixels:2400000,maxRatio:1.5};
}
