/* ═══════════════════════════════════════════════════════════════════════
   SIGNATURE 2 — Company morph
   Renders into <div data-morph></div>.

   Client palettes are the real ones from each case study where they exist
   (/work/recurly, /work/forallsecure); the rest come from the brand itself.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const CLIENTS = [
    {
      id: 'recurly', name: 'Recurly',
      core: '#24152f', key: '#9161c5', alt: '#9de4cc', paper: '#f6f4ed',
      tagline: 'Subscription billing · 2021—23',
      title: 'Revenue data that still reads on a phone',
      body: 'Owned front-end implementation across the product-story surface. The desktop ' +
            'charts were the easy half — keeping multi-series billing data interactive and ' +
            'legible at 360px, without forking the component, was the work.',
      tags: ['SVG', 'Canvas', 'Scroll-linked motion', 'Design system'],
      href: '/work/recurly/',
      stat: { v: 360, u: 'px', l: 'narrowest supported chart' },
      series: [.34,.41,.38,.52,.47,.61,.58,.72,.8,.94],
      foot: ['Charts · maps · tables', 'Case study ↗']
    },
    {
      id: 'forallsecure', name: 'ForAllSecure',
      core: '#183536', key: '#94dfc4', alt: '#ff947e', paper: '#f6f5ee',
      tagline: 'Security tooling · 2022',
      title: 'Explaining fuzzing to people who would spot a bad metaphor',
      body: 'A sequenced, scroll-driven explainer for an audience of security engineers. ' +
            'Every stage of the animation had to be technically defensible, and the ' +
            'reduced-motion path had to teach the same thing without moving.',
      tags: ['Motion sequencing', 'IntersectionObserver', 'Reduced-motion parity'],
      href: '/work/forallsecure/',
      stat: { v: 2, u: 'paths', l: 'motion and still, same lesson' },
      series: [.22,.3,.46,.4,.58,.54,.7,.66,.86,.9],
      foot: ['Technical storytelling', 'Case study ↗']
    },
    {
      id: 'fourwinds', name: 'Four Winds',
      core: '#0b2b45', key: '#2fb6e8', alt: '#7ee0c3', paper: '#eef6fb',
      tagline: 'Digital signage · 2019—21',
      title: 'A component library non-engineers could drive',
      body: 'Templating and component architecture across a large marketing surface, with a ' +
            'CMS that marketers operated daily. The constraint that shaped everything: a ' +
            'wrong click could not be allowed to break a layout.',
      tags: ['Component architecture', 'CMS', 'Templating'],
      href: '/archive/',
      stat: { v: 40, u: '+ templates', l: 'one system behind them' },
      series: [.3,.36,.44,.5,.48,.62,.68,.74,.82,.88],
      foot: ['Systems work', 'Archive ↗']
    },
    {
      id: 'mathews', name: 'Mathews',
      core: '#101210', key: '#8a9a33', alt: '#e0532f', paper: '#f2f1ea',
      tagline: 'Precision manufacturing · 2017—19',
      title: 'A configurator under a hard image budget',
      body: 'Heavy product photography, deep configuration, and an audience often on rural ' +
            'connections. Most of the engineering was deciding what never had to load.',
      tags: ['Image performance', 'Configurator UI', 'Custom CMS'],
      href: '/archive/',
      stat: { v: 12, u: 'yrs', l: 'building for the web' },
      series: [.5,.44,.56,.5,.64,.6,.72,.7,.84,.8],
      foot: ['Performance work', 'Archive ↗']
    },
    {
      id: 'seriesfest', name: 'SeriesFest',
      core: '#160d1c', key: '#e8356d', alt: '#f2c14e', paper: '#faf0f3',
      tagline: 'Festival platform · 2016—18',
      title: 'Scheduling and ticketing that survives one spike a year',
      body: 'Submissions, programming, and ticketing for a festival whose traffic arrives in ' +
            'a single afternoon. Everything was built so that the busiest hour was the ' +
            'cheapest hour to serve.',
      tags: ['Scheduling UI', 'Integrations', 'UX design'],
      href: '/archive/',
      stat: { v: 1, u: 'spike', l: 'the only hour that matters' },
      series: [.18,.2,.24,.22,.3,.28,.42,.56,.78,1],
      foot: ['Event platform', 'Archive ↗']
    }
  ];

  const W = 100, H = 100;

  function build(root) {
    root.classList.add('morph');

    const tabs = document.createElement('div');
    tabs.className = 'morph-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Selected clients');

    const panel = document.createElement('div');
    panel.className = 'morph-panel';
    panel.innerHTML = `
      <div class="morph-copy">
        <p class="tagline"></p>
        <h3></h3>
        <p class="body"></p>
        <ul class="morph-tags"></ul>
        <a class="go" href="#">Open the case study <span aria-hidden="true">→</span></a>
      </div>
      <div class="morph-viz">
        <div class="morph-stat">
          <span class="v">0</span><span class="u"></span><span class="l"></span>
        </div>
        <div class="morph-chart">
          <div class="morph-bars" aria-hidden="true"></div>
          <svg class="morph-line" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
            <polyline points=""/>
          </svg>
        </div>
        <div class="morph-foot"><span class="f1"></span><span class="f2"></span></div>
      </div>`;

    root.append(tabs, panel);

    const q = s => panel.querySelector(s);
    const bars = q('.morph-bars');
    const line = q('.morph-line polyline');
    const statV = q('.morph-stat .v');

    const barEls = CLIENTS[0].series.map((_, i) => {
      const b = document.createElement('i');
      b.style.setProperty('--i', i);
      bars.append(b);
      return b;
    });

    const buttons = CLIENTS.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0);
      b.style.setProperty('--k', c.key);
      b.innerHTML = `<i aria-hidden="true"></i>${c.name}`;
      tabs.append(b);
      return b;
    });

  /* Live read of the motion switch — never cached, because the visitor can
     flip it at any moment and every piece has to agree instantly. */
  const reduced = () => window.nmMotion
    ? window.nmMotion.isReduced()
    : matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = -1, countTo = null;

    const points = s => s.map((v, i) =>
      `${(i / (s.length - 1)) * W},${H - v * H * .92 - 4}`).join(' ');

    /* The line can't tween its points in CSS, so it retracts and redraws —
       which reads better than a crossfade anyway. */
    const redraw = series => {
      const len = line.getTotalLength?.() || 300;
      if (reduced()) { line.setAttribute('points', points(series)); line.style.strokeDasharray = ''; return; }
      line.style.transition = 'none';
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = 0;
      void line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 240ms var(--ease)';
      line.style.strokeDashoffset = len;
      setTimeout(() => {
        line.setAttribute('points', points(series));
        const l2 = line.getTotalLength?.() || len;
        line.style.transition = 'none';
        line.style.strokeDasharray = l2;
        line.style.strokeDashoffset = l2;
        void line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 620ms var(--ease) 60ms';
        line.style.strokeDashoffset = 0;
      }, 250);
    };

    const count = (to, unitMax) => {
      cancelAnimationFrame(countTo);
      if (reduced()) { statV.textContent = to; return; }
      const from = Number(statV.textContent.replace(/\D/g, '')) || 0;
      const t0 = performance.now(), d = 700;
      const frame = t => {
        const p = Math.min(1, (t - t0) / d);
        const eased = 1 - Math.pow(1 - p, 3);
        statV.textContent = Math.round(from + (to - from) * eased);
        if (p < 1) countTo = requestAnimationFrame(frame);
      };
      countTo = requestAnimationFrame(frame);
    };

    const select = i => {
      if (i === current) return;
      current = i;
      const c = CLIENTS[i];

      root.style.setProperty('--client-core', c.core);
      root.style.setProperty('--client-key', c.key);
      root.style.setProperty('--client-alt', c.alt);
      root.style.setProperty('--client-paper', c.paper);

      q('.tagline').textContent = c.tagline;
      q('h3').textContent = c.title;
      q('.body').textContent = c.body;
      q('.morph-tags').innerHTML = c.tags.map(t => `<li>${t}</li>`).join('');
      q('.go').href = c.href;
      q('.go').setAttribute('aria-label', `Open the ${c.name} case study`);
      q('.morph-stat .u').textContent = c.stat.u;
      q('.morph-stat .l').textContent = c.stat.l;
      q('.f1').textContent = c.foot[0];
      q('.f2').textContent = c.foot[1];

      barEls.forEach((b, n) => b.style.setProperty('--v', c.series[n]));
      redraw(c.series);
      count(c.stat.v);

      buttons.forEach((b, n) => {
        b.setAttribute('aria-selected', n === i);
        b.tabIndex = n === i ? 0 : -1;
      });
    };

    buttons.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const n = (i + d + buttons.length) % buttons.length;
        select(n); buttons[n].focus();
      });
    });

    /* Hold the first render until the panel is on screen, so the bars and
       the counter animate where someone can see them. */
    const start = () => select(0);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect(); start();
      }, { threshold: .2 });
      io.observe(root);
      // Fallback if it is already fully in view at load.
      requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) { io.disconnect(); start(); }
      });
    } else start();
  }

  document.querySelectorAll('[data-morph]').forEach(build);
})();
