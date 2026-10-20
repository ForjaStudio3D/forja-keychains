(() => {
  'use strict';
  const catalog = window.FORJA_PRICES;
  if (!catalog) return;
  const money = amount => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(amount);
  document.querySelectorAll('[data-unit]').forEach(node => {
    const price = catalog[node.dataset.unit];
    if (price != null) node.textContent = `${['carabiner','nfcAddon'].includes(node.dataset.unit) ? '+ ' : ''}${money(price)}`;
  });
  document.querySelectorAll('[data-lot]').forEach(node => {
    const price = catalog[node.dataset.lot];
    if (price != null) node.textContent = money(price * catalog.minimum);
  });
  document.querySelectorAll('[data-lot-label]').forEach(node => {
    const price = catalog[node.dataset.lotLabel];
    if (price != null) node.textContent = `${catalog.minimum} un. · ${money(price * catalog.minimum)}`;
  });
})();
