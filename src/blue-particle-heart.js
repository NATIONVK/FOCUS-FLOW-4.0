export function mountBlueParticleHeart(root){
 if(!root)return ()=>{};
 const canvas=root.querySelector('#blueHeartCanvas'),ctx=canvas?.getContext('2d',{alpha:false});
 if(!canvas||!ctx)return ()=>{};
 const TAU=Math.PI*2,rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
 const mobileCount=1875,desktopCount=3150,baseScale=.235,dissolveDuration=2.8,gatherDuration=2.1,baseSpeed=3;
 const palette=['#258fff','#a855f7','#ff4fa3','#ff8a3d','#35d6c5','#f5d547'];
 let speed=baseSpeed,currentColor=palette[0];
 const hexRgb=h=>({r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)});
 const mixColor=(a,b,t)=>{const x=hexRgb(a),y=hexRgb(b);return `rgb(${Math.round(lerp(x.r,y.r,t))},${Math.round(lerp(x.g,y.g,t))},${Math.round(lerp(x.b,y.b,t))})`;};
 function updateTimedEffects(){const slot=900,hold=720,stage=Math.floor(time/slot)%palette.length,within=time%slot,next=(stage+1)%palette.length,blend=clamp((within-hold)/180,0,1);currentColor=blend>0?mixColor(palette[stage],palette[next],blend):palette[stage];speed=baseSpeed+Math.min(time/900,8)*.45;root.style.setProperty('--heart-color',currentColor);}
 let W=0,H=0,DPR=1,particles=[],last=0,time=0,mode='normal',gather=0,dissolve=0,nextDissolve=24,beat=0,raf=0,active=true;
 const center={x:0,y:0},pointer={x:0,y:0,down:false};
 const point=t=>({x:16*Math.pow(Math.sin(t),3),y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))});
 const target=()=>{const p=point(Math.random()*TAU),r=Math.sqrt(Math.random());return{x:p.x*r*.94,y:p.y*r*.94};};
 const scale=()=>Math.min(W,H)*baseScale/16;
 const pos=p=>{const z=1+p.z*.08,pulse=1+beat*.052*1.8,k=scale();return{x:center.x+p.target.x*k*pulse*z,y:center.y+p.target.y*k*pulse*z};};
 class Particle{
  constructor(){this.target=target();this.x=rand(-W,W*2);this.y=rand(-H,H*2);this.vx=0;this.vy=0;this.z=rand(-.6,.6);this.size=rand(.85,1.15);this.phase=rand(0,TAU);this.alpha=rand(.76,.82);this.spiral=rand(-1,1);this.sx=this.x;this.sy=this.y;this.angle=rand(0,TAU);this.orbit=rand(.5,1.5);}
  setStart(){this.sx=this.x;this.sy=this.y;}
  normal(dt){const q=pos(this),w1=Math.sin(time*2.1+this.phase),w2=Math.cos(time*1.55+this.phase*1.7),w3=Math.sin(time*.85+this.phase*2.4);this.angle+=dt*(.45+this.orbit*.3)*speed;const ox=Math.cos(this.angle)*this.orbit*1.15,oy=Math.sin(this.angle)*this.orbit*1.15,f=clamp(dt*6.5,0,1);this.x=lerp(this.x,q.x+(w1*2.3+w3+ox)*speed,f);this.y=lerp(this.y,q.y+(w2*2.3+w3*.8+oy)*speed,f);this.z=clamp(this.z+Math.sin(time*.7+this.phase)*dt*.045*speed,-.6,.6);}
  explode(dt){this.vx*=Math.pow(.985,dt*60);this.vy*=Math.pow(.985,dt*60);this.x+=this.vx*dt;this.y+=this.vy*dt;if(pointer.down){const dx=pointer.x-this.x,dy=pointer.y-this.y,f=clamp(16000/(dx*dx+dy*dy+120),0,18);this.vx+=dx*f*dt;this.vy+=dy*f*dt;}}
  gatherTo(dt,p){const q=pos(this),a=this.spiral*(1-p)*5.2,r=(1-p)*Math.min(W,H)*.10,e=p*p*(3-2*p),f=clamp(dt*10*speed,0,1);this.x=lerp(this.x,lerp(this.sx,q.x,e)+Math.cos(a)*r,f);this.y=lerp(this.y,lerp(this.sy,q.y,e)+Math.sin(a)*r,f);this.vx*=.9;this.vy*=.9;}
  draw(){const d=1+this.z*.08,t=.97+.03*Math.sin(time*1.5+this.phase),a=this.alpha*t,s=this.size*d;ctx.globalAlpha=a;ctx.fillStyle=currentColor;ctx.beginPath();ctx.arc(this.x,this.y,s,0,TAU);ctx.fill();ctx.globalAlpha=a*.08;ctx.beginPath();ctx.arc(this.x,this.y,s*2,0,TAU);ctx.fill();}
 }
 function resize(){const ow=W,oh=H;W=root.clientWidth||innerWidth;H=root.clientHeight||innerHeight;DPR=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);if(!particles.length){center.x=W/2;center.y=H/2;for(let i=0,n=W<700?mobileCount:desktopCount;i<n;i++)particles.push(new Particle());}else{const sx=ow?W/ow:1,sy=oh?H/oh:1;for(const p of particles){p.x*=sx;p.y*=sy;p.sx*=sx;p.sy*=sy;}center.x=W/2;center.y=H/2;}}
 function explode(){if(mode==='explode')return;mode='explode';for(const p of particles){const dx=p.x-center.x,dy=p.y-center.y,d=Math.hypot(dx,dy)+1,k=rand(100,390)*speed;p.vx=dx/d*k+rand(-90,90)*speed;p.vy=dy/d*k+rand(-90,90)*speed;p.setStart();}}
 function reform(x,y){center.x=clamp(x,40,Math.max(40,W-40));center.y=clamp(y,40,Math.max(40,H-40));gather=0;for(const p of particles){p.setStart();p.spiral=rand(-1,1);}mode='gather';}
 function startDissolve(){if(mode!=='normal')return;mode='dissolve';dissolve=0;for(const p of particles){const dx=p.x-center.x,dy=p.y-center.y,d=Math.hypot(dx,dy)+1;p.vx=dx/d*rand(20,100)+rand(-20,20);p.vy=dy/d*rand(20,100)+rand(-20,20);p.setStart();}}
 function down(e){if(e.target.closest('button'))return;e.preventDefault();pointer.x=e.clientX;pointer.y=e.clientY;pointer.down=true;if(mode==='gather'||mode==='dissolve'){mode='explode';for(const p of particles)p.setStart();}explode();}
 function move(e){if(!pointer.down)return;e.preventDefault();pointer.x=e.clientX;pointer.y=e.clientY;}
 function up(e){if(!pointer.down)return;if(Number.isFinite(e?.clientX)){pointer.x=e.clientX;pointer.y=e.clientY;}pointer.down=false;reform(pointer.x||W/2,pointer.y||H/2);}
 function frame(ts){if(!active||!root.isConnected)return;if(!last)last=ts;const dt=Math.min((ts-last)/1000,.033);last=ts;time+=dt;updateTimedEffects();const phase=time*1.15,primary=Math.pow(Math.max(0,Math.sin(phase)),12),secondary=Math.pow(Math.max(0,Math.sin(phase-.72)),18)*.42;beat=Math.min(1,primary+secondary);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  if(mode==='normal'){for(const p of particles)p.normal(dt);if(time>nextDissolve){startDissolve();nextDissolve=time+rand(24,34);}}
  else if(mode==='explode'){for(const p of particles)p.explode(dt);if(!pointer.down)reform(pointer.x||W/2,pointer.y||H/2);}
  else if(mode==='gather'){gather+=dt;const k=clamp(gather/gatherDuration,0,1);for(const p of particles)p.gatherTo(dt,k);if(k>=1){mode='normal';for(const p of particles){const q=pos(p);p.x=q.x;p.y=q.y;p.vx=p.vy=0;}}}
  else if(mode==='dissolve'){dissolve+=dt;const k=clamp(dissolve/dissolveDuration,0,1);for(const p of particles){p.vx*=Math.pow(.965,dt*60);p.vy*=Math.pow(.965,dt*60);p.x+=p.vx*dt;p.y+=p.vy*dt;if(k>.45){const q=pos(p),f=clamp(dt*1.5,0,1);p.x=lerp(p.x,q.x,f);p.y=lerp(p.y,q.y,f);}}if(k>=1){for(const p of particles){const q=pos(p);p.x=q.x;p.y=q.y;p.vx=p.vy=0;}mode='normal';}}
  for(const p of particles)p.draw();ctx.globalAlpha=1;raf=requestAnimationFrame(frame);
 }
 canvas.addEventListener('pointerdown',down,{passive:false});canvas.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('resize',resize,{passive:true});resize();raf=requestAnimationFrame(frame);
 return ()=>{active=false;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('resize',resize);particles.length=0;};
}
