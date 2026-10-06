(() => {
  const links = [...document.querySelectorAll('[data-gallery]')];
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
