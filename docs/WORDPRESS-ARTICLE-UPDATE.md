# WordPress migration article — October 6, 2026

This is the complete updated Renatus source project, with a freshly built `dist/` folder. It has not been deployed.

## What changed

- New `/why-wordpress-migrations-fail` article, based on Victor’s supplied draft.
- New `/insights` page collecting the article and three existing guides.
- Homepage article feature after “How we work.”
- Insights links in the shared Resources menu and footer.
- Contextual article links from the WordPress comparison, technology transparency and legacy modernization pages.
- Article-specific responsive styles, table of contents, reading time, author/date, technical references and contact call to action.
- Canonical and social metadata, BlogPosting/CollectionPage/BreadcrumbList structured data, and sitemap entries.

Editorial adjustments preserve the first-person account while identifying hypothetical examples and avoiding a diagnosis without the old logs. Serialized string lengths are explained in bytes; the 512 MB plugin limit is illustrative. The Java example explicitly includes data migrations, persistent storage and verification. Official WordPress and PHP references are linked in the article.

The modernization link is maintained in `js/business-industries-data.mjs`. Its HTML page is generated during the normal build. Edit the data source to preserve future changes.

## Apply to your existing Mac project

Keep using your current Renatus Git checkout. The archive contains no `.git` directory and should not replace your repository folder.

First check that this is your correct checkout. Adjust the path if you keep Renatus somewhere else:

```bash
cd ~/Desktop/IdeaProjects/RENATUS/renatus &&
git rev-parse --show-toplevel &&
git remote -v &&
git status --short
```

The remote should identify `victorpena210/renatus`. If you already have uncommitted work in the files listed in `WORDPRESS-ARTICLE-FILES.txt`, preserve or compare those edits before copying the update.

Download the archive as `renatus-wordpress-article.zip` into Downloads, then run this from your confirmed checkout:

```bash
update_dir="$(mktemp -d)" &&
unzip -q ~/Downloads/renatus-wordpress-article.zip -d "$update_dir" &&
test -f "$update_dir/renatus/why-wordpress-migrations-fail.html" &&
rsync -av --files-from="$update_dir/renatus/docs/WORDPRESS-ARTICLE-FILES.txt" \
  "$update_dir/renatus/" ./ &&
npm run check &&
git diff --stat &&
git status --short
```

This copies only the files for this update. It does not delete unrelated files, overwrite Git history or change hosting configuration. `npm run check` rebuilds `dist/`.

Preview locally:

```bash
npm run dev
```

Open `http://localhost:4173/insights` and `http://localhost:4173/why-wordpress-migrations-fail`. Check the article on a narrow screen, the table of contents, Resources menu and contact link. Stop the preview with Control-C.

After reviewing:

```bash
git add --pathspec-from-file=docs/WORDPRESS-ARTICLE-FILES.txt &&
git commit -m "Add WordPress migration article and Renatus insights" &&
git push
```

Netlify should run the existing `npm run check` command, publish `dist/`, and deploy the existing functions. Use the Git deployment workflow; a static-only upload of `dist/` would omit the site's scanner function.

After Netlify reports a successful deployment, check:

- `https://renatus.technology/insights`
- `https://renatus.technology/why-wordpress-migrations-fail`
- The homepage feature and Resources menu.

## Verification completed

- `npm run check`: all 84 existing Node tests passed; 55 HTML pages built; the existing lead-page validator passed.
- New pages: correctly nested HTML, one H1 per page, valid JSON-LD, matching canonical/social URLs, unique element IDs, resolving local assets, links and fragment targets.
- Both new URLs appear exactly once in the sitemap.
- All five contextual entry points link to the new article after the build.
- `git diff --check` passed.
- Browser rendering could not be checked: Chromium was unavailable and its download failed. Responsive styles are included, but visual verification in your local preview remains to be done.

The existing `UPDATE-INSTRUCTIONS.txt` refers to the earlier October 1 case-study update. Use this document for the October 6 article update.
