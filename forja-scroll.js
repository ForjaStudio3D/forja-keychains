import {colors} from './color-palette.js?v=26';

const section = document.querySelector('#cores');
const pin = section.querySelector('.color-pin');
const stage = section.querySelector('.color-stage');
const canvas = document.querySelector('#forja-scroll');
const product = document.querySelector('#color-product');
const reduced = window.forjaMotion;
const context = canvas.getContext('2d');
const keys = Object.keys(colors), frameCount = 96, cache = new Map();
let visible = false, raf = 0, revision = 0, lastDraw = '', manualColor = keys[0];

function progress() {
  if (reduced.matches) return 0;
  const top = parseFloat(getComputedStyle(pin).top) || 0;
  const travel = section.offsetHeight - pin.offsetHeight;
  return Math.max(0, Math.min(1, (top - section.getBoundingClientRect().top) / Math.max(1, travel)));
}
function stateAt(p) {
  return {color: keys[Math.min(keys.length - 1, Math.floor(p * keys.length))], frame: Math.round(p * frameCount) % frameCount};
}
function frameImage(color, frame) {
  const key = `${color}/${String((frame + frameCount) % frameCount).padStart(2, '0')}`;
  if (cache.has(key)) return cache.get(key);
  const image = new Image(); image.decoding = 'async';
  image.src = `assets/forja-scroll-v26/${key}.webp`;
  const pending = image.decode().then(() => image).catch(error => {cache.delete(key); throw error;});
  cache.set(key, pending);
  // A small moving window keeps mobile decoded-image memory bounded.
  if (cache.size > 16) cache.delete(cache.keys().next().value);
  return pending;
}
function selectColor(key) {
  if (stage.dataset.color === key && stage.dataset.initialized) return;
  const c = colors[key];
  stage.dataset.color = key; stage.dataset.initialized = 'true';
  product.src = `assets/forja-${key}-v26.webp`;
  product.alt = `Chaveiro Forja Studio ${c.name.toLowerCase()} com marca em bronze`;
  section.querySelector('#color-name').textContent = c.name;
  section.querySelector('.color-step').textContent = `${keys.indexOf(key) + 1} / ${keys.length}`;
  section.querySelectorAll('.swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === key)));
}
async function draw() {
  raf = 0;
  if (!visible || document.hidden || !context) return;
  const p = progress(), state = stateAt(p);
  const color = reduced.matches ? manualColor : state.color, frame = reduced.matches ? 0 : state.frame;
  selectColor(color);
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio, 1.5), signature = [frame,color,width,height,ratio].join(':');
  canvas.dataset.progress = p.toFixed(4); canvas.dataset.yaw = (p * Math.PI * 2).toFixed(4);
  if (signature === lastDraw) return;
  const version = ++revision;
  try {
    const image = await frameImage(color, frame);
    if (version !== revision || !visible || document.hidden) return;
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) {canvas.width = w; canvas.height = h;}
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,width,height);
    const size = Math.min(width, height);
    context.drawImage(image,(width-size)/2,(height-size)/2,size,size);
    lastDraw = signature;
    stage.classList.add('is-render-ready'); delete stage.dataset.error;
    canvas.dataset.renderedColor = color; canvas.dataset.renderedFrame = String(frame);
    canvas.dataset.frame = String(Number(canvas.dataset.frame || 0) + 1);
    // Prefetch the actual next scroll states, including the following color boundary.
    for (const offset of [-2,-1,1,2,3]) {
      const next = stateAt(Math.max(0,Math.min(1,p + offset / frameCount)));
      frameImage(reduced.matches ? manualColor : next.color, reduced.matches ? 0 : next.frame).catch(() => {});
    }
  } catch {
    if (version !== revision) return;
    stage.classList.remove('is-render-ready'); stage.dataset.error = 'true';
  }
}
function schedule() {if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw);}
section.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => {
  manualColor = button.dataset.color;
  if (reduced.matches) {schedule(); return;}
  const top = parseFloat(getComputedStyle(pin).top) || 0;
  const travel = section.offsetHeight - pin.offsetHeight;
  const p = (keys.indexOf(manualColor) + .05) / keys.length;
  window.scrollTo({top: scrollY + section.getBoundingClientRect().top - top + p * travel, behavior:'instant'});
  schedule();
}));
new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; if (!visible) revision++; schedule();}, {rootMargin:'200px'}).observe(pin);
window.addEventListener('scroll', schedule, {passive:true});
window.addEventListener('resize', schedule, {passive:true});
window.visualViewport?.addEventListener('resize', schedule, {passive:true});
new ResizeObserver(schedule).observe(stage);
document.addEventListener('visibilitychange', schedule);
reduced.addEventListener('change', () => {lastDraw = ''; schedule();});
