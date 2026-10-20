/* ═══════════════════════════════════════════════════════════════════════
   MOTION SWITCH
   One source of truth for whether this page animates, shared by the CSS
   and all five signature pieces.

   It deliberately matches the contract the live site already uses in
   /work/motion.js — same storage key, same `data-motion` values, same
   `motionchange` event, same `window.nmMotion` API — so a page built from
   one of these variants drops straight in beside the existing case studies.

   A saved visitor choice outranks the system preference in both directions:
   someone who has Reduce Motion on system-wide can still opt into the
   animation here, which is the whole reason the control is visible rather
   than inferred.

   The initial value is written by a tiny inline script in <head> so the
   first paint is already correct; this file only takes over afterwards.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const KEY = 'nm-motion';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let manual = null;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'full' || saved === 'reduced') manual = saved;
  } catch {}

  const isReduced = () => manual === 'reduced' || (manual !== 'full' && preference.matches);

  const PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>';
  const PLAY  = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1l7 5-7 5z"/></svg>';

  function apply() {
    const reduced = isReduced();
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';

    for (const button of document.querySelectorAll('[data-motion-toggle]')) {
      const action = reduced ? 'Play motion' : 'Pause motion';
      const icon = button.querySelector('[data-motion-icon]');
      const label = button.querySelector('[data-motion-label]');
      if (icon) icon.innerHTML = reduced ? PLAY : PAUSE;
      if (label) label.textContent = reduced ? 'Paused' : 'Motion';
      // The name describes what the press will DO; aria-pressed carries the
      // current state. Both, because either alone is ambiguous here.
      button.setAttribute('aria-label', action);
      button.setAttribute('aria-pressed', String(!reduced));
      button.title = reduced
        ? 'Play animations, even if your system asks to reduce motion'
        : 'Pause all animations on this page';
      button.disabled = false;
    }

    document.dispatchEvent(new CustomEvent('motionchange', { detail: { reduced } }));
  }

  function set(value) {
    manual = value === 'full' ? 'full' : 'reduced';
    try { localStorage.setItem(KEY, manual); } catch {}
    apply();
  }

  const toggle = () => set(isReduced() ? 'full' : 'reduced');

  window.nmMotion = { isReduced, set, toggle };

  document.addEventListener('click', e => {
    if (e.target.closest('[data-motion-toggle]')) toggle();
  });
  preference.addEventListener('change', apply);
  // Keep tabs in step — two windows disagreeing about this is a real bug.
  addEventListener('storage', e => {
    if (e.key !== KEY) return;
    manual = ['full', 'reduced'].includes(e.newValue) ? e.newValue : null;
    apply();
  });

  apply();
})();
