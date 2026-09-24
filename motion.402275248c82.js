/* O ajuste do aparelho é do visitante, não deste site: ele conta como a pessoa
   configurou o telefone, não o que ela quer ver aqui. Quando o aparelho pede
   menos movimento, o site pergunta uma vez — antes de exibir a página — e passa
   a obedecer à resposta dela. A escolha vira cookie só se houver consentimento;
   sem consentimento ela vale para a visita e é perguntada de novo na próxima. */
(() => {
  const system = window.matchMedia('(prefers-reduced-motion: reduce)');
  const events = new EventTarget(), COOKIE = 'forja_motion';
  const read = name => {
    const found = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
  };
  const saved = read(COOKIE);
  let choice = saved === 'on' || saved === 'off' ? saved : null;

  function sync() {
    document.documentElement.dataset.motion = choice || 'ask';
    events.dispatchEvent(new Event('change'));
  }
  function persist() {
    if (window.forjaI18n?.consent !== 'accepted') return;
    const path = new URL(window.FORJA_ROOT || location.href).pathname;
    document.cookie = `${COOKIE}=${choice || ''}; Path=${path}; Max-Age=${choice ? 15552000 : 0}; SameSite=Lax; Secure`;
  }
  window.forjaMotion = {
    // Sem resposta ainda, o aparelho decide — é o palpite seguro até a pergunta.
    get matches() {return choice ? choice === 'off' : system.matches;},
    get systemReduced() {return system.matches;},
    get choice() {return choice;},
    // Só vale perguntar quando o aparelho pediu algo e a pessoa ainda não disse nada.
    get needsAsk() {return !choice && system.matches;},
    get preference() {return choice === 'on' ? 'full' : choice === 'off' ? 'reduced' : 'system';},
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    persist,
    choose(value) {choice = value === 'on' ? 'on' : 'off'; persist(); sync();},
    forget() {choice = null; persist(); sync();},
    setPreference(value) {this.choose(value === 'full' ? 'on' : 'off');}
  };
  system.addEventListener('change', sync);
  sync();
})();
