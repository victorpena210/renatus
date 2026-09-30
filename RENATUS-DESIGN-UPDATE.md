# Renatus design consistency update

## Status

Implemented and tested against `renatus(20260930-015350).zip`. This is a source-file update, not a live deployment. No GitHub push, Netlify deployment, real form submission, or live scanner request was performed.

## What changed

The lead-generation section had its own light-and-teal palette and explicit CSS rules overriding Renatus's shared dark theme. Those rules are replaced by styles that consume the existing `--renatus-*` colors and the shared `.hero`, `.card`, `.btn-primary`, and `.btn-outline` components.

The update applies to all 25 generated pages: the free-tool hub, industries hub, 13 interactive assessment/calculator pages, nine industry/workflow landing pages, and the business-review confirmation page. It also updates the three tool cards on the homepage.

The pages now use the existing skyline image, uppercase hero typography, gold text accents, dark framed surfaces, orange/pink action buttons, and consistent form and result styling. Mobile quick-start numbers no longer break onto two lines. Keyboard focus remains visible, consent checkboxes retain their correct size, comparison tables scroll within their own labelled region, and printed reports remain dark text on a light background.

The template generator is updated, not just the generated HTML. Running the build will preserve this design.

## What was preserved

- Assessment questions, calculation/scoring code, report data, source catalogs, and scan implementation are unchanged.
- Form names, field names, consent requirements, honeypot fields, endpoints, and submission/analytics behavior are unchanged.
- Existing URLs, canonical metadata, sitemap entries and lead-capture setup are unchanged.
- The homepage's retro-computer hero and existing service-page designs remain intact.
- RoutePulse's existing standalone product-page design remains unchanged. The site-wide surface audit identifies it as the intentional light product-design exception; this update does not replace that separate design system.
- This update does not alter `.git`, private configuration, account permissions, deployment settings, or stored leads.

## Apply safely on your Mac

Use the changed-file ZIP, **renatus-design-fix.zip**. Its entries are relative to the project root: `css/`, `scripts/`, `tests/`, HTML files, `package.json`, and this guide. It contains no `.git` directory, deleted-file operations, images, dependencies, or private `.env` files.

Do not delete or replace the entire project folder. Keep the ZIP in Downloads and apply its contents over the existing checkout:

```bash
cd "$HOME/Desktop/IdeaProjects/RENATUS/renatus" &&
git rev-parse --show-toplevel &&
unzip -o "$HOME/Downloads/renatus-design-fix.zip" -d . &&
npm run check
```

`unzip -o` overwrites the named source files only. It cannot remove your `.git` folder. Any edits made to those same files after the supplied upload would be replaced; save those edits before applying.

After successful checks, review the changes:

```bash
git status --short
git --no-pager diff --stat
```

Stage and review before committing:

```bash
git add . &&
git --no-pager diff --cached --stat
```

Then commit and push:

```bash
git commit -m "fix: align business tools and industry pages with Renatus design" &&
git push
```

Do not force-push if Git reports an error. The ZIP is a patch for your existing source project, not a standalone site and not a complete `dist` deployment.

## Verification completed

- `npm run check`: 84 Node tests passed; the build emitted 50 HTML pages; validation passed for all 25 generated pages, static form schemas, local links, canonical metadata, sitemap, and private-source exclusions.
- `npm run test:browser`: 104 existing offline browser assertions passed, covering the questionnaires, calculations, results, report export/print hooks, edits, failed/retried lead submissions, consent, analytics privacy and duplicate-event prevention.
- `npm run test:design`: 84 additional browser assertions passed. All 25 generated pages were checked at 1440, 768 and 360 CSS pixels. The suite also checked representative form contrast, focus outlines, print colors, mobile navigation, homepage card integration, and all 50 compiled pages for large solid light surfaces.
- Screenshots were visually reviewed for the hub, industries, assessment, forms and representative mobile layouts.

The browser tests use Chromium with local HTML/assets and controlled network/form fixtures. They are not Safari/Firefox certification, a full accessibility audit, a live Netlify delivery test, or proof of current scanner availability.

The browser tests are optional local development tools. The production build requires no new dependency. To run them locally, use the existing `tests/requirements.txt`, a local Chromium installation, and the `CHROMIUM_PATH` environment variable when needed.

## After deployment

Confirm the new Netlify deploy succeeds, then check `/free-business-tools`, `/industries`, `/business-technology-assessment`, one industry detail page, and the homepage tool cards. Try an assessment through its result screen on a phone. Print preview should remain light even though the web result is dark. Refresh the page after the deployment completes to load the latest CSS.

## Maintenance

- Change toolkit/industry markup in `scripts/render-business-tools.mjs`.
- Change toolkit layout and component details in `css/business-tools.css`.
- Keep brand colors and shared visual components in the existing shared stylesheets.
- Do not add a second global palette to `business-tools.css`.
- The six new Node design tests run automatically in `npm run check`.
- `tests/browser_smoke.py` now exposes its fixture helpers behind a `main()` guard so the new design tests can reuse them without running the entire existing suite on import.
