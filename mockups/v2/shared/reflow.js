/* ═══════════════════════════════════════════════════════════════════════
   SIGNATURE 4 — Reflow
   Renders into <div data-reflow></div>.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const MIN = 280;
  const PRESETS = [['360', 360], ['480', 480], ['700', 700], ['Full', 'max']];

  function build(root) {
    root.classList.add('reflow');
    root.innerHTML = `
      <div class="reflow-bar">
        <span class="lbl">Live component</span>
        <div class="reflow-presets" role="group" aria-label="Preset widths"></div>
        <span class="reflow-read">container <b class="px">—</b>px</span>
      </div>
      <div class="reflow-stage">
        <div class="reflow-resizer" style="--w:100%">
          <article class="rf-card">
            <span class="rf-badge" aria-hidden="true"></span>
            <div class="rf-inner">
              <div class="rf-shot" aria-hidden="true">
                <svg viewBox="0 0 200 120" aria-hidden="true">
                  <path class="rf-spark" d="M12 96 52 60l30 22 38-52 34 40 22-16"/>
                  <circle cx="52" cy="60" r="5" fill="var(--bg)"/>
                  <circle cx="120" cy="30" r="5" fill="var(--bg)"/>
                </svg>
              </div>
              <div class="rf-body">
                <span class="rf-eyebrow">Case study</span>
                <h3>Subscription data that still reads on a phone</h3>
                <p>Recurly's revenue story depended on multi-series charts. The desktop
                version was the easy half; keeping it interactive and legible at 360px
                without forking the component was the work.</p>
                <ul class="rf-meta"><li>SVG</li><li>Container queries</li><li>WAAPI</li></ul>
                <a class="rf-cta" href="/work/recurly/">Open the study <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </article>
          <button class="reflow-handle" aria-label="Resize component" role="slider"
                  aria-valuemin="${MIN}" aria-valuemax="1000" aria-valuenow="0"
                  aria-valuetext="full width" tabindex="0"><i></i></button>
        </div>
      </div>
      <p class="reflow-note">Layout, badge and this rule all come from the same query set,
      so the label can't disagree with what you're seeing. Matching now:
      <span class="rf-rule"></span>. Drag the edge, or focus the handle and use the arrow
      keys — Shift for bigger steps, Home and End for the extremes.</p>`;

    const resizer = root.querySelector('.reflow-resizer');
    const handle  = root.querySelector('.reflow-handle');
    const px      = root.querySelector('.px');
    const presetWrap = root.querySelector('.reflow-presets');

    const buttons = PRESETS.map(([label, w], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.w = w; b.textContent = label;
      b.setAttribute('aria-pressed', i === PRESETS.length - 1);
      presetWrap.append(b);
      return b;
    });

    const maxWidth = () => {
      const stage = resizer.parentElement;
      const cs = getComputedStyle(stage);
      return stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    };

    const report = w => {
      const n = Math.round(w);
      px.textContent = n;
      handle.setAttribute('aria-valuenow', n);
      handle.setAttribute('aria-valuemax', Math.round(maxWidth()));
      handle.setAttribute('aria-valuetext', `${n} pixels`);
    };

    const apply = (w, { animate = true } = {}) => {
      const max = maxWidth();
      const v = Math.max(MIN, Math.min(max, w));
      if (!animate) resizer.setAttribute('data-dragging', '');
      resizer.style.setProperty('--w', v + 'px');
      report(v);
      buttons.forEach(b => b.setAttribute('aria-pressed',
        b.dataset.w === 'max' ? Math.abs(v - max) < 2 : Math.abs(v - Number(b.dataset.w)) < 2));
    };

    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      resizer.setAttribute('data-dragging', '');
    });
    handle.addEventListener('pointermove', e => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      apply(e.clientX - resizer.getBoundingClientRect().left, { animate: false });
    });
    const end = () => resizer.removeAttribute('data-dragging');
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);

    handle.addEventListener('keydown', e => {
      const cur = resizer.getBoundingClientRect().width;
      const d = e.shiftKey ? 100 : 20;
      let next = cur;
      if (e.key === 'ArrowRight') next = cur + d;
      else if (e.key === 'ArrowLeft') next = cur - d;
      else if (e.key === 'Home') next = MIN;
      else if (e.key === 'End') next = maxWidth();
      else return;
      e.preventDefault();
      apply(next);
    });

    buttons.forEach(b => b.addEventListener('click', () =>
      apply(b.dataset.w === 'max' ? maxWidth() : Number(b.dataset.w))));

    new ResizeObserver(entries => report(entries[0].contentRect.width)).observe(resizer);

    apply(maxWidth(), { animate: false });
    requestAnimationFrame(end);
  }

  document.querySelectorAll('[data-reflow]').forEach(build);
})();
