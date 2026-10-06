# Custom websites article — October 6, 2026

Added **Why Custom-Built Websites Give You More Freedom Than WordPress** at:

`https://renatus.technology/custom-built-websites-vs-wordpress`

The article uses the existing Renatus editorial layout, author byline, table of contents, typography and contact call to action. It is the latest feature on the homepage and Insights page. The migration article remains in Insights and links to the new piece; the WordPress/static comparison also links to it. The four supporting Insights cards use a two-column desktop layout and stack on mobile.

The supplied article's argument and first-person voice are preserved. Small clarifications explain that WordPress can be custom-developed and version-controlled, custom applications also have dependencies, and Git does not restore databases or uploaded files. The migration anecdote avoids asserting an unverified cause. Official WordPress documentation is linked alongside the relevant statements.

The new page includes a canonical URL, social sharing metadata, BlogPosting and BreadcrumbList structured data, and publication/modified dates of October 6, 2026. The Insights ItemList matches the visible article order. The sitemap now covers all 48 canonical, indexable pages exactly once. Existing last-modified dates were preserved; every modified page already had an October 6 date, and the new article uses that same date.

## Apply to your existing checkout

Use the existing Renatus Git folder on your Mac. This archive contains the updated source and generated `dist/`; it omits Git metadata and the stale `dist 2/` copy. Keep your existing checkout and its Git history.

Download the updated ZIP. From your Renatus folder, run the following. Set `article_zip` to the exact downloaded filename if your browser added a suffix:

```bash
article_zip="$HOME/Downloads/renatus(20261006-130940).zip"
git rev-parse --show-toplevel &&
git status --short &&
article_update_dir="$(mktemp -d)" &&
unzip -q "$article_zip" -d "$article_update_dir" &&
test -f "$article_update_dir/renatus/docs/CUSTOM-WEBSITES-ARTICLE-FILES.txt" &&
rsync -av \
  --files-from="$article_update_dir/renatus/docs/CUSTOM-WEBSITES-ARTICLE-FILES.txt" \
  "$article_update_dir/renatus/" ./ &&
npm run check &&
git diff --stat &&
git status --short
```

The copy is limited to the ten files listed in the manifest. If you have made newer edits to any of those files since uploading this snapshot, reconcile them before copying. The command rebuilds `dist/` from your current source.

Preview with `npm run dev`, then visit:

- `http://localhost:4173/custom-built-websites-vs-wordpress`
- `http://localhost:4173/insights`
- `http://localhost:4173/`

After reviewing the changes:

```bash
git add --pathspec-from-file=docs/CUSTOM-WEBSITES-ARTICLE-FILES.txt &&
git commit -m "Add custom websites vs WordPress article and update sitemap" &&
git push
```

Use the existing Git-to-Netlify deployment. It builds the website and includes the existing Netlify functions. A static-only `dist/` upload does not include those functions. No deployment was performed while preparing this update.

## Validation

- `npm run check` passed: all 84 existing tests, 56-page build, and the existing lead-page validator.
- All five changed HTML pages passed checks for a single H1, unique IDs, valid JSON-LD, resolving local links/assets/fragment targets, and built navigation.
- All 48 sitemap URLs match the canonical, indexable pages; no duplicate, missing, redirected or noindex URLs were found. The generated sitemap matches the source.
- `git diff --check` passed.
- Browser rendering was not verified because no Chromium executable was available. The article reuses the existing responsive layout; check desktop and mobile in the local preview before deploying.

After deployment, verify the new article, homepage feature, Insights listing and `/sitemap.xml`. You can then request indexing for the new article in Search Console.
