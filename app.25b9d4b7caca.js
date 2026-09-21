import {colors} from './color-palette.8f85882c2a3a.js';
(() => {
  'use strict';

  const stage=document.querySelector('.color-stage'),reduced=window.forjaMotion;
  function contact(idea){window.open(`https://wa.me/5518998265902?text=${encodeURIComponent((window.forjaI18n.lang==='en'?'Hello, Forja! ':'Olá, Forja! ')+idea)}`,'_blank','noopener,noreferrer');}
  document.querySelectorAll('.choose-model').forEach(b=>b.addEventListener('click',()=>contact(b.dataset.finish?(window.forjaI18n.lang==='en'?`I would like a project with ${b.dataset.finish}.`:`Gostaria de um projeto com ${b.dataset.finish.toLowerCase()}.`):(window.forjaI18n.lang==='en'?`I would like a project inspired by ${b.dataset.model.replace('Personalizado · ','')}.`:`Gostaria de um projeto inspirado em ${b.dataset.model.replace('Personalizado · ','')}.`))));
  document.querySelector('.color-copy .text-link[href]').addEventListener('click',e=>{e.preventDefault();contact(window.forjaI18n.lang==='en'?`I would like a Forja Studio keychain in ${window.forjaI18n.t(colors[stage.dataset.color].name).toLowerCase()}.`:`Gostaria de criar um chaveiro Forja Studio na cor ${colors[stage.dataset.color].name.toLowerCase()}.`);});
  const ideaForm=document.querySelector('#idea-form'),ideaInput=document.querySelector('#visitor-idea');
  // Native form submission opens a WhatsApp draft; only the visitor sends it.
  ideaForm.addEventListener('formdata',event=>{
    const idea=ideaInput.value.trim();
    event.formData.set('text',(window.forjaI18n.lang==='en'?'About the Smart keychain:':'Sobre o keychain smart:')+(idea?'\n'+idea:''));
  });
  document.querySelectorAll('[data-idea]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    document.querySelector('#contato').scrollIntoView({behavior:reduced.matches||event.detail===0?'instant':'smooth',block:'start'});
    if(link.dataset.idea&&!ideaInput.value.trim())ideaInput.value=link.dataset.idea;
    ideaInput.focus({preventScroll:true});
  }));

  // Reveal content once, without translating sticky sections or hiding content if JS fails.
  const entrances=new Set();
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    observer.unobserve(entry.target);
    const gentle=reduced.matches;
    const animation=entry.target.animate([
      {opacity:0,transform:gentle?'none':'translateY(18px)'},
      {opacity:1,transform:gentle?'none':'translateY(0)'}
    ],{duration:gentle?180:520,easing:'cubic-bezier(.23,1,.32,1)'});
    entry.target.dataset.revealed='true';
    entrances.add(animation);animation.finished.finally(()=>entrances.delete(animation)).catch(()=>{});
  }),{threshold:0,rootMargin:'0px 0px -36px 0px'});
  document.querySelectorAll('.color-copy,.section-heading,.use-grid>figure,.nfc-copy,.nfc-comic,.relief-grid>*,.pricing>h2,.price-options>*,.contact-heading,.idea-form').forEach(element=>{
    if(element.getBoundingClientRect().top>=innerHeight)observer.observe(element);
  });
  reduced.addEventListener('change',()=>{if(reduced.matches)entrances.forEach(animation=>animation.cancel());});
})();
