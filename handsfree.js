(() => {
 const track=document.querySelector('.handsfree-track'),dots=[...document.querySelectorAll('[data-handsfree-index]')],labels=['Preto e dourado · iPhone branco','Branco e azul · iPhone prata'];let current=0;
 const reduced=window.forjaMotion;
 function go(index){current=(index+2)%2;track.scrollTo({left:current*track.clientWidth,behavior:reduced.matches?'instant':'smooth'});}
 function update(){current=Math.round(track.scrollLeft/track.clientWidth);dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));document.querySelector('#handsfree-color').textContent=labels[current];}
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
 document.querySelectorAll('[data-handsfree-step]').forEach(button=>button.addEventListener('click',()=>go(current+Number(button.dataset.handsfreeStep))));
 track.addEventListener('scroll',update,{passive:true});track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(current+(e.key==='ArrowRight'?1:-1));}});
 new ResizeObserver(()=>track.scrollTo({left:current*track.clientWidth,behavior:'instant'})).observe(track);
})();
