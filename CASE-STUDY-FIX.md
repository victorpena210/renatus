# Renatus case-study readability update

This is a small update for your current redesigned site.

Changed: project goals are now a labeled section with five numbered rows, clear
headings and readable descriptions. Callouts and outcome panels now use solid,
high-contrast surfaces. Applies to TexMediator, Zachry Insurance and Pena Plaza.

## Apply safely on your Mac

Unzip renatus-case-study-fix.zip in Downloads, then run:

```bash
rsync -av ~/Downloads/renatus-case-study-fix/ ~/Desktop/IdeaProjects/RENATUS/renatus/
cd ~/Desktop/IdeaProjects/RENATUS/renatus
npm run check
git status
```

This merges the update into the existing project. It does not delete anything
or replace your .git directory. Do not delete or replace your project folder.

Review the four changed source files, then use your normal Git commit/push
workflow. Netlify will rebuild the site from source. The matching dist files
are included for local compiled previews. No deployment was made here.

Validation: 84 existing tests pass, 53-page build and lead-page validation pass.
The updated components were rendered on all three case studies at 1440px, 768px
and 390px. No horizontal overflow or JavaScript errors. Checked goal, callout and
outcome text all exceeded 4.5:1 contrast (lowest measured: 5.80:1).
