import {colors} from './color-palette.js?v=26';
(() => {
  'use strict';

  const stage=document.querySelector('.color-stage'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function contact(idea){window.open(`https://wa.me/5518998265902?text=${encodeURIComponent('Olá, Forja! '+idea)}`,'_blank','noopener,noreferrer');}
  document.querySelectorAll('.choose-model').forEach(b=>b.addEventListener('click',()=>contact(b.dataset.finish?`Gostaria de um projeto com ${b.dataset.finish.toLowerCase()}.`:`Gostaria de um projeto inspirado em ${b.dataset.model.replace('Personalizado · ','')}.`)));
  document.querySelector('.color-copy .text-link[href]').addEventListener('click',e=>{e.preventDefault();contact(`Gostaria de criar um chaveiro Forja Studio na cor ${colors[stage.dataset.color].name.toLowerCase()}.`);});
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
