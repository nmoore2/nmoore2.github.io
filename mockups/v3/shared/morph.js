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
      id: 'recurly', logo: '/assets/recurly/recurly-logo-white.svg', name: 'Recurly',
      core: '#24152f', key: '#9161c5', alt: '#9de4cc', paper: '#f6f4ed',
      tagline: 'Subscription billing · 2021—23',
      title: 'Clear data on any screen',
      body: 'I built the interactive billing charts and product-story pages for their marketing site.',
      tags: ['Interactive charts', 'Responsive data', 'Design system'],
      href: '/work/recurly/',
      stat: { v: 360, u: 'px', l: 'narrowest supported chart' },
      series: [.34,.41,.38,.52,.47,.61,.58,.72,.8,.94]
    },
    {
      id: 'forallsecure', logo: '/work/forallsecure/assets/forallsecure-original.svg', name: 'ForAllSecure',
      core: '#183536', key: '#94dfc4', alt: '#ff947e', paper: '#f6f5ee',
      tagline: 'Security tooling · 2022',
      title: 'Making complex ideas clear',
      body: 'An interactive guide to fuzz testing, with animated and reduced-motion versions.',
      tags: ['Motion', 'Accessibility', 'Explainer'],
      href: '/work/forallsecure/',
      stat: { v: 2, u: 'paths', l: 'motion and still, same lesson' },
      series: [.22,.3,.46,.4,.58,.54,.7,.66,.86,.9]
    },
    {
      id: 'fourwinds', logo: '/assets/client-logos/fwi-logo.svg', name: 'Four Winds',
      core: '#0b2b45', key: '#2fb6e8', alt: '#7ee0c3', paper: '#eef6fb',
      tagline: 'Digital signage · 2019—21',
      title: 'A site marketers could manage',
      body: 'Reusable templates and CMS tools for everyday updates without broken layouts.',
      tags: ['Templates', 'CMS', 'Component library'],
      href: '/archive/',
      stat: { v: 40, u: '+ templates', l: 'one system behind them' },
      series: [.3,.36,.44,.5,.48,.62,.68,.74,.82,.88]
    },
    {
      id: 'mathews', logo: null, name: 'Mathews',
      core: '#101210', key: '#8a9a33', alt: '#e0532f', paper: '#f2f1ea',
      tagline: 'Precision manufacturing · 2017—19',
      title: 'More detail. Less waiting.',
      body: 'A product configurator designed to keep rich photography usable on slower connections.',
      tags: ['Configurator', 'Image performance'],
      href: '/archive/',
      stat: { v: 12, u: 'yrs', l: 'building for the web' },
      series: [.5,.44,.56,.5,.64,.6,.72,.7,.84,.8]
    },
    {
      id: 'seriesfest', logo: '/assets/client-logos/seriesfest.svg', name: 'SeriesFest',
      core: '#160d1c', key: '#e8356d', alt: '#f2c14e', paper: '#faf0f3',
      tagline: 'Festival platform · 2016—18',
      title: 'Bringing a festival online',
      body: 'Submissions, schedules, and ticketing in one festival platform.',
      tags: ['Scheduling', 'Ticketing', 'Integrations'],
      href: '/archive/',
      stat: { v: 1, u: 'spike', l: 'the only hour that matters' },
      series: [.18,.2,.24,.22,.3,.28,.42,.56,.78,1]
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
        <div class="morph-logo" role="img"></div>
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
    let current = -1;

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

    let countTo = null;
    const count = to => {
      cancelAnimationFrame(countTo);
      if (reduced()) { statV.textContent = to; return; }
      const from = Number(statV.textContent.replace(/\D/g, '')) || 0;
      const t0 = performance.now(), d = 700;
      const frame = t => {
        const p = Math.min(1, (t - t0) / d);
        statV.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
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

      // Logos are rendered as masks rather than images: every client file
      // arrives in a different colour, and a mask lets one rule tint them
      // all to the active palette instead of six one-off fixes.
      const logo = q('.morph-logo');
      logo.style.setProperty('--logo', c.logo ? `url("${c.logo}")` : 'none');
      logo.toggleAttribute('data-mark', !!c.logo);
      logo.textContent = c.logo ? '' : c.name;
      logo.setAttribute('aria-label', c.name + ' logo');

      q('.tagline').textContent = c.tagline;
      q('h3').textContent = c.title;
      q('.body').textContent = c.body;
      q('.morph-tags').innerHTML = c.tags.map(t => `<li>${t}</li>`).join('');
      // Only Recurly and ForAllSecure have a built case study; the rest live
      // in the archive. The link was always right — the label was promising
      // something three of these clients don't have.
      const go = q('.go');
      const isStudy = c.href.startsWith('/work/');
      go.href = c.href;
      go.firstChild.textContent = isStudy ? 'View case study ' : 'View archive ';
      go.setAttribute('aria-label',
        isStudy ? `View the ${c.name} case study` : `View ${c.name} in the project archive`);
      q('.morph-stat .u').textContent = c.stat.u;
      q('.morph-stat .l').textContent = c.stat.l;
      count(c.stat.v);

      barEls.forEach((b, n) => b.style.setProperty('--v', c.series[n]));
      redraw(c.series);

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
