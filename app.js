import {colors} from './color-palette.js?v=26';
(() => {
  'use strict';

  const keys=Object.keys(colors),stage=document.querySelector('.color-stage'),product=document.querySelector('#color-product'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),play=document.querySelector('#color-play');
  let current='branco',revision=0,animation,visible=false,playing=!reduced.matches,timer;
  async function selectColor(key,animate=false){const rev=++revision,c=colors[key],candidate=new Image();candidate.src=`assets/forja-${key}-v26.webp`;try{await candidate.decode();}catch{document.querySelector('#color-name').textContent='Não foi possível carregar essa cor.';return;}if(rev!==revision)return;current=key;document.querySelectorAll('.swatch[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===key)));animation?.cancel();product.src=candidate.src;product.alt=`Chaveiro Forja Studio ${c.name.toLowerCase()} com marca em bronze`;stage.dataset.color=key;stage.style.backgroundColor=c.background;document.querySelector('#color-name').textContent=c.name;if(animate&&!reduced.matches)animation=product.animate([{opacity:.5,transform:'rotate(5deg)'},{opacity:1,transform:'rotate(8deg)'}],{duration:260,easing:'cubic-bezier(.23,1,.32,1)'});}
  function sync(){clearInterval(timer);play.textContent=playing?'Pausar cores':'Reproduzir cores';play.setAttribute('aria-pressed',String(playing));stage.dataset.playing=String(playing&&visible&&!document.hidden);if(playing&&visible&&!document.hidden)timer=setInterval(()=>selectColor(keys[(keys.indexOf(current)+1)%keys.length],true),2600);}
  document.querySelectorAll('.swatch[data-color]').forEach(b=>b.addEventListener('click',e=>{playing=false;sync();selectColor(b.dataset.color,e.detail>0);}));play.addEventListener('click',()=>{playing=!playing;sync();});new IntersectionObserver(([e])=>{visible=e.isIntersecting&&e.intersectionRatio>=.3;sync();},{threshold:[0,.3]}).observe(stage);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;animation?.cancel();sync();}});selectColor('branco');sync();
  function contact(idea){window.open(`https://wa.me/5518998265902?text=${encodeURIComponent('Olá, Forja! '+idea)}`,'_blank','noopener,noreferrer');}
  document.querySelectorAll('.choose-model').forEach(b=>b.addEventListener('click',()=>contact(b.dataset.finish?`Gostaria de um projeto com ${b.dataset.finish.toLowerCase()}.`:`Gostaria de um projeto inspirado em ${b.dataset.model.replace('Personalizado · ','')}.`)));
  document.querySelector('.color-copy .text-link[href]').addEventListener('click',e=>{e.preventDefault();contact(`Gostaria de criar um chaveiro Forja Studio na cor ${colors[current].name.toLowerCase()}.`);});
  const ideaForm=document.querySelector('#idea-form'),ideaInput=document.querySelector('#visitor-idea');
  // Native form submission opens a WhatsApp draft; only the visitor sends it.
  ideaForm.addEventListener('formdata',event=>{
    const idea=ideaInput.value.trim();
    event.formData.set('text','Sobre o keychain smart:'+(idea?'\n'+idea:''));
  });
  document.querySelectorAll('[data-idea]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    document.querySelector('#contato').scrollIntoView({behavior:reduced.matches||event.detail===0?'instant':'smooth',block:'start'});
    if(link.dataset.idea&&!ideaInput.value.trim())ideaInput.value=link.dataset.idea;
    ideaInput.focus({preventScroll:true});
  }));

  const entrances=new Set(),observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;observer.unobserve(e.target);if(reduced.matches)return;const a=e.target.animate([{opacity:.45,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'cubic-bezier(.23,1,.32,1)'});entrances.add(a);a.finished.then(()=>entrances.delete(a)).catch(()=>{});}),{threshold:.18});document.querySelectorAll('.section-heading,.pricing>h2,.contact-heading').forEach(e=>observer.observe(e));reduced.addEventListener('change',()=>{if(reduced.matches)entrances.forEach(a=>a.cancel());});
})();
