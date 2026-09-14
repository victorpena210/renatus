Update: Peña Plaza hero and social branding — September 14, 2026

Use these files inside your existing project folder. Keep the existing .git folder
on your Mac when copying changes into an already-cloned project. The archive also
retains the original repository metadata; no commits or pushes were performed here.

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
