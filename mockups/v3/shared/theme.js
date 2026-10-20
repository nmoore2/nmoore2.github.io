/* ═══════════════════════════════════════════════════════════════════════
   THEME SWITCHER
   Same contract as the motion switch: an attribute on <html>, a saved
   choice, and a tiny inline script in <head> that sets it before first
   paint so nothing flashes the wrong palette on the way to the right one.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const KEY = 'nm-theme';
  const THEMES = [
    { id: 'reel',      name: 'Reel',         bg: '#07070a', acc: '#ff5c35' },
    { id: 'sheet',     name: 'Contact sheet',bg: '#0b0a10', acc: '#a78bfa' },
    { id: 'console',   name: 'Console',      bg: '#0c0e0d', acc: '#4ade80' },
    { id: 'stage',     name: 'Stage',        bg: '#08080a', acc: '#e4ff3f' },
    { id: 'control',   name: 'Control room', bg: '#0a0c0f', acc: '#00d3f2' },
    { id: 'ember',     name: 'Ember',        bg: '#15100c', acc: '#ff7a2f' },
    { id: 'cyanotype', name: 'Cyanotype',    bg: '#060d18', acc: '#36d2ff' }
  ];

  const current = () => document.documentElement.dataset.theme || 'reel';
  const set = id => {
    if (!THEMES.some(t => t.id === id)) return;
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem(KEY, id); } catch {}
    paint();
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: id } }));
  };

  let buttons = [];
  const paint = () => buttons.forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.theme === current())));

  document.querySelectorAll('[data-theme-pick]').forEach(wrap => {
    wrap.classList.add('theme-pick');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Colour theme');
    THEMES.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.theme = t.id;
      b.style.setProperty('--sw-bg', t.bg);
      b.style.setProperty('--sw-acc', t.acc);
      b.title = t.name;
      b.setAttribute('aria-label', t.name + ' theme');
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => set(t.id));
      wrap.append(b);
      buttons.push(b);
    });
  });

  window.nmTheme = { set, current, list: () => THEMES.map(t => t.id) };
  paint();

  // Another tab switching theme should not leave this one disagreeing.
  addEventListener('storage', e => {
    if (e.key === KEY && e.newValue) { document.documentElement.dataset.theme = e.newValue; paint(); }
  });
})();
