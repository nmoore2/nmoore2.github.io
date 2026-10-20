/* ═══════════════════════════════════════════════════════════════════════
   SHOWPIECES — ten animations, no libraries
   Renders into <div data-showpieces data-only="id,id,…"></div>.

   Shared plumbing first: a DPR-correct canvas, a render loop that only runs
   when the piece is on screen, the tab is visible and motion is switched on,
   and a pointer reader that works for mouse, pen and touch alike. Everything
   after that is the actual effects.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const reduced = () => window.nmMotion
  ? window.nmMotion.isReduced()
  : matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

/* Cheap deterministic value noise — enough for a flow field, and ~20 lines
   instead of a dependency. */
const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const smooth = t => t * t * (3 - 2 * t);
const noise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  return lerp(
    lerp(hash(xi, yi),     hash(xi + 1, yi),     xf),
    lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), xf), yf);
};

/* Colour tokens. Canvas can't read a custom property mid-paint, so each
   piece holds a plain object of resolved colours — and every one of those
   objects is refreshed when the theme switches. Without this, the DOM
   re-themes instantly and the canvases quietly stay on last season's
   palette, which is exactly the bug a token system is supposed to prevent. */
const LIVE = [];
const read = (el, into) => {
  const cs = getComputedStyle(el);
  const v = (n, d) => cs.getPropertyValue(n).trim() || d;
  into.bg = v('--bg-2', '#111');
  into.bgDeep = v('--bg', '#0b0b0d');
  into.ink = v('--ink', '#fff');
  into.dim = v('--dim', '#888');
  into.line = v('--line-2', '#333');
  into.accent = v('--accent', '#0f0');
  into.accent2 = v('--accent-2', '#0ff');
  return into;
};
const tokens = el => {
  const obj = read(el, {});
  LIVE.push([el, obj]);
  return obj;
};
document.addEventListener('themechange', () => {
  // Next frame, so the new custom properties have actually been applied.
  requestAnimationFrame(() => { for (const [el, obj] of LIVE) read(el, obj); });
});

function makeCanvas(stage) {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  stage.append(cv);
  const ctx = cv.getContext('2d');
  const state = { w: 0, h: 0, dpr: 1, resized: () => {} };
  const fit = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Cap DPR: a retina canvas at 3× costs 9× the fill rate for no visible gain.
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    state.w = Math.round(r.width); state.h = Math.round(r.height);
    cv.width = state.w * state.dpr; cv.height = state.h * state.dpr;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.resized();
  };
  new ResizeObserver(fit).observe(stage);
  fit();
  return { cv, ctx, state, fit };
}

/* One loop per piece, gated three ways. Paused work costs nothing. */
function loop(root, frame, { still } = {}) {
  let inView = false, running = false, raf = 0, t0 = performance.now();
  const tick = now => {
    raf = requestAnimationFrame(tick);
    // rAF can hand back a timestamp from just before the call that scheduled
    // it, which makes elapsed time briefly negative — and a negative time
    // through a modulo is how you index an array at -1.
    frame(Math.max(0, (now - t0) / 1000), now);
  };
  const should = () => inView && document.visibilityState === 'visible' && !reduced();
  const sync = () => {
    const want = should();
    if (want === running) return;
    running = want;
    if (want) { t0 = performance.now(); raf = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(raf); if (still) still(); }
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); },
    { threshold: 0 }).observe(root);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('motionchange', sync);
  requestAnimationFrame(sync);
  return { sync, isRunning: () => running };
}

/* Pointer in element space, with a "has it been touched yet" flag that the
   hint badge keys off. */
function pointer(root, stage) {
  const p = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, inside: false, down: false };
  const set = e => {
    const r = stage.getBoundingClientRect();
    p.px = p.x; p.py = p.y;
    p.x = e.clientX - r.left; p.y = e.clientY - r.top;
    if (p.px > -9000) { p.vx = p.x - p.px; p.vy = p.y - p.py; }
    p.inside = true;
    root.setAttribute('data-touched', '');
  };
  stage.addEventListener('pointermove', set, { passive: true });
  stage.addEventListener('pointerdown', e => { p.down = true; set(e); }, { passive: true });
  addEventListener('pointerup', () => { p.down = false; });
  stage.addEventListener('pointerleave', () => {
    p.inside = false; p.x = p.y = -9999; p.vx = p.vy = 0;
  });
  return p;
}

const PIECES = {};
/* Technical notes: shown in the large view, deliberately not in the tile
   caption. The grid should read as "here is what it does", not as a
   vocabulary test. */
const TECH = {
  flow: 'Two thousand particles reading a value-noise field; trails are compositing, not stored paths.',
  kinetic: 'A spring per character, with the overshoot coming from momentum rather than an easing curve.',
  ribbon: 'A spring-coupled chain extruded perpendicular to its direction of travel.',
  goo: 'An SVG filter stack: blur, then a colour matrix that snaps the alpha ramp back to a hard edge.',
  spotlight: 'Each object is shaded by its angle and distance to the light, and projects a shadow away from it.',
  oneline: 'Every shape is the same hundred-and-twenty points, so the stroke redistributes instead of lifting.',
  matrix: 'Inverse-square repulsion on a lattice; the ripple propagates by distance, not staggered delay.',
  shatter: 'Convex shards from repeated random cuts, kicked by proximity and released by distance.',
  interference: 'Three wave sources summed per cell and quantised into bands; the moiré is emergent.',
  reaction: 'A Gray–Scott reaction–diffusion system solved on a coarse grid every frame.',
  flock: 'Separation, alignment and cohesion per agent, with a hairline between every influencing pair.',
};
const def = (id, title, note, hint, build, needsMotion = true) =>
  PIECES[id] = { id, title, note, hint, build, needsMotion };

/* ══ 01 · GOOEY MORPH ══════════════════════════════════════════════════
   The classic SVG filter stack — blur, then a colour matrix that slams the
   alpha ramp back to a hard edge, so overlapping blurs read as one merged
   body. Blobs are thrown from the old word and reabsorbed by the new one. */
def('goo', 'Gooey morph',
  'Words melt, scatter, and come together again.',
  null,
  (root, stage) => {
    const art = document.createElement('div');
    art.className = 'sp-goo';
    stage.append(art);
    const { ctx, state } = makeCanvas(art);
    const p = pointer(root, stage);
    const WORDS = ['DESIGN', 'BUILD', 'SHIP', 'LEARN'];
    const t = tokens(root);
    let wi = 0, phase = 0, blobs = [];

    const seed = () => {
      blobs = Array.from({ length: 46 }, () => ({
        a: Math.random() * TAU, r: 0, sp: .4 + Math.random() * .9,
        size: 7 + Math.random() * 16, off: Math.random() * TAU
      }));
    };
    seed();

    const label = document.createElement('div');
    label.className = 'sp-goo-word';
    label.textContent = WORDS[0];
    art.append(label);

    loop(root, time => {
      const cx = state.w / 2, cy = state.h / 2;
      // 0 → 1 across a 2.6s cycle; the word swaps at the loosest point.
      const cyc = (time % 3.2) / 3.2;
      if (cyc < phase) { wi = (wi + 1) % WORDS.length; label.textContent = WORDS[wi]; seed(); }
      phase = cyc;

      // Out and back: blobs scatter to a ring, then collapse.
      const spread = Math.sin(cyc * Math.PI) ** 1.6;
      label.style.opacity = 1 - spread * .92;
      label.style.letterSpacing = (-.05 + spread * .22) + 'em';

      ctx.clearRect(0, 0, state.w, state.h);
      ctx.fillStyle = t.accent;
      const reach = Math.min(state.w, state.h) * .42;
      for (const b of blobs) {
        const ang = b.a + time * .25 * b.sp;
        let x = cx + Math.cos(ang) * reach * spread * b.sp;
        let y = cy + Math.sin(ang) * reach * .72 * spread * b.sp;
        // The pointer shoves nearby droplets around.
        if (p.inside) {
          const dx = x - p.x, dy = y - p.y, d2 = dx * dx + dy * dy;
          if (d2 < 22000) { const f = (1 - d2 / 22000) * 46; x += dx / Math.sqrt(d2 + 1) * f; y += dy / Math.sqrt(d2 + 1) * f; }
        }
        const rr = b.size * (.45 + spread * .9) * (1 + Math.sin(time * 2 + b.off) * .12);
        ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
      }
      // The core keeps the word legible at the ends of the cycle.
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(state.w, state.h) * (.3 - spread * .22), 0, TAU);
      ctx.fill();
    });
  });

/* ══ 02 · FLOW FIELD ═══════════════════════════════════════════════════ */
def('flow', 'Flow field',
  'Move through the particles to stir the flow.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    let parts = [];
    const COUNT = 2000;
    const reseed = () => {
      parts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * state.w, y: Math.random() * state.h,
        vx: 0, vy: 0, life: Math.random() * 180 | 0,
        hot: Math.random() < .16
      }));
    };
    state.resized = reseed; reseed();

    loop(root, time => {
      if (!parts.length) reseed();
      // Fade instead of clear: this is what makes the trails.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = t.bg; ctx.globalAlpha = .085;
      ctx.fillRect(0, 0, state.w, state.h);
      ctx.globalAlpha = 1;

      const S = .0042, drift = time * .14;
      for (const q of parts) {
        const n = noise(q.x * S + drift, q.y * S - drift * .6);
        let a = n * TAU * 2;
        let fx = Math.cos(a), fy = Math.sin(a);
        if (p.inside) {
          const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
          if (d < 190) {
            const w = (1 - d / 190) ** 2;
            // Perpendicular to the radius = a swirl, not a push.
            fx += (-dy / (d + 1)) * w * 5; fy += (dx / (d + 1)) * w * 5;
          }
        }
        q.vx = q.vx * .86 + fx * .5;
        q.vy = q.vy * .86 + fy * .5;
        const px = q.x, py = q.y;
        q.x += q.vx; q.y += q.vy;
        if (--q.life < 0 || q.x < -10 || q.x > state.w + 10 || q.y < -10 || q.y > state.h + 10) {
          q.x = Math.random() * state.w; q.y = Math.random() * state.h;
          q.vx = q.vy = 0; q.life = 120 + Math.random() * 160 | 0;
          continue;
        }
        ctx.strokeStyle = q.hot ? t.accent : t.dim;
        ctx.globalAlpha = q.hot ? .95 : .4;
        ctx.lineWidth = q.hot ? 1.4 : .8;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, { still() { ctx.fillStyle = t.bg; ctx.fillRect(0, 0, state.w, state.h); } });
  });

/* ══ 04 · KINETIC TYPE ═════════════════════════════════════════════════ */
def('kinetic', 'Kinetic type',
  'Drag the bar. Watch the letters stretch and settle.',
  null,
  (root, stage) => {
    const WORD = 'MOMENTUM';
    const kin = document.createElement('div');
    kin.className = 'sp-kin';
    kin.setAttribute('aria-label', WORD);
    const chars = [...WORD].map((ch, i) => {
      const b = document.createElement('b');
      b.textContent = ch; b.setAttribute('aria-hidden', 'true');
      kin.append(b);
      return { el: b, i, y: 0, vy: 0, sx: 1, vsx: 0, rot: 0, vrot: 0 };
    });
    stage.append(kin);

    const scrub = document.createElement('div');
    scrub.className = 'sp-scrub';
    scrub.setAttribute('role', 'slider');
    scrub.setAttribute('tabindex', '0');
    scrub.setAttribute('aria-label', 'Scrub the animation');
    scrub.setAttribute('aria-valuemin', '0');
    scrub.setAttribute('aria-valuemax', '100');
    scrub.innerHTML = '<i></i><b></b>';
    stage.append(scrub);

    let pos = 0, auto = true;
    const setPos = v => {
      pos = clamp(v, 0, 1);
      scrub.style.setProperty('--p', (pos * 100).toFixed(1) + '%');
      scrub.setAttribute('aria-valuenow', Math.round(pos * 100));
    };
    setPos(0);
    scrub.addEventListener('pointerdown', e => {
      auto = false; scrub.setPointerCapture(e.pointerId);
      setPos((e.clientX - scrub.getBoundingClientRect().left) / scrub.offsetWidth);
    });
    scrub.addEventListener('pointermove', e => {
      if (!scrub.hasPointerCapture(e.pointerId)) return;
      setPos((e.clientX - scrub.getBoundingClientRect().left) / scrub.offsetWidth);
    });
    scrub.addEventListener('keydown', e => {
      const d = { ArrowRight: .05, ArrowUp: .05, ArrowLeft: -.05, ArrowDown: -.05 }[e.key];
      if (d == null) return;
      e.preventDefault(); auto = false; setPos(pos + d);
    });

    loop(root, time => {
      if (auto) {
        // One pass, then park at the end and hand the handle over. A control
        // that never stops moving is a control nobody can grab.
        const t = time * .55;
        if (t < 1) setPos(t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        else { setPos(1); auto = false; }
      }
      for (const c of chars) {
        // Each letter lags the one before it: the phase offset is the whole
        // reason this reads as a wave through a word.
        const ph = clamp(pos * 1.5 - c.i * .055, 0, 1);
        const s = Math.sin(ph * Math.PI);
        const ty = -s * 46;
        const tsx = 1 + s * .55;
        const trot = (c.i % 2 ? 1 : -1) * s * 9;
        c.vy = (c.vy + (ty - c.y) * .22) * .78;  c.y += c.vy;
        c.vsx = (c.vsx + (tsx - c.sx) * .2) * .74; c.sx += c.vsx;
        c.vrot = (c.vrot + (trot - c.rot) * .18) * .76; c.rot += c.vrot;
        c.el.style.transform =
          `translateY(${c.y.toFixed(2)}px) scale(${c.sx.toFixed(3)}, ${(2 - c.sx).toFixed(3)}) rotate(${c.rot.toFixed(2)}deg)`;
        c.el.classList.toggle('hot', s > .55);
      }
    }, { still() { for (const c of chars) { c.el.style.transform = ''; c.el.classList.remove('hot'); } } });
  });

/* ══ 05 · SPOTLIGHT STAGE ══════════════════════════════════════════════ */
def('spotlight', 'Spotlight stage',
  'Move the light to reveal what’s in the dark.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    let items = [];
    const build = () => {
      items = Array.from({ length: 13 }, (_, i) => ({
        x: .08 + (i % 5) * .21 + (i % 3) * .03,
        y: .18 + Math.floor(i / 5) * .3 + (i % 2) * .06,
        w: .07 + (i % 4) * .025, h: .1 + (i % 3) * .05, seed: i
      }));
    };
    build(); state.resized = build;

    loop(root, time => {
      const W = state.w, H = state.h;
      const lx = p.inside ? p.x : W * (.5 + Math.sin(time * .45) * .33);
      const ly = p.inside ? p.y : H * (.5 + Math.cos(time * .33) * .28);

      ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);

      for (const it of items) {
        const x = it.x * W, y = it.y * H, w = it.w * W, h = it.h * H;
        const cx = x + w / 2, cy = y + h / 2;
        const dx = cx - lx, dy = cy - ly;
        const d = Math.hypot(dx, dy);
        const fall = clamp(1 - d / (Math.max(W, H) * .62), 0, 1) ** 1.7;
        // Shadow: push away from the light, length tied to proximity.
        const sl = clamp(70 * fall, 0, 90);
        ctx.globalAlpha = fall * .55;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.roundRect(x + dx / (d + 1) * sl, y + dy / (d + 1) * sl, w, h, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = `color-mix(in oklab, ${t.accent} ${(fall * 92).toFixed(0)}%, ${t.line})`;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
      }

      // The light itself, drawn last so it sits over everything.
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * .5);
      g.addColorStop(0, 'rgba(255,255,255,.14)');
      g.addColorStop(.45, 'rgba(255,255,255,.04)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = t.ink; ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    });
  });

/* ══ 06 · ONE LINE ═════════════════════════════════════════════════════
   Six drawings that are the same 120 points in different places, so the
   stroke never lifts — it just redistributes. Shared point count is the
   whole trick behind every good path morph. */
def('oneline', 'One line',
  'Six drawings. One continuous line.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const t = tokens(root);
    const N = 120;
    const shapes = [
      // circle
      i => { const a = i / N * TAU; return [Math.cos(a) * .36, Math.sin(a) * .36]; },
      // square
      i => { const u = i / N * 4, s = Math.floor(u), f = u - s, k = .34;
             return [[ -k + f*2*k, k, k - f*2*k, -k ][s], [ -k, -k + f*2*k, k, k - f*2*k ][s]]; },
      // wave
      i => [-.42 + i / N * .84, Math.sin(i / N * TAU * 2) * .22],
      // spiral
      i => { const a = i / N * TAU * 2.4, r = .06 + i / N * .3; return [Math.cos(a) * r, Math.sin(a) * r]; },
      // star
      i => { const a = i / N * TAU * 5 % TAU, r = .12 + (i % 2) * .26; return [Math.cos(a) * r, Math.sin(a) * r]; },
      // arrow / chevron stack
      i => { const u = i / N * 3, s = Math.floor(u), f = u - s;
             return [-.34 + f * .68, -.22 + s * .22 - Math.abs(f - .5) * .3]; }
    ];
    const pts = s => Array.from({ length: N }, (_, i) => shapes[s](i));

    loop(root, time => {
      const W = state.w, H = state.h, S = Math.min(W, H);
      ctx.clearRect(0, 0, W, H);
      const span = 2.4;
      const k = (time / span) % shapes.length;
      const a = Math.floor(k), b = (a + 1) % shapes.length;
      // Hold, then travel: the pause is what lets you read each shape.
      const raw = k - a;
      const m = clamp((raw - .45) / .55, 0, 1);
      const e = m < .5 ? 4 * m ** 3 : 1 - (-2 * m + 2) ** 3 / 2;
      const A = pts(a), B = pts(b);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.lineWidth = 2.25; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = t.accent;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = lerp(A[i][0], B[i][0], e) * S, y = lerp(A[i][1], B[i][1], e) * S;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      // A faint echo of where it was, so the morph leaves a wake.
      ctx.globalAlpha = .18; ctx.strokeStyle = t.accent2; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = lerp(A[i][0], B[i][0], clamp(e - .12, 0, 1)) * S;
        const y = lerp(A[i][1], B[i][1], clamp(e - .12, 0, 1)) * S;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    });
  });

/* ══ 08 · DOT MATRIX ═══════════════════════════════════════════════════ */
def('matrix', 'Dot matrix',
  'Move through the dots. Click to send a ripple.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    let dots = [], waves = [];
    const GAP = 26;
    const build = () => {
      dots = [];
      const cols = Math.ceil(state.w / GAP) + 1, rows = Math.ceil(state.h / GAP) + 1;
      const ox = (state.w - (cols - 1) * GAP) / 2, oy = (state.h - (rows - 1) * GAP) / 2;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
        dots.push({ hx: ox + c * GAP, hy: oy + r * GAP, x: 0, y: 0, vx: 0, vy: 0 });
    };
    state.resized = build; build();

    stage.addEventListener('pointerdown', e => {
      const r = stage.getBoundingClientRect();
      waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 });
      if (waves.length > 4) waves.shift();
    });

    loop(root, (time, now) => {
      ctx.clearRect(0, 0, state.w, state.h);
      for (const w of waves) w.t += .016;
      waves = waves.filter(w => w.t < 1.8);

      for (const d of dots) {
        let tx = d.hx, ty = d.hy;
        if (p.inside) {
          const dx = d.hx - p.x, dy = d.hy - p.y;
          const d2 = dx * dx + dy * dy + 80;
          const f = clamp(26000 / d2, 0, 34);
          tx += dx / Math.sqrt(d2) * f; ty += dy / Math.sqrt(d2) * f;
        }
        let lift = 0;
        for (const w of waves) {
          const dist = Math.hypot(d.hx - w.x, d.hy - w.y);
          const front = w.t * 420;
          const edge = dist - front;
          if (edge < 0 && edge > -150)
            lift += Math.sin(edge / 150 * Math.PI) * (1 - w.t / 1.8) * 16;
        }
        d.vx = (d.vx + (tx - (d.hx + d.x)) * .18) * .8;
        d.vy = (d.vy + (ty + lift - (d.hy + d.y)) * .18) * .8;
        d.x += d.vx; d.y += d.vy;
        const disp = Math.hypot(d.x, d.y);
        const k = clamp(disp / 26, 0, 1);
        ctx.fillStyle = k > .06 ? t.accent : t.dim;
        ctx.globalAlpha = .5 + k * .5;
        ctx.beginPath();
        ctx.arc(d.hx + d.x, d.hy + d.y, 1.7 + k * 2.8, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  });

/* ══ 10 · RIBBON ═══════════════════════════════════════════════════════ */
def('ribbon', 'Ribbon',
  'A ribbon that follows your movement.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    const N = 46;
    let chain = [];
    const reset = () => {
      chain = Array.from({ length: N }, () => ({ x: state.w / 2, y: state.h / 2 }));
    };
    state.resized = reset; reset();

    loop(root, time => {
      const W = state.w, H = state.h;
      if (!chain.length) reset();
      const tx = p.inside ? p.x : W * (.5 + Math.sin(time * .9) * .34);
      const ty = p.inside ? p.y : H * (.5 + Math.cos(time * 1.32) * .3);

      chain[0].x = lerp(chain[0].x, tx, .3);
      chain[0].y = lerp(chain[0].y, ty, .3);
      for (let i = 1; i < N; i++) {
        chain[i].x = lerp(chain[i].x, chain[i - 1].x, .36);
        chain[i].y = lerp(chain[i].y, chain[i - 1].y, .36);
      }

      ctx.clearRect(0, 0, W, H);
      const left = [], right = [];
      for (let i = 0; i < N - 1; i++) {
        const a = chain[i], b = chain[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        // Width tapers along the chain and swells a little where it moves fast.
        const w = (1 - i / N) ** 1.25 * 20 * (1 + clamp(len / 26, 0, .9));
        const nx = -dy / len * w, ny = dx / len * w;
        left.push([a.x + nx, a.y + ny]);
        right.unshift([a.x - nx, a.y - ny]);
      }
      if (left.length < 2) return;
      const g = ctx.createLinearGradient(chain[0].x, chain[0].y, chain[N - 1].x, chain[N - 1].y);
      g.addColorStop(0, t.accent);
      g.addColorStop(.55, t.accent2);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(left[0][0], left[0][1]);
      for (const [x, y] of left.slice(1)) ctx.lineTo(x, y);
      for (const [x, y] of right) ctx.lineTo(x, y);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = t.ink; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.arc(chain[0].x, chain[0].y, 3, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }, { still() { ctx.clearRect(0, 0, state.w, state.h); } });
  });

/* ══ MURMURATION ═══════════════════════════════════════════════════════
   The flow field's opposite number: no field at all. Every heading is
   negotiated between neighbours, three rules at a time.

   Drawn as the negotiation rather than the birds — each agent is a dash
   along its own velocity, and every pair close enough to be influencing
   each other is joined by a hairline. What you are looking at is the
   communication graph, which is the actually interesting part.           */
def('flock', 'Murmuration',
  'Move through the flock and watch it regroup.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    const N = 165, NEAR = 52, SEP = 22, LINK = 40, MAX = 2.3;
    let birds = [];
    const reseed = () => {
      birds = Array.from({ length: N }, () => {
        const a = Math.random() * TAU;
        return { x: Math.random() * state.w, y: Math.random() * state.h,
                 vx: Math.cos(a) * MAX, vy: Math.sin(a) * MAX, n: 0 };
      });
    };
    state.resized = reseed; reseed();

    loop(root, () => {
      const W = state.w, H = state.h;
      if (!birds.length) reseed();
      ctx.clearRect(0, 0, W, H);

      // One pass: steer everybody, and collect the links as we go, so the
      // drawing costs nothing beyond the simulation we already ran.
      const links = [];
      for (let i = 0; i < N; i++) {
        const b = birds[i];
        let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0, m = 0;
        for (let k = 0; k < N; k++) {
          if (k === i) continue;
          const o = birds[k];
          const dx = o.x - b.x, dy = o.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > NEAR * NEAR) continue;
          ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; n++;
          if (k > i && d2 < LINK * LINK) links.push([b, o, 1 - Math.sqrt(d2) / LINK]);
          if (d2 < SEP * SEP) {
            const d = Math.sqrt(d2) || .001;
            sx -= dx / d / d * 6; sy -= dy / d / d * 6; m++;
          }
        }
        b.n = n;
        if (n) {
          // Separation strong, alignment moderate, cohesion barely there.
          // Get that ratio wrong and you have a clump or a cloud, never a flock.
          b.vx += ((ax / n) - b.vx) * .055 + ((cx / n) - b.x) * .0015;
          b.vy += ((ay / n) - b.vy) * .055 + ((cy / n) - b.y) * .0015;
        }
        if (m) { b.vx += sx * 1.5; b.vy += sy * 1.5; }
        if (p.inside) {
          const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy);
          if (d < 130) { const w = (1 - d / 130) ** 2 * 2.1; b.vx += dx / (d + 1) * w; b.vy += dy / (d + 1) * w; }
        }
        const sp = Math.hypot(b.vx, b.vy) || .001;
        b.vx = b.vx / sp * MAX; b.vy = b.vy / sp * MAX;
        b.x += b.vx; b.y += b.vy;
        if (b.x < -10) b.x = W + 10; else if (b.x > W + 10) b.x = -10;
        if (b.y < -10) b.y = H + 10; else if (b.y > H + 10) b.y = -10;
      }

      // The graph underneath…
      ctx.lineWidth = 1;
      ctx.strokeStyle = t.accent;
      for (const [a, b, w] of links) {
        if (Math.abs(a.x - b.x) > W / 2 || Math.abs(a.y - b.y) > H / 2) continue; // wrapped pair
        ctx.globalAlpha = w * .3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // …and the agents on top, as dashes along their own heading.
      ctx.lineCap = 'round';
      for (const b of birds) {
        const dense = Math.min(1, b.n / 9);
        ctx.strokeStyle = dense > .45 ? t.accent : t.dim;
        ctx.globalAlpha = .45 + dense * .55;
        ctx.lineWidth = 1.6 + dense * 1.1;
        ctx.beginPath();
        ctx.moveTo(b.x - b.vx * 2.1, b.y - b.vy * 2.1);
        ctx.lineTo(b.x + b.vx * 2.1, b.y + b.vy * 2.1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, { still() { ctx.clearRect(0, 0, state.w, state.h); } });
  });

/* ══ REACTION–DIFFUSION ════════════════════════════════════════════════
   Gray–Scott, run on a coarse grid and scaled up. Two chemicals, one
   feeding and one killing, and the pattern is nobody's drawing — it is the
   equation settling.                                                      */
def('reaction', 'Growing patterns',
  'Draw on the surface and watch the pattern evolve.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    const GW = 132, GH = 76;
    const off = document.createElement('canvas');
    off.width = GW; off.height = GH;
    const octx = off.getContext('2d');
    const img = octx.createImageData(GW, GH);

    let frames = 0;
    let A = new Float32Array(GW * GH), B = new Float32Array(GW * GH);
    let A2 = new Float32Array(GW * GH), B2 = new Float32Array(GW * GH);
    // F=.0367/k=.0649 sits in "U-skate" territory — gorgeous, and prone to
    // collapsing to nothing. These are the coral-growth numbers, which keep
    // producing structure instead of flatlining.
    const DA = 1, DB = .5, FEED = .055, KILL = .062;

    const seed = () => {
      A.fill(1); B.fill(0);
      for (let k = 0; k < 7; k++) {
        const cx = 10 + Math.random() * (GW - 20) | 0, cy = 10 + Math.random() * (GH - 20) | 0;
        for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++)
          B[(cy + y) * GW + (cx + x)] = 1;
      }
    };
    seed();

    const lap = (f, i, x, y) => {
      // Wrapped nine-point Laplacian; wrapping keeps the pattern from dying
      // at the edges, which is what makes it look alive rather than framed.
      const l = x > 0 ? i - 1 : i + GW - 1, r = x < GW - 1 ? i + 1 : i - GW + 1;
      const u = y > 0 ? i - GW : i + GW * (GH - 1), d = y < GH - 1 ? i + GW : i - GW * (GH - 1);
      const ul = y > 0 ? l - GW : l + GW * (GH - 1), ur = y > 0 ? r - GW : r + GW * (GH - 1);
      const dl = y < GH - 1 ? l + GW : l - GW * (GH - 1), dr = y < GH - 1 ? r + GW : r - GW * (GH - 1);
      return f[l] * .2 + f[r] * .2 + f[u] * .2 + f[d] * .2
           + (f[ul] + f[ur] + f[dl] + f[dr]) * .05 - f[i];
    };

    const hex = (c, fallback) => {
      const m = /#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(c || '');
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : fallback;
    };
    // Re-resolved whenever the token object changes underneath us, so the
    // chemistry re-themes along with everything else.
    let BG = hex(t.bg, [17, 17, 20]), AC = hex(t.accent, [200, 255, 46]), seenBg = t.bg, seenAc = t.accent;
    const refresh = () => {
      if (t.bg === seenBg && t.accent === seenAc) return;
      seenBg = t.bg; seenAc = t.accent;
      BG = hex(t.bg, BG); AC = hex(t.accent, AC);
    };

    loop(root, () => {
      if (p.inside) {
        const gx = Math.round(p.x / state.w * GW), gy = Math.round(p.y / state.h * GH);
        for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
          const i = (gy + y) * GW + (gx + x);
          if (i >= 0 && i < GW * GH) B[i] = 1;
        }
      }
      for (let step = 0; step < 4; step++) {
        for (let y = 0, i = 0; y < GH; y++) for (let x = 0; x < GW; x++, i++) {
          const a = A[i], b = B[i], abb = a * b * b;
          // Clamped because an unclamped Gray–Scott at dt = 1 can walk off
          // to NaN, and a grid of NaN renders as exactly the black screen
          // you would expect.
          A2[i] = clamp(a + (DA * lap(A, i, x, y) - abb + FEED * (1 - a)), 0, 1);
          B2[i] = clamp(b + (DB * lap(B, i, x, y) + abb - (KILL + FEED) * b), 0, 1);
        }
        [A, A2] = [A2, A]; [B, B2] = [B2, B];
      }

      // Watchdog: if the reaction burns out or saturates, start it again.
      // A simulation that can die needs a plan for dying.
      if (++frames % 90 === 0) {
        let total = 0;
        for (let i = 0; i < GW * GH; i += 7) total += B[i];
        const mean = total / (GW * GH / 7);
        if (mean < .012 || mean > .62) seed();
      }
      refresh();
      const d = img.data;
      for (let i = 0, j = 0; i < GW * GH; i++, j += 4) {
        const v = clamp(B[i] * 3.1, 0, 1);
        d[j]     = BG[0] + (AC[0] - BG[0]) * v;
        d[j + 1] = BG[1] + (AC[1] - BG[1]) * v;
        d[j + 2] = BG[2] + (AC[2] - BG[2]) * v;
        d[j + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, GW, GH, 0, 0, state.w, state.h);
    });
  });

/* ══ SHATTER ═══════════════════════════════════════════════════════════ */
def('shatter', 'Shatter',
  'Click to break it. Watch it pull itself together.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    let shards = [];

    /* Clip a convex polygon against a half-plane; apply twice with opposite
       normals and a random cut becomes two convex pieces. */
    const clip = (poly, px, py, nx, ny) => {
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const da = (a[0] - px) * nx + (a[1] - py) * ny;
        const db = (b[0] - px) * nx + (b[1] - py) * ny;
        if (da >= 0) out.push(a);
        if ((da >= 0) !== (db >= 0)) {
          const k = da / (da - db);
          out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
        }
      }
      return out;
    };
    const area = poly => {
      let s = 0;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        s += a[0] * b[1] - b[0] * a[1];
      }
      return Math.abs(s) / 2;
    };

    const build = () => {
      const W = state.w, H = state.h;
      if (!W || !H) return;
      let polys = [[[0, 0], [W, 0], [W, H], [0, H]]];
      while (polys.length < 42) {
        // Always split the biggest piece: that is what stops the result
        // looking like a grid with a few extra lines in it.
        let bi = 0;
        for (let i = 1; i < polys.length; i++) if (area(polys[i]) > area(polys[bi])) bi = i;
        const poly = polys.splice(bi, 1)[0];
        let cx = 0, cy = 0;
        for (const q of poly) { cx += q[0]; cy += q[1]; }
        cx /= poly.length; cy /= poly.length;
        cx += (Math.random() - .5) * W * .12;
        cy += (Math.random() - .5) * H * .12;
        const a = Math.random() * Math.PI;
        const nx = Math.cos(a), ny = Math.sin(a);
        const p1 = clip(poly, cx, cy, nx, ny), p2 = clip(poly, cx, cy, -nx, -ny);
        if (p1.length > 2) polys.push(p1);
        if (p2.length > 2) polys.push(p2);
        if (p1.length <= 2 && p2.length <= 2) polys.push(poly);
      }
      shards = polys.map(poly => {
        let cx = 0, cy = 0;
        for (const q of poly) { cx += q[0]; cy += q[1]; }
        cx /= poly.length; cy /= poly.length;
        return { poly, cx, cy, dx: 0, dy: 0, vx: 0, vy: 0, rot: 0, vrot: 0, delay: 0,
                 tone: (cx / W * .6 + cy / H * .4) };
      });
    };
    state.resized = build; build();

    const hit = (hx, hy) => {
      const R = Math.hypot(state.w, state.h);
      for (const s of shards) {
        const dx = s.cx - hx, dy = s.cy - hy, d = Math.hypot(dx, dy) || 1;
        const force = (1 - Math.min(1, d / (R * .7))) ** 1.6 * 26;
        s.vx += dx / d * force; s.vy += dy / d * force;
        s.vrot += (Math.random() - .5) * force * .012;
        s.delay = d / R * 16;        // the break travels outward
      }
      root.setAttribute('data-touched', '');
    };
    stage.addEventListener('pointerdown', e => {
      const r = stage.getBoundingClientRect();
      hit(e.clientX - r.left, e.clientY - r.top);
    });

    let idle = 0;
    loop(root, () => {
      const W = state.w, H = state.h;
      if (!shards.length) build();
      // If nobody has touched it, break it occasionally so the tile is alive.
      if (++idle > 170 && !root.hasAttribute('data-touched')) {
        idle = 0; hit(W * (.25 + Math.random() * .5), H * (.25 + Math.random() * .5));
      }
      ctx.clearRect(0, 0, W, H);
      for (const s of shards) {
        if (s.delay > 0) { s.delay--; }
        else {
          s.vx = (s.vx - s.dx * .085) * .9;
          s.vy = (s.vy - s.dy * .085) * .9;
          s.vrot = (s.vrot - s.rot * .085) * .9;
          s.dx += s.vx; s.dy += s.vy; s.rot += s.vrot;
        }
        const lift = Math.min(1, Math.hypot(s.dx, s.dy) / 40);
        ctx.save();
        ctx.translate(s.cx + s.dx, s.cy + s.dy);
        ctx.rotate(s.rot);
        ctx.translate(-s.cx, -s.cy);
        ctx.beginPath();
        ctx.moveTo(s.poly[0][0], s.poly[0][1]);
        for (let i = 1; i < s.poly.length; i++) ctx.lineTo(s.poly[i][0], s.poly[i][1]);
        ctx.closePath();
        // Tinted glass rather than dark-on-dark: the pane has to read as a
        // solid surface before breaking it means anything.
        ctx.fillStyle = t.accent;
        ctx.globalAlpha = .1 + s.tone * .26 + lift * .5;
        ctx.fill();
        ctx.globalAlpha = .9;
        ctx.strokeStyle = t.bg;
        ctx.lineWidth = 1.5; ctx.stroke();
        if (lift > .04) {
          ctx.globalAlpha = lift * .7;
          ctx.strokeStyle = t.accent; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }, { still() {
      for (const s of shards) { s.dx = s.dy = s.rot = s.vx = s.vy = s.vrot = 0; }
    } });
  });

/* ══ INTERFERENCE ══════════════════════════════════════════════════════
   A scalar wave field rather than a vector one: three sources, the sum of
   their phases evaluated per cell, quantised into bands. The moiré is not
   drawn anywhere — it is what two spacings do to each other.             */
def('interference', 'Interference',
  'Move to reshape the overlapping waves.',
  null,
  (root, stage) => {
    const { ctx, state } = makeCanvas(stage);
    const p = pointer(root, stage);
    const t = tokens(root);
    const GW = 180, GH = 102;
    const off = document.createElement('canvas');
    off.width = GW; off.height = GH;
    const octx = off.getContext('2d');
    const img = octx.createImageData(GW, GH);

    const hex = (c, f) => {
      const m = /#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(c || '');
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : f;
    };
    let BG = hex(t.bg, [17, 17, 20]), A1 = hex(t.accent, [200, 255, 46]),
        A2 = hex(t.accent2, [84, 231, 192]), sb = t.bg, sa = t.accent, sc = t.accent2;
    const refresh = () => {
      if (t.bg === sb && t.accent === sa && t.accent2 === sc) return;
      sb = t.bg; sa = t.accent; sc = t.accent2;
      BG = hex(t.bg, BG); A1 = hex(t.accent, A1); A2 = hex(t.accent2, A2);
    };

    loop(root, time => {
      refresh();
      // Sources in grid space; the third one is wherever the pointer is.
      const s1x = GW * (.26 + Math.sin(time * .34) * .1), s1y = GH * (.3 + Math.cos(time * .27) * .12);
      const s2x = GW * (.74 + Math.cos(time * .23) * .1), s2y = GH * (.7 + Math.sin(time * .31) * .12);
      const s3x = p.inside ? p.x / state.w * GW : GW * .5;
      const s3y = p.inside ? p.y / state.h * GH : GH * (.5 + Math.sin(time * .5) * .3);
      const K = .55, W = time * 3.4;
      const d = img.data;
      for (let y = 0, i = 0, j = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++, i++, j += 4) {
          const d1 = Math.hypot(x - s1x, y - s1y);
          const d2 = Math.hypot(x - s2x, y - s2y);
          const d3 = Math.hypot(x - s3x, y - s3y);
          const v = (Math.cos(d1 * K - W) + Math.cos(d2 * K - W) + Math.cos(d3 * K - W * 1.1)) / 3;
          // Quantising is what turns a smooth field into visible fringes.
          const band = Math.round((v * .5 + .5) * 7) / 7;
          const mix = v > 0 ? A1 : A2;
          const k = band * band;
          d[j]     = BG[0] + (mix[0] - BG[0]) * k;
          d[j + 1] = BG[1] + (mix[1] - BG[1]) * k;
          d[j + 2] = BG[2] + (mix[2] - BG[2]) * k;
          d[j + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, GW, GH, 0, 0, state.w, state.h);
    });
  });

/* ══ Render ════════════════════════════════════════════════════════════ */
/* Interference and Growing patterns are still defined below; they are just
   not shown. Nine pieces also means the grid divides evenly once the
   feature takes the top row. */
const ORDER = ['flow', 'kinetic', 'spotlight', 'shatter', 'ribbon',
               'oneline', 'matrix', 'flock', 'goo'];

/* The gooey filter is defined once per document, not once per piece. */
function ensureGooFilter() {
  if (document.getElementById('sp-goo-filter')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('style', 'position:absolute;width:0;height:0');
  svg.innerHTML =
    '<filter id="sp-goo-filter">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/>' +
      '<feColorMatrix in="b" mode="matrix" ' +
        'values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/>' +
      '<feBlend in="SourceGraphic" in2="g"/>' +
    '</filter>';
  document.body.append(svg);
}

function mount(root, id, index) {
  const piece = PIECES[id];
  if (!piece) return null;
  const fig = document.createElement('figure');
  fig.className = 'sp';
  fig.dataset.sp = id;
  if (piece.needsMotion) fig.setAttribute('data-needs-motion', '');
  fig.innerHTML =
    `<div class="sp-stage"></div>
     <figcaption class="sp-cap">
       <span class="n">${String(index + 1).padStart(2, '0')} <b>${piece.title}</b></span>
       <p>${piece.note}</p>
     </figcaption>`;
  const stage = fig.querySelector('.sp-stage');
  if (piece.hint) {
    const hint = document.createElement('span');
    hint.className = 'sp-hint';
    hint.textContent = piece.hint;
    stage.append(hint);
  }
  const stat = document.createElement('div');
  stat.className = 'sp-static';
  stat.textContent = 'Motion is paused. Use the motion control to resume.';
  stage.append(stat);

  const expand = document.createElement('button');
  expand.type = 'button';
  expand.className = 'sp-expand';
  expand.setAttribute('aria-label', 'Open ' + piece.title + ' at full size');
  expand.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1H1v5M10 15h5v-5M1 10v5h5M15 6V1h-5"/></svg>';
  expand.addEventListener('click', e => { e.stopPropagation(); openModal(fig); });
  stage.append(expand);

  /* The whole tile opens the large view. A plain click does it; a drag does
     not, because several of these are things you drag — and a click that
     lands on a control belongs to that control. */
  let down = false, moved = false, x0 = 0, y0 = 0;
  fig.addEventListener('pointerdown', e => {
    down = true; moved = false; x0 = e.clientX; y0 = e.clientY;
  });
  fig.addEventListener('pointermove', e => {
    if (down && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) moved = true;
  });
  addEventListener('pointerup', () => { down = false; });
  fig.addEventListener('click', e => {
    if (moved || fig.hasAttribute('data-expanded')) return;
    if (e.target.closest('button, a, input, [role="slider"]')) return;
    openModal(fig);
  });

  root.append(fig);
  MOUNTED.push(fig);
  // Build after insertion so measurements are real.
  requestAnimationFrame(() => piece.build(fig, stage));
  return fig;
}

/* ══ Large view ════════════════════════════════════════════════════════
   These pieces are built around a live canvas that sizes itself from its
   stage, so the honest way to show one big is to *move* the figure into a
   dialog rather than clone it — a copy would be a second simulation with
   its own state, and the one you had been playing with would be the one you
   left behind. The ResizeObserver inside each piece does the rest.        */
let modal = null, slot = null, openFig = null, opener = null;

/* Mount order, which is the order the reader sees. Walking the DOM instead
   would put whichever piece is currently in the dialog last, because the
   dialog lives at the end of <body> — so "next" from the third piece would
   wrap to the first. */
const MOUNTED = [];

function buildModal() {
  modal = document.createElement('dialog');
  modal.className = 'sp-modal';
  modal.innerHTML =
    `<div class="sp-modal-bar">
       <p class="t"><b></b><span></span><em class="tech"></em></p>
       <div class="nav">
         <button type="button" data-step="-1" aria-label="Previous study">
           <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8 1 3 6l5 5"/></svg></button>
         <span class="cnt mono"></span>
         <button type="button" data-step="1" aria-label="Next study">
           <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 1l5 5-5 5"/></svg></button>
         <button type="button" data-close class="close">Close <kbd>Esc</kbd></button>
       </div>
     </div>
     <div class="sp-modal-body"></div>`;
  document.body.append(modal);

  modal.addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) return hop(Number(step.dataset.step));
    if (e.target.closest('[data-close]')) return modal.close();
    // Clicking the backdrop closes; clicking the piece must not.
    if (e.target === modal) modal.close();
  });
  modal.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); hop(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); hop(-1); }
  });
  modal.addEventListener('close', restore);
}

function restore() {
  if (openFig && slot) {
    slot.replaceWith(openFig);
    openFig.removeAttribute('data-expanded');
  }
  openFig = null; slot = null;
  if (opener) { opener.focus(); opener = null; }
}

function hop(dir) {
  const here = MOUNTED.indexOf(openFig);
  if (here < 0) return;
  const next = MOUNTED[(here + dir + MOUNTED.length) % MOUNTED.length];
  const wasOpener = opener;
  restoreQuiet();
  place(next);
  opener = wasOpener;
}

function restoreQuiet() {
  if (openFig && slot) { slot.replaceWith(openFig); openFig.removeAttribute('data-expanded'); }
  openFig = null; slot = null;
}

function place(fig) {
  slot = document.createElement('div');
  slot.className = 'sp-slot';
  slot.style.minHeight = fig.getBoundingClientRect().height + 'px';
  fig.replaceWith(slot);
  fig.setAttribute('data-expanded', '');
  modal.querySelector('.sp-modal-body').append(fig);
  openFig = fig;

  const cap = fig.querySelector('.sp-cap');
  modal.querySelector('.t b').textContent = cap.querySelector('.n b').textContent;
  modal.querySelector('.t span').textContent = cap.querySelector('p').textContent;
  modal.querySelector('.t .tech').textContent = TECH[fig.dataset.sp] || '';
  modal.querySelector('.cnt').textContent =
    String(MOUNTED.indexOf(fig) + 1).padStart(2, '0') + ' / ' +
    String(MOUNTED.length).padStart(2, '0');
}

function openModal(fig) {
  if (!modal) buildModal();
  opener = fig.querySelector('.sp-expand');
  place(fig);
  modal.showModal();
}

window.nmShowpieces = { ORDER, mount, open: openModal, titles: () => ORDER.map(id => PIECES[id].title) };

document.querySelectorAll('[data-showpieces]').forEach(root => {
  ensureGooFilter();
  const ids = (root.dataset.only || '').trim()
    ? root.dataset.only.split(',').map(s => s.trim()).filter(id => PIECES[id])
    : ORDER;
  ids.forEach((id, i) => mount(root, id, ORDER.indexOf(id) >= 0 ? ORDER.indexOf(id) : i));
});

})();
