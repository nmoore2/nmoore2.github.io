(() => {
  'use strict';
  const comparison = document.querySelector('.comparison');
  if (!comparison) return;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = document.documentElement.dataset.motion ? document.documentElement.dataset.motion === 'reduced' : media.matches;
  let explanation = 'what';
  let state = 'after';
  const animations = new Set();
  const copy = {
    after: {
      headline: ['Know what changed.', 'Decide what comes next.'],
      body: 'Bring your team’s product signals together, so the next step is easier to see.',
      cta: 'See how it works',
      what: ['Lead with the reader’s next step.', 'The headline names a useful outcome. The product visual sits beside it, and the page gives the reader one clear route forward.'],
      why: ['Make the connection easier to see.', 'A reader can connect the promise, the product, and the action without hunting around the page. This is a design rationale, not a measured conversion result.'],
      status: 'After: a clear outcome, connected explanation, and one primary action.'
    },
    before: {
      headline: ['Everything your team needs.'],
      body: 'One powerful platform with features for every part of your workflow.',
      cta: 'Learn more',
      what: ['The pieces are here. The point is harder to find.', 'A broad headline sits above an isolated feature list and product visual. The page describes a platform before giving the reader a reason to care.'],
      why: ['The reader has to do the joining up.', 'When the promise is broad and the explanation is separated, the reader has more work to do. A clearer hierarchy can help answer “Is this useful to me?”'],
      status: 'Before: a broad headline, separated feature list, and a generic action.'
    }
  };
  function updateNote() {
    const note = copy[state][explanation];
    document.querySelector('[data-note-title]').textContent = note[0];
    document.querySelector('[data-note-copy]').textContent = note[1];
    document.querySelectorAll('[data-explanation]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.explanation === explanation)));
  }
  function stopAnimations() { animations.forEach(animation => animation.cancel()); animations.clear(); }
  function setLayout(next) {
    if (next === state) return;
    stopAnimations();
    const blocks = [...comparison.querySelectorAll('.demo-block')];
    const previous = blocks.map(block => block.getBoundingClientRect());
    state = next;
    comparison.dataset.state = state;
    const headline = document.querySelector('[data-demo-headline]');
    headline.replaceChildren();
    copy[state].headline.forEach((line, index) => { if (index) headline.append(document.createElement('br')); headline.append(document.createTextNode(line)); });
    document.querySelector('[data-demo-copy]').textContent = copy[state].body;
    const cta = document.querySelector('[data-demo-cta]');
    cta.replaceChildren(document.createTextNode(copy[state].cta + ' '));
    const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = ''; cta.append(arrow);
    document.querySelectorAll('[data-layout]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === state)));
    updateNote();
    document.querySelector('.comparison-status').textContent = copy[state].status;
    if (reduced || !Element.prototype.animate) return;
    blocks.forEach((block, index) => {
      const nextRect = block.getBoundingClientRect();
      const oldRect = previous[index];
      const animation = block.animate([
        { transform: `translate(${oldRect.left - nextRect.left}px, ${oldRect.top - nextRect.top}px) scale(${oldRect.width / nextRect.width}, ${oldRect.height / nextRect.height})`, opacity: .72 },
        { transform: 'translate(0, 0) scale(1, 1)', opacity: 1 }
      ], { duration: 660, easing: 'cubic-bezier(.22,1,.36,1)' });
      animations.add(animation); animation.onfinish = () => animations.delete(animation);
    });
  }
  document.querySelectorAll('[data-layout]').forEach(button => button.addEventListener('click', () => setLayout(button.dataset.layout)));
  document.querySelectorAll('[data-explanation]').forEach(button => button.addEventListener('click', () => { explanation = button.dataset.explanation; updateNote(); }));
  function updateMotion(value) { reduced = Boolean(value); if (reduced) stopAnimations(); }
  document.addEventListener('motionchange', event => updateMotion(Boolean(event.detail?.reduced)));
  media.addEventListener('change', () => updateMotion(document.documentElement.dataset.motion === 'reduced'));
})();
