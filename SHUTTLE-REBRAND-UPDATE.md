# Is the Shuttle Running rebrand

Updated September 29, 2026, using the public content and brand assets at https://istheshuttlerunning.com/.

## What changed

- Replaced active RoutePulse branding and its old domain across the homepage, Products, About, Custom Software, transportation/scheduling pages, privacy notice, and build story.
- Rebuilt the product page around clear rider status and the manager/driver workflows behind it. The page uses the new lime-green shuttle mark and product identity inside the existing Renatus navigation and footer.
- Added a clearly labeled interactive example with Running, Paused, and Off duty states. It does not fetch or imply actual shuttle status.
- Replaced old GPS/ETA promises with the current product scope: schedule imports, demand planning, driver coverage, QR/NFC checkpoints, service status, driving records, ride confirmations, and operational analytics. The FAQ states that live GPS and predicted arrival times are not currently provided.
- Updated product metadata, structured data, social image, internal links, sitemap URLs, and modification dates.
- Added permanent Netlify redirects for the former RoutePulse pages and older RouteFlow/ShuttleFlow aliases, including .html and trailing-slash forms.

## Page addresses

| Previous address | Current address |
| --- | --- |
| `/routepulse` | `/is-the-shuttle-running` |
| `/routepulse-shuttle-operations-platform` | `/is-the-shuttle-running-operations-platform` |
| `/routePulse-thank-you.html` | `/shuttle-pilot-thank-you.html` |

The old HTML files are intentionally retained as small fallback redirect pages. This also makes copying the update over an existing checkout safe: older product content is overwritten. Netlify uses the forced 301 redirects in `_redirects`; the fallback HTML is for other static previews. Its JavaScript preserves query strings and fragments.

## Forms and analytics

The existing `routepulse-early-access` Netlify form name, hidden form-name value, field names, honeypot, and GA lead identifier are preserved. These are integration identifiers, not public product branding. The form now sends users to the rebranded confirmation page. No live form was submitted during verification.

## Verification

- `npm run check`: all 84 existing tests pass; 53 HTML pages build; the existing 25-page lead validation passes.
- Updated HTML structured data parses successfully and its local links/assets resolve in the build.
- Headless Chromium checks at 1440px, 390px, and 360px: product page, Products page, build story, and confirmation page have no horizontal overflow or broken images.
- Inspected the homepage's updated product card and the product page on desktop/mobile.
- Preview buttons update the example text, colors, and `aria-pressed` state correctly.
- Old product, build-story, and confirmation HTML pages redirect to the new pages while preserving query strings/fragments.
- Required fields prevent an empty pilot submission. No JavaScript page errors observed.
- Netlify's actual HTTP 301 behavior and production form delivery must be verified after deployment; local preview does not emulate Netlify redirects or deliver forms.

Desktop/mobile product-page screenshots are in `docs/shuttle-rebrand/`. Historical implementation notes may still use the previous product name.

## Apply and publish

1. Copy the contents of this `renatus` folder into your existing Renatus project, replacing matching files. Keep your existing `.git` folder and local environment settings.
2. In your project directory, run `npm run check`.
3. Review and commit the update, then push through your existing GitHub/Netlify deployment workflow.

Suggested commit message:

```text
feat: rebrand RoutePulse as Is the Shuttle Running across Renatus
```

The archive includes the source and a freshly built `dist/` directory. Netlify remains configured to run `npm run check` and publish `dist`. This delivery does not itself publish the changes.
