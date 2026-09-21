(() => {
  const motion = window.forjaMotion;
  const choice = document.querySelector('#motion-choice');
  const explanation = document.querySelector('#motion-explanation');
  const enable = document.querySelector('#motion-enable');
  const top = document.querySelector('.back-to-top');
  function updateChoice() {
    choice.hidden = !motion.systemReduced && motion.preference === 'system';
    explanation.textContent = motion.preference === 'full' ? 'Animações ativadas nesta página.' : 'Seu dispositivo pediu menos movimento.';
    enable.textContent = motion.preference === 'full' ? 'Usar ajuste do dispositivo' : 'Ativar animações';
  }
  enable.addEventListener('click', () => motion.setPreference(motion.preference === 'full' ? 'system' : 'full'));
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
