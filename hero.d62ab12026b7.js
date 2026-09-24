(() => {
 const video=document.querySelector('#hero-video'),reduced=window.forjaMotion;
 let visible=false,done=false,pending=false,watchdog=0,armed=false;
 const playButton=document.createElement('button');playButton.type='button';playButton.className='media-start';playButton.textContent='Ver a apresentação';playButton.hidden=true;video.closest('figure').append(playButton);
 video.muted=true;video.defaultMuted=true;video.playsInline=true;
 const eligible=()=>armed&&!done&&!reduced.matches&&!document.hidden&&visible;
 function measure(){const r=video.getBoundingClientRect();visible=r.bottom>0&&r.top<innerHeight;}
 function fallback(){if(eligible()&&video.paused&&video.readyState>=3)playButton.hidden=false;}
 function play(){
  if(!eligible()||pending)return;
  pending=true;clearTimeout(watchdog);watchdog=setTimeout(fallback,4000);
  video.play().then(()=>{if(!eligible())video.pause();else playButton.hidden=true;})
   .catch(error=>{if(error&&error.name==='NotAllowedError'&&eligible())playButton.hidden=false;else fallback();})
   .finally(()=>{pending=false;});
 }
 function sync(){
  video.hidden=reduced.matches;
  if(!eligible()){video.pause();clearTimeout(watchdog);playButton.hidden=true;return;}
  play();
 }
 playButton.addEventListener('click',()=>{pending=false;measure();play();});
 video.addEventListener('playing',()=>{clearTimeout(watchdog);playButton.hidden=true;});
 video.addEventListener('ended',()=>{done=true;video.dataset.ended='true';playButton.hidden=true;clearTimeout(watchdog);});
 // Retry when media becomes ready or a suspended page returns on iOS.
 video.addEventListener('canplay',sync);
 window.addEventListener('pageshow',()=>{measure();sync();});
 document.addEventListener('visibilitychange',()=>{measure();sync();});
 document.addEventListener('touchend',()=>{if(video.paused&&!playButton.hidden){pending=false;measure();play();}},{passive:true});
 reduced.addEventListener('change',()=>{video.hidden=reduced.matches;measure();sync();});
 if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();},{threshold:0}).observe(video);
 measure();
 (window.forjaReady||Promise.resolve()).then(()=>{
  armed=true;
  // The veil may have hidden the opening frames; rewind so nothing is missed.
  if(video.currentTime>0&&!done){try{video.currentTime=0;}catch{}}
  measure();sync();
 });
})();

(() => {
 const phrase=document.querySelector('#hero-title'),word=phrase.querySelector('.hero-verb'),reduced=window.forjaMotion,words=['usa.','lembra.','compartilha.'];
 let visible=false,timer=0,fade=0,index=0;
 function stop(){clearTimeout(timer);clearTimeout(fade);timer=fade=0;word.classList.remove('is-changing');}
 function schedule(){stop();if(!released||!visible||document.hidden||reduced.matches)return;timer=setTimeout(()=>{word.classList.add('is-changing');fade=setTimeout(()=>{index=(index+1)%words.length;word.textContent=words[index];word.dataset.word=index;word.classList.remove('is-changing');schedule();},160);},2600);}
 let released=false;(window.forjaReady||Promise.resolve()).then(()=>{released=true;schedule();});
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(phrase);
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',()=>{if(reduced.matches){index=0;word.textContent=words[0];word.dataset.word=0;}schedule();});
})();
