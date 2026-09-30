"""Offline design regression checks; no live submissions or network calls.

Uses the same local HTML/assets and browser fixture boundaries as browser_smoke.
Run npm run check first, then npm run test:design. Requires tests/requirements.txt
and a Chromium installation (CHROMIUM_PATH can specify the browser executable).
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
import browser_smoke as fixture

OUT = Path(os.environ.get('DESIGN_TEST_OUTPUT', str(fixture.ROOT / 'test-output' / 'design')))
OUT.mkdir(parents=True, exist_ok=True)
CASES = []
AUDIT = []

def check(ok, label):
    if not ok:
        raise AssertionError(label)
    CASES.append(label)
    print('PASS', label, flush=True)

def rgb(value):
    import re
    return tuple(float(x) for x in re.findall(r'[\d.]+', value)[:3])

def contrast(foreground, background):
    def luminance(color):
        channels = [v / 255 for v in rgb(color)]
        channels = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
        return sum(a*b for a, b in zip(channels, [.2126, .7152, .0722]))
    a, b = sorted([luminance(foreground), luminance(background)])
    return (b + .05) / (a + .05)

def main():
    with sync_playwright() as p:
        binary = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
        browser = p.chromium.launch(**({'executable_path': binary} if binary else {}), headless=True, args=['--no-sandbox'])
        slugs = ['free-business-tools', 'industries', 'business-review-thank-you'] + [t['id'] for t in fixture.CATALOG['tools']] + [t['id'] for t in fixture.CATALOG['industries']]
        for slug in slugs:
            ctx, page = fixture.load(browser, slug)
            for width in [1440, 768, 360]:
                page.set_viewport_size({'width': width, 'height': 1000})
                state = page.evaluate('''() => {
                  const main = getComputedStyle(document.querySelector('main'));
                  const hero = document.querySelector('.tool-hero');
                  return {
                    mainBg: main.backgroundColor,
                    mainColor: main.color,
                    skyline: !hero || getComputedStyle(hero).backgroundImage.includes('data:image/webp'),
                    uppercase: !hero || getComputedStyle(hero.querySelector('h1')).textTransform === 'uppercase',
                    darkCards: [...document.querySelectorAll('.tool-card')].every(e => e.classList.contains('card') && getComputedStyle(e).backgroundImage.includes('linear-gradient')),
                    panels: [...document.querySelectorAll('.tool-panel')].every(e => getComputedStyle(e).backgroundColor === 'rgb(13, 14, 34)'),
                    buttons: [...document.querySelectorAll('.tool-hero .btn')].every(e => getComputedStyle(e).backgroundImage.includes('linear-gradient')),
                    numbers: [...document.querySelectorAll('.tool-start-panel > a > span')].every(e => getComputedStyle(e).whiteSpace === 'nowrap')
                  };
                }''')
                check(fixture.no_overflow(page) and state['mainBg'] == 'rgb(7, 8, 25)' and state['mainColor'] == 'rgb(247, 245, 240)' and all(state[k] for k in ['skyline','uppercase','darkCards','panels','buttons','numbers']), f'{slug}: Renatus theme and contained layout at {width}px')
            if slug in ['free-business-tools', 'industries', 'business-technology-assessment']:
                for width in [1440, 390]:
                    page.set_viewport_size({'width': width, 'height': 1000 if width > 600 else 844})
                    page.evaluate('window.scrollTo(0,0)');page.mouse.move(0,0)
                    page.screenshot(path=str(OUT / f'{slug}-{width}.png'), full_page=False)
            ctx.close()

        # Audit the rest of the compiled site for large unexpected white panels.
        for html in sorted(fixture.DIST.glob('*.html')):
            slug = html.stem
            ctx, page = fixture.load(browser, slug, js=False)
            info = page.evaluate('''() => ({
              width: innerWidth, pageWidth: document.documentElement.scrollWidth,
              lightSurfaces: [...document.querySelectorAll('main section, main article, main aside, main form, main .card')].filter(e => {
                const r=e.getBoundingClientRect(), c=getComputedStyle(e).backgroundColor.match(/[\\d.]+/g)?.map(Number)||[];
                return r.width*r.height > 30000 && c.length>=3 && c.slice(0,3).every(v=>v>220) && (c.length<4 || c[3]>.8);
              }).map(e=>({tag:e.tagName,id:e.id,classes:e.className}))
            })''')
            AUDIT.append({'page': slug, **info})
            ctx.close()
        check(all(not x['lightSurfaces'] for x in AUDIT if x['page'] in slugs), 'No large white surfaces on any of the 25 updated pages')

        ctx, page = fixture.load(browser, 'business-technology-assessment', width=390)
        page.locator('.tool-field select').first.focus()
        focus_style = page.locator('.tool-field select').first.evaluate('(e)=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth})')
        check(focus_style['style'] == 'solid' and float(focus_style['width'].replace('px','')) >= 3, 'Questionnaire controls have a visible keyboard-focus outline')
        colors = page.evaluate('''() => {
          const bg=getComputedStyle(document.querySelector('.tool-panel')).backgroundColor;
          return {bg, colors:['.tool-field label','.tool-help','#step-label'].map(s=>getComputedStyle(document.querySelector(s)).color)};
        }''')
        check(all(contrast(c, colors['bg']) >= 4.5 for c in colors['colors']), 'Sampled form labels, help and progress text exceed 4.5:1 on the solid form panel')
        page.locator('#assessment').scroll_into_view_if_needed()
        page.screenshot(path=str(OUT / 'assessment-form-mobile.png'),full_page=False)
        tool = next(t for t in fixture.CATALOG['tools'] if t['id'] == 'business-technology-assessment')
        fixture.complete(page, tool)
        page.locator('#result-heading').scroll_into_view_if_needed()
        check(page.locator('.tool-metric strong').first.evaluate('(e)=>getComputedStyle(e).color') == 'rgb(230, 188, 122)', 'Result metrics use Renatus gold')
        page.screenshot(path=str(OUT / 'assessment-result-mobile.png'),full_page=False)
        page.emulate_media(media='print')
        print_style = page.locator('.tool-metric strong').first.evaluate('(e)=>getComputedStyle(e).color')
        check(print_style == 'rgb(17, 17, 17)' and not page.locator('#personal-review').is_visible() and not page.locator('.tool-hero').is_visible(), 'Printed result is dark text without the form or skyline')
        ctx.close()

        ctx, page = fixture.load(browser, 'free-business-tools', width=390)
        toggle = page.locator('.nav-toggle')
        if not toggle.count(): toggle=page.locator('button[aria-controls]').first
        toggle.click()
        check(toggle.get_attribute('aria-expanded') == 'true', 'Shared mobile navigation opens on the tool hub')
        page.keyboard.press('Escape')
        check(toggle.get_attribute('aria-expanded') == 'false', 'Shared mobile navigation closes with Escape')
        ctx.close()
        ctx, page = fixture.load(browser, 'index')
        check(page.locator('.tool-card.card').count() == 3 and page.locator('.hero-retro').count() == 1, 'Homepage tool cards are restyled while the retro-computer hero stays intact')
        ctx.close()
        check(not fixture.ERRORS, 'No uncaught JavaScript errors in design checks')
        browser.close()
    (OUT/'design-results.json').write_text(json.dumps({'passed':len(CASES),'cases':CASES,'page_surface_audit':AUDIT,'mode':'offline fixtures, Chromium only; no live Netlify requests'},indent=2)+'\n')
    print(f'Passed {len(CASES)} design assertions; audited {len(AUDIT)} compiled pages. Output: {OUT}')

if __name__ == '__main__':
    main()
