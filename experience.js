(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const states=new Map([...document.querySelectorAll('.detail-film')].map(video=>[video,{visible:false,done:false}]));
  function sync(video,state){
    if(reduced.matches||document.hidden||!state.visible||state.done){video.pause();return;}
    if(video.paused)video.play().catch(()=>{});
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const state=states.get(entry.target);state.visible=entry.isIntersecting&&entry.intersectionRatio>=.35;sync(entry.target,state);
  }),{threshold:[0,.35]});
  states.forEach((state,video)=>{video.addEventListener('ended',()=>{state.done=true;observer.unobserve(video);});observer.observe(video);});
  document.addEventListener('visibilitychange',()=>states.forEach((state,video)=>sync(video,state)));
  reduced.addEventListener('change',()=>states.forEach((state,video)=>sync(video,state)));
})();
(() => {
 const word=document.querySelector('.detail-word'),colors=['#C8202D','#2678CC','#A77900'],reduced=matchMedia('(prefers-reduced-motion: reduce)');let visible=false,timer,index=0;
 function sync(){clearInterval(timer);if(visible&&!document.hidden&&!reduced.matches)timer=setInterval(()=>{index=(index+1)%colors.length;word.style.color=colors[index];word.dataset.color=String(index);},1800);}
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();}).observe(word);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
})();
