(() => {
 const video=document.querySelector('#hero-video'),reduced=window.forjaMotion;let visible=false,done=false;
 const playButton=document.createElement('button');playButton.type='button';playButton.className='media-start';playButton.textContent='Ver a apresentação';playButton.hidden=true;video.closest('figure').append(playButton);
 video.muted=true;video.defaultMuted=true;
 function play(){video.play().then(()=>{playButton.hidden=true;}).catch(()=>{playButton.hidden=done||reduced.matches;});}
 function sync(){if(done||reduced.matches||document.hidden||!visible){video.pause();if(reduced.matches)playButton.hidden=true;return;}play();}
 playButton.addEventListener('click',play);
 video.addEventListener('ended',()=>{done=true;video.dataset.ended='true';});
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();},{threshold:0}).observe(video);
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',()=>{if(reduced.matches){video.pause();video.hidden=true;}else{video.hidden=false;const rect=video.getBoundingClientRect();visible=rect.bottom>0&&rect.top<innerHeight;sync();}});
 if(reduced.matches)video.hidden=true;
})();

(() => {
 const phrase=document.querySelector('#hero-title'),word=phrase.querySelector('.hero-verb'),reduced=window.forjaMotion,words=['usa.','lembra.','compartilha.'];
 let visible=false,timer=0,fade=0,index=0;
 function stop(){clearTimeout(timer);clearTimeout(fade);timer=fade=0;word.classList.remove('is-changing');}
 function schedule(){stop();if(!visible||document.hidden||reduced.matches)return;timer=setTimeout(()=>{word.classList.add('is-changing');fade=setTimeout(()=>{index=(index+1)%words.length;word.textContent=words[index];word.dataset.word=index;word.classList.remove('is-changing');schedule();},160);},2600);}
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(phrase);
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',()=>{if(reduced.matches){index=0;word.textContent=words[0];word.dataset.word=0;}schedule();});
})();
