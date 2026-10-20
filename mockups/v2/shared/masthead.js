/* ═══════════════════════════════════════════════════════════════════════
   SIGNATURE 3 — Masthead field
   Splits [data-split] into per-character spans and arms the reveal.

   Accessibility note: splitting text into spans destroys it for screen
   readers, so the original string is restored as an aria-label on the
   element and the split result is hidden from the tree. Plenty of "text
   animation" libraries skip this; it is the whole reason this is written
   by hand.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const split = root => {
    const lines = root.innerHTML.split(/<br\s*\/?>/i);
    // A <br> is a word boundary for a reader even though textContent has no
    // space there, so the label is rebuilt from the lines rather than taken
    // from textContent.
    const label = lines
      .map(l => l.replace(/<[^>]*>/g, ''))
      .join(' ').replace(/\s+/g, ' ').trim();

    root.setAttribute('aria-label', label);
    root.innerHTML = '';
    root.classList.add('reveal');

    let n = 0;
    lines.forEach((html, li) => {
      const line = document.createElement('span');
      line.className = 'line';
      line.setAttribute('aria-hidden', 'true');
      line.style.setProperty('--line-d', `${li * 90}ms`);

      // Parse so <em>/<span class="mark"> inside the heading survive.
      const holder = document.createElement('span');
      holder.innerHTML = html;

      const walk = (src, dest) => {
        for (const node of [...src.childNodes]) {
          if (node.nodeType === Node.TEXT_NODE) {
            // Characters are wrapped per word, so a line break can only land
            // between words. Splitting straight to characters is what makes
            // most text-animation demos break "Moore." into "Moo / re."
            for (const part of node.textContent.split(/(\s+)/)) {
              if (!part) continue;
              if (/^\s+$/.test(part)) {
                const sp = document.createElement('span');
                sp.className = 'ch sp';
                sp.style.setProperty('--i', n++);
                sp.textContent = ' ';
                dest.append(sp);
                continue;
              }
              const word = document.createElement('span');
              word.className = 'w';
              for (const chr of part) {
                const s = document.createElement('span');
                s.className = 'ch';
                s.style.setProperty('--i', n++);
                s.textContent = chr;
                word.append(s);
              }
              dest.append(word);
            }
          } else {
            const clone = node.cloneNode(false);
            dest.append(clone);
            walk(node, clone);
          }
        }
      };
      walk(holder, line);
      root.append(line);
    });
  };

  const arm = el => {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        el.setAttribute('data-in', '');
      }, { threshold: .2 });
      io.observe(el);
    } else el.setAttribute('data-in', '');
  };

  document.querySelectorAll('[data-split]').forEach(el => { split(el); arm(el); });
  document.querySelectorAll('.reveal-sibling').forEach(arm);

  /* Pointer parallax on the field — two custom properties, rAF-throttled,
     and skipped entirely for reduced motion or coarse pointers. */
  const reduced = () => window.nmMotion
    ? window.nmMotion.isReduced()
    : matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fields = [...document.querySelectorAll('.field')];
  if (fields.length && matchMedia('(pointer: fine)').matches) {
    let qx = 0, qy = 0, queued = false;
    addEventListener('pointermove', e => {
      if (reduced()) return;
      qx = (e.clientX / innerWidth - .5) * 2;
      qy = (e.clientY / innerHeight - .5) * 2;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        for (const f of fields) {
          f.style.setProperty('--px', qx.toFixed(3));
          f.style.setProperty('--py', qy.toFixed(3));
        }
        queued = false;
      });
    }, { passive: true });

    // Snap the field back to centre the moment motion is paused.
    document.addEventListener('motionchange', e => {
      if (!e.detail.reduced) return;
      for (const f of fields) { f.style.setProperty('--px', 0); f.style.setProperty('--py', 0); }
    });
  }
})();
