(() => {
  const visual = document.querySelector('.launch-visual');
  const buttons = [...document.querySelectorAll('[data-stage-button]')];
  const copy = ['Start with the audience, the promise, and one useful next step.','Give the idea a distinct voice, a responsive layout, and purposeful interaction.','Carry the experience through inquiry, confirmation, and the handoff to your team.','Check the right events, listen to real use, and choose the next improvement.'];
  let stage = 0;
  function selectStage(value) {
    stage = Number(value);
    visual.dataset.stage=String(stage);
    buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
    document.getElementById('stage-copy').textContent=copy[stage];
    document.querySelector('.stage-number').textContent=String(stage+1).padStart(2,'0')+' / 04';
  }
  buttons.forEach(button=>button.addEventListener('click',()=>selectStage(button.dataset.stageButton)));
  document.getElementById('next-stage').addEventListener('click',()=>selectStage((stage+1)%4));
  const steps=[...document.querySelectorAll('[data-process-step]')];
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){steps.forEach(s=>s.classList.toggle('is-active',s===entry.target));}});},{rootMargin:'-25% 0px -35% 0px',threshold:.2});
    steps.forEach(step=>observer.observe(step));
  }
  const content={launch:['A FOCUSED PROJECT','Give the next big thing<br>a proper introduction.','A new product story, campaign page, comparison experience, or interactive tool. A defined scope, clear milestones, and someone who takes it through launch.',['Product and landing pages','Responsive design and development','Forms, integrations, and launch QA'],'Talk through your launch '],ongoing:['A CONTINUING PARTNERSHIP','A website that keeps up<br>with your marketing.','A dependable partner for the requests that keep arriving. One prioritized queue, clear communication, and regular improvements to the experience your customers use.',['Campaign updates and new sections','Search, performance, and conversion improvements','Ongoing QA and concise reporting'],'Talk about ongoing support ']};
  document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-service]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const c=content[button.dataset.service];
    document.getElementById('service-panel').innerHTML=`<div><span class="eyebrow">${c[0]}</span><h3>${c[1]}</h3></div><div><p>${c[2]}</p><ul>${c[3].map(s=>`<li>${s}</li>`).join('')}</ul><a href="#contact">${c[4]}</a></div>`;
  }));
})();
