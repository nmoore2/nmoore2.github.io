(() => {
  const lab = document.querySelector('.lab');
  const buttons = [...document.querySelectorAll('[data-mode-select]')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  const modes = {
    explain: {
      caption: '01 / EXPLAIN', title: ['Less decoding.', 'More understanding.'], description: 'Bring the important ideas together in a story your buyers can see, explore, and remember.',
      sources: ['Capabilities', 'Customer context', 'Technical detail'], core: 'Find the story.', coreCaption: 'Clarity, by design.',
      results: [['A clear promise', 'The part that matters.'], ['Show it working', 'Make the value visible.'], ['An obvious next step', 'Keep the story moving.']],
      paths: [[180,83,340,83,360,180,520,180],[160,180,350,180,370,180,520,180],[180,277,340,277,360,180,520,180],[600,180,740,180,750,80,910,80],[600,180,740,180,750,180,910,180],[600,180,740,180,750,280,910,280]]
    },
    launch: {
      caption: '02 / LAUNCH', title: ['One idea.', 'Ready for the world.'], description: 'Bring the message, the design, and the details into one considered campaign experience, all the way through the inquiry.',
      sources: ['A focused message', 'A clear audience', 'The right proof'], core: 'Bring it together.', coreCaption: 'Built for the moment.',
      results: [['Campaign page', 'A focused destination.'], ['Form & confirmation', 'A considered handoff.'], ['Launch checks', 'The details, connected.']],
      paths: [[180,101,360,101,380,180,550,180],[258,180,380,180,390,180,550,180],[180,259,360,259,380,180,550,180],[630,180,775,180,790,80,940,80],[630,180,775,180,790,180,940,180],[630,180,775,180,790,280,940,280]]
    },
    journey: {
      caption: '03 / IMPROVE', title: ['A good visit.', 'A useful next step.'], description: 'Connect discovery, understanding, and trust. Give interested people a clear route from the first impression to a conversation.',
      sources: ['Find the page', 'Understand the value', 'Build confidence'], core: 'Make the next step clear.', coreCaption: 'An invitation to connect.',
      results: [['A focused inquiry', 'Ask what matters.'], ['A clear confirmation', 'Set the expectation.'], ['A human conversation', 'Keep things moving.']],
      paths: [[145,180,190,180,240,180,300,180],[340,180,385,180,440,180,485,180],[530,180,565,180,620,180,690,180],[750,180,800,180,850,97,985,97],[750,180,800,180,850,180,985,180],[750,180,800,180,850,263,985,263]]
    }
  };
  const reduced = () => media.matches || document.documentElement.dataset.motion === 'reduced';
  let paused = false;
  let frame = null;
  let rendered = modes.explain.paths.map(path => [...path]);
  let active = 'explain';
  const pathString = p => `M ${p[0]} ${p[1]} C ${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}`;
  function draw(paths) {
    rendered = paths;
    paths.forEach((path, index) => {
      const d = pathString(path);
      document.getElementById(`wire${index}`).setAttribute('d', d);
      document.getElementById(`signal${index}`).setAttribute('d', d);
    });
  }
  function animatePaths(target) {
    cancelAnimationFrame(frame);
    if (reduced() || paused) { draw(target.map(path => [...path])); return; }
    const from = rendered.map(path => [...path]);
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / 950, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      draw(from.map((path, i) => path.map((value, j) => value + (target[i][j] - value) * eased)));
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
  }
  function setMode(key) {
    if (key === active) return;
    active = key;
    const mode = modes[key];
    lab.dataset.mode = key;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.modeSelect === key)));
    document.querySelectorAll('.node-label').forEach((label, index) => { label.textContent = mode.sources[index]; });
    document.querySelector('.core-title').textContent = mode.core;
    document.querySelector('.core-caption').textContent = mode.coreCaption;
    document.querySelectorAll('.result-node').forEach((node, index) => {
      node.querySelector('.result-label').textContent = mode.results[index][0];
      node.querySelector('small').textContent = mode.results[index][1];
    });
    document.querySelector('.caption-index').textContent = mode.caption;
    const heading = document.querySelector('.mode-caption h2');
    heading.replaceChildren(document.createTextNode(mode.title[0]), document.createElement('br'), document.createTextNode(mode.title[1]));
    document.querySelector('.mode-caption p').textContent = mode.description;
    animatePaths(mode.paths);
  }
  function syncMotion() {
    const isPaused = paused || reduced() || document.hidden;
    lab.classList.toggle('is-paused', isPaused);
    toggle.setAttribute('aria-pressed', String(isPaused));
    toggle.disabled = reduced();
    toggle.innerHTML = reduced() ? 'Still mode <span aria-hidden="true">○</span>' : paused ? 'Play motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    if (isPaused) { cancelAnimationFrame(frame); draw(modes[active].paths.map(path => [...path])); }
  }
  buttons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.modeSelect)));
  toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
  document.addEventListener('motionchange', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  media.addEventListener('change', syncMotion);
  syncMotion();
})();
