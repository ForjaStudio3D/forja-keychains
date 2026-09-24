/* Carrossel simples de poucas opções, compartilhado pelo "mãos livres" e pelo
   relevo. A primeira virada vem 1s depois de a seção aparecer — é o que conta
   ao visitante que há mais de um cartão ali — e a partir daí vira a cada 4s.
   Só roda onde o CSS de fato empilhou os cartões numa faixa rolável: no
   desktop, onde eles ficam lado a lado, não há o que passar. */
(() => {
  const reduced = window.forjaMotion;
  const FIRST = 1000, EVERY = 4000, RESUME = 8000;

  function setup({track, slide, dot, step, label, labels}) {
    const strip = document.querySelector(track);
    if (!strip) return;
    const slides = [...strip.querySelectorAll(slide)];
    if (slides.length < 2) return;
    const dots = dot ? [...document.querySelectorAll(dot)] : [];
    const steps = step ? [...document.querySelectorAll(step)] : [];
    const caption = label ? document.querySelector(label) : null;
    let current = 0, visible = false, timer = 0, resumeAt = 0;

    // Enquanto os cartões couberem lado a lado não existe carrossel nenhum.
    const scrollable = () => strip.scrollWidth - strip.clientWidth > 8;

    function go(index, instant) {
      current = (index + slides.length) % slides.length;
      strip.scrollTo({left: current * strip.clientWidth,
                      behavior: instant || reduced.matches ? 'instant' : 'smooth'});
    }
    function update() {
      if (!strip.clientWidth) return;
      current = Math.round(strip.scrollLeft / strip.clientWidth);
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === current)));
      if (caption && labels) caption.textContent = window.forjaI18n?.t(labels[current]) ?? labels[current];
    }
    function playing() {
      return !reduced.matches && visible && !document.hidden &&
        scrollable() && performance.now() >= resumeAt;
    }
    function schedule(delay) {
      clearTimeout(timer);
      if (!playing()) return;
      timer = setTimeout(() => {go(current + 1); schedule(EVERY);}, delay);
    }
    // Quem tocou no carrossel manda: o automático espera antes de voltar.
    function hold() {resumeAt = performance.now() + RESUME; schedule(RESUME);}

    dots.forEach((d, i) => d.addEventListener('click', () => {go(i); hold();}));
    steps.forEach(button => button.addEventListener('click',
      () => {go(current + Number(button.dataset.carouselStep || button.dataset.handsfreeStep || 1)); hold();}));
    strip.addEventListener('scroll', update, {passive: true});
    strip.addEventListener('pointerdown', hold, {passive: true});
    strip.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      go(current + (event.key === 'ArrowRight' ? 1 : -1)); hold();
    });
    strip.addEventListener('focusin', hold);
    new ResizeObserver(() => {go(current, true); schedule(EVERY);}).observe(strip);
    document.addEventListener('visibilitychange', () => schedule(EVERY));
    reduced.addEventListener('change', () => schedule(EVERY));
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule(visible ? FIRST : EVERY);
    }, {threshold: .35}).observe(strip);
    update();
  }

  setup({track: '.handsfree-track', slide: '.handsfree-slide',
         dot: '[data-handsfree-index]', step: '[data-handsfree-step]',
         label: '#handsfree-color',
         labels: ['Preto e dourado · iPhone branco', 'Branco e azul · iPhone prata']});
  setup({track: '.relief-grid', slide: '.relief-card',
         dot: '[data-relief-index]', step: '[data-relief-step]'});
})();
