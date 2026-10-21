(() => {
  'use strict';
  const prices = window.FORJA_PRICES;
  const cookiePath = window.FORJA_ROOT.pathname;
  const readCookie = name => document.cookie.split('; ').find(value => value.startsWith(name + '='))?.slice(name.length + 1);
  const cookie = (name, value, age = 15552000) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=${cookiePath}; Max-Age=${age}; SameSite=Lax; Secure`;
  };
  let consent = readCookie('forja_consent');
  document.documentElement.lang = 'pt-BR';
  // Retire escolhas de idioma deixadas pela versão bilíngue.
  if (readCookie('forja_lang')) cookie('forja_lang', '', 0);

  const money = value => new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);
  function updatePrices() {
    document.querySelectorAll('[data-price]').forEach(element => {
      const key = element.dataset.price;
      const value = key === 'lot' ? prices.single * prices.minimum : prices[key];
      if (value == null) return;
      element.textContent = key === 'lot' ? `A partir de ${money(value)}` : `${key === 'carabiner' || key === 'nfcAddon' ? '+ ' : ''}${money(value)}`;
    });
    document.querySelectorAll('[data-price-copy]').forEach(element => {
      const unit = prices[element.dataset.priceCopy];
      if (unit != null) element.textContent = `por unidade · lote de ${prices.minimum} por ${money(unit * prices.minimum)}`;
    });
  }
  function syncURL() {
    const url = new URL(location.href);
    url.pathname = cookiePath;
    url.searchParams.delete('lang');
    if (url.href !== location.href) history.replaceState(null, '', url);
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.href = url.pathname + url.search + link.getAttribute('href');
    });
  }
  window.forjaI18n = {
    t: value => value,
    lang: 'pt-BR',
    get consent() { return consent; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const notice = document.querySelector('#cookie-notice');
    let noticeTimer = 0;
    syncURL();
    updatePrices();
    document.querySelector('.privacy-settings').addEventListener('click', () => {
      clearTimeout(noticeTimer);
      notice.hidden = false;
      notice.querySelector('button').focus();
    });
    document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
      clearTimeout(noticeTimer);
      consent = button.dataset.consent;
      cookie('forja_consent', consent);
      notice.hidden = true;
      if (consent === 'accepted') window.forjaMotion?.persist();
      else {
        cookie('forja_motion', '', 0);
        try { localStorage.removeItem('forja-motion'); } catch {}
      }
    }));
    if (!['accepted', 'denied'].includes(consent)) noticeTimer = setTimeout(() => { notice.hidden = false; }, 10000);
  });
})();
