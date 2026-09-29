// Website Cost Check v1. All amounts are USD. This is a scope checklist,
// not a market-price database or a website scan.
export const serviceLabels = {
  build: 'Website build or redesign payments', hosting: 'Hosting and SSL',
  maintenance: 'Technical maintenance', edits: 'Content updates', support: 'Direct support',
  seo: 'Ongoing SEO / AEO', content: 'New content creation', ads: 'Advertising / ad management',
  integrations: 'Booking, payments, or integrations', unknown: 'Not sure what is included'
};

export function annualize(amount, period) {
  if (amount === '' || amount == null) return null;
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0 || value > 1000000) throw new Error('Enter an amount from 0 to 1,000,000.');
  if (!['monthly', 'yearly'].includes(period)) throw new Error('Select monthly or yearly billing.');
  return Math.round(value * (period === 'monthly' ? 12 : 1) * 100) / 100;
}

export function evaluateCost(answers) {
  const baseAnnual = answers.costUnknown ? null : annualize(answers.amount, answers.period);
  const extrasAnnual = answers.extrasStatus === 'none' ? 0 :
    answers.extrasStatus === 'known' ? annualize(answers.extras, answers.extrasPeriod) : null;
  const annual = baseAnnual !== null && extrasAnnual !== null ? Math.round((baseAnnual + extrasAnnual) * 100) / 100 : null;
  const services = answers.services || [];
  const issues = [];
  const unknowns = [];
  const strengths = [];
  const suggestions = [];
  const add = (title, detail) => suggestions.push({ title, detail });

  if (annual === null) {
    unknowns.push('Some recurring charges are unknown.');
    add('Get a complete list of recurring charges', 'Ask for website, hosting, domain, software, and marketing charges, with billing periods. Count each charge once; exclude items already included in your main payment.');
  }
  if (!services.length || services.includes('unknown')) {
    unknowns.push('The included services need clarification.');
    add('Request an itemized scope', 'Ask which tasks are included, how often they happen, what costs extra, and how requests are handled. A price alone cannot establish value.');
  } else {
    strengths.push('You can identify the services included in your payment.');
    if (services.every(s => s === 'hosting')) {
      add('Separate hosting from hands-on service', 'Confirm whether the fee covers only hosting and SSL or also pays for support, maintenance, updates, or an earlier website build. Compare quotes for that same scope.');
    }
  }
  if (answers.domain === 'provider') {
    issues.push('Your provider controls the domain account.');
    add('Confirm domain control', 'Ask who is the registered domain holder, how you can access the account, and what the transfer process requires. Provider management can be convenient when access and terms are clear.');
  } else if (answers.domain === 'unknown') {
    unknowns.push('Domain control is unclear.');
    add('Check your domain account', 'Confirm the registered holder and account access. Request the renewal date and a written transfer process.');
  } else strengths.push('You report having control of your domain account.');

  if (answers.files === 'no') {
    issues.push('You cannot currently export or move the website.');
    add('Understand your exit options', 'Check ownership, export options, remaining payments, and migration costs. Hosted website platforms may require a rebuild elsewhere; include that in a future comparison.');
  } else if (answers.files === 'unknown') {
    unknowns.push('Website ownership or export terms are unclear.');
    add('Ask what you receive when you leave', 'Confirm whether you can export the site or its content, when files become available, and what cancellation or handover charges apply.');
  } else strengths.push('You report that website handover or export terms are defined.');

  if (answers.editAccess === 'no' && !services.includes('edits')) {
    issues.push('You cannot edit the site and have not listed content updates as included.');
    add('Agree on a way to keep the site current', 'Ask how changes to hours, services, prices, and photos are made, what they cost, and the usual response time.');
  } else if (answers.editAccess === 'unknown') {
    unknowns.push('Your editing access needs clarification.');
    add('Confirm how updates work', 'Ask whether you can make changes yourself or request them, and which update costs are included.');
  }
  if (answers.satisfaction === 'issues') {
    issues.push('You reported problems with the website or support.');
    add('Document the problems before requesting a quote', 'List broken forms, mobile issues, slow responses, or other specific concerns. Ask whether they can be fixed within your current agreement.');
  } else if (answers.satisfaction === 'good') strengths.push('You are satisfied with the website and support.');
  else unknowns.push('Website performance or support results need review.');

  if (services.includes('seo')) {
    if (answers.seoEvidence !== 'yes') {
      unknowns.push('Ongoing SEO / AEO deliverables need confirmation.');
      add('Ask for evidence of ongoing search work', 'Request a record of page improvements, research, technical fixes, and reporting on relevant inquiries or conversions. A plugin alone does not describe an ongoing service. Rankings and AI citations cannot be guaranteed.');
    } else strengths.push('You report receiving evidence of ongoing SEO / AEO work.');
  }

  const simpleScope = answers.siteType === 'business' && answers.pages === '1-5' && services.length > 0 &&
    !services.some(s => ['seo', 'content', 'ads', 'integrations', 'unknown'].includes(s));
  const outcome = issues.length ? 'review' : unknowns.length ? 'clarify' : 'defined';
  const titles = {review: 'A few parts of your agreement deserve a closer look.', clarify: 'Clarify the details before comparing prices.', defined: 'Your services and access look clearly defined.'};
  const descriptions = {
    review: 'Your answers point to specific questions about access, support, or portability. These deserve attention regardless of the amount you pay.',
    clarify: 'Some important information is missing. An itemized agreement will make it easier to compare the same services and avoid surprise costs.',
    defined: 'Your answers suggest a clear arrangement and no obvious service concerns in this checklist. Price fairness still depends on the quality and amount of work delivered.'
  };
  add('Compare the full cost of changing providers', 'Include setup or rebuild fees, remaining commitments, migration, paid software, and ongoing work. Your past setup payment is separate from the recurring estimate below.');
  return {annual, baseAnnual, extrasAnnual, monthly: annual === null ? null : annual / 12,
    knownAnnual: (baseAnnual || 0) + (extrasAnnual || 0), outcome, title: titles[outcome], description: descriptions[outcome],
    issues, unknowns, strengths, suggestions, simpleScope};
}

export const money = value => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:2, maximumFractionDigits:2}).format(value);
