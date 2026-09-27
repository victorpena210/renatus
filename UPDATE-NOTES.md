# September 27, 2026 — Full SEO course follow-through

This revision follows a complete transcript review of the linked Ahrefs course. The outer package includes START-HERE.md and COURSE-IMPLEMENTATION.md with a keyword map, course checklist, and live/account-dependent tasks.

- Added a website-maintenance service page using existing published scope/pricing.
- Improved the WordPress comparison title, introduction, and direct answer to whether WordPress is static.
- Added five contextual links to the maintenance page and its sitemap entry.
- Removed the broken /products#suiteflow link from About, preserving the descriptive text. This resolves the missing-anchor issue recorded in the earlier notes below.
- Retained all earlier image, metadata, testimonial, and project-evidence improvements.
- Built 23 HTML pages; five testimonial tests pass. File checks cover 20 indexable sitemap/canonical URLs, 538 internal targets/anchors, 19 JSON-LD blocks, and 34 image alt attributes. No missing internal target remains.
- Live deployment, visual browser review, field performance, account metrics, recurring audits, and outreach are not completed by this archive.

Merge these website files into an existing Git checkout; keep its Git history. See the outer START-HERE.md for safe copy and recovery instructions.

---

# SEO/AEO improvements — September 27, 2026

## What changed

- Client reviews are now present in source snapshots and generated HTML. The build refreshes the review blocks from data/testimonials.json, publishes only explicitly approved entries, preserves company links, and requires no browser JavaScript to display reviews.
- Homepage title, Open Graph title, and Twitter title are now "San Antonio Web Design & Custom Software | Renatus". Their descriptions also explain the local services.
- Added specific project evidence and descriptive case-study links to Web Design, Custom Software, Business Technology, and SEO/AEO service pages. Existing case studies supply the facts; no traffic, revenue, or ranking improvements were invented. RoutePulse remains labeled as a demo-phase product.
- Optimized seven image assets, using transparent WebP variants for displayed PNGs and 1200 × 630 compressed JPEGs for social sharing. Source PNGs remain available, but the updated page image elements load the WebP versions.
- Updated sitemap last-modified dates for the six pages with substantive text/review changes.

## Use the updated files

Copy the contents of the renatus folder into your existing project, replacing matching files and preserving your existing .git folder. This deliverable omits repository metadata and macOS metadata files.

From the project root:

```sh
node --test scripts/render-testimonials.test.mjs
node scripts/build-site.mjs
```

Netlify is already configured to run the build and publish dist/. For a manual deployment, deploy the contents of dist/. The rebuilt dist/ is included in this archive. The live website has not been changed by this file update.

For future review updates, edit data/testimonials.json and rebuild; the JSON remains the source of truth. Do not maintain review text separately inside generated dist/ files.

## Validation

- All 22 pages built successfully with static navigation and footers.
- All five testimonial regression checks passed: explicit approval, home-page limit, escaped text and safe links, repeat builds, and removal of withdrawn reviews.
- Both current client reviews appear in the actual HTML on the homepage and testimonial page; the homepage review section is visible without JavaScript.
- Checked evidence links, image paths, CSS asset paths, structured-data JSON, single H1 headings, and consistent homepage titles.
- Contact and testimonial form controls and submission settings match the supplied files.
- Visual browser QA was unavailable because the preview browser's URL policy blocked local files; rendered desktop/mobile layouts were not verified.
- Unrelated pre-existing issue: about.html links to /products#suiteflow, but products.html has no SuiteFlow section. That existing content is unchanged.

## Image transfer savings

These are asset byte reductions, not measured load-time or Core Web Vitals improvements.

| Asset | Before | Served replacement |
| --- | ---: | ---: |
| images/retro_computer.png | 1,552,420 bytes | 160,806 bytes |
| images/zachry-insurance-computer-transparent.png | 2,121,100 bytes | 125,098 bytes |
| images/logos/renatus-phoenix-transparent.png | 955,600 bytes | 71,038 bytes |
| images/logos/renatus-horizontal-transparent.png | 290,800 bytes | 56,240 bytes |
| images/pena-plaza-logo-horizontal.png | 375,839 bytes | 53,690 bytes |
| images/zachry-insurance-og.jpg | 2,029,614 bytes | 92,173 bytes |
| images/renatus-technology-og.jpg | 1,785,434 bytes | 119,490 bytes |

Total: 9,110,807 → 678,535 bytes (about 93% smaller).

## Changed source files

- web-design-san-antonio.html
- pena-plaza-case-study.html
- zachry-insurance-case-study.html
- seo-aeo-keyword-research.html
- business-technology-services.html
- testimonials.html
- sitemap.xml
- custom-software-san-antonio.html
- README.md
- index.html
- scripts/render-testimonials.test.mjs
- scripts/build-site.mjs
- scripts/render-testimonials.mjs
- images/zachry-insurance-computer-transparent.webp
- images/retro_computer.webp
- images/zachry-insurance-og.jpg
- images/pena-plaza-logo-horizontal.webp
- images/renatus-technology-og.jpg
- components/navbar.html
- css/main.css
- js/testimonials.js
- images/logos/renatus-horizontal-transparent.webp
- images/logos/renatus-phoenix-transparent.webp

---

## Earlier update notes

Update: Peña Plaza hero and social branding — September 14, 2026

Use these files inside your existing project folder. Keep the existing .git folder
on your Mac when copying changes into an already-cloned project. No commits or pushes were performed here.

Build from the project root:
node scripts/build-site.mjs

Then review and publish through your normal GitHub/Netlify flow:
git status
git add .
git commit -m "fix: update Pena Plaza hero and social branding"
git push

The social card is 1200 x 630 JPG. Its editable HTML source is under scripts/.
New social image URLs avoid reusing the old preview URL, though social platforms
may still need time or a rescrape to refresh previously shared links.

Renatus changes:
- Peña Plaza case study uses the same computer and responsive hero layout as TexMediator.
- Original Peña Plaza logo and property image are layered into the display with CSS.
- Portfolio thumbnail, Open Graph, Twitter, and Article image point to the new brand card.
- The old pena-plaza-og.jpg filename also contains the corrected card.
- TexMediator and Zachry case studies are unchanged.
