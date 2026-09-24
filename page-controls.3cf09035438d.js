(() => {
  const motion = window.forjaMotion;
  const choice = document.querySelector('#motion-choice');
  const explanation = document.querySelector('#motion-explanation');
  const enable = document.querySelector('#motion-enable');
  const top = document.querySelector('.back-to-top');
  // Depois da pergunta inicial, este é o caminho para mudar de ideia — e o
  // único lugar onde o assunto aparece para quem nunca pediu menos movimento.
  function updateChoice() {
    const on = !motion.matches;
    choice.hidden = !motion.systemReduced && !motion.choice;
    explanation.textContent = on ? 'Animações ativadas nesta página.' : 'Animações desligadas nesta página.';
    enable.textContent = on ? 'Desligar animações' : 'Ativar animações';
  }
  enable.addEventListener('click', () => motion.choose(motion.matches ? 'on' : 'off'));
  motion.addEventListener('change', updateChoice);
  updateChoice();
  let raf = 0;
  function updateTop() {raf = 0; top.hidden = scrollY < Math.max(600, innerHeight);}
  window.addEventListener('scroll', () => {if (!raf) raf = requestAnimationFrame(updateTop);}, {passive:true});
  window.addEventListener('resize', updateTop, {passive:true});
  top.addEventListener('click', () => {
    document.querySelector('.site-header .brand').focus({preventScroll:true});
    window.scrollTo({top:0, behavior:motion.matches ? 'instant' : 'smooth'});
  });
  updateTop();
})();
