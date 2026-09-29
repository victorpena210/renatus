import { evaluateCost, money, serviceLabels } from './website-cost-model.mjs';

const form = document.querySelector('#cost-questionnaire');
const review = document.querySelector('#cost-review-form');
const steps = [...document.querySelectorAll('.cost-step')];
const progress = [...document.querySelectorAll('.cost-progress li')];
const byId = id => document.getElementById(id);
let step = 0;
let started = false;
let result = null;
let submitting = false;

// Only fixed event names and step numbers are sent to analytics. Never send
// costs, free text, website URLs, names, emails, or phone numbers to GA.
function track(name, details = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, { tool_name: 'website_cost_check', ...details });
}
function focusAt(id) {
  const element = byId(id);
  element.focus({ preventScroll: true });
  element.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
}
function showStep(next) {
  step = next;
  steps.forEach((section, i) => { section.hidden = i !== step; });
  progress.forEach((item, i) => {
    if (i === step) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  byId('cost-back').hidden = step === 0;
  byId('cost-next').textContent = step === 2 ? 'See my results' : 'Continue';
  byId('checker-error').hidden = true;
  focusAt(steps[step].querySelector('h3').id);
}
function syncConditionalFields() {
  const unknown = byId('cost-unknown').checked;
  byId('current-amount').disabled = unknown;
  byId('current-amount').required = !unknown;
  byId('billing-period').disabled = unknown;
  const extras = byId('extras-status').value === 'known';
  byId('extras-fields').hidden = !extras;
  byId('extras-amount').disabled = !extras;
  byId('extras-amount').required = extras;
  byId('extras-period').disabled = !extras;
  const seo = form.querySelector('[name="services"][value="seo"]').checked;
  byId('seo-evidence-field').hidden = !seo;
  byId('seo-evidence').disabled = !seo;
  byId('seo-evidence').required = seo;
}
form.addEventListener('change', event => {
  if (event.target.name === 'services') {
    const checkbox = event.target;
    if (checkbox.checked) {
      if (checkbox.value === 'unknown') {
        form.querySelectorAll('[name="services"]:checked').forEach(input => { if (input !== checkbox) input.checked = false; });
      } else form.querySelector('[name="services"][value="unknown"]').checked = false;
    }
    byId('services-error').hidden = true;
  }
  syncConditionalFields();
});
form.addEventListener('input', () => {
  if (!started) { track('website_cost_check_start'); started = true; }
});
function validateStep() {
  for (const control of steps[step].querySelectorAll('input, select')) {
    if (!control.disabled && !control.checkValidity()) {
      control.reportValidity();
      return false;
    }
  }
  if (step === 1 && !form.querySelector('[name="services"]:checked')) {
    byId('services-error').hidden = false;
    form.querySelector('[name="services"]').focus();
    return false;
  }
  return true;
}
function getAnswers() {
  const data = new FormData(form);
  return { ...Object.fromEntries(data), costUnknown: byId('cost-unknown').checked, services: data.getAll('services') };
}
function selectedText(name) {
  const field = form.elements.namedItem(name);
  return field?.selectedOptions?.[0]?.textContent || 'Not provided';
}
function summaryText(answers, assessment) {
  const summary = [
    'RENATUS WEBSITE COST CHECK — v1',
    `Date: ${new Date().toLocaleDateString('en-US')}`,
    `Result: ${assessment.title}`,
    `Main payment: ${answers.costUnknown ? 'Unknown' : money(Number(answers.amount)) + ' / ' + answers.period}`,
    `Additional charges: ${answers.extrasStatus === 'none' ? 'None' : answers.extrasStatus === 'known' ? money(Number(answers.extras)) + ' / ' + answers.extrasPeriod : 'Unknown'}`,
    `Annual recurring estimate: ${assessment.annual === null ? 'Incomplete — known charges total ' + money(assessment.knownAnnual) + ' annually' : money(assessment.annual)}`,
    `Monthly equivalent: ${assessment.monthly === null ? 'Incomplete' : money(assessment.monthly)}`,
    `Original setup payment: ${answers.setupPaid === '' ? 'Not provided' : money(Number(answers.setupPaid))} (separate from recurring estimate)`,
    `Remaining commitment: ${selectedText('commitment')}`,
    `Services: ${answers.services.map(s => serviceLabels[s]).join(', ')}`,
    `Website type: ${selectedText('siteType')}`,
    `Pages: ${selectedText('pages')}`,
    `Can edit: ${selectedText('editAccess')}`,
    `Domain control: ${selectedText('domain')}`,
    `File / export access: ${selectedText('files')}`,
    `Satisfaction: ${selectedText('satisfaction')}`,
    `SEO evidence: ${answers.services.includes('seo') ? selectedText('seoEvidence') : 'Not applicable'}`,
    '', 'OBSERVATIONS', ...[...assessment.issues, ...assessment.unknowns, ...assessment.strengths].map(text => `- ${text}`),
    '', 'NEXT QUESTIONS', ...assessment.suggestions.map(item => `- ${item.title}: ${item.detail}`),
    '', 'Based on self-reported answers. No website scan, market-price benchmark, or guaranteed savings. Recurring estimate assumes unchanged rates; excludes unreported charges and future switching costs.'
  ];
  return summary.join('\n');
}
function renderResult(answers) {
  result = evaluateCost(answers);
  byId('result-title').textContent = result.title;
  byId('result-description').textContent = result.description;
  byId('result-monthly').textContent = result.monthly === null ? 'Incomplete' : money(result.monthly);
  byId('result-annual').textContent = result.annual === null ? 'Incomplete' : money(result.annual);
  byId('cost-breakdown').textContent = result.annual === null
    ? `Known charges: ${money(result.knownAnnual)} per year. Missing charges prevent a complete total.`
    : `Annual breakdown: ${money(result.baseAnnual)} main payment + ${money(result.extrasAnnual)} separate charges.`;
  byId('setup-summary').textContent = `Past setup payment: ${answers.setupPaid === '' ? 'not provided' : money(Number(answers.setupPaid))} (separate). Remaining commitment: ${selectedText('commitment')}.`;
  byId('result-observations').replaceChildren(...[...result.issues, ...result.unknowns, ...result.strengths].map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  byId('result-suggestions').replaceChildren(...result.suggestions.map(item => {
    const article = document.createElement('div'); article.className = 'cost-recommendation';
    const title = document.createElement('h4'); title.textContent = item.title;
    const copy = document.createElement('p'); copy.textContent = item.detail;
    article.append(title, copy); return article;
  }));
  byId('scope-note').textContent = result.simpleScope
    ? 'Your 1–5 page business website may fit this subscription scope. Renatus would still need to review your requirements and migration before confirming a fit.'
    : 'Your listed scope includes additional work, advanced features, more pages, or details that need clarification. The base subscription below is not a like-for-like comparison; a custom scope review is needed.';
  byId('review-summary').value = summaryText(answers, result);
  byId('result-date').textContent = new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  byId('results-section').hidden = false;
  byId('personal-review').hidden = false;
  byId('checker').hidden = true;
  focusAt('result-title');
  track('website_cost_check_complete');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateStep()) return;
  if (!started) { track('website_cost_check_start'); started = true; }
  if (step < 2) {
    track('website_cost_check_step', { step_number: step + 1 });
    showStep(step + 1);
    return;
  }
  try { renderResult(getAnswers()); }
  catch (error) { byId('checker-error').textContent = error.message; byId('checker-error').hidden = false; }
});
byId('cost-back').addEventListener('click', () => showStep(step - 1));
byId('edit-results').addEventListener('click', () => {
  result = null;
  byId('results-section').hidden = true;
  byId('personal-review').hidden = true;
  byId('review-summary').value = '';
  byId('checker').hidden = false;
  showStep(0);
});
byId('print-results').addEventListener('click', () => {
  track('website_cost_check_print'); window.print();
});
byId('review-method').addEventListener('change', () => {
  const phoneRequired = byId('review-method').value !== 'email';
  byId('review-phone').required = phoneRequired;
  byId('phone-label').textContent = phoneRequired ? 'Phone' : 'Phone (optional)';
});
byId('review-website').addEventListener('input', () => byId('review-website').setCustomValidity(''));
review.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !result) return;
  const website = byId('review-website');
  try {
    const value = website.value.trim();
    const parsed = new URL(value.includes('://') ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.') || parsed.username || parsed.password) throw new Error('Invalid website');
    website.value = parsed.href;
    website.setCustomValidity('');
  } catch {
    website.setCustomValidity('Enter a public website address such as yourbusiness.com.');
    website.reportValidity();
    return;
  }
  for (const field of [byId('review-name'), byId('review-email'), byId('review-phone')]) field.value = field.value.trim();
  if (!review.reportValidity()) return;
  submitting = true;
  byId('send-review').disabled = true;
  byId('send-review').textContent = 'Sending…';
  byId('review-error').hidden = true;
  try {
    const response = await fetch('/', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams(new FormData(review)).toString()
    });
    if (!response.ok) throw new Error('Submission failed');
    // Only mark a lead after the form endpoint accepts the POST. The existing
    // confirmation-page script consumes this marker once, within 10 minutes.
    try { sessionStorage.setItem('renatus:pending-lead:website-cost-review', String(Date.now())); } catch { /* Storage may be unavailable. */ }
    window.location.assign(review.getAttribute('action'));
  } catch {
    byId('review-error').textContent = 'Your request could not be confirmed. Your answers are still here. Please try again, or email victor@renatus.technology.';
    byId('review-error').hidden = false;
    submitting = false;
    byId('send-review').disabled = false;
    byId('send-review').textContent = 'Send my review request';
  }
});
syncConditionalFields();
byId('checker-app').hidden = false;
