import {colors} from './color-palette.5cda01ce2f8f.js';

const section = document.querySelector('#cores');
const pin = section.querySelector('.color-pin');
const stage = section.querySelector('.color-stage');
const canvas = document.querySelector('#forja-scroll');
const product = document.querySelector('#color-product');
const reduced = window.forjaMotion;
const context = canvas.getContext('2d');
const keys = Object.keys(colors), frameCount = 96;
// Decoded frames are ~2 MB each in memory, so only a window is kept resident.
// Reach is solved on the network side instead: see warm().
const DECODED_WINDOW = 24;
const ready = new Map(), inflight = new Map();
// One pinned frame per colour, never evicted: crossing a colour boundary must
// change the colour even when the rest of that colour is still downloading.
const anchors = new Map();
let visible = false, raf = 0, lastDraw = '', manualColor = keys[0], warmed = false;

function progress() {
  const top = parseFloat(getComputedStyle(pin).top) || 0;
  const travel = section.offsetHeight - pin.offsetHeight;
  return Math.max(0, Math.min(1, (top - section.getBoundingClientRect().top) / Math.max(1, travel)));
}
function stateAt(p) {
  return {color: keys[Math.min(keys.length - 1, Math.floor(p * keys.length))], frame: Math.round(p * frameCount) % frameCount};
}
function frameKey(color, frame) {
  return `${color}/${String((frame + frameCount) % frameCount).padStart(2, '0')}`;
}
function frameUrl(key) {return `assets/forja-scroll-v26/${key}.webp`;}

// Synchronous read: a decoded frame must never cost the scroll a turn of the event loop.
function decoded(key) {
  const pinned = anchors.get(key);
  if (pinned) return pinned;
  const image = ready.get(key);
  if (!image) return null;
  ready.delete(key); ready.set(key, image);   // keep recent frames at the young end
  return image;
}
function request(key) {
  const hit = anchors.get(key) || ready.get(key);
  if (hit) return Promise.resolve(hit);
  const running = inflight.get(key);
  if (running) return running;
  const image = new Image(); image.decoding = 'async'; image.src = frameUrl(key);
  const pending = image.decode().then(() => {
    inflight.delete(key); ready.set(key, image);
    while (ready.size > DECODED_WINDOW) ready.delete(ready.keys().next().value);
    return image;
  }).catch(error => {inflight.delete(key); throw error;});
  inflight.set(key, pending);
  return pending;
}
// Pull every frame the linear scroll visits into the HTTP cache: 96 of the 768
// stills, about 2 MB. Decoding stays on demand, so phone memory is untouched.
// Phase one: the first frame each colour is entered on. Eight small requests in
// parallel, so every colour can be shown within one round trip.
function warmAnchors() {
  if (anchors.size) return Promise.resolve();
  return Promise.all(keys.map((color, index) => {
    const state = stateAt((index + .02) / keys.length);
    const key = frameKey(state.color, state.frame);
    const image = new Image(); image.decoding = 'async'; image.src = frameUrl(key);
    return image.decode().then(() => {anchors.set(key, image); schedule();}).catch(() => {});
  })).then(() => {canvas.dataset.anchors = String(anchors.size);});
}
// Phase two: every frame the linear scroll visits — 96 of the 768 stills, about
// 2 MB — into the HTTP cache. Decoding stays on demand, so phone memory is untouched.
function warm() {
  if (warmed) return;
  warmed = true;
  warmAnchors().then(() => {
    const track = [];
    for (let frame = 0; frame < frameCount; frame++) {
      const state = stateAt(frame / frameCount);
      track.push(frameKey(state.color, state.frame));
    }
    let next = 0;
    const worker = async () => {
      while (next < track.length) {
        const key = track[next++];
        if (anchors.has(key) || ready.has(key)) continue;
        try {await (await fetch(frameUrl(key), {cache: 'force-cache'})).arrayBuffer();} catch {}
      }
    };
    // Ten parallel requests: HTTP/2 multiplexes them, and 20 KB each stays well
    // clear of the bandwidth the hero film needs.
    Promise.all(Array.from({length: 10}, worker)).then(() => {
      canvas.dataset.warmed = 'true';
      schedule();
    });
  });
}
function selectColor(key) {
  if (stage.dataset.color === key && stage.dataset.initialized) return;
  const c = colors[key];
  stage.dataset.color = key; stage.dataset.initialized = 'true';
  // The still is only the pre-canvas placeholder. Re-pointing it mid-scroll aborts
  // its own request eight times over and starves the frames doing the animation.
  if (!stage.classList.contains('is-render-ready')) {
    product.src = `assets/forja-${key}-v26.webp`;
    product.alt = `Chaveiro Forja Studio ${c.name.toLowerCase()} com marca em bronze`;
  }
  section.querySelector('#color-name').textContent = c.name;
  section.querySelector('.color-step').textContent = `${keys.indexOf(key) + 1} / ${keys.length}`;
  section.querySelectorAll('.swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === key)));
}
// Closest already-decoded neighbour, so a fast flick degrades in smoothness, never into a stall.
function nearest(state) {
  for (let distance = 1; distance <= 8; distance++) {
    for (const frame of [state.frame - distance, state.frame + distance]) {
      const key = frameKey(state.color, frame);
      const image = decoded(key);
      if (image) return {image, key};
    }
  }
  for (const [key, image] of anchors) if (key.startsWith(state.color + '/')) return {image, key};
  return null;
}
function prefetch(p) {
  for (const offset of [1, 2, 3, -1, -2, 4, 6]) {
    const next = stateAt(Math.max(0, Math.min(1, p + offset / frameCount)));
    request(frameKey(next.color, next.frame)).catch(() => {});
  }
}
function draw() {
  raf = 0;
  if (!visible || document.hidden || !context) return;
  const p = progress(), state = stateAt(p);
  selectColor(state.color);
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio, 1.5);
  canvas.dataset.progress = p.toFixed(4); canvas.dataset.yaw = (p * Math.PI * 2).toFixed(4);

  const key = frameKey(state.color, state.frame);
  let image = decoded(key), shown = key;
  if (!image) {
    request(key).then(schedule).catch(() => {if (!lastDraw) stage.dataset.error = 'true';});
    const near = nearest(state);
    if (!near) {prefetch(p); return;}   // keep the last painted frame rather than clearing
    image = near.image; shown = near.key;
  }
  const signature = [shown, width, height, ratio].join(':');
  if (signature !== lastDraw) {
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) {canvas.width = w; canvas.height = h;}
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const size = Math.min(width, height);
    context.drawImage(image, (width - size) / 2, (height - size) / 2, size, size);
    lastDraw = signature;
    stage.classList.add('is-render-ready'); delete stage.dataset.error;
    const [renderedColor, renderedFrame] = shown.split('/');
    canvas.dataset.renderedColor = renderedColor; canvas.dataset.renderedFrame = String(Number(renderedFrame));
    canvas.dataset.frame = String(Number(canvas.dataset.frame || 0) + 1);
  }
  prefetch(p);
}
function schedule() {if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw);}
section.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => {
  manualColor = button.dataset.color;
  const top = parseFloat(getComputedStyle(pin).top) || 0;
  const travel = section.offsetHeight - pin.offsetHeight;
  const p = (keys.indexOf(manualColor) + .05) / keys.length;
  window.scrollTo({top: scrollY + section.getBoundingClientRect().top - top + p * travel, behavior:'instant'});
  schedule();
}));
// 600px of lead time: the cache starts filling before the section is reachable.
new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; if (visible) warm(); schedule();}, {rootMargin:'600px'}).observe(pin);
window.addEventListener('scroll', schedule, {passive:true});
window.addEventListener('resize', schedule, {passive:true});
window.visualViewport?.addEventListener('resize', schedule, {passive:true});
new ResizeObserver(schedule).observe(stage);
document.addEventListener('visibilitychange', schedule);
reduced.addEventListener('change', () => {lastDraw = ''; schedule();});

window.addEventListener('pageshow', () => {lastDraw = ''; schedule();});
// Once the page is revealed, fill the cache in idle time even if the visitor has not scrolled.
(window.forjaReady || Promise.resolve()).then(() => {
  warmAnchors();
  'requestIdleCallback' in window ? requestIdleCallback(() => warm(), {timeout: 2500}) : setTimeout(warm, 1200);
});
