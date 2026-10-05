(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const stageButtons = [...document.querySelectorAll('[data-stage-button]')];
  const stages = [
    { total: 0, day: 'Day 01', status: 'Free trial', label: 'Due during your trial', plan: '$49.00', addon: '—', credit: '−$49.00', footer: 'Your next chapter starts here.', icon: '✦', event: 'A little room to explore', eventSub: '14-DAY TRIAL STARTED', description: 'Try the experience. The first chapter is on us.' },
    { total: 49, day: 'Day 14', status: 'Active', label: 'Your monthly invoice', plan: '$49.00', addon: '—', credit: '—', footer: 'Subscription active. You’re all set.', icon: '✓', event: 'Welcome aboard', eventSub: 'STUDIO PLAN ACTIVATED', description: 'From trying it out to making it part of the day.' },
    { total: 89, day: 'Day 21', status: 'Upgraded', label: 'Your next invoice', plan: '$49.00', addon: '$40.00', credit: '—', footer: 'Plan updated. Everything in sync.', icon: '↗', event: 'Room to grow', eventSub: 'TEAM ADD-ON ACTIVATED', description: 'A growing team. One seamless plan change.' },
    { total: 89, day: 'Day 44', status: 'Renewed', label: 'Your renewed subscription', plan: '$49.00', addon: '$40.00', credit: '—', footer: 'Payment received. Keep creating.', icon: '↻', event: 'And the story continues', eventSub: 'MONTHLY RENEWAL COMPLETE', description: 'The next month begins. No extra steps needed.' }
  ];

  let stage = 2;
  let elapsed = 0;
  let previousTime = null;
  let frame = null;
  let reduced = window.nmMotion ? window.nmMotion.isReduced() : true;
  let sceneVisible = true;
  let displayedTotal = 89;
  let countFrom = 89;
  let countTarget = 89;
  let countElapsed = 850;
  const cycleDuration = 5800;

  function renderStage(index, announce = false) {
    stage = index;
    const value = stages[index];
    $('.rc-billing').dataset.stage = index;
    $('#stage-counter').textContent = `${String(index + 1).padStart(2, '0')} / 04`;
    $('#invoice-status').textContent = value.status;
    $('#total-label').textContent = value.label;
    $('#invoice-date').textContent = value.day;
    $('#plan-amount').textContent = value.plan;
    $('#addon-amount').textContent = value.addon;
    $('#credit-amount').textContent = value.credit;
    $('#addon-row').classList.toggle('is-muted', index < 2);
    $('#credit-row').classList.toggle('is-muted', index !== 0);
    $('#invoice-footnote').textContent = value.footer;
    $('#event-icon').textContent = value.icon;
    $('#event-label').replaceChildren(document.createTextNode(value.event));
    const small = document.createElement('small');
    small.textContent = value.eventSub;
    $('#event-label').append(small);
    $('#stage-description').textContent = value.description;
    $('#timeline-progress').style.width = `${index / 3 * 100}%`;
    stageButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('is-active', buttonIndex === index);
      button.classList.toggle('is-complete', buttonIndex < index);
      button.setAttribute('aria-pressed', String(buttonIndex === index));
    });
    countFrom = displayedTotal;
    countTarget = value.total;
    countElapsed = reduced ? 850 : 0;
    if (reduced) {
      displayedTotal = value.total;
      $('#invoice-total').textContent = value.total;
    }
    if (announce) $('#stage-announcement').textContent = `${value.status}. ${value.label}: $${value.total}. ${value.description}`;
  }

  function tick(now) {
    frame = null;
    if (reduced || document.hidden || !sceneVisible) { previousTime = null; return; }
    const delta = previousTime === null ? 0 : Math.min(now - previousTime, 100);
    previousTime = now;
    elapsed += delta;
    if (elapsed >= cycleDuration) {
      elapsed = 0;
      renderStage((stage + 1) % stages.length);
    }
    if (countElapsed < 850) {
      countElapsed = Math.min(850, countElapsed + delta);
      const fraction = 1 - Math.pow(1 - countElapsed / 850, 3);
      displayedTotal = Math.round(countFrom + (countTarget - countFrom) * fraction);
      $('#invoice-total').textContent = displayedTotal;
    }
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    previousTime = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (!reduced && !document.hidden && sceneVisible) frame = requestAnimationFrame(tick);
  }

  stageButtons.forEach((button) => button.addEventListener('click', () => {
    elapsed = 0;
    renderStage(Number(button.dataset.stageButton), true);
    syncPlayback();
  }));
  document.addEventListener('motionchange', (event) => {
    reduced = event.detail.reduced;
    if (reduced) {
      displayedTotal = countTarget;
      countElapsed = 850;
      $('#invoice-total').textContent = displayedTotal;
    }
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      sceneVisible = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 }).observe($('.rc-billing'));
  }
  renderStage(stage);
  syncPlayback();

  const chartData = {
    industry: {
      labels: ['Software', 'Media', 'Retail', 'Education'],
      recovery: [54, 47, 38, 61],
      churn: [3.2, 5.8, 6.4, 4.1]
    },
    arpc: {
      labels: ['Under $25', '$25–$50', '$50–$100', '$100+'],
      recovery: [41, 49, 57, 64],
      churn: [7.2, 5.6, 4.3, 3.1]
    }
  };
  let metric = 'recovery';
  let dimension = 'industry';
  let selectedBar = 0;
  const bars = [];

  for (let index = 0; index < 4; index++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rc-chart-bar';
    button.dataset.barIndex = String(index);
    const stack = document.createElement('span');
    stack.className = 'rc-bar-stack';
    const fill = document.createElement('span');
    fill.className = 'rc-bar-fill';
    const value = document.createElement('span');
    value.className = 'rc-bar-value';
    const name = document.createElement('span');
    name.className = 'rc-bar-name';
    fill.append(value);
    stack.append(fill);
    button.append(stack, name);
    button.addEventListener('click', () => { selectedBar = index; renderInsight(); });
    $('#chart-bars').append(button);
    bars.push({ button, fill, value, name });
  }

  function renderInsight() {
    const data = chartData[dimension];
    const value = data[metric][selectedBar];
    $('#insight-label').textContent = data.labels[selectedBar];
    $('#insight-value').textContent = String(value);
    $('#insight-unit').textContent = metric === 'recovery' ? 'of failed payments recovered' : 'of subscribers leave per month';
    $('#insight-description').textContent = metric === 'recovery'
      ? `Of 100 failed payments, ${value} are recovered in this sample group.`
      : `An illustrative monthly churn rate of ${value}% for this sample group.`;
    bars.forEach(({ button }, index) => button.setAttribute('aria-pressed', String(index === selectedBar)));
  }

  function renderChart() {
    const data = chartData[dimension];
    const max = metric === 'recovery' ? 80 : 10;
    $('#chart-heading').textContent = metric === 'recovery' ? 'Recovery, in perspective.' : 'A closer look at churn.';
    $('#chart-unit').textContent = metric === 'recovery' ? 'Recovered payments (%)' : 'Monthly subscriber churn (%)';
    $('#axis-max').textContent = `${max}%`;
    $('#axis-mid').textContent = `${max / 2}%`;
    bars.forEach(({ button, fill, value, name }, index) => {
      const point = data[metric][index];
      fill.style.height = `${point / max * 100}%`;
      value.textContent = `${point}%`;
      name.textContent = data.labels[index];
      button.setAttribute('aria-label', `${data.labels[index]}: ${point}% ${metric === 'recovery' ? 'recovery' : 'monthly churn'}, illustrative data`);
    });
    document.querySelectorAll('[data-metric]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.metric === metric)));
    document.querySelectorAll('[data-dimension]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.dimension === dimension)));
    renderInsight();
  }
  document.querySelectorAll('[data-metric]').forEach((button) => button.addEventListener('click', () => {
    metric = button.dataset.metric;
    renderChart();
  }));
  document.querySelectorAll('[data-dimension]').forEach((button) => button.addEventListener('click', () => {
    dimension = button.dataset.dimension;
    selectedBar = 0;
    renderChart();
  }));
  renderChart();
})();
