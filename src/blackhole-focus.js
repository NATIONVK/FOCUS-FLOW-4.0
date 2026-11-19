const KEY='focus-flow-blackhole-v3';
const defaults={particles:true,energy:true,reducedMotion:false,theme:'violet'};
export function getBlackHoleSettings(){
  try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return {...defaults};}
}
export function saveBlackHoleSettings(patch){
  const next={...getBlackHoleSettings(),...patch};
  try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}
  return next;
}
export function renderBlackHoleSettings(){
  const s=getBlackHoleSettings();
  return `<section class="panel bh3-settings"><span class="eyebrow">BLACK HOLE FOCUS 3.0</span><h3>Your Focus Universe</h3><p class="muted">Customize the live cosmic scene. These preferences are stored locally on this device.</p>
  <label class="bh3-setting"><span><b>Orbiting study particles</b><small>Show subtle particles orbiting the event horizon.</small></span><input type="checkbox" id="bh3Particles" ${s.particles?'checked':''}></label>
  <label class="bh3-setting"><span><b>Gravity energy response</b><small>Let the visual intensity respond to elapsed focus time.</small></span><input type="checkbox" id="bh3Energy" ${s.energy?'checked':''}></label>
  <label class="bh3-setting"><span><b>Reduce motion</b><small>Lower animation intensity to save battery and improve comfort.</small></span><input type="checkbox" id="bh3ReducedMotion" ${s.reducedMotion?'checked':''}></label>
  <div class="goal-setting"><label for="bh3Theme">Cosmic color</label><select id="bh3Theme"><option value="violet" ${s.theme==='violet'?'selected':''}>Nebula Violet</option><option value="cyan" ${s.theme==='cyan'?'selected':''}>Event Horizon Cyan</option><option value="amber" ${s.theme==='amber'?'selected':''}>Solar Amber</option></select></div>
  <p class="muted">Milestones: 1, 10 and 100 cumulative focus hours. Existing study records remain unchanged.</p></section>`;
}
export function bindBlackHoleSettings(onChange=()=>{}){
  const update=()=>{const patch={particles:document.querySelector('#bh3Particles')?.checked??true,energy:document.querySelector('#bh3Energy')?.checked??true,reducedMotion:document.querySelector('#bh3ReducedMotion')?.checked??false,theme:document.querySelector('#bh3Theme')?.value||'violet'};saveBlackHoleSettings(patch);onChange();};
  ['#bh3Particles','#bh3Energy','#bh3ReducedMotion','#bh3Theme'].forEach(sel=>document.querySelector(sel)?.addEventListener('change',update));
}
export function mountBlackHoleFocus(scene){
  if(!scene)return;
  const s=getBlackHoleSettings();
  scene.dataset.bh3Theme=s.theme;
  scene.classList.toggle('bh3-reduced-motion',s.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches);
  let orbit=scene.querySelector('.bh3-orbiters');
  if(!orbit){orbit=document.createElement('div');orbit.className='bh3-orbiters';orbit.setAttribute('aria-hidden','true');scene.append(orbit);}
  orbit.hidden=!s.particles;
  if(!orbit.childElementCount){for(let i=0;i<8;i++){const p=document.createElement('i');p.className='bh3-orbiter';p.style.setProperty('--i',String(i));p.style.setProperty('--delay',String(-i*.82)+'s');orbit.append(p);}}
  return (elapsed=0,paused=false)=>{
    const current=getBlackHoleSettings();
    scene.dataset.bh3Theme=current.theme;
    scene.classList.toggle('bh3-reduced-motion',current.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches);
    orbit.hidden=!current.particles;
    scene.classList.toggle('bh3-energy-off',!current.energy);
    scene.style.setProperty('--bh3-progress',String(Math.min(1,elapsed/3600)));
    scene.classList.toggle('bh3-paused',paused);
  };
}
