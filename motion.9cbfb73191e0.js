(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  function sync() {
    document.documentElement.dataset.motion = preference.matches ? 'reduced' : 'full';
  }
  window.forjaMotion = preference;
  preference.addEventListener('change', sync);
  sync();
})();
