# Renatus Technology

Static website for Renatus Technology.

- Website: https://renatus.technology
- GitHub profile: https://github.com/victorpena210
- GitHub repository: https://github.com/victorpena210/renatus

## Client testimonial workflow

Renatus collects testimonials with a Netlify Form at `/testimonials`.

1. A client submits the testimonial form.
2. Review the submission in Netlify under Forms → `testimonial`.
3. Only publish submissions that include publication permission and that you want displayed publicly.
4. Add the approved testimonial to `data/testimonials.json` using this shape:

```json
{
  "testimonials": [
    {
      "name": "Client Name",
      "company": "Company Name",
      "website": "https://example.com/",
      "project": "Website Design",
      "rating": 5,
      "testimonial": "Their approved testimonial text.",
      "approved": true
    }
  ]
}
```

Run `node scripts/build-site.mjs` after updating the JSON file. Only entries with `"approved": true` are included. The build writes the reviews directly into `dist/testimonials.html` and the first three into `dist/index.html`, including linked company titles. No browser fetch or JavaScript is needed to read them. If there are no approved testimonials, the homepage section remains hidden.

The root HTML files include a snapshot of the current reviews for source previews. The build regenerates the marked testimonial blocks from `data/testimonials.json`, which remains the source of truth. Deploy `dist/`, not the source folder. Netlify already uses this build command and publish directory in `netlify.toml`.

Do not add a testimonial to the JSON file unless the client granted publication permission. Email addresses collected by the form are for verification/follow-up only and are never rendered publicly.


## Website cost checker

New page: `/website-cost-check`. A three-step questionnaire shows free results before contact details are requested. The cost logic lives in `js/website-cost-model.mjs`; the UI and optional form submission live in `js/website-cost-check.mjs`. No external API, market-price dataset, website scanning, or AI service is involved.

### Results and pricing

- Monthly payments are annualized; separate fees are included once. Unknown fees produce an incomplete total rather than an assumed zero.
- Original setup payments are reported separately. Contract duration is context, not an exact remaining balance. No fabricated savings or overpricing thresholds are used.
- Scope, ownership, support, and SEO-deliverable questions drive the recommendations.
- The $299/month, 12-month, $3,588 Renatus offer is a disclosed comparison, not a maintenance-only quote or a market average. Larger sites, ongoing SEO, advertising, content, and integrations need separate scope review.
- Update the offer in `website-cost-check.html` along with `/pricing` if pricing changes. Update the visible method-review date, page metadata, and sitemap when the method or offer changes.

### Review requests and deployment

1. Run `node scripts/build-site.mjs`; Netlify already publishes `dist` using `netlify.toml`.
2. Deploy through the existing Git/Netlify workflow (or deploy the contents of `dist` manually). The ZIP includes the existing `.git` history and remote; do not run `git init`.
3. In Netlify Forms, confirm form detection is enabled and `website-cost-review` appears after deployment. The source HTML declares all form fields so Netlify can detect them.
4. Configure a submission notification for `website-cost-review` to `victor@renatus.technology`, if one is not already covered by a site-wide notification. Submissions are stored in Netlify Forms.
5. Send one clearly labeled test request on the deployed site and verify it arrives. Local tests mock the submission endpoint; they do not prove live delivery or notification settings.
6. Respond personally to the requester using the selected contact method. The tool does not send automatic reports or subscribe visitors to email marketing. Visitors can print/save their immediate result as a PDF.

The form sends the contact details, cost answers, result, and optional notes together. It only moves to the confirmation page after a successful response from the form endpoint. Failed requests retain entered data and offer retry. Contact fields are excluded from the print layout. No answers or contact details are stored in localStorage or sent as custom GA event parameters.

### Measurement

The existing GA4 property receives `website_cost_check_start`, `website_cost_check_step` (fixed step number only), `website_cost_check_complete`, and `website_cost_check_print`. The existing `generate_lead` confirmation logic is reused with `form_name=website-cost-review`; it fires only after an accepted request has set a recent session marker, and consumes that marker once. GA4's existing page view covers visits. Review funnel results and mark `generate_lead` as a key event in GA4 if desired.

### Search setup

The landing page includes static explanatory content, visible questions and answers, canonical and social metadata, WebPage and BreadcrumbList JSON-LD, and links from navigation, the homepage, pricing, the cost guide, support, business technology, and SEO/AEO pages. The sitemap includes the new URL. The confirmation page is `noindex` and excluded from the sitemap. After deployment, inspect `/website-cost-check` in Google Search Console and request indexing.

### Checks

Run `node --test scripts/website-cost-model.test.mjs` and `node scripts/build-site.mjs` before deployment. Browser acceptance checks should cover mobile and desktop steps, unknown amounts, SEO conditional fields, editing a result, printing, submission failure/retry, and confirmation tracking. No live form submission was sent while preparing this update.
