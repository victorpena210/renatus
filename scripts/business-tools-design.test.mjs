import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {renderBusinessTools} from './render-business-tools.mjs';

let directory;
let pages;
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'renatus-design-'));
  const ids = await renderBusinessTools(directory);
  pages = new Map(await Promise.all(ids.map(async id => [id, await readFile(path.join(directory, `${id}.html`), 'utf8')])));
});
after(async () => { if (directory) await rm(directory, {recursive: true, force: true}); });

test('all 25 generated pages load the Renatus foundation before the toolkit stylesheet', () => {
  assert.equal(pages.size, 25);
  for (const [id, html] of pages) {
    assert.match(html, /class="tools-page"/, id);
    assert.ok(html.indexOf('/css/site.css') < html.indexOf('/css/business-tools.css'), id);
  }
});

test('every generated marketing hero reuses the shared skyline hero class', () => {
  for (const [id, html] of pages) {
    if (id === 'business-review-thank-you') continue;
    assert.match(html, /<section class="hero tool-hero(?: tool-hero-compact)?">/, id);
  }
});

test('library, industry and related-tool cards inherit the shared Renatus card class', () => {
  let count = 0;
  for (const [id, html] of pages) {
    for (const match of html.matchAll(/<article class="([^"]*\btool-card\b[^"]*)"/g)) {
      assert.ok(match[1].split(/\s+/).includes('card'), id);
      count++;
    }
  }
  assert.ok(count > 23, 'Includes related cards as well as both hubs');
});

test('tool calls to action use the shared primary and outline button variants', () => {
  for (const [id, html] of pages) {
    assert.doesNotMatch(html, /tool-btn-light/, id);
    for (const match of html.matchAll(/class="([^"]*\bbtn\b[^"]*)"/g)) {
      assert.match(match[1], /\bbtn-(?:primary|outline)\b/, id);
    }
  }
});

test('the homepage tool cards also inherit the Renatus card class', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/class="card tool-card"/g) ?? []).length, 3);
  assert.doesNotMatch(html, /class="tool-card"/);
});

test('toolkit CSS uses brand tokens rather than a competing global palette', async () => {
  const css = await readFile(new URL('../css/business-tools.css', import.meta.url), 'utf8');
  for (const name of ['bg', 'gold', 'muted', 'panel-deep', 'border', 'cyan']) {
    assert.ok(css.includes(`var(--renatus-${name})`), name);
  }
  assert.doesNotMatch(css, /:root\s*\{|--tool-(?:ink|paper|muted)|#b9e4d4|#f7f9fb/i);
  assert.match(css, /@media print/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
});
