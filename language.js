(() => {
  'use strict';
  const prices = window.FORJA_PRICES;
  const cookiePath = window.FORJA_ROOT.pathname;
  document.documentElement.lang = 'pt-BR';
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
  window.forjaI18n = {t: value => value, lang: 'pt-BR'};
  document.addEventListener('DOMContentLoaded', () => {syncURL(); updatePrices();});
})();
