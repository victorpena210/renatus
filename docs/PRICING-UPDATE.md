# Renatus pricing update — October 6, 2026

Renatus now publishes separate project and support tiers for websites, internal tools, software MVPs and operations platforms. The published amounts are starting prices or planning ranges; each proposal defines the deliverables and final price.

| Engagement | Published price |
| --- | --- |
| Business website | From $3,500 |
| Advanced / conversion-focused website | $6,500–$12,000+ |
| Software discovery and architecture | $2,500–$5,000 |
| Internal tool or workflow | From $12,500 |
| Custom software MVP | From $20,000 |
| Business operations software | From $35,000 |
| Complex multi-user / multi-tenant platform | $45,000–$75,000+ |
| Website Care | $299/month |
| Software Care | From $750/month |
| Priority software support / ongoing development | $1,500–$3,000+/month |

The existing $299/month website subscription remains available with its initial 12-month, $3,588 commitment. It already includes care. It is distinct from the $299/month Website Care plan for an existing supported website. Software support is no longer advertised at $299/month.

Discovery is separately scoped and priced. Support capacity, response targets, infrastructure costs and any development allocation are agreed in writing. No public hourly engineering rate was added. The Is the Shuttle Running example links to the existing platform page without claiming a past sale price or a guaranteed business outcome.

## What changed

- Rebuilt the primary pricing sections around software, discovery, websites and ongoing care, with scope explanations and FAQs.
- Updated homepage pricing and the software, maintenance, web design, website cost guide and business technology pages.
- Clarified that lower-priced setup, integration and AI prototype services are bounded work within existing products.
- Added an optional budget field to the homepage contact form and expanded the 22 generated review forms through over $75,000. The generator contains the change so rebuilding preserves it.
- Updated privacy copy, pricing metadata, structured data and relevant sitemap modification dates.
- Added responsive pricing styles that use the existing studio palette and typography.

## Apply the patch to your existing checkout

Download `renatus-pricing-update.patch` to Downloads. These commands assume your existing checkout is at the path below and Node 22 or newer is installed:

```sh
cd ~/Desktop/IdeaProjects/RENATUS/renatus
git status --short
git apply --check ~/Downloads/renatus-pricing-update.patch &&
git apply ~/Downloads/renatus-pricing-update.patch &&
npm run check
```

The patch is based on the ZIP provided for this update. If `git apply --check` reports a conflict, stop before applying it and review the differing files. The patch excludes generated `dist/`; `npm run check` rebuilds it.

Alternatively, the updated ZIP contains the complete project under `renatus/`, including the rebuilt `dist/`. Copy the changed source files into the existing Git checkout, then run `npm run check`. Keep using the existing Git-to-Netlify deployment so the serverless function is included. Do not deploy only the static build folder.

## Validation

- All 84 existing Node tests passed.
- Production build completed for 57 HTML pages.
- Existing validation passed for 25 generated pages, lead-form schemas, local links, canonical metadata, sitemap coverage and private-source exclusions.
- Additional checks verified JSON-LD across the built pages, unique IDs and pricing anchors on the primary changed pages, and all 23 budget selectors (homepage plus 22 review forms).
- Browser layout verification could not complete: Chromium was blocked by the execution environment's socket restriction. No desktop/mobile rendering pass or live form delivery is claimed.

Before publishing, preview `/`, `/pricing`, `/custom-software-san-antonio` and `/website-maintenance-san-antonio` at desktop and mobile widths. The existing optional browser suite can be run with `npm run test:design` in an environment with Playwright and Chromium available. No live forms were submitted and no deployment was performed as part of this update.

After deployment, check that Netlify detects the new `budget` field on the `contact` form. The generated review form already declares that field; its options were expanded.
