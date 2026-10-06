(() => {
  const links = [...document.querySelectorAll('[data-gallery]')];
  const gallery = document.querySelector('.archive-gallery');
  if (gallery && links.length) {
    const slides = [...gallery.querySelectorAll('.archive-frame')];
    let current = 0;
    let animation;
    const region = document.createElement('section');
    region.className = 'archive-carousel';
    region.setAttribute('aria-label', 'Project images');
    region.setAttribute('aria-roledescription', 'carousel');
    gallery.before(region);
    region.append(gallery);
    gallery.classList.add('carousel-slides');
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = '<button type="button" data-slide-prev aria-label="Previous image">Previous</button><p class="carousel-status" role="status" aria-live="polite"></p><button type="button" data-slide-next aria-label="Next image">Next</button>';
    const choices = document.createElement('div');
    choices.className = 'carousel-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Choose an image');
    const buttons = slides.map((slide, i) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(i + 1).padStart(2, '0');
      button.setAttribute('aria-label', `Show image ${i + 1}: ${links[i].dataset.caption}`);
      button.addEventListener('click', () => select(i));
      choices.append(button);
      return button;
    });
    region.append(controls, choices);
    const reduced = () => window.nmMotion ? window.nmMotion.isReduced() : matchMedia('(prefers-reduced-motion: reduce)').matches;
    function select(next, animate = true) {
      if (animation) animation.cancel();
      current = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.hidden = i !== current;
        buttons[i].setAttribute('aria-pressed', String(i === current));
      });
      controls.querySelector('.carousel-status').textContent = `${current + 1} / ${slides.length}`;
      slides[current].querySelector('img').loading = 'eager';
      if (animate && !reduced()) animation = slides[current].animate([{opacity: .3}, {opacity: 1}], {duration: 220, easing: 'ease-out'});
    }
    controls.querySelector('[data-slide-prev]').addEventListener('click', () => select(current - 1));
    controls.querySelector('[data-slide-next]').addEventListener('click', () => select(current + 1));
    region.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1);
      // Keep keyboard focus out of a slide that is about to become hidden.
      if (gallery.contains(document.activeElement)) controls.querySelector('[data-slide-next]').focus();
      select(next);
    });
    document.addEventListener('motionchange', () => { if (reduced() && animation) animation.cancel(); });
    select(0, false);
  }
  const dialog = document.querySelector('.lightbox');
  if (!links.length || !dialog || !dialog.showModal) return;
  let index = 0;
  const image = dialog.querySelector('[data-image-view]');
  function show(next) {
    index = (next + links.length) % links.length;
    const link = links[index];
    image.src = link.href;
    image.alt = link.dataset.caption;
    dialog.querySelector('[data-image-caption]').textContent = `${index + 1} / ${links.length} · ${link.dataset.caption}`;
    dialog.querySelector('[data-original]').href = link.href;
  }
  links.forEach((link, i) => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();show(i);dialog.showModal();
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {event.preventDefault();show(index + 1);}
    if (event.key === 'ArrowLeft') {event.preventDefault();show(index - 1);}
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
