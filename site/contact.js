(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  // Keep unconfigured submissions disabled, while showing the requested layout.
  if (!form.elements.access_key.value.trim()) {
    form.addEventListener('submit', event => event.preventDefault());
    return;
  }
  form.querySelector('#contact-inputs').disabled = false;
  form.querySelector('button[type="submit"]').disabled = false;
  form.querySelector('button[type="submit"]').textContent = 'Send inquiry';
  document.querySelector('#contact-availability').hidden = true;
  const captchaScript = document.createElement('script');
  captchaScript.src = 'https://web3forms.com/client/script.js';
  captchaScript.async = true;
  document.head.append(captchaScript);
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#contact-status');
  let pending = false;
  const report = (message, state) => {
    status.textContent = message;
    status.dataset.state = state;
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const data = new FormData(form);
    if (!String(data.get('access_key') || '').trim()) {
      report('Please use the LinkedIn contact link while the form is being connected.', 'error');
      return;
    }
    if (!data.get('h-captcha-response')) {
      report('Please complete the verification above. If it is unavailable, use the LinkedIn contact link.', 'error');
      return;
    }
    pending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    report('Sending your inquiry…', 'pending');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Submission rejected');
      form.reset();
      report('Thanks! Your inquiry has been sent. I’ll reply to the email address you provided.', 'success');
    } catch (error) {
      report(error.name === 'AbortError'
        ? 'The connection timed out, so I couldn’t confirm delivery. Your details are still here. You can retry or use the LinkedIn contact link.'
        : 'I couldn’t confirm delivery. Your details are still here. Please complete verification again and retry, or use the LinkedIn contact link.', 'error');
    } finally {
      clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      button.textContent = 'Send inquiry';
      form.removeAttribute('aria-busy');
      if (window.hcaptcha) window.hcaptcha.reset();
    }
  });
})();
