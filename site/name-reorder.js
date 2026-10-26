(() => {
  const grab = document.querySelector('.grab');
  if (!grab) return;
  const reset = document.querySelector('#reset-name');
  const status = document.querySelector('#name-status');
  const original = [...grab.textContent.replace(/\.$/, '')].map((letter, i) => {
    const element = document.createElement('b');
    element.textContent = letter;
    element.tabIndex = 0;
    element.setAttribute('role', 'button');
    element.dataset.letter = i;
    return element;
  });
  const period = document.createElement('span');
  period.textContent = '.';
  grab.replaceChildren(...original, period);
  let active = null;
  const letters = () => [...grab.querySelectorAll('b')];
  const reduced = () => document.documentElement.dataset.motion === 'reduced' ||
    (!document.documentElement.dataset.motion && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function update(announce = true) {
    const order = letters();
    reset.hidden = order.every((letter, i) => letter === original[i]);
    order.forEach((letter, i) => letter.setAttribute('aria-label', `${letter.textContent}, position ${i + 1} of ${order.length}. Use left or right to move.`));
    if (announce) status.textContent = `Name arranged as ${order.map(letter => letter.textContent).join('')}.`;
  }
  function move(element, position) {
    const remaining = letters().filter(letter => letter !== element);
    const previous = new Map(letters().map(letter => [letter, letter.getBoundingClientRect()]));
    element.style.translate = '';
    grab.insertBefore(element, remaining[position] || period);
    if (!reduced()) for (const letter of letters()) {
      const before = previous.get(letter), after = letter.getBoundingClientRect();
      letter.animate([{ transform: `translate(${before.x - after.x}px,${before.y - after.y}px)` }, { transform: 'translate(0,0)' }], { duration: 200, easing: 'ease-out' });
    }
    update();
  }
  function finish(cancel = false) {
    if (!active) return;
    const { element, start, centerX, moved, pointerId } = active;
    active = null;
    if (cancel || !moved) element.style.translate = '';
    else {
      // Measure untouched slots, not translated letters, to avoid a moving target.
      const position = start.filter(slot => slot.element !== element && centerX > slot.center).length;
      move(element, position);
    }
    element.style.zIndex = '';
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
  }
  for (const element of original) {
    element.addEventListener('pointerdown', event => {
      if (active || !event.isPrimary || event.button !== 0) return;
      for (const letter of letters()) letter.getAnimations().forEach(animation => animation.cancel());
      const rect = element.getBoundingClientRect();
      active = { element, pointerId: event.pointerId, x: event.clientX, y: event.clientY, centerX: rect.x + rect.width / 2, origin: rect.x + rect.width / 2, moved: false, start: letters().map(letter => { const r = letter.getBoundingClientRect(); return {element: letter, center: r.x + r.width / 2}; }) };
      element.setPointerCapture(event.pointerId);
      element.style.zIndex = '2';
    });
    element.addEventListener('pointermove', event => {
      if (!active || active.element !== element || event.pointerId !== active.pointerId) return;
      const dx = event.clientX - active.x, dy = event.clientY - active.y;
      active.moved ||= Math.hypot(dx, dy) > 4;
      active.centerX = active.origin + dx;
      element.style.translate = `${dx}px ${Math.max(-80, Math.min(80, dy))}px`;
    });
    element.addEventListener('pointerup', () => finish());
    element.addEventListener('pointercancel', () => finish(true));
    element.addEventListener('lostpointercapture', () => finish(true));
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { finish(true); return; }
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      finish(true);
      const position = letters().indexOf(element) + (event.key === 'ArrowRight' ? 1 : -1);
      if (position >= 0 && position < original.length) { move(element, position); element.focus({preventScroll: true}); }
    });
  }
  reset.addEventListener('click', () => {
    finish(true);
    original.forEach(element => {element.getAnimations().forEach(a => a.cancel()); element.style.translate = ''; grab.insertBefore(element, period);});
    update();
    original[0].focus({preventScroll: true});
  });
  document.addEventListener('motionchange', () => { if (reduced()) letters().forEach(letter => letter.getAnimations().forEach(a => a.cancel())); });
  update(false);
})();
