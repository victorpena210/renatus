# Zachry Insurance case study update

October 15, 2026

The existing `/zachry-insurance-case-study` is now the full article, **Building Zachry Insurance’s Search Presence From Scratch**. Its canonical URL is retained so current portfolio and service-page links lead to the expanded story.

## What changed

- Expanded the project story to cover the business need, brand and website build, guided tools, recruiting, early search results, and inquiry-tracking improvements.
- Added a dated results panel, two comparison tables, an in-page contents menu, source notes, the existing client testimonial, and a project contact link.
- Featured the case study on the homepage and Insights page. The previous featured article remains in the Insights article list.
- Updated article/social metadata, the Insights structured article list, and relevant sitemap dates. Preserved the case study's existing publication date; marked the expansion as an October 15 update.
- Kept the emailed inquiry out of the article. No customer count, revenue gain, SEO-attributed lead, or lead conversion rate is claimed.

## Evidence and scope

Source: [Zachry Insurance data for the Renatus case study](https://chatgpt.com/space/page_b0724d4c4ba48191820473f645b19916), read October 15, 2026.

Main period: June 23–October 13, 2026. Search Console: 6,160 impressions and 65 clicks. GA4, filtered to production hostnames: 312 sessions, including 128 Organic Search sessions. The article keeps the metrics separate and discloses that historical owner visits may remain.

The recent 28-day comparison includes the full mixed result: average position improved from 55.0 to 39.7 while impressions declined from 2,529 to 2,396 and clicks from 15 to 11. The controlled October 15 inquiry-tracking test is outside the reporting window and is not presented as a customer inquiry.

The source Page was not modified and is not linked publicly in the article. No private screenshots or source data files are included in the public page.

## Files

- `zachry-insurance-case-study.html`
- `css/case-study-report.css`
- `index.html`
- `insights.html`
- `sitemap.xml`
- `README.md`, `UPDATE-INSTRUCTIONS.txt`, and this note
- Regenerated `dist/` output

## Validation and deployment

- `npm run check`: 84 tests passed, 58 HTML pages built, and the existing form/link/sitemap checks passed.
- The three changed built pages were checked for one H1, unique IDs, valid JSON-LD, resolved local assets/links and fragment targets, and valid accessible-label references.
- Article figures were checked against the supplied brief. The email inquiry and stale Supabase tag are absent.
- Browser visual verification was unavailable. Check desktop and mobile layouts with `npm run dev`, particularly table scrolling, contents links, and shared navigation.

Apply the complete source project to the existing checkout and deploy through its Git/Netlify workflow. Keep `netlify/functions/` with the source; uploading only `dist/` does not deploy the scanner function. This delivery has not been pushed to GitHub or deployed to the live domain.
