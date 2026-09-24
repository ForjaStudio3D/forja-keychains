/* Respect the device by default. Motion is enabled only by the visitor's explicit choice. */
(() => {
  const system = window.matchMedia('(prefers-reduced-motion: reduce)');
  const events = new EventTarget(), storageKey = 'forja-motion';
  let preference = 'system';
  try {if (window.forjaI18n?.consent === 'accepted' && localStorage.getItem(storageKey) === 'full') preference = 'full';} catch {}
  function sync() {
    document.documentElement.dataset.motion = preference;
    events.dispatchEvent(new Event('change'));
  }
  window.forjaMotion = {
    get matches() {return preference !== 'full' && system.matches;},
    get systemReduced() {return system.matches;},
    get preference() {return preference;},
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    persist() {
      if(window.forjaI18n?.consent !== 'accepted') return;
      try {if(preference === 'full') localStorage.setItem(storageKey,'full');else localStorage.removeItem(storageKey);} catch {}
    },
    setPreference(value) {
      preference = value === 'full' ? 'full' : 'system';
      this.persist();
      sync();
    }
  };
  system.addEventListener('change', sync);
  sync();
})();
