(() => {
  const events = new EventTarget();
  document.documentElement.dataset.motion = 'full';
  window.forjaMotion = {
    matches: false, needsAsk: false, choice: 'on', preference: 'full',
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events)
  };
})();
