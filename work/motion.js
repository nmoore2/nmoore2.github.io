/* A saved visitor choice takes precedence over their system motion preference. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manual = null;
  try {
    const saved = localStorage.getItem('nm-motion');
    if (saved === 'full' || saved === 'reduced') manual = saved;
  } catch (_) {}

  const isReduced = () => manual === 'reduced' || (manual !== 'full' && preference.matches);
  function apply() {
    const reduced = isReduced();
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      const label = button.querySelector('[data-motion-label]') || button;
      label.textContent = reduced ? 'Play motion' : 'Pause motion';
      button.setAttribute('aria-pressed', String(!reduced));
      button.setAttribute('aria-label', reduced ? 'Play motion' : 'Pause motion');
      button.title = reduced ? 'Play animations, including when system Reduce Motion is on' : 'Pause animations';
      button.disabled = false;
    });
    document.dispatchEvent(new CustomEvent('motionchange', { detail: { reduced } }));
  }
  function set(value) {
    manual = value === 'full' ? 'full' : 'reduced';
    try { localStorage.setItem('nm-motion', manual); } catch (_) {}
    apply();
  }
  function toggle() { set(isReduced() ? 'full' : 'reduced'); }
  window.nmMotion = { isReduced, set, toggle };
  document.addEventListener('click', event => {
    if (event.target.closest('[data-motion-toggle]')) toggle();
  });
  preference.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key !== 'nm-motion') return;
    manual = ['full', 'reduced'].includes(event.newValue) ? event.newValue : null;
    apply();
  });
  apply();
})();
