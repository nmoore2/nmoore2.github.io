/* ═══════════════════════════════════════════════════════════════════════
   SIGNATURE 1 — "How I get it done"

   Renders into any <div data-process></div>.

   Design note: the nine rectangles are the whole trick. Each stage is a set
   of nine geometries; switching stage writes nine sets of custom properties
   and CSS interpolates. Nothing is a keyframe, so any stage can interrupt
   any other mid-flight and the result is still correct.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, kids = []) => {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    for (const c of [].concat(kids)) n.append(c);
    return n;
  };

  /* ── Stage geometry: 5 stages × 9 units ──────────────────────────── */
  const ACC = 'var(--accent)', ACC2 = 'var(--accent-2)', NEU = 'var(--line-2)', INK = 'var(--ink)';

  const STAGES = [
    { // 0 · Understand — fragments of a request, scattered
      units: [
        { x: 62,  y: 72,  w: 104, h: 18, r: 9, f: NEU, o: .9 },
        { x: 238, y: 46,  w: 86,  h: 16, r: 8, f: NEU, o: .6 },
        { x: 402, y: 88,  w: 118, h: 20, r: 10, f: NEU, o: .8 },
        { x: 556, y: 58,  w: 92,  h: 16, r: 8, f: NEU, o: .5 },
        { x: 96,  y: 188, w: 128, h: 18, r: 9, f: NEU, o: .75 },
        { x: 300, y: 166, w: 74,  h: 16, r: 8, f: ACC, o: .9 },
        { x: 470, y: 206, w: 106, h: 18, r: 9, f: NEU, o: .65 },
        { x: 150, y: 296, w: 96,  h: 16, r: 8, f: NEU, o: .55 },
        { x: 386, y: 312, w: 132, h: 20, r: 10, f: NEU, o: .7 }
      ],
      label: 'Understand',
      hint: 'Decide what the thing actually is',
      caption: '<b>Understand.</b> A request arrives as fragments — a deck, a thread, three ' +
               'opinions that disagree. The first job is converging them into one sentence ' +
               'about who this is for and what decision it has to support.'
    },
    { // 1 · Prototype — the fragments snap into a wireframe
      units: [
        { x: 166, y: 72,  w: 388, h: 22, r: 4, f: NEU, o: 1 },
        { x: 166, y: 106, w: 388, h: 92, r: 6, f: NEU, o: .55 },
        { x: 166, y: 210, w: 120, h: 76, r: 6, f: NEU, o: .8 },
        { x: 300, y: 210, w: 120, h: 76, r: 6, f: NEU, o: .8 },
        { x: 434, y: 210, w: 120, h: 76, r: 6, f: NEU, o: .8 },
        { x: 166, y: 298, w: 250, h: 10, r: 5, f: NEU, o: .7 },
        { x: 166, y: 316, w: 180, h: 10, r: 5, f: NEU, o: .5 },
        { x: 434, y: 298, w: 120, h: 28, r: 6, f: ACC, o: 1 },
        { x: 166, y: 342, w: 388, h: 6,  r: 3, f: NEU, o: .4 }
      ],
      label: 'Prototype',
      hint: 'Lay it out in the browser',
      caption: '<b>Prototype.</b> That sentence becomes a rough layout in the browser, not a ' +
               'picture of one. Arguing about a static mock costs more than building the real ' +
               'thing badly once and looking at it.'
    },
    { // 2 · Systemize — the wireframe breaks into tokens
      units: [
        { x: 80,  y: 110, w: 40,  h: 40, r: 10, f: ACC,  o: 1 },
        { x: 128, y: 110, w: 40,  h: 40, r: 10, f: ACC2, o: 1 },
        { x: 176, y: 110, w: 40,  h: 40, r: 10, f: INK,  o: .9 },
        { x: 224, y: 110, w: 40,  h: 40, r: 10, f: NEU,  o: 1 },
        { x: 320, y: 104, w: 220, h: 26, r: 3,  f: NEU,  o: .95 },
        { x: 320, y: 142, w: 160, h: 18, r: 3,  f: NEU,  o: .75 },
        { x: 320, y: 172, w: 112, h: 12, r: 3,  f: NEU,  o: .55 },
        { x: 572, y: 110, w: 96,  h: 8,  r: 4,  f: ACC2, o: .85 },
        { x: 572, y: 132, w: 96,  h: 30, r: 4,  f: NEU,  o: .7 }
      ],
      label: 'Systemize',
      hint: 'Tokens first, then one component',
      caption: '<b>Systemize.</b> Break the prototype into its real parts — colour, type scale, ' +
               'spacing — then rebuild it as one component that holds at three sizes, instead of ' +
               'three components that drift apart by the second sprint.'
    },
    { // 3 · Build — one component, three sizes, filled with real content
      units: [
        { x: 70, y: 70,  w: 300, h: 70, r: 8, f: NEU, o: .4 },
        { x: 70, y: 152, w: 220, h: 70, r: 8, f: NEU, o: .4 },
        { x: 70, y: 234, w: 150, h: 88, r: 8, f: NEU, o: .4 },
        { x: 84, y: 86,  w: 120, h: 10, r: 5, f: ACC, o: 1 },
        { x: 84, y: 104, w: 262, h: 8,  r: 4, f: NEU, o: .9 },
        { x: 84, y: 168, w: 100, h: 10, r: 5, f: ACC, o: 1 },
        { x: 84, y: 186, w: 182, h: 8,  r: 4, f: NEU, o: .9 },
        { x: 84, y: 250, w: 80,  h: 10, r: 5, f: ACC, o: 1 },
        { x: 84, y: 268, w: 122, h: 8,  r: 4, f: NEU, o: .9 }
      ],
      label: 'Build',
      hint: 'Correctness in the same pass',
      caption: '<b>Build.</b> Real content goes in while the correctness work lands beside it — ' +
               'contrast, focus order, the keyboard path, the weight budget. Not a later pass. ' +
               'A later pass never happens.'
    },
    { // 4 · Ship & learn — everything flattens into measured reality
      units: [0,1,2,3,4,5,6,7,8].map(i => {
        const h = [70,110,88,150,124,186,160,224,206][i];
        return { x: 90 + i * 62, y: 330 - h, w: 38, h, r: 4,
                 f: i > 5 ? ACC : NEU, o: i > 5 ? 1 : .55 + i * .04 };
      }),
      label: 'Ship & learn',
      hint: 'Live, measured, back around',
      caption: '<b>Ship &amp; learn.</b> It goes live, real use draws the picture, and what the ' +
               'picture says becomes the first sentence of the next step one. The loop is the point.'
    }
  ];

  const TREND = [0,1,2,3,4,5,6,7,8].map(i => {
    const h = [70,110,88,150,124,186,160,224,206][i];
    return `${90 + i * 62 + 19},${330 - h - 10}`;
  }).join(' ');

  const BADGES = [
    ['4.8:1 contrast', 'M3 8.5 6.5 12 13 4'],
    ['focus order', 'M3 8.5 6.5 12 13 4'],
    ['keyboard path', 'M3 8.5 6.5 12 13 4'],
    ['41 kB, 0 shift', 'M3 8.5 6.5 12 13 4']
  ];

  /* ── Build one instance ──────────────────────────────────────────── */
  function build(root) {
    root.classList.add('process');
    root.dataset.step = '0';

    /* -- stage ---------------------------------------------------- */
    const svg = el('svg', {
      viewBox: '0 0 720 400', role: 'img',
      'aria-label': 'Animated diagram of a five-stage working process'
    });

    const grid = el('g', { class: 'pr-grid' });
    for (let x = 166; x <= 554; x += 48.5) grid.append(el('line', { x1: x, y1: 56, x2: x, y2: 356 }));
    for (let y = 72; y <= 344; y += 34) grid.append(el('line', { x1: 150, y1: y, x2: 570, y2: y }));
    svg.append(grid);

    const unitsG = el('g', { class: 'pr-units' });
    const units = STAGES[0].units.map(() => {
      const g = el('g', { class: 'unit' });
      g.append(el('rect', {}));
      unitsG.append(g);
      return g;
    });
    svg.append(unitsG);

    /* overlay 0 — scan */
    const o0 = el('g', { class: 'pr-overlay', 'data-o': '0' }, [
      el('line', { class: 'pr-scan', x1: 40, y1: 36, x2: 40, y2: 364 })
    ]);

    /* overlay 1 — cursor */
    const o1 = el('g', { class: 'pr-overlay', 'data-o': '1' }, [
      el('g', { class: 'pr-cursor-g' }, [
        el('path', { class: 'pr-cursor', d: 'M0 0 L0 17 L4.6 12.6 L7.4 18.6 L10.4 17.2 L7.6 11.4 L13.8 11z' })
      ])
    ]);

    /* overlay 2 — token labels */
    const o2 = el('g', { class: 'pr-overlay', 'data-o': '2' });
    [['COLOUR', 80], ['TYPE SCALE', 320], ['SPACING', 572]].forEach(([t, x]) => {
      o2.append(el('text', { class: 'pr-label', x, y: 190 }, document.createTextNode(t)));
      o2.append(el('line', { class: 'pr-tick', x1: x, y1: 198, x2: x + 22, y2: 198 }));
    });

    /* overlay 3 — code stream + correctness badges */
    const o3 = el('g', { class: 'pr-overlay', 'data-o': '3' });
    const code = el('g', { class: 'pr-code' });
    [180,120,210,96,160,230,140,190].forEach((w, i) => {
      code.append(el('rect', { x: 420 + (i % 3 === 2 ? 14 : 0), y: 70 + i * 17, width: w, height: 7, style: `--i:${i}` }));
    });
    o3.append(code);
    BADGES.forEach(([label, d], i) => {
      // The animation sets `transform`, and a CSS transform beats a
      // presentation attribute outright — so position lives on an outer <g>
      // and the keyframes only ever touch the inner one.
      const pos = el('g', { transform: `translate(420 ${216 + i * 36})` });
      const g = el('g', { class: 'pr-badge', style: `--i:${i}` });
      g.append(el('rect', { width: 206, height: 28 }));
      g.append(el('path', { d, transform: 'translate(10 7)' }));
      g.append(el('text', { x: 34, y: 18 }, document.createTextNode(label)));
      pos.append(g);
      o3.append(pos);
    });

    /* overlay 4 — deploy pulse, trend, feedback loop */
    const o4 = el('g', { class: 'pr-overlay', 'data-o': '4' }, [
      el('circle', { class: 'pr-pulse', cx: 360, cy: 62, r: 10 }),
      el('circle', { cx: 360, cy: 62, r: 5, fill: 'var(--accent)' }),
      el('polyline', { class: 'pr-trend', points: TREND }),
      el('path', { class: 'pr-loop', d: 'M640 364 C 520 392, 220 392, 96 366' }),
      el('path', { class: 'pr-loop', d: 'M96 366 l14 10 M96 366 l16 -4' })
    ]);

    svg.append(o0, o1, o2, o3, o4);

    const stage = document.createElement('div');
    stage.className = 'process-stage';
    stage.append(svg);

    /* -- stepper --------------------------------------------------- */
    const steps = document.createElement('div');
    steps.className = 'process-steps';
    steps.setAttribute('role', 'tablist');
    steps.setAttribute('aria-label', 'Process stages');

    const buttons = STAGES.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-current', i === 0);
      b.innerHTML =
        `<span class="n"><svg class="ring" viewBox="0 0 14 14" aria-hidden="true">` +
        `<circle class="bg" cx="7" cy="7" r="5.4"/><circle class="fg" cx="7" cy="7" r="5.4"/></svg>` +
        `0${i + 1}</span><span class="t">${s.label}</span>`;
      b.append(Object.assign(document.createElement('span'), { className: 'sr', textContent: s.hint }));
      steps.append(b);
      return b;
    });

    /* -- caption + transport --------------------------------------- */
    const foot = document.createElement('div');
    foot.className = 'process-foot';
    const caption = document.createElement('p');
    caption.className = 'process-caption';
    caption.setAttribute('aria-live', 'polite');
    const transport = document.createElement('div');
    transport.className = 'process-transport';
    transport.innerHTML =
      `<button type="button" data-act="prev" aria-label="Previous stage"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8 1 3 6l5 5z"/></svg></button>` +
      `<button type="button" data-act="play" aria-label="Pause"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg></button>` +
      `<span class="state mono">01 / 05</span>` +
      `<button type="button" data-act="next" aria-label="Next stage"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 1l5 5-5 5z"/></svg></button>`;
    foot.append(caption, transport);

    root.append(stage, steps, foot);

    /* ── State ────────────────────────────────────────────────────── */
  /* Live read of the motion switch — never cached, because the visitor can
     flip it at any moment and every piece has to agree instantly. */
  const reduced = () => window.nmMotion
    ? window.nmMotion.isReduced()
    : matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DUR = parseFloat(getComputedStyle(root).getPropertyValue('--stage-dur')) || 5200;
    let step = -1, playing = false, timer = null, inView = true;

    const playBtn = transport.querySelector('[data-act="play"]');
    const stateEl = transport.querySelector('.state');

    const render = n => {
      step = n;
      root.dataset.step = n;
      const s = STAGES[n];
      s.units.forEach((u, i) => {
        const g = units[i];
        // Stagger outward from the middle so the formation reads as a move,
        // not a flock. Re-randomising per stage would look like noise.
        g.style.cssText =
          `--x:${u.x};--y:${u.y};--w:${u.w};--h:${u.h};--r:${u.r};--f:${u.f};--o:${u.o};` +
          `--d:${Math.abs(i - 4) * 42}ms`;
      });
      [o0, o1, o2, o3, o4].forEach((o, i) => o.toggleAttribute('data-on', i === n));
      buttons.forEach((b, i) => b.setAttribute('aria-current', i === n));
      caption.innerHTML = s.caption;
      stateEl.textContent = `0${n + 1} / 05`;
      // Restart the ring animation on the newly-current button.
      const ring = buttons[n].querySelector('.fg');
      ring.style.animation = 'none'; void ring.offsetWidth; ring.style.animation = '';
    };

    const tick = () => {
      clearTimeout(timer);
      if (!playing || !inView) return;
      timer = setTimeout(() => { render((step + 1) % STAGES.length); tick(); }, DUR);
    };

    const setPlaying = on => {
      playing = on;
      root.toggleAttribute('data-playing', on);
      playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
      playBtn.innerHTML = on
        ? `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>`
        : `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1l7 5-7 5z"/></svg>`;
      tick();
    };

    const goto = n => { render(n); if (playing) tick(); };

    buttons.forEach((b, i) => {
      b.addEventListener('click', () => { setPlaying(false); goto(i); });
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const n = (i + d + buttons.length) % buttons.length;
        setPlaying(false); goto(n); buttons[n].focus();
      });
    });

    transport.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'play') return setPlaying(!playing);
      setPlaying(false);
      goto((step + (act === 'next' ? 1 : -1) + STAGES.length) % STAGES.length);
    });

    /* Don't animate off-screen or in a hidden tab — it burns battery and
       the user misses the choreography anyway. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; tick(); },
        { threshold: .25 }).observe(root);
    }
    document.addEventListener('visibilitychange', () => {
      inView = document.visibilityState === 'visible';
      tick();
    });

    render(0);
    if (reduced()) { render(STAGES.length - 1); setPlaying(false); }
    else setPlaying(true);

    // Follow the switch both ways: pausing holds the fullest stage so the
    // diagram still explains the process standing still.
    document.addEventListener('motionchange', e => {
      if (e.detail.reduced) { render(STAGES.length - 1); setPlaying(false); }
      else setPlaying(true);
    });
  }

  document.querySelectorAll('[data-process]').forEach(build);
})();
