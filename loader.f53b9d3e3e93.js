/* Holds the page until fonts, the hero film and the first colour frame are ready,
   so the opening animations are seen from their first frame instead of mid-way.
   Every gate has a ceiling: a slow or failed asset never keeps the page hidden. */
(() => {
  const root = document.documentElement, overlay = document.querySelector('#forja-loader');
  // Measured from navigation start, not from this script: on a slow network the
  // script itself arrives late, and the ceiling must still be the visitor's ceiling.
  const CEILING = 5200;
  let settled = false, release;
  window.forjaReady = new Promise(resolve => {release = resolve;});

  // Resolve on the first of: the gate settling, or its own time limit.
  function limit(promise, ms) {
    return Promise.race([
      Promise.resolve(promise).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, ms))
    ]);
  }

  function finish(reason) {
    if (settled) return;
    settled = true;
    root.dataset.loaderReason = reason;
    delete root.dataset.loading;
    if (overlay) {
      overlay.addEventListener('transitionend', () => overlay.remove(), {once: true});
      setTimeout(() => overlay.remove(), 900);
    }
    release();
  }

  // The inline safety timer may have already revealed the page. Release the
  // animations at once rather than leaving them armed behind a veil that is gone.
  if (!root.hasAttribute('data-loading')) return finish('preempted');

  const fonts = limit(document.fonts ? document.fonts.ready : null, 2600);

  // The film only gates the page when it is actually going to play.
  const video = document.querySelector('#hero-video');
  const film = (!video || window.forjaMotion?.matches) ? Promise.resolve() : limit(new Promise(resolve => {
    if (video.readyState >= 3) return resolve();
    video.addEventListener('canplaythrough', resolve, {once: true});
    video.addEventListener('canplay', resolve, {once: true});
    video.addEventListener('error', resolve, {once: true});
    video.addEventListener('stalled', resolve, {once: true});
  }), 3600);

  // First colour frame, so the scroll section never opens on an empty canvas.
  const firstFrame = limit(new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', resolve, {once: true});
    image.addEventListener('error', resolve, {once: true});
    image.src = 'assets/forja-scroll-v26/branco/00.webp';
    window.forjaFirstFrame = image;
  }), 2600);

  Promise.all([fonts, film, firstFrame]).then(() => finish('ready'));
  setTimeout(() => finish('ceiling'), Math.max(300, CEILING - performance.now()));
})();
