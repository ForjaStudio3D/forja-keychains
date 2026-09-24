(() => {
 const video=document.querySelector('#hero-video'),reduced=window.forjaMotion;
 const overlay=document.querySelector('.hero-overlay');
 let visible=false,done=false,pending=false,watchdog=0,armed=false,curtain=0;
 // O titulo entra depois que a abertura termina, flutuando sobre o filme. Se a
 // reproducao nao acontecer -- movimento reduzido, autoplay recusado, rede que
 // nunca entrega -- ele entra assim mesmo: o texto nunca depende do video.
 function reveal(){clearTimeout(curtain);curtain=0;overlay&&overlay.setAttribute('data-revealed','');}
 function hideTitle(){clearTimeout(curtain);curtain=0;overlay&&overlay.removeAttribute('data-revealed');}
 function curtainUp(){clearTimeout(curtain);curtain=setTimeout(reveal,6000);}
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
 video.addEventListener('ended',()=>{done=true;video.dataset.ended='true';playButton.hidden=true;clearTimeout(watchdog);reveal();});
 // Retry when media becomes ready or a suspended page returns on iOS.
 video.addEventListener('canplay',sync);
 window.addEventListener('pageshow',()=>{measure();sync();});
 document.addEventListener('visibilitychange',()=>{measure();sync();});
 document.addEventListener('touchend',()=>{if(video.paused&&!playButton.hidden){pending=false;measure();play();}},{passive:true});
 reduced.addEventListener('change',()=>{video.hidden=reduced.matches;measure();sync();});
 if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();},{threshold:0}).observe(video);
 measure();
 function start(){
  armed=true;
  // The veil may have hidden the opening frames; rewind so nothing is missed.
  if(video.currentTime>0&&!done){try{video.currentTime=0;}catch{}}
  if(reduced.matches||video.error)reveal();else curtainUp();
  measure();sync();
 }
 (window.forjaReady||Promise.resolve()).then(start);

 // Trocar de idioma e uma pagina nova: rota, textos e filme mudam juntos. A
 // abertura roda de novo, atras do mesmo veu da primeira visita.
 document.addEventListener('forja:language',()=>{
  if(!armed)return;
  armed=false;done=false;pending=false;
  delete video.dataset.ended;
  hideTitle();clearTimeout(watchdog);playButton.hidden=true;
  const pronto=video.readyState>=3?Promise.resolve():new Promise(resolve=>{
   video.addEventListener('canplay',resolve,{once:true});
   video.addEventListener('error',resolve,{once:true});
  });
  (window.forjaVeil?window.forjaVeil(pronto):pronto).then(start);
 });
 reduced.addEventListener('change',()=>{if(reduced.matches)reveal();});
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
