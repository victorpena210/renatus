/* A v2 marker means the form endpoint accepted the POST, not just a click. */
(function () {
  const PREFIX = 'renatus:accepted-lead:v2:';
  const WINDOW_MS = 10 * 60 * 1000;
  const trackedForms = new Set(['contact', 'routepulse-early-access', 'website-cost-review']);
  const sending = new WeakSet();

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !trackedForms.has(form.dataset.gaLeadForm)) return;
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (sending.has(form) || !form.reportValidity()) return;
    const destination = new URL(form.getAttribute('action'), window.location.href);
    if (destination.origin !== window.location.origin) return;
    const formName = form.dataset.gaLeadForm;
    const key = PREFIX + formName;
    try { sessionStorage.removeItem(key); } catch {}
    const honeypot = form.elements.namedItem(form.getAttribute('data-netlify-honeypot') || 'bot-field');
    if (honeypot?.value) return;
    sending.add(form);
    const buttons = [...form.querySelectorAll('button[type="submit"], input[type="submit"]')];
    buttons.forEach(button => { button.disabled = true; });
    let message = form.querySelector('[data-submit-status]');
    if (!message) {
      message = document.createElement('p');
      message.dataset.submitStatus = '';
      message.setAttribute('role', 'status');
      message.setAttribute('aria-live', 'polite');
      form.appendChild(message);
    }
    message.textContent = 'Sending…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
        credentials: 'same-origin',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission was not accepted');
      try { sessionStorage.setItem(key, String(Date.now())); } catch {}
      window.location.assign(destination.href);
    } catch {
      message.textContent = 'Your request could not be confirmed. Your details are still here. Please try again or email victor@renatus.technology. After a timeout, check before resending to avoid a duplicate.';
      sending.delete(form);
      buttons.forEach(button => { button.disabled = false; });
    } finally { clearTimeout(timeout); }
  });

  function trackConfirmedLead() {
    const formName = document.body.dataset.gaConfirmLead;
    if (!trackedForms.has(formName)) return;
    let acceptedAt = 0;
    try {
      acceptedAt = Number(sessionStorage.getItem(PREFIX + formName));
      sessionStorage.removeItem(PREFIX + formName);
      sessionStorage.removeItem('renatus:pending-lead:' + formName);
    } catch { return; }
    const elapsed = Date.now() - acceptedAt;
    if (!(acceptedAt > 0 && elapsed >= 0 && elapsed <= WINDOW_MS)) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', {
      form_name: formName,
      lead_source: document.body.dataset.gaLeadSource || 'Website form'
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackConfirmedLead);
  else trackConfirmedLead();
})();
