# Pricing and package clarity — October 15, 2026

The core website and software starting prices stay the same. This update clarifies care, purchase options and monthly deliverables.

## New proposals

| Offer | Price | Scope |
| --- | --- | --- |
| Website Care Essentials | $149/month | Hosting and SSL, monthly maintenance review and summary, 30 minutes of content edits, 2-business-day email response target |
| Website Care Plus | $299/month | Essentials coverage, 90 minutes of edits total, monthly checks of two agreed customer journeys and one conversion event, 1-business-day response target |
| Website subscription | $299/month for 12 months | 1–5 informational pages, approved client content, one inquiry form, one design revision round and Essentials care; automatically continues at $149/month Essentials from month 13 unless changed or canceled |
| Software Care | From $750/month | Up to five hours across maintenance reviews, investigation and fixes; 2-business-day response target |
| Priority software support | $1,500 or $3,000/month; larger plans quoted | Up to 10 or 20 combined maintenance and development hours; 1-business-day response target; replaces Software Care for the same application |
| Managed Web Operations | From $499/month | Essentials hosting and care, with up to three total hours across content, upkeep, checks and coordination; replaces the separate website care fee |

Allowances do not roll over. Response targets cover initial response and triage, not guaranteed completion or 24/7 coverage. Business days exclude U.S. federal holidays and use Central Time. Additional work requires an agreed quote. Software infrastructure and third-party charges are separate unless included in the proposal.

These offers apply to new proposals. Existing client agreements retain their agreed terms unless changed in writing. This update changes website content only; it does not change invoices, Stripe subscriptions or contracts.

## Website purchase distinction

The subscription covers a bounded small informational site. One-time projects start at $3,500 with custom page structure, content organization, an agreed page count and up to two consolidated design revision rounds. Ongoing care is optional.

The comparison shows $3,588 for the subscription's first year and a $5,288 example for the minimum one-time build plus 12 months of optional Essentials care ($3,500 + $149 × 12). These have different scopes. Additional work, third-party fees and applicable taxes are excluded.

## Other changes

- Added illustrative first-release scopes for internal tools, MVPs, operations systems and multi-tenant platforms.
- Linked TexMediator, Zachry Insurance and Is the Shuttle Running as capability examples without asserting actual sale prices or new business-result metrics.
- Kept four main buying categories prominent; moved the smaller service catalog into three native expandable sections and preserved existing pricing anchors.
- Matched the main SEO offer to the detailed page: optimization of up to two existing pages monthly.
- Updated related service pages, cost guide, transparency page, homepage, cost checker, generator data and calculator result copy.
- Preserved branding, forms, analytics, Netlify function and deployment configuration.

## Verification

- All 84 existing Node tests passed.
- Production build completed for 58 HTML pages.
- Existing validation passed for 25 generated pages, lead schemas, local links, canonical metadata, sitemap and private-source exclusions.
- Checked built HTML structure, unique IDs, JSON-LD and local fragment targets across all 58 pages.
- Checked pricing arithmetic and searched for superseded unlimited-edit and $299 post-term subscription wording.
- Browser visual verification was unavailable. Preview the disclosures and comparison table on mobile and desktop before publishing.

## Applying and publishing

The ZIP contains the complete `renatus/` project, including rebuilt `dist/`. Follow the root `UPDATE-INSTRUCTIONS.txt` to merge into the existing checkout without removing Git history or local environment files.

This update has not been pushed or deployed. Use the existing Git-to-Netlify workflow so the Netlify function is included.
