/* Local illustration only: no NFC reads, device access or navigation. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-nfc-story]').forEach(async (figure) => {
    const stage = figure.querySelector('.nfc-story-stage');
    const fallback = stage?.querySelector('img');
    const toggle = figure.querySelector('.nfc-story-toggle');
    if (!fallback || !toggle) return;
    let visible = false;
    let userPaused = false;
    const update = () => {
      figure.classList.toggle('is-playing', visible && !document.hidden && !userPaused && !reducedMotion.matches);
      toggle.hidden = reducedMotion.matches;
      toggle.textContent = userPaused ? 'Reproduzir animação' : 'Pausar animação';
      toggle.setAttribute('aria-pressed', String(userPaused));
    };
    try {
      const source = new URL(fallback.getAttribute('src'), document.baseURI);
      const response = await fetch(source);
      if (!response.ok) return;
      const documentSVG = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const svg = documentSVG.documentElement;
      if (svg.localName !== 'svg' || documentSVG.querySelector('parsererror')) return;
      svg.querySelectorAll('image').forEach((image) => {
        image.setAttribute('href', new URL(image.getAttribute('href'), source).href);
      });
      stage.replaceChildren(document.importNode(svg, true));
      figure.classList.add('is-enhanced');
      toggle.addEventListener('click', () => { userPaused = !userPaused; update(); });
      document.addEventListener('visibilitychange', update);
      reducedMotion.addEventListener('change', update);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .15 }).observe(figure);
      } else { visible = true; }
      update();
    } catch {
      // The original static illustration remains a complete three-step explanation.
    }
  });
})();
