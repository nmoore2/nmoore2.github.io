/* ═══════════════════════════════════════════════════════════════════════
   "HOW I GET IT DONE" — one five-stage argument, ten ways of drawing it
   <div data-process="blocks"></div>, or add data-pick to expose the picker.

   The stepper, autoplay clock, captions, transport and motion behaviour are
   written once. A treatment supplies a stage renderer and nothing else —
   which is exactly the claim the diagram is making about how I build things.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const el = (n, a = {}, k = []) => {
  const e = document.createElementNS(NS, n);
  for (const [p, v] of Object.entries(a)) e.setAttribute(p, v);
  for (const c of [].concat(k)) e.append(c);
  return e;
};
const svg = (vb = '0 0 720 400', extra = {}) =>
  el('svg', { viewBox: vb, preserveAspectRatio: 'xMidYMid meet', ...extra });
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const TAU = Math.PI * 2;
const reduced = () => window.nmMotion
  ? window.nmMotion.isReduced()
  : matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── The five stages. Text is shared by every treatment. ───────────── */
const STAGES = [
  { label: 'Understand', hint: 'Decide what the thing actually is',
    caption: '<b>Understand.</b> A request arrives as fragments — a deck, a thread, three opinions that disagree. The first job is converging them into one sentence about who this is for and what decision it has to support.' },
  { label: 'Prototype', hint: 'Lay it out in the browser',
    caption: '<b>Prototype.</b> That sentence becomes a rough layout in the browser, not a picture of one. Arguing about a static mock costs more than building the real thing badly once and looking at it.' },
  { label: 'Systemize', hint: 'Tokens first, then one component',
    caption: '<b>Systemize.</b> Break the prototype into its real parts — colour, type scale, spacing — then rebuild it as one component that holds at three sizes, instead of three components that drift apart by the second sprint.' },
  { label: 'Build', hint: 'Correctness in the same pass',
    caption: '<b>Build.</b> Real content goes in while the correctness work lands beside it — contrast, focus order, the keyboard path, the weight budget. Not a later pass. A later pass never happens.' },
  { label: 'Ship & learn', hint: 'Live, measured, back around',
    caption: '<b>Ship &amp; learn.</b> It goes live, real use draws the picture, and what the picture says becomes the first sentence of the next step one. The loop is the point.' }
];

/* ── One source of truth for what each stage *looks* like ───────────────
   Every stage is a list of rectangles in a 720×400 field. The block
   treatment draws them directly; the swarm fills them with particles; the
   single-line treatment walks their perimeters. Three very different
   drawings, one description. */
const ACC = 'var(--accent)', ACC2 = 'var(--accent-2)', NEU = 'var(--line-2)', INK = 'var(--ink)';
const FORMS = [
  [ // 0 · fragments
    { x: 62, y: 72, w: 104, h: 18, r: 9, f: NEU, o: .9 },
    { x: 238, y: 46, w: 86, h: 16, r: 8, f: NEU, o: .6 },
    { x: 402, y: 88, w: 118, h: 20, r: 10, f: NEU, o: .8 },
    { x: 556, y: 58, w: 92, h: 16, r: 8, f: NEU, o: .5 },
    { x: 96, y: 188, w: 128, h: 18, r: 9, f: NEU, o: .75 },
    { x: 300, y: 166, w: 74, h: 16, r: 8, f: ACC, o: .95 },
    { x: 470, y: 206, w: 106, h: 18, r: 9, f: NEU, o: .65 },
    { x: 150, y: 296, w: 96, h: 16, r: 8, f: NEU, o: .55 },
    { x: 386, y: 312, w: 132, h: 20, r: 10, f: NEU, o: .7 }
  ],
  [ // 1 · wireframe
    { x: 166, y: 72, w: 388, h: 22, r: 4, f: NEU, o: 1 },
    { x: 166, y: 106, w: 388, h: 92, r: 6, f: NEU, o: .55 },
    { x: 166, y: 210, w: 120, h: 76, r: 6, f: NEU, o: .8 },
    { x: 300, y: 210, w: 120, h: 76, r: 6, f: NEU, o: .8 },
    { x: 434, y: 210, w: 120, h: 76, r: 6, f: NEU, o: .8 },
    { x: 166, y: 298, w: 250, h: 10, r: 5, f: NEU, o: .7 },
    { x: 166, y: 316, w: 180, h: 10, r: 5, f: NEU, o: .5 },
    { x: 434, y: 298, w: 120, h: 28, r: 6, f: ACC, o: 1 },
    { x: 166, y: 342, w: 388, h: 6, r: 3, f: NEU, o: .4 }
  ],
  [ // 2 · tokens
    { x: 80, y: 110, w: 40, h: 40, r: 10, f: ACC, o: 1 },
    { x: 128, y: 110, w: 40, h: 40, r: 10, f: ACC2, o: 1 },
    { x: 176, y: 110, w: 40, h: 40, r: 10, f: INK, o: .9 },
    { x: 224, y: 110, w: 40, h: 40, r: 10, f: NEU, o: 1 },
    { x: 320, y: 104, w: 220, h: 26, r: 3, f: NEU, o: .95 },
    { x: 320, y: 142, w: 160, h: 18, r: 3, f: NEU, o: .75 },
    { x: 320, y: 172, w: 112, h: 12, r: 3, f: NEU, o: .55 },
    { x: 572, y: 110, w: 96, h: 8, r: 4, f: ACC2, o: .85 },
    { x: 572, y: 132, w: 96, h: 30, r: 4, f: NEU, o: .7 }
  ],
  [ // 3 · one component, three sizes
    { x: 70, y: 70, w: 300, h: 70, r: 8, f: NEU, o: .4 },
    { x: 70, y: 152, w: 220, h: 70, r: 8, f: NEU, o: .4 },
    { x: 70, y: 234, w: 150, h: 88, r: 8, f: NEU, o: .4 },
    { x: 84, y: 86, w: 120, h: 10, r: 5, f: ACC, o: 1 },
    { x: 84, y: 104, w: 262, h: 8, r: 4, f: NEU, o: .9 },
    { x: 84, y: 168, w: 100, h: 10, r: 5, f: ACC, o: 1 },
    { x: 84, y: 186, w: 182, h: 8, r: 4, f: NEU, o: .9 },
    { x: 84, y: 250, w: 80, h: 10, r: 5, f: ACC, o: 1 },
    { x: 84, y: 268, w: 122, h: 8, r: 4, f: NEU, o: .9 }
  ],
  [0,1,2,3,4,5,6,7,8].map(i => { // 4 · measured
    const h = [70,110,88,150,124,186,160,224,206][i];
    return { x: 90 + i * 62, y: 330 - h, w: 38, h, r: 4,
             f: i > 5 ? ACC : NEU, o: i > 5 ? 1 : .55 + i * .04 };
  })
];

const TREAT = {};
const treat = (id, name, mount) => TREAT[id] = { id, name, mount };

/* ══ 01 · BLOCKS ═══════════════════════════════════════════════════════ */
treat('blocks', 'Blocks', stage => {
  const s = svg();
  const g = el('g');
  const units = FORMS[0].map(() => {
    const u = el('g', { class: 'unit' });
    u.append(el('rect'));
    g.append(u);
    return u;
  });
  s.append(g); stage.append(s);
  return {
    render(step) {
      FORMS[step].forEach((u, i) => {
        units[i].style.cssText =
          `--x:${u.x};--y:${u.y};--w:${u.w};--h:${u.h};--r:${u.r};--f:${u.f};--o:${u.o};` +
          `--d:${Math.abs(i - 4) * 42}ms`;
      });
    }
  };
});

/* ══ 02 · ONE LINE ═════════════════════════════════════════════════════
   The same 160 points walk every stage's perimeters in order, so the
   stroke redistributes rather than lifting. */
treat('oneline', 'One line', stage => {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  stage.append(cv);
  const ctx = cv.getContext('2d');
  const N = 180;
  let W = 720, H = 400, dpr = 1;
  const fit = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.width * 400 / 720;
    cv.style.height = H + 'px';
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(fit).observe(stage); fit();

  /* Sample a form's rectangles end-to-end into exactly N points. */
  const sample = form => {
    const peri = form.map(r => 2 * (r.w + r.h));
    const total = peri.reduce((a, b) => a + b, 0);
    const out = [];
    for (let i = 0; i < N; i++) {
      let d = (i / N) * total;
      let k = 0;
      while (d > peri[k] && k < form.length - 1) { d -= peri[k]; k++; }
      const r = form[k];
      let t = d / peri[k] * 2 * (r.w + r.h);
      if (t < r.w) out.push([r.x + t, r.y]);
      else if (t < r.w + r.h) out.push([r.x + r.w, r.y + (t - r.w)]);
      else if (t < 2 * r.w + r.h) out.push([r.x + r.w - (t - r.w - r.h), r.y + r.h]);
      else out.push([r.x, r.y + r.h - (t - 2 * r.w - r.h)]);
    }
    return out;
  };
  const CLOUD = FORMS.map(sample);

  let from = CLOUD[0], to = CLOUD[0], t0 = 0, raf = 0, playing = false;
  const draw = now => {
    const e = clamp((now - t0) / 900, 0, 1);
    const k = e < .5 ? 4 * e ** 3 : 1 - (-2 * e + 2) ** 3 / 2;
    const sc = W / 720;
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.scale(sc, sc);
    ctx.lineWidth = 2 / sc; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const cs = getComputedStyle(stage);
    ctx.strokeStyle = cs.getPropertyValue('--accent').trim() || '#0f0';
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = lerp(from[i][0], to[i][0], k), y = lerp(from[i][1], to[i][1], k);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = .22;
    ctx.strokeStyle = cs.getPropertyValue('--accent-2').trim() || '#0ff';
    ctx.lineWidth = 1 / sc;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const k2 = clamp(k - .1, 0, 1);
      const x = lerp(from[i][0], to[i][0], k2), y = lerp(from[i][1], to[i][1], k2);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
    if (e < 1) raf = requestAnimationFrame(draw);
  };
  return {
    render(step) {
      cancelAnimationFrame(raf);
      from = to; to = CLOUD[step]; t0 = performance.now();
      if (reduced()) { from = to; }
      raf = requestAnimationFrame(draw);
    }
  };
});

/* ══ 03 · ISOMETRIC ════════════════════════════════════════════════════ */
treat('iso', 'Isometric', stage => {
  const s = svg();
  const root = el('g', { transform: 'translate(360 250)' });
  // Axonometric basis: x right-down, y left-down, z straight up.
  const P = (x, y, z) => [(x - y) * 1.05, (x + y) * .52 - z];
  const face = (pts, cls) => el('polygon', { points: pts.map(p => p.join(',')).join(' '), class: cls });

  const plate = (level, w, d, h, lift) => {   // level drives the tonal step
    const g = el('g', { class: 'iso-plate' });
    const z = lift, z2 = lift + h;
    const a = P(-w, -d, z2), b = P(w, -d, z2), c = P(w, d, z2), e2 = P(-w, d, z2);
    const a0 = P(-w, d, z), b0 = P(w, d, z), c0 = P(w, -d, z);
    g.append(face([e2, c, b0, a0], 'pr-neu'));          // left wall
    g.append(face([c, b, c0, b0], 'pr-ink'));           // right wall
    const top = face([a, b, c, e2], 'pr-neu');
    top.classList.add('iso-top');
    // Each plate a step lighter than the one under it, or five greys stack
    // into one grey and the whole drawing reads flat.
    top.style.fill = `color-mix(in oklab, var(--ink) ${8 + level * 11}%, var(--bg-3))`;
    g.append(top);
    g.setAttribute('opacity', '1');
    return g;
  };

  const plates = [
    plate(0, 96, 96, 9, -52),
    plate(1, 78, 78, 11, -34),
    plate(2, 60, 60, 13, -14),
    plate(3, 42, 42, 15, 8),
    plate(4, 24, 24, 26, 32)
  ];
  plates.forEach(p => root.append(p));

  // A beacon that only arrives at the top of the stack.
  const beacon = el('g', { class: 'iso-plate' });
  const bp = P(0, 0, 72);
  beacon.append(el('circle', { cx: bp[0], cy: bp[1], r: 7, class: 'pr-acc' }));
  beacon.append(el('circle', { cx: bp[0], cy: bp[1], r: 18, class: 'pr-s-acc gr-ping' }));
  root.append(beacon);

  s.append(root); stage.append(s);
  return {
    render(step) {
      plates.forEach((p, i) => {
        p.toggleAttribute('data-on', i <= step);
        p.toggleAttribute('data-live', i === step);
        p.style.transitionDelay = `${Math.max(0, (i - 0)) * 70}ms`;
      });
      beacon.toggleAttribute('data-on', step === 4);
    }
  };
});

/* ══ 04 · BLUEPRINT ════════════════════════════════════════════════════ */
treat('blueprint', 'Blueprint', stage => {
  const s = svg();
  const grid = el('g', { opacity: '.5' });
  for (let x = 40; x <= 680; x += 40) grid.append(el('line', { x1: x, y1: 30, x2: x, y2: 370, stroke: 'var(--line)', 'stroke-width': 1 }));
  for (let y = 30; y <= 370; y += 34) grid.append(el('line', { x1: 40, y1: y, x2: 680, y2: y, stroke: 'var(--line)', 'stroke-width': 1 }));
  s.append(grid);

  // One construction drawing per stage, each a single path.
  const PATHS = [
    'M120 300 L200 120 L300 240 L400 90 L500 230 L600 120',
    'M160 80 H560 V320 H160 Z M160 150 H560 M300 150 V320 M430 150 V320',
    'M100 120 h90 v90 h-90 z M230 120 h90 v90 h-90 z M360 120 h90 v90 h-90 z M490 120 h90 v90 h-90 z M100 260 H580',
    'M120 100 h420 v70 h-420 z M120 190 h300 v70 h-300 z M120 280 h180 v70 h-180 z',
    'M90 320 V240 M152 320 V200 M214 320 V260 M276 320 V160 M338 320 V210 M400 320 V120 M462 320 V180 M524 320 V80 M586 320 V110 M70 330 H620'
  ];
  const DIMS = [
    'M120 330 H600 M120 324 v12 M600 324 v12',
    'M560 80 h26 M560 320 h26 M573 80 V320',
    'M100 100 H190 M100 94 v12 M190 94 v12',
    'M560 100 V170 M554 100 h12 M554 170 h12',
    'M70 348 H620 M70 342 v12 M620 342 v12'
  ];

  const draws = PATHS.map(d => el('path', { class: 'bp-draw', d }));
  const dims = DIMS.map(d => el('path', { class: 'bp-dim', d, fill: 'none' }));
  const pen = el('circle', { class: 'bp-pen', r: 5 });
  draws.forEach(p => s.append(p));
  dims.forEach(p => s.append(p));
  s.append(pen);
  stage.append(s);
  // Measure once in the document so dash lengths are real.
  requestAnimationFrame(() => draws.forEach(p => {
    const len = p.getTotalLength ? p.getTotalLength() : 1400;
    p.style.setProperty('--len', len);
  }));

  let penRaf = 0;
  return {
    render(step) {
      draws.forEach((p, i) => p.toggleAttribute('data-on', i === step));
      dims.forEach((p, i) => p.toggleAttribute('data-on', i === step));
      pen.toggleAttribute('data-on', true);
      cancelAnimationFrame(penRaf);
      const path = draws[step];
      const len = path.getTotalLength ? path.getTotalLength() : 0;
      const t0 = performance.now();
      const run = now => {
        const e = clamp((now - t0) / 1500, 0, 1);
        if (len) {
          const pt = path.getPointAtLength(len * e);
          pen.setAttribute('cx', pt.x); pen.setAttribute('cy', pt.y);
        }
        if (e < 1) penRaf = requestAnimationFrame(run);
      };
      if (!reduced()) penRaf = requestAnimationFrame(run);
    }
  };
});

/* ══ 05 · CONVEYOR ═════════════════════════════════════════════════════ */
treat('conveyor', 'Conveyor', stage => {
  const s = svg();
  s.append(el('line', { class: 'cv-belt', x1: 40, y1: 300, x2: 680, y2: 300 }));
  s.append(el('line', { class: 'cv-belt', x1: 40, y1: 314, x2: 680, y2: 314, opacity: '.5' }));

  const X = [100, 240, 380, 500, 620];
  const stations = X.map((x, i) => {
    const g = el('g', { class: 'cv-station' });
    g.append(el('circle', { class: 'cv-ring pr-s-neu', cx: x, cy: 200, r: 44, 'stroke-width': 2 }));
    g.append(el('line', { x1: x, y1: 244, x2: x, y2: 292, stroke: 'var(--line-2)', 'stroke-width': 2 }));
    g.append(el('text', { class: 'pr-lbl-s', x, y: 268, 'text-anchor': 'middle' },
      document.createTextNode(String(i + 1).padStart(2, '0'))));
    // A little glyph per station, built from the stage's own form.
    const inner = el('g');
    const f = FORMS[i];
    const minX = Math.min(...f.map(r => r.x)), maxX = Math.max(...f.map(r => r.x + r.w));
    const minY = Math.min(...f.map(r => r.y)), maxY = Math.max(...f.map(r => r.y + r.h));
    const sc = 56 / Math.max(maxX - minX, maxY - minY);
    f.forEach(r => inner.append(el('rect', {
      x: (r.x - minX) * sc, y: (r.y - minY) * sc,
      width: Math.max(1.5, r.w * sc), height: Math.max(1.5, r.h * sc),
      rx: 1.5, fill: r.f, opacity: r.o
    })));
    inner.setAttribute('transform',
      `translate(${x - (maxX - minX) * sc / 2} ${200 - (maxY - minY) * sc / 2})`);
    g.append(inner);
    s.append(g);
    return g;
  });

  const work = el('g', { class: 'cv-work' });
  work.append(el('rect', { x: -16, y: -16, width: 32, height: 32, rx: 6, class: 'pr-acc' }));
  work.append(el('rect', { x: -16, y: -16, width: 32, height: 32, rx: 6, class: 'pr-s-acc', 'stroke-width': 2, opacity: .4 }));
  s.append(work);
  stage.append(s);

  return {
    render(step) {
      stations.forEach((g, i) => g.toggleAttribute('data-on', i === step));
      work.setAttribute('transform', `translate(${X[step]} 307) rotate(${step * 72})`);
    }
  };
});

/* ══ 06 · ORBIT ════════════════════════════════════════════════════════ */
treat('orbit', 'Orbit', stage => {
  const s = svg();
  const C = [360, 200];
  const rings = [], spins = [];
  for (let i = 0; i < 5; i++) {
    const r = 54 + i * 32;
    rings.push(s.appendChild(el('circle', { class: 'orb-ring', cx: C[0], cy: C[1], r })));
    const spin = el('g', { class: 'orb-spin' + (i % 2 ? ' rev' : '') });
    const n = 3 + i;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + i;
      const g = el('g', { class: 'orb-sat' });
      g.append(el('rect', {
        x: C[0] + Math.cos(a) * r - 7, y: C[1] + Math.sin(a) * r - 7,
        width: 14, height: 14, rx: 4,
        fill: k === 0 ? 'var(--accent-2)' : 'var(--line-2)'
      }));
      spin.append(g);
    }
    s.append(spin); spins.push(spin);
  }
  const core = el('circle', { class: 'orb-core pr-acc', cx: C[0], cy: C[1], r: 12 });
  s.append(core);
  const num = el('text', {
    x: C[0], y: C[1] + 5, 'text-anchor': 'middle',
    font: '700 15px var(--font-mono)', fill: 'var(--on-accent)'
  }, document.createTextNode('01'));
  s.append(num);
  stage.append(s);
  return {
    render(step) {
      rings.forEach((r, i) => r.toggleAttribute('data-on', i === step));
      spins.forEach((g, i) => g.toggleAttribute('data-on', i <= step));
      core.setAttribute('r', 12 + step * 4);
      num.textContent = String(step + 1).padStart(2, '0');
    }
  };
});

/* ══ 07 · FILM STRIP ═══════════════════════════════════════════════════ */
treat('film', 'Film strip', stage => {
  const s = svg();
  const FW = 250, GAP = 22, CY = 200;
  const track = el('g', { class: 'fs-track' });
  const frames = FORMS.map((f, i) => {
    const g = el('g', { class: 'fs-frame' });
    const x = i * (FW + GAP);
    g.append(el('rect', { class: 'fs-card', x, y: CY - 78, width: FW, height: 156, rx: 6, 'stroke-width': 2 }));
    // sprockets
    for (let k = 0; k < 6; k++) {
      g.append(el('rect', { class: 'fs-hole', x: x + 14 + k * 40, y: CY - 96, width: 16, height: 11, rx: 2 }));
      g.append(el('rect', { class: 'fs-hole', x: x + 14 + k * 40, y: CY + 85, width: 16, height: 11, rx: 2 }));
    }
    const minX = Math.min(...f.map(r => r.x)), maxX = Math.max(...f.map(r => r.x + r.w));
    const minY = Math.min(...f.map(r => r.y)), maxY = Math.max(...f.map(r => r.y + r.h));
    const sc = Math.min(200 / (maxX - minX), 110 / (maxY - minY));
    const inner = el('g', {
      transform: `translate(${x + FW / 2 - (maxX - minX) * sc / 2} ${CY - (maxY - minY) * sc / 2})`
    });
    f.forEach(r => inner.append(el('rect', {
      x: (r.x - minX) * sc, y: (r.y - minY) * sc,
      width: Math.max(2, r.w * sc), height: Math.max(2, r.h * sc),
      rx: 2, fill: r.f, opacity: r.o
    })));
    g.append(inner);
    g.append(el('text', { class: 'pr-lbl-s', x: x + 10, y: CY + 70 },
      document.createTextNode(`0${i + 1} ${STAGES[i].label.toUpperCase()}`)));
    track.append(g);
    return g;
  });
  s.append(track);
  s.append(el('rect', { class: 'fs-gate', x: 360 - FW / 2 - 8, y: CY - 104, width: FW + 16, height: 208, rx: 8 }));
  stage.append(s);
  return {
    render(step) {
      frames.forEach((g, i) => g.toggleAttribute('data-on', i === step));
      track.setAttribute('transform', `translate(${360 - FW / 2 - step * (FW + GAP)} 0)`);
    }
  };
});

/* ══ 08 · TERMINAL ═════════════════════════════════════════════════════ */
treat('terminal', 'Terminal', stage => {
  const s = svg();
  s.append(el('rect', { x: 30, y: 30, width: 320, height: 340, rx: 8, fill: 'var(--bg-3)', stroke: 'var(--line-2)' }));
  s.append(el('rect', { x: 370, y: 30, width: 320, height: 340, rx: 8, fill: 'var(--bg)', stroke: 'var(--line-2)' }));
  s.append(el('text', { class: 'pr-lbl-s', x: 44, y: 54 }, document.createTextNode('SOURCE')));
  s.append(el('text', { class: 'pr-lbl-s', x: 384, y: 54 }, document.createTextNode('PREVIEW')));

  const WIDTHS = [
    [150, 90, 180, 70], [120, 200, 160, 90, 140], [180, 120, 90, 210, 70, 150],
    [140, 190, 110, 160, 80, 200, 120], [100, 170, 140, 90, 190, 130, 170, 110]
  ];
  const lines = [];
  for (let i = 0; i < 8; i++) {
    const g = el('g', { class: 'tm-line', style: `--i:${i}` });
    g.append(el('rect', { x: 46 + (i % 3 === 2 ? 16 : 0), y: 76 + i * 26, width: 120, height: 8, rx: 2 }));
    s.append(g); lines.push(g);
  }
  const caret = el('rect', { class: 'tm-caret', x: 46, y: 76, width: 9, height: 12, rx: 1 });
  s.append(caret);

  const prev = FORMS.map((f, i) => {
    const minX = Math.min(...f.map(r => r.x)), maxX = Math.max(...f.map(r => r.x + r.w));
    const minY = Math.min(...f.map(r => r.y)), maxY = Math.max(...f.map(r => r.y + r.h));
    const sc = Math.min(270 / (maxX - minX), 280 / (maxY - minY));
    const pos = el('g', {
      transform: `translate(${530 - (maxX - minX) * sc / 2} ${200 - (maxY - minY) * sc / 2})`
    });
    const g = el('g', { class: 'tm-prev', style: `--i:${i}` });
    pos.append(g);
    f.forEach(r => g.append(el('rect', {
      x: (r.x - minX) * sc, y: (r.y - minY) * sc,
      width: Math.max(2, r.w * sc), height: Math.max(2, r.h * sc),
      rx: 2, fill: r.f, opacity: r.o
    })));
    s.append(pos);
    return g;
  });
  stage.append(s);
  return {
    render(step) {
      const w = WIDTHS[step];
      lines.forEach((g, i) => {
        const on = i < w.length + 3;
        g.toggleAttribute('data-on', on);
        g.firstChild.setAttribute('width', w[i % w.length]);
        // Restart the type-in on every stage change.
        g.style.animation = 'none'; void g.offsetWidth; g.style.animation = '';
      });
      caret.setAttribute('y', 76 + Math.min(7, w.length + 2) * 26);
      prev.forEach((g, i) => g.toggleAttribute('data-on', i === step));
    }
  };
});

/* ══ 09 · SWARM ════════════════════════════════════════════════════════ */
treat('swarm', 'Swarm', stage => {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  stage.append(cv);
  const ctx = cv.getContext('2d');
  const COUNT = 760;
  let W = 720, H = 400, dpr = 1;
  const fit = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.width * 400 / 720;
    cv.style.height = H + 'px';
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(fit).observe(stage); fit();

  /* Scatter COUNT points across a form's rectangles, weighted by area, so
     the denser parts of the drawing get more particles. */
  const fill = form => {
    const areas = form.map(r => r.w * r.h);
    const total = areas.reduce((a, b) => a + b, 0);
    const pts = [];
    form.forEach((r, i) => {
      const n = Math.max(6, Math.round(COUNT * areas[i] / total));
      for (let k = 0; k < n; k++)
        pts.push([r.x + Math.random() * r.w, r.y + Math.random() * r.h, r.f === ACC || r.f === ACC2]);
    });
    while (pts.length < COUNT) pts.push(pts[pts.length % pts.length || 0]);
    return pts.slice(0, COUNT);
  };
  const TARGETS = FORMS.map(fill);
  const parts = Array.from({ length: COUNT }, () => ({
    x: 360, y: 200, vx: 0, vy: 0, tx: 360, ty: 200, hot: false
  }));

  let raf = 0, alive = true;
  const frame = () => {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const sc = W / 720;
    ctx.clearRect(0, 0, W, H);
    const cs = getComputedStyle(stage);
    const acc = cs.getPropertyValue('--accent').trim() || '#0f0';
    const neu = cs.getPropertyValue('--line-2').trim() || '#444';
    for (const p of parts) {
      p.vx = (p.vx + (p.tx - p.x) * .035) * .86;
      p.vy = (p.vy + (p.ty - p.y) * .035) * .86;
      p.x += p.vx; p.y += p.vy;
      const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 6);
      ctx.fillStyle = p.hot ? acc : neu;
      ctx.globalAlpha = p.hot ? .95 : .55 + sp * .45;
      const r = p.hot ? 3.4 : 2.8;
      ctx.fillRect(p.x * sc, p.y * sc, r, r);
    }
    ctx.globalAlpha = 1;
  };
  const stop = () => { alive = false; cancelAnimationFrame(raf); };
  raf = requestAnimationFrame(frame);
  return {
    render(step) {
      const T = TARGETS[step];
      parts.forEach((p, i) => { p.tx = T[i][0]; p.ty = T[i][1]; p.hot = T[i][2]; });
      if (reduced()) parts.forEach(p => { p.x = p.tx; p.y = p.ty; p.vx = p.vy = 0; });
    },
    stop
  };
});

/* ══ 10 · GRAPH ════════════════════════════════════════════════════════ */
treat('graph', 'Graph', stage => {
  const s = svg();
  const N = 11;
  // Each stage is a different wiring of the same nodes.
  const LAYOUTS = [
    N => Array.from({ length: N }, (_, i) => [120 + (i % 4) * 150 + (i % 3) * 20, 90 + Math.floor(i / 4) * 110]),
    N => Array.from({ length: N }, (_, i) => [360 + Math.cos(i / N * TAU) * 160, 200 + Math.sin(i / N * TAU) * 120]),
    N => Array.from({ length: N }, (_, i) => [140 + (i % 3) * 180, 80 + Math.floor(i / 3) * 90]),
    N => Array.from({ length: N }, (_, i) => [200 + (i % 2) * 320, 70 + Math.floor(i / 2) * 58]),
    N => Array.from({ length: N }, (_, i) => [90 + i * 54, 320 - [40,90,70,140,110,180,150,210,190,240,220][i]])
  ];
  const EDGES = [
    [[0,1],[1,2],[2,3],[4,5],[6,7],[8,9]],
    [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,0]],
    [[0,3],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[7,10]],
    [[0,1],[2,3],[4,5],[6,7],[8,9],[0,2],[2,4],[4,6],[6,8]],
    [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]]
  ];
  const edgeG = el('g');
  const nodeG = el('g');
  s.append(edgeG, nodeG);
  const edges = [];
  for (let i = 0; i < 12; i++) edges.push(edgeG.appendChild(el('line', { class: 'gr-edge', opacity: 0 })));
  const nodes = Array.from({ length: N }, (_, i) =>
    nodeG.appendChild(el('circle', { class: 'gr-node', r: 7, fill: 'var(--line-2)', cx: 360, cy: 200 })));
  const ping = el('circle', { class: 'gr-ping', cx: 360, cy: 200, r: 6 });
  s.append(ping);
  stage.append(s);
  return {
    render(step) {
      const pos = LAYOUTS[step](N);
      nodes.forEach((n, i) => {
        n.setAttribute('cx', pos[i][0]); n.setAttribute('cy', pos[i][1]);
        n.setAttribute('r', i % 4 === 0 ? 10 : 7);
        n.setAttribute('fill', i % 4 === 0 ? 'var(--accent)' : 'var(--line-2)');
        n.style.transitionDelay = `${i * 28}ms`;
      });
      const E = EDGES[step];
      edges.forEach((e, i) => {
        if (i < E.length) {
          const [a, b] = E[i];
          e.setAttribute('x1', pos[a][0]); e.setAttribute('y1', pos[a][1]);
          e.setAttribute('x2', pos[b][0]); e.setAttribute('y2', pos[b][1]);
          e.setAttribute('opacity', .75);
          e.toggleAttribute('data-on', i % 3 === 0);
        } else e.setAttribute('opacity', 0);
      });
      ping.setAttribute('cx', pos[0][0]); ping.setAttribute('cy', pos[0][1]);
    }
  };
});

/* ══ Chrome, shared by all ten ═════════════════════════════════════════ */
const ORDER = ['blocks', 'oneline', 'iso', 'blueprint', 'conveyor',
               'orbit', 'film', 'terminal', 'swarm', 'graph'];

function build(root) {
  root.classList.add('process');
  root.dataset.step = '0';

  const stageBox = document.createElement('div');
  stageBox.className = 'process-stage';
  stageBox.setAttribute('role', 'img');
  stageBox.setAttribute('aria-label', 'Animated diagram of a five-stage working process');

  const steps = document.createElement('div');
  steps.className = 'process-steps';
  steps.setAttribute('role', 'tablist');
  steps.setAttribute('aria-label', 'Process stages');
  const buttons = STAGES.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-current', i === 0);
    b.innerHTML = `<span class="n"><svg class="ring" viewBox="0 0 14 14" aria-hidden="true">` +
      `<circle class="bg" cx="7" cy="7" r="5.4"/><circle class="fg" cx="7" cy="7" r="5.4"/></svg>` +
      `0${i + 1}</span><span class="t">${s.label}</span>`;
    b.append(Object.assign(document.createElement('span'), { className: 'sr', textContent: s.hint }));
    steps.append(b);
    return b;
  });

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

  root.append(stageBox, steps, foot);

  /* Optional treatment picker. */
  let pickWrap = null;
  if (root.hasAttribute('data-pick')) {
    pickWrap = document.createElement('div');
    pickWrap.className = 'pr-pick';
    pickWrap.setAttribute('role', 'group');
    pickWrap.setAttribute('aria-label', 'Diagram treatment');
    root.insertBefore(pickWrap, stageBox);
  }

  const DUR = parseFloat(getComputedStyle(root).getPropertyValue('--stage-dur')) || 5200;
  let step = 0, playing = false, timer = null, inView = true, current = null, currentId = null;
  const playBtn = transport.querySelector('[data-act="play"]');
  const stateEl = transport.querySelector('.state');

  const paint = () => {
    root.dataset.step = step;
    current && current.render(step);
    buttons.forEach((b, i) => b.setAttribute('aria-current', i === step));
    caption.innerHTML = STAGES[step].caption;
    stateEl.textContent = `0${step + 1} / 05`;
    const ring = buttons[step].querySelector('.fg');
    ring.style.animation = 'none'; void ring.offsetWidth; ring.style.animation = '';
  };
  const tick = () => {
    clearTimeout(timer);
    if (!playing || !inView) return;
    timer = setTimeout(() => { step = (step + 1) % STAGES.length; paint(); tick(); }, DUR);
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
  const goto = n => { step = n; paint(); if (playing) tick(); };

  const mount = id => {
    if (currentId === id) return;
    current && current.stop && current.stop();
    stageBox.innerHTML = '';
    currentId = id;
    root.dataset.treatment = id;
    current = TREAT[id].mount(stageBox);
    if (pickWrap) pickWrap.querySelectorAll('button')
      .forEach(b => b.setAttribute('aria-pressed', b.dataset.t === id));
    requestAnimationFrame(paint);
  };

  if (pickWrap) {
    ORDER.forEach((id, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.t = id;
      b.textContent = `${String(i + 1).padStart(2, '0')} ${TREAT[id].name}`;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => mount(id));
      pickWrap.append(b);
    });
  }

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

  if ('IntersectionObserver' in window)
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; tick(); }, { threshold: .2 }).observe(root);
  document.addEventListener('visibilitychange', () => {
    inView = document.visibilityState === 'visible'; tick();
  });
  document.addEventListener('motionchange', e => {
    if (e.detail.reduced) { step = STAGES.length - 1; paint(); setPlaying(false); }
    else setPlaying(true);
  });

  mount(TREAT[root.dataset.process] ? root.dataset.process : 'blocks');
  if (reduced()) { step = STAGES.length - 1; paint(); setPlaying(false); }
  else setPlaying(true);
}

window.nmProcess = { ORDER, names: () => ORDER.map(id => TREAT[id].name) };
document.querySelectorAll('[data-process]').forEach(build);

})();
