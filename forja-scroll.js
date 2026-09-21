import {colors} from './color-palette.js?v=26';

const section=document.querySelector('#cores');
const stage=section.querySelector('.color-stage');
const canvas=document.querySelector('#forja-scroll');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const context=canvas.getContext('2d');
const frameCount=96,cache=new Map();
let visible=false,raf=0,revision=0,lastDraw='';

function progress(){
  if(reduced.matches)return 0;
  const rect=section.getBoundingClientRect();
  return Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-innerHeight)));
}

function frameImage(color,frame){
  const key=`${color}/${String((frame+frameCount)%frameCount).padStart(2,'0')}`;
  if(cache.has(key))return cache.get(key);
  const image=new Image();image.decoding='async';
  image.src=`assets/forja-scroll-v26/${key}.webp`;
  const pending=image.decode().then(()=>image);
  cache.set(key,pending);
  // Keep decoded image memory bounded while allowing nearby scroll reversals.
  if(cache.size>12)cache.delete(cache.keys().next().value);
  return pending;
}

async function draw(){
  raf=0;
  if(!visible||document.hidden||!context)return;
  const p=progress(),frame=Math.round(p*frameCount)%frameCount;
  const color=colors[stage.dataset.color]?stage.dataset.color:'branco';
  const width=canvas.clientWidth,height=canvas.clientHeight;
  const ratio=Math.min(devicePixelRatio,1.5);
  const signature=[frame,color,width,height,ratio].join(':');
  canvas.dataset.progress=p.toFixed(4);
  canvas.dataset.yaw=(p*Math.PI*2).toFixed(4);
  if(signature===lastDraw)return;
  lastDraw=signature;
  const version=++revision;
  try{
    const image=await frameImage(color,frame);
    if(version!==revision||!visible||document.hidden){if(version===revision)lastDraw='';return;}
    const w=Math.round(width*ratio),h=Math.round(height*ratio);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,width,height);
    context.drawImage(image,(width-height)/2,0,height,height);
    stage.classList.add('is-render-ready');
    delete stage.dataset.error;
    canvas.dataset.renderedColor=color;
    canvas.dataset.renderedFrame=String(frame);
    canvas.dataset.frame=String(Number(canvas.dataset.frame||0)+1);
    // Only adjacent frames are prefetched, rather than the entire sequence.
    for(const adjacent of [frame-1,frame+1])frameImage(color,adjacent).catch(()=>{});
  }catch{
    if(version!==revision)return;
    stage.classList.remove('is-render-ready');
    stage.dataset.error='true';
  }
}

function schedule(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(draw);}
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{rootMargin:'100px'}).observe(section);
window.addEventListener('scroll',schedule,{passive:true});
new ResizeObserver(schedule).observe(stage);
new MutationObserver(schedule).observe(stage,{attributes:true,attributeFilter:['data-color']});
document.addEventListener('visibilitychange',schedule);
reduced.addEventListener('change',schedule);
