(() => {
  const video = document.querySelector('#hero-video');
  const stage = video.closest('figure');
  const overlay = document.querySelector('.hero-overlay');
  const motion = window.forjaMotion;
  const connection = navigator.connection;
  const media = matchMedia('(max-width: 900px)').matches ? video.dataset.mobileSrc : video.dataset.desktopSrc;
  // Pages supports byte-range requests for video, including on Safari.
  const pages = 'https://forjastudio3d.github.io/forja-keychains/';
  const sources = [...new Set([new URL(media, pages).href, new URL(media, document.baseURI).href])];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'media-start';
  button.setAttribute('aria-controls', video.id);
  button.hidden = true;
  stage.append(button);

  let armed = false;
  let visible = false;
  let requested = false;
  let stopped = '';
  let sourceIndex = -1;
  let pending = null;
  let watchdog = 0;
  const allowsAutoplay = () => !motion.matches && !connection?.saveData;

  function reveal() {
    overlay.setAttribute('data-revealed', '');
  }
  function settle() {
    reveal();
    document.dispatchEvent(new Event('forja:hero-settled'));
  }
  function updateButton() {
    button.hidden = !armed;
    if (stopped === 'failed') button.textContent = 'Tentar reproduzir';
    else if (stopped === 'ended') button.textContent = 'Rever animação';
    else if (!video.paused) button.textContent = 'Pausar animação';
    else button.textContent = video.currentTime > 0 ? 'Continuar animação' : 'Ver animação';
  }
  function suspend() {
    clearTimeout(watchdog);
    pending = null;
    video.pause();
  }
  function selectSource(index) {
    sourceIndex = index;
    video.preload = 'auto';
    video.src = sources[index];
  }
  function stop(reason) {
    stopped = reason;
    sync();
    settle();
  }
  function recover() {
    suspend();
    if (sourceIndex + 1 === sources.length) stop('failed');
    else {
      selectSource(sourceIndex + 1);
      sync();
    }
  }
  function play() {
    if (pending || !video.paused) return;
    if (sourceIndex < 0) selectSource(0);
    clearTimeout(watchdog);
    watchdog = setTimeout(recover, 6500);
    const attempt = video.play();
    pending = attempt;
    attempt.catch((error) => {
      if (pending !== attempt || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') stop('blocked');
      else recover();
    }).finally(() => {
      if (pending === attempt) pending = null;
      updateButton();
    });
  }
  function sync() {
    const enabled = requested || allowsAutoplay();
    video.hidden = !enabled || stopped === 'failed';
    if (!armed || !visible || document.hidden || !enabled || stopped) suspend();
    else play();
    updateButton();
  }
  function measure() {
    const rect = stage.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < innerHeight;
    sync();
  }

  button.addEventListener('click', () => {
    if (!video.paused) {
      stopped = 'paused';
    } else {
      if (stopped === 'ended') document.dispatchEvent(new Event('forja:hero-restart'));
      if (stopped === 'failed') selectSource(0);
      stopped = '';
      requested = true;
    }
    measure();
  });
  video.addEventListener('playing', () => {
    clearTimeout(watchdog);
    reveal();
    updateButton();
  });
  video.addEventListener('ended', () => stop('ended'));
  video.addEventListener('error', () => {if (video.error && stopped !== 'failed') recover();});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();}).observe(stage);
  }
  window.addEventListener('pageshow', measure);
  document.addEventListener('visibilitychange', measure);
  motion.addEventListener('change', () => {requested = false; measure();});
  connection?.addEventListener?.('change', () => {requested = false; measure();});

  if (allowsAutoplay()) selectSource(0);
  sync();
  (window.forjaReady || Promise.resolve()).then(() => {
    const root = document.documentElement;
    function start() {
      armed = true;
      if (!allowsAutoplay()) settle();
      else requestAnimationFrame(() => requestAnimationFrame(reveal));
      measure();
    }
    if (!root.hasAttribute('data-loading')) {
      start();
    } else {
      const loader = new MutationObserver(() => {
        if (root.hasAttribute('data-loading')) return;
        loader.disconnect();
        start();
      });
      loader.observe(root, { attributes: true, attributeFilter: ['data-loading'] });
    }
  });
})();

(() => {
 const phrase=document.querySelector('#hero-title'),word=phrase.querySelector('.hero-verb'),reduced=window.forjaMotion,words=['usa.','lembra.','compartilha.'];
 let visible=false,timer=0,fade=0,index=0;
 function stop(){clearTimeout(timer);clearTimeout(fade);timer=fade=0;word.classList.remove('is-changing');}
 function schedule(){stop();if(!released||!visible||document.hidden||reduced.matches)return;timer=setTimeout(()=>{word.classList.add('is-changing');fade=setTimeout(()=>{index=(index+1)%words.length;word.textContent=words[index];word.dataset.word=index;word.classList.remove('is-changing');schedule();},160);},2600);}
 let released=false;
 document.addEventListener('forja:hero-settled',()=>{released=true;schedule();});
 document.addEventListener('forja:hero-restart',()=>{released=false;index=0;word.textContent=words[0];word.dataset.word=0;stop();});
 if(document.querySelector('.hero-overlay')?.hasAttribute('data-revealed')){released=true;schedule();}
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(phrase);
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',()=>{if(reduced.matches){index=0;word.textContent=words[0];word.dataset.word=0;}schedule();});
})();
