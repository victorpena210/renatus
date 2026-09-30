# Renatus lead-generation toolkit

Implementation: September 29, 2026. This is a source-code delivery, not a deployment.
The original uploaded archive was not modified. No live lead was submitted.

## What was added

The main entry point is `/free-business-tools`. It includes category filters,
question-based starting points, all 14 tool links, and an industry/workflow hub.
Your existing cost checker, prices, testimonials, case studies, contact forms,
retro homepage, navigation, and product pages remain in the project.

| Page | What it actually does |
|---|---|
| `/website-cost-check` | Existing cost-and-service checker, preserved and linked into the hub. |
| `/website-lead-check` | Reviews eight self-reported conversion practices; optionally calculates inquiries per 100 visits from matching user-entered periods. |
| `/website-health-check` | Retrieves public homepage HTML and reports 12 specific observations. |
| `/seo-aeo-check` | Combines public HTML evidence with self-reported content/search-readiness questions. No actual ranking or AI-citation tracking. |
| `/business-automation-calculator` | Values one repetitive workflow, assumed time reduction, setup costs, and running costs. |
| `/competitor-website-comparison` | Compares a homepage with up to two competitor homepages using the same 12 HTML checks. |
| `/business-technology-assessment` | Reviews self-reported website, operational, measurement, and software practices, with evidence coverage and action priorities. |
| `/custom-software-roi-calculator` | Models project cost, monthly benefit, ongoing cost, evaluation-period net value, simple ROI, and break-even. |
| `/website-project-planner` | Records scope and user-entered quotes/costs; explains Renatus's published base offer without inventing a market-price estimate. |
| `/website-modernization-check` | Reviews support and usability; a user-entered rebuild year is context, never a reason by itself to recommend replacement. |
| `/website-maintenance-calculator` | Totals known external costs and optional internal labor; unknown charges stay incomplete. |
| `/local-search-check` | Reviews local-search preparation using self-reported answers; does not retrieve reviews or map rankings. |
| `/website-security-check` | Reviews security practices and responsibilities, not vulnerabilities or security certification. |
| `/website-redesign-readiness` | Checks preparation for a proposed redesign, not whether someone must buy a replacement. |

There are 13 new tools plus the preserved checker—not 14 newly created tools.

### Industry and workflow pages

`/industries` links to nine distinct pages:

- `/web-design-insurance-agencies`
- `/web-design-mediators`
- `/web-design-law-firms`
- `/web-design-contractors`
- `/web-design-trucking-companies`
- `/custom-software-transportation`
- `/employee-scheduling-software-development`
- `/client-portal-development`
- `/legacy-website-modernization`

Each discusses specific workflows, a sensible initial scope, an appropriate free
tool, and a project-review form. Relevant existing work is linked only where the
project supports the statement. No fabricated client outcomes or reviews were added.
The tools hub, industry hub, confirmation page, tool pages, and industry pages
add **25 source HTML pages**. The complete site builds **50 HTML pages**.

## Visitor and lead flow

A visitor chooses a tool, answers a short multi-step form, and sees the result
without providing contact information. Results include inputs, assumptions,
known-versus-unknown coverage, practical next steps, and method limitations.
Visitors can edit their answers, export a text report, or use the browser's print
screen to print/save a PDF. Contact fields are excluded from the print layout.

An optional personal-review request asks for name and email, optional business,
website, budget, timeline and message, and explicit consent to send the details
and be contacted about that request. The displayed assessment is included; a
preview lets the visitor inspect it before sending. There is no newsletter opt-in,
automated report email, or automatic sales sequence.

The new Netlify form is **`renatus-business-review`**. Every source page contains
the same statically declared field schema, so JavaScript is not required for
form detection. Tool/industry identity and the source page accompany each lead.
The existing `website-cost-review` form remains separate and unchanged.

Only an accepted POST redirects to `/business-review-thank-you.html`. A failed
request preserves input and the report, displays an error, and permits retry.
A timeout can be ambiguous; the error message advises checking before resending.
With JavaScript disabled, a native form remains available for a personal review.

The accepted-submission session marker contains only a known tool identifier
and timestamp. It expires after ten minutes and is consumed once. The new
confirmation page does not count a direct visit or reload as a lead. This
client-side measurement is not a replacement for the Netlify submission ledger.

## Calculation and evidence limits

Known checklist answers use equal weights: Yes = 2, Partly = 1, No = 0. Unknowns
are excluded, and at least half the checklist must be known for an overall
percentage. The percentage measures this questionnaire, not an industry benchmark.
An unknown answer creates a verification task, not an asserted defect.

Automation and ROI values come entirely from visitor inputs. Labor time is
valued capacity, not guaranteed cash removable from a budget. Costs and negative
returns remain visible. Zero upfront investment yields undefined percentage ROI,
not infinity. Nonpositive monthly benefit does not produce a break-even date.

The public scanner reports HTTPS, title, description, viewport, H1 markup,
document language, canonical declaration, explicit indexing directives, JSON-LD
types, image alt-attribute presence, a main landmark, and supported plain-HTTP
resource declarations. These are conservative source observations, not a browser
DOM audit. A missing declaration is not automatically a defect; details explain
context and limitations. No total competitor score or winner is manufactured.

It does **not** measure speed/Core Web Vitals, execute JavaScript, validate all
structured data, crawl the entire site, prove indexing, retrieve actual search
positions, confirm AI citations, test form delivery, establish WCAG compliance,
scan vulnerabilities, or certify security. PageSpeed Insights is offered as a
separate external performance check. Dynamic sites may show limited source evidence.

## Deployment — use the complete project

1. Back up your current checkout. Copy the update into the existing `renatus`
   project folder. Keep the checkout's `.git` directory and existing remote.
   This delivery intentionally excludes Git history and credentials.
2. Use Node 22 or newer. Run `npm run check`. No `npm install` is required for
   runtime libraries because this project has no external npm dependencies.
3. Commit and push through the existing Netlify-connected repository. Use the
   included `netlify.toml`: build command `npm run check`, publish directory
   `dist`, function directory `netlify/functions`, Node 22, esbuild bundler.
4. Confirm `site-snapshot` is present in the deployed site's Functions list.
   A static-only upload of `dist` does not deploy this function. Calculators
   still run in a static preview; homepage checks show unavailable there.
5. In Netlify, enable form detection and redeploy if detection was previously
   disabled. Confirm **`renatus-business-review`** appears alongside the
   existing site forms. Add a submission notification to
   `victor@renatus.technology`, or confirm an existing site-wide notification
   covers the new form. The code cannot configure account-level inbox settings.
6. Submit one clearly labeled test request on the deployed site. Confirm the
   Netlify submission and inbox notification, then review spam handling.
7. Run the live acceptance checklist below. Only then announce the tools.

Netlify account configuration, hosting usage, and current plan limits still
apply. The tools are free for visitors; hosting is not promised to be cost-free.
No external SEO, AI, or PageSpeed API key is required by this implementation.
No Stripe, CRM, mailing-list, or third-party automation integration was added.

Suggested commit:

```text
feat: add business lead-generation toolkit and industry landing pages
```

## Local development and tests

```sh
npm run check
npm run dev
```

Open the localhost address printed by the server. The preview serves the actual
compiled files and the scanner route. Outbound scanning needs ordinary public
network/DNS access. The local server intentionally refuses lead-form POSTs:
**no request is stored or delivered locally.** Do not interpret a local error as
Netlify rejecting a production submission.

Optional browser fixtures:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:browser
```

The fixture harness renders compiled HTML, CSS, images, and shipped JavaScript
in Chromium without sending data to any live provider. It inlines local assets,
provides a page-URL context for shared navigation, and substitutes network,
session storage, final navigation, and print/download boundaries. It does not
replace the calculation or questionnaire logic. An installed Chromium is used
when found; `CHROMIUM_PATH` can select a local browser executable. Results and
screenshots go to ignored `test-output/`.

### Verification performed for this delivery

- **78 Node tests passed**, including the existing testimonial/cost tests and
  new models, numeric edge cases, source observations, crawler policies, private
  destination blocking, DNS pinning, redirect limits, caching, and API errors.
- **104 browser-fixture assertions passed**, including all 13 new tool flows,
  desktop/360px results, 390px hubs/industry pages, required answers, unknowns,
  zero-cost ROI, rate-limit/unavailable outcomes, report content, print isolation,
  consent, submission failure/retry, payload context, and lead-event deduplication.
- The **50-page build** and **25-new-page validator** passed, including static
  navigation, local links, unique IDs, JSON-LD, canonical metadata, sitemap entries,
  declared Netlify fields, noindex confirmation, and source-directory exclusions.
- Desktop hub and mobile result screenshots were inspected; theme/form conflicts
  found during testing were corrected with scoped toolkit styles.

Live public-homepage retrieval and Netlify storage/email delivery were **not**
verified from this environment. Browser navigation and outbound network access
were restricted; fixtures prove local behavior, not a live platform integration.

## Live acceptance checklist

- Open `/free-business-tools` on desktop and a real phone; test filters and navigation.
- Complete a calculator and a checklist; edit, export, and print their results.
- Run a homepage check against a public site you control. Confirm real timestamps,
  observed signals, and normal behavior when retrieval is unavailable.
- Compare two distinct domains; unavailable evidence must not appear as a poor score.
- Submit a labeled review request with consent. Check the form entry, report,
  source-tool field, email notification, confirmation page, and GA DebugView.
- Revisit the confirmation page directly and refresh it; no extra custom lead
  event should appear without a new accepted submission.
- Test the manual review form with JavaScript disabled.
- Check the preserved contact, testimonial, RoutePulse, and cost-review flows.
- Confirm the sitemap and canonical URLs on the actual production domain.

## Public scanner architecture and safeguards

`netlify/functions/site-snapshot.mjs` handles same-origin JSON POSTs at
`/.netlify/functions/site-snapshot`. The function returns derived observations,
not raw HTML. A same-origin check is not authentication and is not described as one.

`lib/public-web.mjs` permits public standard-port HTTP(S) business domains only.
Paths/query strings/fragments supplied by a visitor are removed before the initial
homepage check. Credentials, IP literals, local/internal names, custom ports, and
unsupported schemes are rejected. Every DNS answer is checked against blocked
IPv4 ranges; a validated address is pinned into the connection to avoid a second
unvalidated DNS lookup. Every redirect is revalidated; TLS verification remains on.
The scanner is intentionally IPv4-only: IPv6-only or blocked sites are unavailable,
not silently fetched through a weaker path.

The scanner identifies itself as RenatusCheck, honors supported robots.txt rules,
limits redirects, bytes, headers, DNS duration and request duration, and performs
GETs only. It does not sign in, send cookies, submit forms, or probe admin paths.
Netlify edge rate limiting is configured for 12 requests per IP per 60 seconds.
A three-site comparison uses up to three requests. A bounded per-instance memory
cache holds up to 128 successful observations for up to ten minutes; it is not a
persistent database. Logs and provider-level retention remain subject to Netlify.

Set `DISABLE_SITE_CHECKS=true` in the Netlify runtime environment to disable new
scans while leaving questionnaires and review forms available. Review runtime
logs, traffic and platform usage after launch. These controls are not a promise
that the system is immune to every form of abuse or every future parser issue.

## Editing and source-of-truth files

| File | Purpose |
|---|---|
| `js/business-tools-data.mjs` | Tool metadata, fields, answer choices, method text, and related tools. |
| `js/business-industries-data.mjs` | Nine unique industry/workflow narratives and supporting links. |
| `js/business-tools-model.mjs` | Validation, math, checklist priorities, and report text. |
| `js/business-tools.mjs` | Browser steps, results, scanner requests, review forms, and tracking. |
| `css/business-tools.css` | Scoped responsive tool, form, report, and print styling. |
| `scripts/render-business-tools.mjs` | Generates the 25 source pages on every build. |
| `scripts/build-site.mjs` | Builds public output and injects the existing shared components. |
| `lib/public-web.mjs` / `lib/html-signals.mjs` | Bounded retrieval and conservative HTML observations. |
| `netlify/functions/site-snapshot.mjs` | Netlify API handler, rate-limit configuration, and cache. |
| `scripts/*test.mjs` / `tests/browser_smoke.py` | Unit/security-boundary tests and offline browser fixtures. |

Edit catalog/renderer sources rather than only the generated root HTML: the next
build will regenerate those pages. Update `METHOD_VERSION`, relevant review dates,
metadata, and sitemap dates when changing a method. Keep advertised pricing in the
project planner, existing cost checker, and `/pricing` consistent. The base offer
is a specific Renatus reference—not a market average or maintenance-only quote.

Do not place client submissions in public `data/`, `dist/`, or source control.
Generated reports are not saved in browser persistent storage. Contact details
and answers are not included as custom GA event parameters. Only fixed event
names, tool IDs, step numbers, and result categories are sent by the new script.

New interaction names: `business_tool_start`, `business_tool_step`,
`business_tool_complete`, `business_tool_print`, `business_tool_export`, and
`business_tool_review_click`; accepted requests use `generate_lead` with
`form_name=renatus-business-review`. Keep the existing cost-checker event names.

Static explanatory content, descriptive internal links, canonical/social metadata,
breadcrumb structured data, and sitemap entries are included. Search rankings,
indexing, AI citations, and inbound lead volume are not guaranteed by these changes.

## Official platform references

- Netlify Forms: https://docs.netlify.com/manage/forms/setup/
- Netlify Functions API: https://docs.netlify.com/build/functions/api/
- Netlify rate limiting: https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- Google AI search features: https://developers.google.com/search/docs/appearance/ai-features
