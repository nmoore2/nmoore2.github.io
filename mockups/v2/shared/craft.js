/* ═══════════════════════════════════════════════════════════════════════
   SIGNATURE 5 — Craft wall
   Renders into <div data-craft></div>. Optional data-only="id,id,…" picks
   a subset and an order, so a variant can lead with different components
   without forking any of this.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  const reduced = () => window.nmMotion
    ? window.nmMotion.isReduced()
    : matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TILES = {};
  const def = (id, title, wide, note, markup, wire) =>
    TILES[id] = { id, title, wide, note, markup, wire };

  /* ── 1 · spring toggle ───────────────────────────────────────────── */
  def('toggle', 'Spring toggle', false,
    'Overshoot on the thumb, squash while held. One transition and a real <code>aria-pressed</code> button — not a styled checkbox pretending.',
    `<button class="c-sw" type="button" aria-pressed="false" aria-label="Enable setting"></button>`,
    tile => {
      const b = tile.querySelector('.c-sw');
      b.addEventListener('click', () =>
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'));
    });

  /* ── 2 · segmented control ───────────────────────────────────────── */
  def('seg', 'Segmented control', true,
    'The indicator measures the real button box, so it stays correct when the labels, the font or the language change. Arrow keys move between tabs; only the selected tab is in the tab order.',
    `<div class="c-seg" role="tablist" aria-label="View">
       <span class="thumb" aria-hidden="true"></span>
       <button role="tab" aria-selected="true">Overview</button>
       <button role="tab" aria-selected="false">Activity</button>
       <button role="tab" aria-selected="false">Settings</button>
     </div>`,
    tile => {
      const seg = tile.querySelector('.c-seg');
      const thumb = seg.querySelector('.thumb');
      const tabs = [...seg.querySelectorAll('[role="tab"]')];
      const move = el => {
        thumb.style.setProperty('--x', (el.offsetLeft - 4) + 'px');
        thumb.style.setProperty('--w', el.offsetWidth + 'px');
      };
      const select = el => {
        tabs.forEach(t => { t.setAttribute('aria-selected', t === el); t.tabIndex = t === el ? 0 : -1; });
        move(el); el.focus();
      };
      tabs.forEach((t, i) => {
        t.tabIndex = i === 0 ? 0 : -1;
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', e => {
          const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          select(tabs[(i + d + tabs.length) % tabs.length]);
        });
      });
      const place = () => {
        const prev = thumb.style.transition;
        thumb.style.transition = 'none';
        move(tabs.find(t => t.getAttribute('aria-selected') === 'true'));
        void thumb.offsetWidth;
        thumb.style.transition = prev;
      };
      place();
      document.fonts?.ready.then(place);
      addEventListener('resize', place, { passive: true });
    });

  /* ── 3 · copy state ──────────────────────────────────────────────── */
  def('copy', 'Copy state', false,
    'The icon crossfades and springs; the result is announced through a live region instead of stealing focus.',
    `<button class="c-copy" type="button" data-state="idle">
       <span class="ico" aria-hidden="true">
         <svg class="clip" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
         <svg class="check" viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg>
       </span><span class="txt">hello@nmoore.net</span>
     </button><span class="sr" aria-live="polite"></span>`,
    tile => {
      const btn = tile.querySelector('.c-copy');
      const live = tile.querySelector('[aria-live]');
      let t;
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(btn.querySelector('.txt').textContent.trim()); } catch {}
        btn.dataset.state = 'done';
        live.textContent = 'Email address copied';
        clearTimeout(t);
        t = setTimeout(() => { btn.dataset.state = 'idle'; live.textContent = ''; }, 1800);
      });
    });

  /* ── 4 · odometer ────────────────────────────────────────────────── */
  def('odometer', 'Odometer', false,
    'Per-digit reels on tabular numerals, so only the digits that change actually move. The real value goes out through a live region.',
    `<div class="c-odo" aria-hidden="true"></div><span class="sr" aria-live="polite"></span>
     <div class="c-odo-ctl">
       <button type="button" data-step="-7" aria-label="Decrease">&minus;</button>
       <button type="button" data-step="7" aria-label="Increase">+</button>
     </div>`,
    tile => {
      const el = tile.querySelector('.c-odo');
      const live = tile.querySelector('[aria-live]');
      let value = 1280, reels = [];
      const build = n => {
        el.innerHTML = '';
        reels = String(n).split('').map(() => {
          const col = h(`<span class="col"><span class="reel"></span></span>`);
          const reel = col.firstElementChild;
          for (let i = 0; i <= 9; i++) reel.append(h(`<span>${i}</span>`));
          el.append(col);
          return reel;
        });
        el.append(h(`<span class="uom">px</span>`));
      };
      const render = n => {
        String(n).padStart(reels.length, '0').split('')
          .forEach((d, i) => reels[i].style.translate = `0 ${-d}em`);
        live.textContent = n + ' pixels';
      };
      build(value); render(value);
      tile.querySelectorAll('.c-odo-ctl button').forEach(b =>
        b.addEventListener('click', () => {
          value = Math.max(0, Math.min(9999, value + Number(b.dataset.step)));
          render(value);
        }));
    });

  /* ── 5 · detented slider ─────────────────────────────────────────── */
  def('slider', 'Detented slider', true,
    'Pointer capture so the drag survives leaving the track, snap-to-detent, and the full keyboard contract — arrows, Home, End, PageUp/PageDown — on a correct <code>role="slider"</code> with <code>aria-valuetext</code>.',
    `<div class="c-sld">
       <div class="track" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="4"
            aria-valuenow="2" aria-label="Density" aria-valuetext="Comfortable">
         <div class="rail"></div><div class="fill"></div><div class="knob"></div>
       </div>
       <div class="ticks"><span>XS</span><span>S</span><span data-on>M</span><span>L</span><span>XL</span></div>
     </div>`,
    tile => {
      const track = tile.querySelector('.track');
      const fill = tile.querySelector('.fill');
      const knob = tile.querySelector('.knob');
      const ticks = [...tile.querySelectorAll('.ticks span')];
      const names = ['Compact', 'Snug', 'Comfortable', 'Roomy', 'Spacious'];
      const MAX = ticks.length - 1;
      let v = 2;
      const paint = () => {
        const p = (v / MAX) * 100 + '%';
        fill.style.width = p; knob.style.left = p;
        track.setAttribute('aria-valuenow', v);
        track.setAttribute('aria-valuetext', names[v]);
        ticks.forEach((t, i) => i === v ? t.setAttribute('data-on', '') : t.removeAttribute('data-on'));
      };
      const fromX = x => {
        const r = track.getBoundingClientRect();
        return Math.round(Math.min(1, Math.max(0, (x - r.left) / r.width)) * MAX);
      };
      const set = n => { if (n !== v) { v = n; paint(); } };
      track.addEventListener('pointerdown', e => { track.setPointerCapture(e.pointerId); set(fromX(e.clientX)); });
      track.addEventListener('pointermove', e => { if (track.hasPointerCapture(e.pointerId)) set(fromX(e.clientX)); });
      track.addEventListener('keydown', e => {
        const map = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
        let n = v;
        if (e.key in map) n = v + map[e.key];
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = MAX;
        else if (e.key === 'PageUp') n = v + 2;
        else if (e.key === 'PageDown') n = v - 2;
        else return;
        e.preventDefault();
        set(Math.max(0, Math.min(MAX, n)));
      });
      paint();
    });

  /* ── 6 · tooltip group ───────────────────────────────────────────── */
  def('tooltip', 'Tooltip group', false,
    'Warm-up delay on the first, instant on the rest, cooling off after you leave — the behaviour good desktop apps have and most websites miss.',
    `<div class="c-tips">
       <span class="c-tip"><button type="button" aria-describedby="tt1">⌘</button><span class="bubble" id="tt1" role="tooltip">Command palette</span></span>
       <span class="c-tip"><button type="button" aria-describedby="tt2">⇧</button><span class="bubble" id="tt2" role="tooltip">Multi-select</span></span>
       <span class="c-tip"><button type="button" aria-describedby="tt3">⌥</button><span class="bubble" id="tt3" role="tooltip">Duplicate</span></span>
     </div>`,
    tile => {
      const wrap = tile.querySelector('.c-tips');
      let cool;
      wrap.addEventListener('pointerover', () => {
        clearTimeout(cool);
        setTimeout(() => wrap.setAttribute('data-warm', ''), 500);
      });
      wrap.addEventListener('pointerleave', () => {
        cool = setTimeout(() => wrap.removeAttribute('data-warm'), 900);
      });
    });

  /* ── 7 · submit morph ────────────────────────────────────────────── */
  def('submit', 'Submit morph', false,
    'Width animates down to the spinner and back out to the result, disabled while busy, state announced rather than implied by colour.',
    `<button class="c-morph" type="button" data-state="idle">
       <span class="lbl">Send inquiry</span>
       <span class="spin" aria-hidden="true"><i></i></span>
     </button><span class="sr" aria-live="polite"></span>`,
    tile => {
      const btn = tile.querySelector('.c-morph');
      const lbl = btn.querySelector('.lbl');
      const live = tile.querySelector('[aria-live]');
      btn.addEventListener('click', () => {
        if (btn.dataset.state !== 'idle') return;
        btn.dataset.state = 'busy'; btn.disabled = true; live.textContent = 'Sending';
        setTimeout(() => {
          btn.dataset.state = 'done'; btn.disabled = false;
          lbl.textContent = 'Sent ✓'; live.textContent = 'Sent';
          setTimeout(() => { btn.dataset.state = 'idle'; lbl.textContent = 'Send inquiry'; live.textContent = ''; }, 1900);
        }, 1200);
      });
    });

  /* ── 8 · disclosure ──────────────────────────────────────────────── */
  def('disclosure', 'Disclosure', true,
    'Height animated with <code>interpolate-size</code> and <code>::details-content</code> — no JS measuring the box, and it still opens with scripting off.',
    `<div class="c-acc">
       <details open><summary>What I do best <i aria-hidden="true"></i></summary>
         <div class="inner">Data visualisation that survives a phone. Motion with a real reduced-motion path. Component systems other engineers extend without asking me first.</div></details>
       <details><summary>What I reach for <i aria-hidden="true"></i></summary>
         <div class="inner">TypeScript, React, and modern CSS — container queries, cascade layers, <code>:has()</code>, view transitions. And plain HTML when that is the right answer, which is more often than it sounds.</div></details>
       <details><summary>How I work <i aria-hidden="true"></i></summary>
         <div class="inner">Close to design, early. Prototype in the browser instead of arguing in a comment thread.</div></details>
     </div>`,
    () => {});

  /* ── 9 · FLIP reorder ────────────────────────────────────────────── */
  def('flip', 'FLIP reorder', true,
    'Sort changes the DOM order; the items then animate from where they used to be. First, Last, Invert, Play — measured with <code>getBoundingClientRect</code> and played with the Web Animations API, which is how you animate a layout change you did not cause.',
    `<ul class="c-flip"></ul>
     <div class="c-flip-ctl">
       <button type="button" data-sort="score">By score</button>
       <button type="button" data-sort="name">A–Z</button>
       <button type="button" data-sort="shuffle">Shuffle</button>
     </div><span class="sr" aria-live="polite"></span>`,
    tile => {
      const list = tile.querySelector('.c-flip');
      const live = tile.querySelector('[aria-live]');
      const DATA = [
        { name: 'Contrast', score: 97 }, { name: 'Keyboard', score: 100 },
        { name: 'Weight', score: 88 },   { name: 'Shift', score: 94 }
      ];
      const render = rows => {
        list.innerHTML = '';
        rows.forEach(r => list.append(h(
          `<li data-k="${r.name}"><b>${String(r.score).padStart(3, '0')}</b>${r.name}` +
          `<span class="bar" style="--b:${r.score * .38}px"></span></li>`)));
      };
      render(DATA);

      const reorder = rows => {
        const items = [...list.children];
        const first = new Map(items.map(el => [el.dataset.k, el.getBoundingClientRect().top]));
        render(rows);
        if (reduced()) return;
        for (const el of list.children) {
          const from = first.get(el.dataset.k);
          if (from == null) continue;
          const dy = from - el.getBoundingClientRect().top;
          if (!dy) continue;
          el.animate(
            [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
            { duration: 480, easing: 'cubic-bezier(.34,1.3,.42,1)' });
        }
      };

      tile.querySelectorAll('[data-sort]').forEach(b =>
        b.addEventListener('click', () => {
          const how = b.dataset.sort;
          const rows = [...DATA];
          if (how === 'score') rows.sort((a, c) => c.score - a.score);
          else if (how === 'name') rows.sort((a, c) => a.name.localeCompare(c.name));
          else rows.sort(() => Math.random() - .5);
          reorder(rows);
          live.textContent = `Reordered: ${rows.map(r => r.name).join(', ')}`;
        }));
    });

  /* ── 10 · magnetic button ────────────────────────────────────────── */
  def('magnet', 'Magnetic target', false,
    'The button leans toward the cursor inside its field and springs back when you leave. Pointer-fine only, and completely inert under reduced motion — the click target never moves away from anyone relying on it.',
    `<div class="c-mag-field"><button class="c-mag" type="button">Get in touch</button></div>`,
    tile => {
      const field = tile.querySelector('.c-mag-field');
      const btn = tile.querySelector('.c-mag');
      // Checked per event, not once at wire-up: the visitor can pause motion
      // after the page loads, and the target must stop leaning immediately.
      if (!matchMedia('(pointer: fine)').matches) return;
      let queued = false, ev = null;
      field.addEventListener('pointermove', e => {
        if (reduced()) return;
        ev = e;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          const r = btn.getBoundingClientRect();
          const dx = ev.clientX - (r.left + r.width / 2);
          const dy = ev.clientY - (r.top + r.height / 2);
          btn.setAttribute('data-pull', '');
          btn.style.setProperty('--mx', (dx * .28).toFixed(1) + 'px');
          btn.style.setProperty('--my', (dy * .32).toFixed(1) + 'px');
          queued = false;
        });
      }, { passive: true });
      field.addEventListener('pointerleave', () => {
        btn.removeAttribute('data-pull');
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });

  /* ── Render ──────────────────────────────────────────────────────── */
  const ORDER = ['toggle', 'seg', 'copy', 'odometer', 'slider', 'tooltip',
                 'submit', 'flip', 'disclosure', 'magnet'];

  document.querySelectorAll('[data-craft]').forEach(root => {
    root.classList.add('craft');
    const ids = (root.dataset.only || '').trim()
      ? root.dataset.only.split(',').map(s => s.trim()).filter(id => TILES[id])
      : ORDER;

    ids.forEach((id, i) => {
      const t = TILES[id];
      const tile = h(`<article class="tile${t.wide ? ' w2' : ''}">
          <h3>${t.title}<span>${String(i + 1).padStart(2, '0')}</span></h3>
          <div class="stage"></div>
          <footer>${t.note}</footer>
        </article>`);
      tile.querySelector('.stage').innerHTML = t.markup;
      root.append(tile);
      t.wire(tile);
    });
  });
})();
