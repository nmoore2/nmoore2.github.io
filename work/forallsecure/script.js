(() => {
  'use strict';
  const scene = document.querySelector('#interactive-study');
  if (!scene) return;

  const byId = id => document.getElementById(id);
  const stageButtons = [...document.querySelectorAll('[data-stage-select]')];
  const branchButtons = [...document.querySelectorAll('[data-branch-select]')];
  const packet = byId('packet');
  const halo = byId('packet-halo');
  const routes = { a: byId('route-a'), b: byId('route-b'), c: byId('route-c') };
  const lengths = Object.fromEntries(Object.entries(routes).map(([key, route]) => [key, route.getTotalLength()]));
  const isReduced = () => window.nmMotion ? window.nmMotion.isReduced() : document.documentElement.dataset.motion !== 'full';
  const stages = ['explore', 'find', 'replay'];
  const branchCopy = {
    a: { title: 'Start with the expected.', description: 'A routine input follows a familiar path. It gives the story a starting point.', input: '“Hello, world”', result: 'Expected response', icon: '✓', takeaway: 'Make the starting point clear before the story gets interesting.' },
    b: { title: 'Ask a different question.', description: 'Remove the message. This path handles the missing input and returns a clear response.', input: '“”', result: 'Empty input handled', icon: '✓', takeaway: 'A different path can still lead to an expected outcome.' },
    c: { title: 'Follow the outlier.', description: 'An oversized input reaches an unexpected response in this illustration. Now there is a path to investigate.', input: '“A…” × 256', result: 'Unexpected response', icon: '!', takeaway: 'The contrast points to a question worth investigating, not a security verdict.' }
  };
  let stage = 'explore';
  let branch = 'a';
  let automatic = true;
  let storyTime = 0;
  let pathTime = 900;
  let lastFrame = null;
  let frameId = null;
  let arrived = false;
  let visible = true;
  const duration = 24000;
  const traversal = 2600;
  const pathCycle = 3700;

  function updateText() {
    const copy = branchCopy[branch];
    const replay = stage === 'replay';
    const finding = stage === 'find';
    byId('detail-step').textContent = `${String(stages.indexOf(stage) + 1).padStart(2, '0')} / ${stage.toUpperCase()}`;
    byId('detail-mode').textContent = replay ? 'Same input' : `Example ${branch.toUpperCase()}`;
    byId('detail-title').textContent = replay ? 'Make it reproducible.' : finding ? 'One path changes the story.' : copy.title;
    byId('detail-description').textContent = replay ? 'Send the same illustrative input down the same path. The repeated result connects cause and effect in the story.' : finding ? 'The oversized input reveals an unexpected response. A small visual change brings the important moment into focus.' : copy.description;
    byId('input-value').textContent = copy.input;
    byId('result-title').textContent = replay ? 'Same response, same path' : copy.result;
    byId('result-icon').textContent = replay ? '=' : copy.icon;
    byId('detail-takeaway').textContent = replay ? 'Repetition turns a surprising moment into an understandable sequence.' : finding ? 'A single coral accent makes the finding easy to follow.' : copy.takeaway;
    byId('map-caption').textContent = replay ? 'The same input. The same unexpected path.' : finding ? 'A different outcome comes into focus.' : 'A small change. A different path.';
    byId('outcome-label').textContent = replay ? 'Reproduced' : 'Unexpected';
    scene.dataset.stage = stage;
    scene.dataset.branch = branch;
    scene.dataset.arrived = String(arrived);
    stageButtons.forEach(button => {
      const active = button.dataset.stageSelect === stage;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    branchButtons.forEach(button => {
      const active = button.dataset.branchSelect === branch;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    packet.setAttribute('fill', branch === 'c' ? '#ffd4b7' : '#defff2');
    halo.setAttribute('fill', branch === 'c' ? '#ff9c7b' : '#b8ffe0');
    updatePlayback();
  }

  function updatePlayback() {
    byId('playback-status').textContent = isReduced()
      ? 'Reduced motion · select a stage to explore'
      : automatic ? 'Story playing · select a stage to explore at your own pace' : 'Your exploration · choose a path or replay the story';
  }

  function drawPacket(fraction) {
    const point = routes[branch].getPointAtLength(Math.min(1, Math.max(0, fraction)) * lengths[branch]);
    for (const element of [packet, halo]) {
      element.setAttribute('cx', point.x.toFixed(2));
      element.setAttribute('cy', point.y.toFixed(2));
    }
  }

  function select(nextStage, nextBranch, manual = false) {
    stage = nextStage;
    branch = nextBranch;
    pathTime = isReduced() ? traversal : 0;
    arrived = isReduced();
    if (manual) {
      automatic = false;
      storyTime = stages.indexOf(stage) * 8000;
    }
    updateText();
    drawPacket(isReduced() ? 1 : 0);
    updateProgress();
    if (manual) byId('story-announcement').textContent = `${stage[0].toUpperCase() + stage.slice(1)}. ${byId('detail-title').textContent} ${byId('result-title').textContent}.`;
  }

  function updateProgress() {
    byId('story-progress-bar').style.width = `${automatic ? Math.max(4, storyTime / duration * 100) : (stages.indexOf(stage) + 1) / 3 * 100}%`;
  }

  function tick(timestamp) {
    frameId = null;
    if (isReduced() || document.hidden || !visible) { lastFrame = null; return; }
    const delta = lastFrame === null ? 0 : Math.min(70, timestamp - lastFrame);
    lastFrame = timestamp;
    pathTime += delta;
    if (automatic) {
      storyTime = (storyTime + delta) % duration;
      const nextStage = storyTime < 8000 ? 'explore' : storyTime < 16000 ? 'find' : 'replay';
      const nextBranch = nextStage === 'explore' ? (storyTime < 4000 ? 'a' : 'b') : 'c';
      if (stage !== nextStage || branch !== nextBranch) select(nextStage, nextBranch);
    }
    const localTime = pathTime % pathCycle;
    const fraction = Math.min(1, localTime / traversal);
    const didArrive = fraction === 1;
    if (didArrive !== arrived) { arrived = didArrive; scene.dataset.arrived = String(arrived); }
    drawPacket(fraction);
    updateProgress();
    frameId = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    updatePlayback();
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastFrame = null;
    if (!isReduced() && !document.hidden && visible) frameId = requestAnimationFrame(tick);
  }

  stageButtons.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.stageSelect;
    select(selected, selected === 'explore' ? 'a' : 'c', true);
  }));
  branchButtons.forEach(button => button.addEventListener('click', () => select('explore', button.dataset.branchSelect, true)));
  byId('replay-story').addEventListener('click', () => {
    automatic = true;
    storyTime = 0;
    select('explore', 'a');
    byId('story-announcement').textContent = isReduced() ? 'Story reset to Explore. Select each stage to explore with reduced motion.' : 'Story restarted. Explore, find, then replay.';
    syncPlayback();
  });
  document.addEventListener('motionchange', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }, { rootMargin: '140px' }).observe(scene);
  }
  updateText();
  drawPacket(isReduced() ? .53 : pathTime / traversal);
  syncPlayback();
})();
