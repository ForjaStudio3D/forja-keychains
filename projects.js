(() => {
  'use strict';
  const section = document.querySelector('#colecao');
  const stage = section.querySelector('.client-stage');
  const canvas = section.querySelector('canvas');
  const track = section.querySelector('.collection-grid');
  const cards = [...track.querySelectorAll('.project')];
  const panelHost = section.querySelector('.client-panels');
  const reduced = window.forjaMotion;
  const names = cards.map(card => card.querySelector('h3').textContent);
  const colors = ['#fff0eb', '#eef3ff', '#f4f0f7', '#f3f3f5', '#fff0f5'];
  const count = cards.length;
  const RESUME_MS = 1000, SPEED = .147;
  const wrap = value => ((value % count) + count) % count;
  const ease = value => 1 - (1 - value) ** 3;
  let position = 0, active = -1, viewer, pending, fallback = false;
  let visible = false, raf = 0, last = 0;
  let resumeAt = 0, resumeTimer = 0, drag = null, centering = null;
  const slots = Array.from({length: 9}, () => {
    const panel = document.createElement('div');
    panel.className = 'client-panel';
    panel.setAttribute('aria-hidden', 'true');
    panelHost.append(panel);
    return panel;
  });

  function layout() {
    const width = stage.clientWidth, small = width < 760, gap = small ? 12 : 28;
    const side = small ? width * .24 : Math.min(280, width * .18);
    const large = small ? width * .74 : Math.min(640, width * .44);
    let x = 0;
    const result = slots.map((_, index) => {
      const logical = Math.floor(position) - 4 + index;
      const relative = logical - position;
      const size = side + (large - side) * (1 - Math.min(1, Math.abs(relative)));
      const panel = {index: wrap(logical), x, width: size, center: x + size / 2, relative};
      x += size + gap;
      return panel;
    });
    const fraction = position - Math.floor(position);
    const center = result[4].center * (1 - fraction) + result[5].center * fraction;
    return result.map(panel => {
      // One continuous, shared quarter turn per card: every model rotates as the
      // belt advances and reaches its own intended pose in the center.
      const facing = [0, 0, 0, Math.PI / 4, 0][panel.index];
      const yaw = panel.relative * Math.PI / 2 + facing;
      const roll = panel.index === 2 ? Math.PI : 0; // Colo de Fono was designed inverted.
      const pitch = panel.index === 3 ? -Math.PI / 6 : 0;
      return {...panel, x: panel.x + width / 2 - center, yaw, pitch, roll};
    });
  }

  function labels() {
    const next = wrap(Math.round(position));
    if (next === active) return;
    active = next;
    cards.forEach((card, index) => card.classList.toggle('is-current', index === active));
    section.querySelector('#project-count').textContent = `${active + 1} / ${count}`;
    canvas.dataset.active = names[active];
  }
  function playing() {
    return !reduced.matches && visible && !document.hidden && !drag && !centering &&
      performance.now() >= resumeAt;
  }
  function paint() {
    labels();
    section.dataset.autoplay = String(playing());
    section.dataset.carouselPosition = wrap(position).toFixed(4);
    if (viewer) {
      const panels = layout();
      slots.forEach((slot, index) => {
        const panel = panels[index];
        slot.style.width = `${panel.width}px`;
        slot.style.transform = `translate3d(${panel.x}px,0,0)`;
        slot.style.backgroundColor = colors[panel.index];
      });
      viewer.draw(wrap(position), panels);
    } else if (fallback) {
      track.scrollTo({left: cards[active].offsetLeft - track.offsetLeft, behavior: 'instant'});
    }
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) {last = 0; return;}
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    if (centering) {
      const progress = Math.min(1, (now - centering.started) / 420);
      position = centering.from + (centering.to - centering.from) * ease(progress);
      if (progress === 1) centering = null;
    } else if (playing()) position += dt * SPEED;
    paint();
    if (playing() || centering) queue();
  }
  function queue() {if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);}
  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    paint(); queue();
  }
  function delayResume() {
    clearTimeout(resumeTimer);
    resumeAt = performance.now() + RESUME_MS;
    resumeTimer = setTimeout(sync, RESUME_MS);
    sync();
  }
  function hold() {clearTimeout(resumeTimer); resumeAt = Infinity; sync();}
  function settle(target) {
    if (reduced.matches || !viewer) {position = target; centering = null;}
    else centering = {from: position, to: target, started: performance.now()};
    delayResume();
  }
  async function prepare() {
    if (viewer || pending || fallback) return;
    pending = import('./clients-renderer.js?v=47').then(module => module.createClientsViewer(canvas)).then(result => {
      viewer = result; section.classList.add('has-3d-clients'); sync();
    }).catch(() => {fallback = true; section.classList.add('clients-fallback'); stage.hidden = true; sync();});
  }
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !viewer) return;
    centering = null;
    drag = {id: event.pointerId, x: event.clientX, position};
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    hold();
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const step = stage.clientWidth < 760 ? stage.clientWidth * .62 : Math.min(500, stage.clientWidth * .44);
    position = drag.position - (event.clientX - drag.x) / step;
    paint();
  });
  function release(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    settle(Math.round(position));
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') settle(0);
    else if (event.key === 'End') settle(count - 1);
    else settle(Math.round(position) + (event.key === 'ArrowRight' ? 1 : -1));
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) prepare();
    sync();
  }, {threshold: 0}).observe(section.querySelector('.collection-pin'));
  const preload = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {prepare(); preload.disconnect();}
  }, {rootMargin: '600px', threshold: 0});
  preload.observe(section);
  window.addEventListener('pageshow', sync);
  canvas.addEventListener('webglcontextrestored', sync);
  new ResizeObserver(sync).observe(stage);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => {centering = null; position = Math.round(position); sync();});
  labels();
})();
