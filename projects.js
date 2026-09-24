(() => {
  'use strict';
  const section = document.querySelector('#colecao');
  const stage = section.querySelector('.client-stage');
  const canvas = section.querySelector('canvas');
  const track = section.querySelector('.collection-grid');
  const cards = [...track.querySelectorAll('.project')];
  const tabs = [...section.querySelectorAll('[data-client-index]')];
  const panelHost = section.querySelector('.client-panels');
  const reduced = window.forjaMotion;
  const names = cards.map(c => c.querySelector('h3').textContent);
  const colors = ['#fff0eb', '#eef3ff', '#edf8f0', '#f3f3f5'];
  const count = cards.length, RESUME_MS = 5000, SPEED = .14;
  const wrap = n => ((n % count) + count) % count;
  const ease = t => 1 - (1 - t) ** 3;
  const angles = cards.map(() => ({yaw: (Math.random() - .5) * .7, pitch: (Math.random() - .5) * .6}));
  const spinRates = cards.map(() => ({yaw: (.23 + Math.random() * .18) * (Math.random() < .5 ? -1 : 1), pitch: (.25 + Math.random() * .20) * (Math.random() < .5 ? -1 : 1)}));
  let position = 0, active = -1, viewer, pending, fallback = false;
  let visible = false, raf = 0, last = 0;
  let resumeAt = 0, resumeTimer = 0, drag = null, centering = null, keyboardFocus = false;
  let panels = [];
  // Extra copies on both edges guarantee a filled track across the last/first seam.
  const slots = Array.from({length: 9}, () => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'client-panel'; button.tabIndex = -1;
    panelHost.append(button); return button;
  });
  function layout() {
    const width = stage.clientWidth, small = width < 760, gap = small ? 12 : 28;
    const side = small ? width * .24 : Math.min(280, width * .18);
    const large = small ? width * .74 : Math.min(640, width * .44);
    let x = 0;
    const result = slots.map((_, i) => {
      const logical = Math.floor(position) - 4 + i, relative = logical - position;
      const size = side + (large - side) * (1 - Math.min(1, Math.abs(relative)));
      const panel = {logical, index: wrap(logical), x, width: size, center: x + size / 2, relative};
      x += size + gap; return panel;
    });
    const fraction = position - Math.floor(position);
    const center = result[4].center * (1 - fraction) + result[5].center * fraction;
    return result.map(panel => ({...panel, x: panel.x + width / 2 - center}));
  }
  function labels() {
    const next = wrap(Math.round(position));
    if (next === active) return;
    active = next;
    cards.forEach((card, i) => card.classList.toggle('is-current', i === active));
    tabs.forEach((tab, i) => tab.setAttribute('aria-current', String(i === active)));
    section.querySelector('#project-count').textContent = `${active + 1} / ${count}`;
    canvas.dataset.active = names[active];
  }
  function playing() {
    return !reduced.matches && visible && !document.hidden && !drag && !centering &&
      !keyboardFocus && performance.now() >= resumeAt;
  }
  function spinning() {return !reduced.matches && visible && !document.hidden && !keyboardFocus;}
  function paint() {
    labels();
    section.dataset.autoplay = String(playing());
    section.dataset.carouselPosition = wrap(position).toFixed(4);
    if (viewer) {
      panels = layout();
      slots.forEach((button, i) => {
        const panel = panels[i], onscreen = panel.x + panel.width > 0 && panel.x < stage.clientWidth;
        button.style.width = `${panel.width}px`;
        button.style.transform = `translate3d(${panel.x}px,0,0)`;
        button.style.backgroundColor = colors[panel.index];
        button.dataset.slot = String(i);
        const label=window.forjaI18n.t(`${names[panel.index]}. Centralizar e explorar em 3D.`);
        if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
        button.setAttribute('aria-hidden', String(!onscreen));
        button.tabIndex = onscreen && Math.abs(panel.relative) < count / 2 ? 0 : -1;
      });
      viewer.draw(wrap(position), panels, angles);
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
      const t = Math.min(1, (now - centering.started) / 550);
      position = centering.from + (centering.to - centering.from) * ease(t);
      if (t === 1) centering = null;
    } else if (playing()) {
      position += dt * SPEED;

    }
    if (spinning()) angles.forEach((a, i) => {
      if (drag?.index === i) return;
      a.yaw += dt * spinRates[i].yaw;
      a.pitch += dt * spinRates[i].pitch;
    });
    paint();
    if (playing() || spinning() || centering) queue();
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
  function select(index, instant = false) {
    const target = position + (((index - position + count / 2) % count + count) % count - count / 2);
    if (instant || reduced.matches || !viewer) {position = target; centering = null;}
    else centering = {from: position, to: target, started: performance.now()};
    delayResume();
  }
  async function prepare() {
    if (viewer || pending || fallback) return;
    pending = import('./clients-renderer.js?v=32').then(m => m.createClientsViewer(canvas)).then(v => {
      viewer = v; section.classList.add('has-3d-clients'); sync();
    }).catch(() => {fallback = true; section.classList.add('clients-fallback'); stage.hidden = true; sync();});
  }
  stage.addEventListener('pointerdown', e => {
    const button = e.target.closest('.client-panel');
    if (!button || !e.isPrimary || e.button !== 0 || !viewer) return;
    keyboardFocus = false;
    const panel = panels[Number(button.dataset.slot)];
    select(panel.index);
    drag = {id: e.pointerId, index: panel.index, x: e.clientX, y: e.clientY, ...angles[panel.index]};
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging'); hold();
  });
  stage.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    angles[drag.index].yaw = drag.yaw + (e.clientX - drag.x) * .009;
    angles[drag.index].pitch = drag.pitch + (e.clientY - drag.y) * .009;
    queue();
  });
  function release(e) {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null; stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    delayResume();
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  slots.forEach(button => button.addEventListener('click', e => {
    if (e.detail === 0) select(panels[Number(button.dataset.slot)].index, true);
  }));
  tabs.forEach((tab, i) => tab.addEventListener('click', e => {if (e.detail > 0) keyboardFocus = false; select(i, e.detail === 0);}));
  section.querySelectorAll('[data-project-step]').forEach(button => button.addEventListener('click', e => {if (e.detail > 0) keyboardFocus = false; select(wrap(active + Number(button.dataset.projectStep)), e.detail === 0);}));
  section.addEventListener('focusin', e => {if (e.target.matches(':focus-visible')) {keyboardFocus = true; hold();}});
  section.addEventListener('focusout', e => {if (!section.contains(e.relatedTarget)) {keyboardFocus = false; delayResume();}});
  stage.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    if (e.shiftKey && e.key.startsWith('Arrow')) {
      angles[active].yaw += e.key === 'ArrowLeft' ? -.18 : e.key === 'ArrowRight' ? .18 : 0;
      angles[active].pitch += e.key === 'ArrowUp' ? -.18 : e.key === 'ArrowDown' ? .18 : 0;
      sync();
    } else if (e.key === 'Home' || e.key === 'End') select(e.key === 'Home' ? 0 : count - 1, true);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') select(wrap(active + (e.key === 'ArrowRight' ? 1 : -1)), true);
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) prepare(); sync();
  }, {threshold: 0}).observe(section.querySelector('.collection-pin'));
  const preload=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){prepare();preload.disconnect();}},{rootMargin:'600px',threshold:0});preload.observe(section);
  window.addEventListener('pageshow',sync);
  canvas.addEventListener('webglcontextrestored',sync);
  new ResizeObserver(sync).observe(stage);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => {centering = null; position = Math.round(position); sync();});
  labels();
})();
