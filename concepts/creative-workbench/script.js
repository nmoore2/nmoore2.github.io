(() => {
  'use strict';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = media.matches || document.documentElement.dataset.motion === 'reduced';
  const desk = document.querySelector('.desk');
  const cards = [...document.querySelectorAll('[data-project]')];
  const benchStatus = document.querySelector('[data-bench-status]');
  const projects = {
    baz: { index: '01', title: 'Baz — a clearer product story.', copy: 'Comparison pages, lead capture, and exploratory motion for a technical product.', link: '#baz', name: 'Baz' },
    recurly: { index: '02', title: 'Recurly — information, in motion.', copy: 'Detailed UI, animated charts, graphs, and maps, with thoughtful mobile layouts.', link: '#recurly', name: 'Recurly' },
    ideaison: { index: '03', title: 'Ideaison — a little room to play.', copy: 'Design, development, and a custom homepage painting interaction for a creative studio.', link: '#ideaison', name: 'Ideaison' }
  };
  let selected = 'baz';
  function selectProject(key) {
    selected = key;
    const project = projects[key];
    cards.forEach(card => card.setAttribute('aria-pressed', String(card.dataset.project === key)));
    document.querySelector('[data-preview-index]').textContent = project.index;
    document.querySelector('[data-preview-title]').textContent = project.title;
    document.querySelector('[data-preview-copy]').textContent = project.copy;
    const link = document.querySelector('[data-preview-link]');
    link.href = project.link;
    link.setAttribute('aria-label', `Explore ${project.name} project`);
    benchStatus.textContent = `${project.name} selected. ${project.copy}`;
  }
  let drag = null;
  let suppressClick = null;
  const offsets = new Map(cards.map(card => [card, { x: 0, y: 0 }]));
  cards.forEach(card => {
    card.addEventListener('click', event => {
      if (suppressClick === card) { event.preventDefault(); suppressClick = null; return; }
      selectProject(card.dataset.project);
    });
    card.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const existing = offsets.get(card);
      drag = { card, pointerId: event.pointerId, originX: event.clientX, originY: event.clientY, x: existing.x, y: existing.y, moved: false };
      card.setPointerCapture(event.pointerId);
    });
    card.addEventListener('pointermove', event => {
      if (!drag || drag.card !== card || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.originX;
      const dy = event.clientY - drag.originY;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      if (!drag.moved) {
        const activeTransform = getComputedStyle(card).transform;
        if (activeTransform !== 'none' && desk.classList.contains('is-tidy')) {
          const matrix = new DOMMatrixReadOnly(activeTransform);
          drag.x = matrix.m41; drag.y = matrix.m42;
        }
        drag.moved = true;
        card.classList.add('dragging');
        selectProject(card.dataset.project);
      }
      const x = Math.max(-card.offsetLeft + 8, Math.min(desk.clientWidth - card.offsetLeft - card.offsetWidth - 8, drag.x + dx));
      const y = Math.max(-card.offsetTop + 12, Math.min(desk.clientHeight - card.offsetTop - card.offsetHeight - 12, drag.y + dy));
      offsets.set(card, { x, y });
      card.style.setProperty('--drag-x', `${x}px`);
      card.style.setProperty('--drag-y', `${y}px`);
    });
    function endDrag(event) {
      if (!drag || drag.card !== card || drag.pointerId !== event.pointerId) return;
      if (drag.moved) { suppressClick = card; window.setTimeout(() => { if (suppressClick === card) suppressClick = null; }, 250); }
      card.classList.remove('dragging');
      if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
      drag = null;
    }
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
  });
  const arrange = document.querySelector('[data-arrange]');
  arrange.addEventListener('click', () => {
    const tidy = desk.classList.toggle('is-tidy');
    cards.forEach(card => { offsets.set(card, { x: 0, y: 0 }); card.style.removeProperty('--drag-x'); card.style.removeProperty('--drag-y'); });
    arrange.replaceChildren(document.createTextNode(tidy ? 'Mix it up ' : 'Tidy up '));
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = tidy ? '↝' : '▦'; arrange.append(icon);
    benchStatus.textContent = tidy ? 'Project cards arranged neatly.' : 'Project cards returned to their original composition.';
  });
  const resizeObserver = new ResizeObserver(() => {
    if (drag) return;
    cards.forEach(card => { offsets.set(card, { x: 0, y: 0 }); card.style.removeProperty('--drag-x'); card.style.removeProperty('--drag-y'); });
  });
  resizeObserver.observe(desk);

  const path = document.querySelector('#feedback-path');
  const packet = document.querySelector('.loop-packet');
  const scene = document.querySelector('.loop-scene');
  const play = document.querySelector('[data-play-loop]');
  const caption = document.querySelector('[data-loop-caption]');
  const loopStatus = document.querySelector('[data-loop-status]');
  const nodes = [...document.querySelectorAll('.loop-node')];
  const pathLength = path.getTotalLength();
  path.style.strokeDasharray = String(pathLength);
  path.style.strokeDashoffset = String(pathLength);
  let frame = 0;
  let running = false;
  const captions = ['A change is just the beginning.', 'A review adds context.', 'Feedback becomes learning.', 'Bring that learning to the next change.'];
  function setPlayLabel(text, symbol) {
    play.replaceChildren(document.createTextNode(text + ' '));
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = symbol; play.append(icon);
  }
  function drawProgress(progress) {
    const point = path.getPointAtLength(pathLength * progress);
    packet.setAttribute('cx', point.x); packet.setAttribute('cy', point.y);
    path.style.strokeDashoffset = String(pathLength * (1 - progress));
    const step = progress < .18 ? 0 : progress < .36 ? 1 : progress < .68 ? 2 : 3;
    nodes.forEach((node, index) => node.classList.toggle('is-current', index === step));
    caption.textContent = captions[step];
  }
  function finishLoop() {
    cancelAnimationFrame(frame); running = false;
    drawProgress(1); scene.classList.add('is-complete');
    setPlayLabel('Replay the idea', '↻');
    loopStatus.textContent = 'The loop is complete: a change, a contextual review, learning, and the next iteration.';
  }
  play.addEventListener('click', () => {
    if (running) { finishLoop(); return; }
    scene.classList.remove('is-complete');
    if (reduced) { finishLoop(); return; }
    running = true;
    setPlayLabel('Finish the idea', '→');
    loopStatus.textContent = 'Following a change through review and learning.';
    const started = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - started) / 4500);
      drawProgress(progress);
      if (progress === 1) finishLoop(); else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  });
  const entranceAnimations = [];
  if (!reduced && Element.prototype.animate) {
    cards.forEach((card, index) => {
      const end = getComputedStyle(card).transform;
      entranceAnimations.push(card.animate([{ opacity: .35, transform: `${end} translateY(22px)` }, { opacity: 1, transform: end }], { duration: 700, delay: 90 * index, easing: 'cubic-bezier(.22,1,.36,1)' }));
    });
  }
  function updateMotion(value) {
    reduced = value || media.matches;
    if (reduced) { entranceAnimations.forEach(animation => animation.cancel()); if (running) finishLoop(); }
  }
  document.addEventListener('motionchange', event => updateMotion(Boolean(event.detail?.reduced)));
  media.addEventListener('change', () => updateMotion(document.documentElement.dataset.motion === 'reduced'));
})();
