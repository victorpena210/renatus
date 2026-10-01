# Renatus — software studio redesign

This update rebuilds the homepage around custom software and business operations,
and applies the warm paper / cobalt / enterprise-computing design to all 53 pages.
The existing phoenix is retained as a cobalt mark. No production deployment was made.

## What changed

- New homepage: operational pain points, three selected systems, software-first
  services, a before/after workflow, delivery process, scope-led pricing, approved
  testimonials, free tools and the “Show us your process” inquiry form.
- Shared navigation and terminal-style footer, responsive layouts, keyboard focus,
  mobile menus and reduced-motion support.
- Rebuilt custom software page and a new pricing overview for systems and support.
  Existing website subscription details, ownership terms and supporting service
  prices remain on the pricing page.
- Updated About, Products and case-study presentation and messaging; the rest of
  the service, resource and tool pages use the same design system.
- New social-sharing image rendered from the actual HTML/CSS workstation design.
- The workstation and catalog previews are HTML/CSS illustrations. Catalog
  previews are explicitly labeled; they are not authenticated app screenshots or
  live operational data. Replace them with approved app captures when available.

## Use this update without losing Git

Copy the **contents** of the extracted `renatus` folder into your existing local
Renatus repository. Merge/replace matching files. Do **not** delete your original
project folder or its `.git` directory. This ZIP intentionally has no Git history.
Keep any local environment file; the archive contains only the original example.

From the existing project directory:

```sh
git status
npm run check
npm run dev
```

Inspect the local preview before committing. The existing Netlify configuration
still runs `npm run check`, publishes `dist`, and deploys `netlify/functions`.
Use your existing full-source Git deployment so the site-snapshot function is
included. A static drag-and-drop of `dist` will not deploy that function.

## Editing

- `index.html`: homepage content and interface illustrations.
- `css/studio.css`: final shared design, components and responsive rules.
- `components/navbar.html`, `components/footer.html`: shared navigation and footer.
- `scripts/render-business-tools.mjs`: generated tool/industry page markup.
- `data/testimonials.json`: approved reviews; existing approval workflow retained.
- `scripts/studio-social-card.html`: source for the new sharing graphic.

Keep `studio.css` last, after page-specific stylesheets. The build injects shared
components and approved reviews into the HTML, including the homepage.

## Verified

- `npm run check`: 84 automated tests, successful 53-page build and the existing
  generated-page/lead-schema validator.
- Every built page at 1440px, 768px and 360px: no horizontal page overflow.
- Local links, anchor targets, duplicate IDs, JSON-LD and image/asset requests.
- Mobile menu, keyboard Escape/focus, desktop dropdown, approved review rendering.
- Contact-form required fields and captured valid form data without delivery.
- Tool hub filtering and 13 questionnaire/result flows using offline fixtures;
  calculator result checks, report creation and mobile results.
- Review submission failure preserves data; an offline successful retry reaches
  the confirmation page. Shuttle status preview still changes state.
- No uncaught JavaScript errors during the browser regression.

The current visual regression runs with `npm run test:design`; it uses optional
Playwright. Install it for local QA with `npm install --no-save playwright` and
`npx playwright install chromium`. `CHROMIUM_PATH` can specify an installed browser.
The earlier Python browser fixtures remain available for deeper toolkit testing.

No live form messages, production scanner requests or analytics were sent.
After deployment, confirm Netlify form detection and send a labeled test inquiry
to verify storage and notification delivery in your real hosting environment.
