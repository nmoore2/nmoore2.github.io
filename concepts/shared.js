(() => {
  const concepts = [['working-partner','The Working Partner'],['product-story-lab','The Product Story Lab'],['evidence-edit','The Evidence Edit'],['creative-workbench','The Creative Workbench'],['launch-sequence','The Launch Sequence']];
  const active = Math.max(0, concepts.findIndex(([slug]) => location.pathname.includes('/'+slug+'/')));
  const holder = document.querySelector('[data-concept-bar]');
  if (holder) {
    holder.innerHTML = `<aside class="nm-preview" aria-label="Design preview controls"><div class="nm-preview-label"><a href="../index.html">← All concepts</a><span>DESIGN STUDY · ${String(active+1).padStart(2,'0')} / 05</span></div><div class="nm-preview-actions"><a class="nm-prev" href="../${concepts[(active+4)%5][0]}/index.html" aria-label="Previous concept">←</a><label><span class="nm-sr-only" style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden">Choose concept</span><select aria-label="Choose a design concept">${concepts.map(([slug,title],i)=>`<option value="${slug}" ${i===active?'selected':''}>${title}</option>`).join('')}</select></label><a class="nm-next" href="../${concepts[(active+1)%5][0]}/index.html" aria-label="Next concept">→</a><button type="button" data-motion-toggle aria-pressed="false">Pause motion</button></div></aside>`;
    holder.querySelector('select').addEventListener('change', e => { location.href='../'+e.target.value+'/index.html'; });
  }
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let manual = null;
  try { manual = localStorage.getItem('nm-motion'); } catch {}
  function apply() {
    const reduced = manual === 'full' ? false : manual === 'reduced' ? true : preference.matches;
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    const button=document.querySelector('[data-motion-toggle]');
    if(button){button.textContent=reduced?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(reduced));button.disabled=false;button.title=reduced?'Play animations':'Pause animations';}
    document.dispatchEvent(new CustomEvent('motionchange',{detail:{reduced}}));
  }
  function setMotion(value) {
    manual = value === 'full' ? 'full' : 'reduced';
    try { localStorage.setItem('nm-motion', manual); } catch {}
    apply();
  }
  function toggleMotion() {
    setMotion(document.documentElement.dataset.motion === 'reduced' ? 'full' : 'reduced');
  }
  window.nmMotion = { set: setMotion, toggle: toggleMotion };
  document.querySelector('[data-motion-toggle]')?.addEventListener('click', toggleMotion);
  preference.addEventListener('change',apply);
  apply();
})();
