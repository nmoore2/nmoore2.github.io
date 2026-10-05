(() => {
  const demo = document.querySelector('.process-demo');
  const buttons = [...document.querySelectorAll('[data-stage-select]')];
  const pause = document.querySelector('.pause-demo');
  const description = document.querySelector('.stage-description');
  const note = document.querySelector('.note-bubble-text');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = ['brief', 'sketch', 'build', 'launch'];
  const copy = {
    brief: ['Start with the audience, the priority, and what a good outcome looks like.', 'A good question comes first.'],
    sketch: ['Make the story clear before polishing the details.', 'A shared picture of where we’re going.'],
    build: ['Bring the design to life, with every little detail considered.', 'All the details, connected.'],
    launch: ['Check the journey, share the work, and plan the next improvement.', 'Checked, connected, ready.']
  };
  let current = 2;
  let manuallyPaused = false;
  let timer;
  const isReduced = () => document.documentElement.dataset.motion ? document.documentElement.dataset.motion === 'reduced' : media.matches;
  function show(stage, announce = false) {
    current = stages.indexOf(stage);
    demo.dataset.stage = stage;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stageSelect === stage)));
    description.setAttribute('aria-live', announce ? 'polite' : 'off');
    description.textContent = copy[stage][0];
    note.textContent = copy[stage][1];
  }
  function sync() {
    clearInterval(timer);
    const paused = manuallyPaused || isReduced();
    pause.setAttribute('aria-pressed', String(paused));
    pause.innerHTML = paused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
    pause.disabled = false;
    if (!paused && !document.hidden) timer = setInterval(() => show(stages[(current + 1) % stages.length]), 4800);
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    manuallyPaused = true;
    show(button.dataset.stageSelect, true);
    sync();
  }));
  pause.addEventListener('click', () => window.nmMotion.set(manuallyPaused || isReduced() ? 'full' : 'reduced'));
  media.addEventListener('change', sync);
  document.addEventListener('motionchange', event => { if (!event.detail.reduced) manuallyPaused = false; sync(); });
  document.addEventListener('visibilitychange', sync);
  sync();

  const projects = {
    recurly: { image: '../../assets/recurly/subscription-page.jpg', alt: "Recurly's Annual Subscription Billing Metrics Report website", category: 'Research experience / UI development', description: 'Detailed UI development, animated charts, graphs, and maps, plus thoughtful mobile layouts.', link: '../../assets/recurly/subscription-page.jpg', name: 'Recurly' },
    fwi: { image: '../../assets/fwi/fwi-01.jpg', alt: 'Four Winds Interactive enterprise product website', category: 'Enterprise software / Development', description: 'Website development in close collaboration with designers, presenting a wide range of digital signage products.', link: 'https://www.fourwindsinteractive.com/', name: 'Four Winds Interactive' },
    mathews: { image: '../../assets/mathews/mathews-home.jpg', alt: 'Mathews website with outdoor imagery and product presentation', category: 'Brand experience / Development', description: 'Working alongside the design team to translate a carefully crafted outdoor brand into a detailed website.', link: 'https://mathewsinc.com/', name: 'Mathews' }
  };
  const rows = [...document.querySelectorAll('[data-project]')];
  const preview = document.querySelector('.project-preview');
  let selected = 'recurly';
  function previewProject(key) {
    if (selected === key) return;
    selected = key;
    const project = projects[key];
    preview.dataset.preview = key;
    const image = document.getElementById('project-image');
    image.src = project.image;
    image.alt = project.alt;
    document.getElementById('project-category').textContent = project.category;
    document.getElementById('project-description').textContent = project.description;
    const link = document.getElementById('project-link');
    link.href = project.link;
    link.setAttribute('aria-label', key === 'recurly' ? 'View archived Recurly project image' : `Visit ${project.name} project`);
    rows.forEach(row => {
      const active = row.dataset.project === key;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-pressed', String(active));
    });
  }
  rows.forEach(row => {
    row.addEventListener('click', () => previewProject(row.dataset.project));
    row.addEventListener('focus', () => previewProject(row.dataset.project));
    row.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') previewProject(row.dataset.project); });
  });
})();
