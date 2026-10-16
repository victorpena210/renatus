/* Load the production property only on the public HTTPS domains. */
(function () {
  'use strict';
  if (window.renatusAnalyticsInitialized) return;
  window.renatusAnalyticsInitialized = true;
  const measurementId = 'G-SEEZLWF1YV';
  const ownerKey = 'renatus:analytics:disabled';
  const mode = new URLSearchParams(window.location.search).get('analytics');
  let ownerDisabled = mode === 'off';
  try {
    if (mode === 'off') localStorage.setItem(ownerKey, '1');
    if (mode === 'on') localStorage.removeItem(ownerKey);
    ownerDisabled = localStorage.getItem(ownerKey) === '1';
  } catch { /* Explicit off still works when storage is blocked. */ }
  const allowed = window.location.protocol === 'https:' &&
    ['renatus.technology', 'www.renatus.technology'].includes(window.location.hostname);
  window.renatusAnalyticsEnabled = allowed && !ownerDisabled;
  window['ga-disable-' + measurementId] = !window.renatusAnalyticsEnabled;
  if (!window.renatusAnalyticsEnabled) {
    window.gtag = function () {};
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // Keep campaign attribution, exclude arbitrary query data and fragments.
  const page = new URL(window.location.href);
  const safeQuery = new URLSearchParams();
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content', 'gclid', 'dclid', 'gbraid', 'wbraid']) {
    if (page.searchParams.has(key)) safeQuery.set(key, page.searchParams.get(key));
  }
  page.search = safeQuery.toString();
  page.hash = '';
  let referrer = '';
  try { const ref = new URL(document.referrer); referrer = ref.origin + ref.pathname; } catch {}
  window.gtag('config', measurementId, { page_location: page.href, page_referrer: referrer });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
})();

