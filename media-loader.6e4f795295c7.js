/* The opening owns the first network turn. Secondary media then fills in
   sequentially in the background; approaching content jumps ahead of the queue. */
(() => {
  const images = [...document.querySelectorAll('img[data-src]')];
  let released = false;
  const pending = new WeakMap();
  window.forjaSecondaryReady = (window.forjaReady || Promise.resolve())
    .then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    .then(() => {released = true; document.documentElement.dataset.secondaryReady = 'true'; performance.mark('forja-secondary-ready');});

  images.forEach(image => {
    const frame = image.parentElement;
    frame.dataset.mediaFrame = '';
    frame.setAttribute('aria-busy', 'true');
    const status = document.createElement('span');
    status.className = 'media-status';
    status.setAttribute('role', 'status');
    status.textContent = 'Carregando imagem…';
    frame.append(status);
    image._mediaStatus = status;
  });

  function load(image) {
    if (!image.dataset.src) return Promise.resolve();
    if (pending.has(image)) return pending.get(image);
    const task = new Promise(resolve => {
      const frame = image.parentElement, status = image._mediaStatus;
      function finish(ok) {
        clearTimeout(deadline);
        frame.setAttribute('aria-busy', 'false');
        image.removeEventListener('load', loaded);
        image.removeEventListener('error', failed);
        pending.delete(image);
        if (ok) {delete image.dataset.src; image.dataset.loaded = 'true'; status.remove();}
        else {
          image.dataset.failed = 'true'; image.removeAttribute('src'); status.replaceChildren();
          const retry = document.createElement('button');
          retry.type = 'button'; retry.textContent = 'Carregar imagem';
          retry.addEventListener('click', () => {
            delete image.dataset.failed;
            frame.setAttribute('aria-busy', 'true');
            status.textContent = 'Carregando imagem…';
            load(image);
          }, {once:true});
          status.append(retry);
        }
        resolve();
      }
      const loaded = () => finish(true), failed = () => finish(false);
      image.addEventListener('load', loaded, {once:true});
      image.addEventListener('error', failed, {once:true});
      const deadline = setTimeout(failed, 15000);
      image.loading = 'eager'; image.decoding = 'async'; image.fetchPriority = 'low';
      image.src = image.dataset.src;
    });
    pending.set(image, task);
    return task;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    window.forjaSecondaryReady.then(() => load(entry.target));
  }), {rootMargin:'320px 0px'});
  images.forEach(image => observer.observe(image));
  const idle = callback => window.requestIdleCallback ? requestIdleCallback(callback, {timeout:1200}) : setTimeout(callback, 150);
  async function next() {
    if (document.hidden || !released) return;
    const image = images.find(image => image.dataset.src && !image.dataset.failed && !pending.has(image));
    if (!image) return;
    await load(image);
    idle(next);
  }
  window.forjaSecondaryReady.then(() => idle(next));
  document.addEventListener('visibilitychange', () => {if (!document.hidden) idle(next);});
})();
