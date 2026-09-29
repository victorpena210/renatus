# Website cost checker update — September 28, 2026

## What changed

- Added `/website-cost-check`, styled to match Renatus, with a three-step questionnaire and immediate results before asking for contact details.
- Added monthly and annual recurring-cost calculations; unknown amounts stay explicitly incomplete. One-time setup costs are kept separate.
- Added recommendations based on services, update access, domain control, export terms, support, and SEO evidence. No arbitrary claim that a provider is overcharging.
- Added an optional personal-review form, including the full answer/result summary, preferred contact method, and a dedicated confirmation page.
- Added print/save-as-PDF support for results. Contact fields are excluded from printing.
- Added static explanatory content and FAQs, canonical/social metadata, WebPage/BreadcrumbList structured data, and the sitemap entry.
- Added entry points in Resources, the homepage, pricing, the website cost guide, maintenance, business technology, and SEO/AEO pages.
- Updated the privacy notice and added GA4 funnel events with no answers or personal information in custom event parameters.
- Corrected a small shared navigation overflow at 320px widths.
- Included a freshly generated `dist/` folder. Existing Git history and the origin remote are preserved. Changes are ready for your review and commit.

## Verification

- All eight calculation/rule tests pass (`node --test scripts/website-cost-model.test.mjs`).
- Production build succeeds for all 25 HTML pages.
- New pages pass static checks for links, anchors, labels, unique IDs, JSON-LD, Netlify form declarations, and sitemap inclusion/exclusion.
- Chromium checks cover required fields, mixed billing periods, zero/unknown costs, conditional SEO questions, editing and recalculating, printing, form payload, submission failure and retry, and confirmed-lead deduplication.
- Mobile checks cover 390px and 320px widths; no horizontal overflow remains in the tested result flow. The landing page, form, and results were visually inspected.
- The no-JavaScript fallback and built-in static navigation were checked.
- Review submissions were intercepted by a local mock. No real lead was sent, no live site was deployed, and Netlify delivery/notification settings remain to be checked after deployment.

## Deploy and receive leads

1. Commit/push the updated project using your existing Git workflow. Netlify runs `node scripts/build-site.mjs` and publishes `dist/`. If deploying manually, upload the contents of `dist/`.
2. Confirm Netlify form detection is enabled and the new `website-cost-review` form appears after deployment. Check its notification settings for `victor@renatus.technology`.
3. Submit one clearly labeled live test and confirm that the full answer summary and contact preference reach Netlify Forms and the configured notification recipient.
4. Respond personally to review requests; automatic email reports and marketing subscriptions are not included. Visitors can print their immediate result themselves.
5. Inspect `https://renatus.technology/website-cost-check` in Google Search Console after deployment and request indexing. The updated sitemap already lists it.

Suggested commit message: `Add website cost checker and optional review lead form`
