(() => {
  const motion = window.forjaMotion;
  const top = document.querySelector('.back-to-top');
  let raf = 0;
  function updateTop() {raf = 0; top.hidden = scrollY < Math.max(600, innerHeight);}
  window.addEventListener('scroll', () => {if (!raf) raf = requestAnimationFrame(updateTop);}, {passive:true});
  window.addEventListener('resize', updateTop, {passive:true});
  top.addEventListener('click', () => {
    document.querySelector('.site-header .brand').focus({preventScroll:true});
    window.scrollTo({top:0, behavior:motion.matches ? 'instant' : 'smooth'});
  });
  const prices = document.querySelector('#valores');
  let priceAlignTimer = 0;
  function alignPrices(behavior) {
    const safeTop = document.querySelector('.site-header').getBoundingClientRect().bottom + 12;
    if (prices.getBoundingClientRect().top < safeTop - 2) prices.scrollIntoView({block:'start', behavior});
  }
  document.querySelector('.hero-options')?.addEventListener('click', event => {
    event.preventDefault();
    history.pushState(null, '', event.currentTarget.href);
    prices.scrollIntoView({block:'start', behavior:motion.matches ? 'instant' : 'smooth'});
    clearTimeout(priceAlignTimer);
    priceAlignTimer = setTimeout(() => alignPrices('instant'), 1200);
  });
  if (location.hash === '#valores') priceAlignTimer = setTimeout(() => alignPrices('instant'), 1200);
  for (const type of ['wheel', 'touchstart']) window.addEventListener(type, () => clearTimeout(priceAlignTimer), {passive:true});
  updateTop();
})();
