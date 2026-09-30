"""Offline browser integration checks against the compiled site.

No real network requests, real forms, or real analytics are sent. Browser policy
may prohibit URL navigation, so pages/assets are loaded from dist into an isolated
about:blank document. Only fetch, sessionStorage, and final navigation are stubbed;
questionnaire, calculation, rendering, validation, consent, and tracking code run
from the shipped modules. Browser-owned downloads/printing are inspected through
local hooks. Run npm run build first. See implementation notes for live checks.
"""
from __future__ import annotations
import base64
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
OUT = Path(os.environ.get('BROWSER_TEST_OUTPUT', str(ROOT / 'test-output')))
OUT.mkdir(parents=True, exist_ok=True)
CATALOG = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {TOOLS} from './js/business-tools-data.mjs';import {INDUSTRIES} from './js/business-industries-data.mjs';console.log(JSON.stringify({tools:TOOLS,industries:INDUSTRIES}));"], cwd=ROOT, text=True))
SNAPSHOT = json.loads((ROOT / 'tests/fixtures/homepage-snapshot.json').read_text())
MODULES: dict[str, str] = {}
CASES: list[str] = []
ERRORS: list[str] = []

def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()

def css_text(path: Path) -> str:
    text = path.read_text()
    def imported(match):
        relative = match.group(1)
        if relative.startswith(('http:', 'https:', '//')):
            return ''
        target = (path.parent / relative).resolve()
        return css_text(target) if target.is_file() else ''
    text = re.sub(r'@import\s+(?:url\(["\']?([^"\')]+)["\']?\)|["\']([^"\']+)["\'])\s*;', lambda m: imported(m) if m.group(1) else '', text)
    def resource(match):
        url = match.group(1).strip('"\'')
        if url.startswith(('data:', '#')):
            return match.group(0)
        target = DIST / url.lstrip('/') if url.startswith('/') else path.parent / url
        return 'url("' + data_uri(target) + '")' if target.is_file() else 'none'
    return re.sub(r'url\(([^)]+)\)', resource, text)

def module_uri(path: Path) -> str:
    key = str(path.resolve())
    if key not in MODULES:
        code = path.read_text()
        code = re.sub(r"(from\s+)(['\"])(\.[^'\"]+)\2", lambda m: m.group(1) + json.dumps(module_uri((path.parent / m.group(3)).resolve())), code)
        # Final navigation is an IO boundary, not an altered questionnaire flow.
        code = code.replace('window.location.assign(review.getAttribute(\'action\'))', 'window.__assigned = review.getAttribute(\'action\')')
        MODULES[key] = 'data:text/javascript;base64,' + base64.b64encode(code.encode()).decode()
    return MODULES[key]

def check(condition: bool, label: str) -> None:
    if not condition:
        raise AssertionError(label)
    CASES.append(label)
    print('PASS', label, flush=True)

def load(browser, slug: str, width: int = 1440, store: dict | None = None, js: bool = True):
    context = browser.new_context(viewport={'width': width, 'height': 1000 if width > 600 else 844}, reduced_motion='reduce', java_script_enabled=js)
    page = context.new_page()
    page.set_default_timeout(5000)
    page.on('pageerror', lambda error: ERRORS.append(f'{slug}: {error}'))
    page.route('**/*', lambda route: route.abort())
    soup = BeautifulSoup((DIST / (slug + '.html')).read_text(), 'html.parser')
    scripts = []
    for script in list(soup.find_all('script')):
        if script.get('type') == 'application/ld+json':
            continue
        src = script.get('src', '')
        if src and not src.startswith(('http:', 'https:', '//', 'data:')):
            path = DIST / src.lstrip('/')
            scripts.append((script.get('type') == 'module', path.read_text(), path))
        elif not src:
            scripts.append((False, script.string or script.get_text(), None))
        script.decompose()
    for link in list(soup.find_all('link')):
        if 'stylesheet' in link.get('rel', []) and not link.get('href', '').startswith(('http:', 'https:', '//')):
            style = soup.new_tag('style'); style.string = css_text(DIST / link['href'].lstrip('/')); link.replace_with(style)
        elif 'icon' in ' '.join(link.get('rel', [])):
            link.decompose()
    for image in soup.find_all(['img', 'source']):
        image.attrs.pop('srcset', None)
        src = image.get('src', '')
        if src and not src.startswith(('http:', 'https:', '//', 'data:')) and (DIST / src.lstrip('/')).is_file():
            image['src'] = data_uri(DIST / src.lstrip('/'))
    page.set_content(str(soup), wait_until='domcontentloaded')
    if not js:
        return context, page
    page.evaluate('''({store,snapshot}) => {
      window.__stored = {...store};
      Object.defineProperty(window,'sessionStorage',{configurable:true,value:{
        getItem:k=>Object.hasOwn(__stored,k)?__stored[k]:null,
        setItem:(k,v)=>{__stored[k]=String(v)},removeItem:k=>{delete __stored[k]},clear:()=>{__stored={}}
      }});
      window.__snapshot=snapshot;window.__scans=[];window.__posts=[];window.__postStatus=200;
      window.__scanMode='ok';window.__assigned=null;
      window.fetch=async (url,options={})=>{
        if(String(url).includes('/.netlify/functions/site-snapshot')){
          const requested=JSON.parse(options.body).url;__scans.push(requested);
          if(__scanMode==='429')return new Response('',{status:429});
          if(__scanMode==='failed'||(__scanMode==='partial'&&requested.includes('example.org')))return new Response(JSON.stringify({ok:false,error:'Fixture: retrieval unavailable.'}),{status:422});
          return new Response(JSON.stringify({...__snapshot,requestedUrl:requested,url:requested}),{status:200,headers:{'Content-Type':'application/json'}});
        }
        if(url==='/'&&options.method==='POST'){__posts.push(options);return new Response('',{status:__postStatus});}
        throw new Error('Unexpected network access in offline browser fixture: '+url);
      };
      window.print=()=>{window.__printed=true};
      const realCreate=URL.createObjectURL.bind(URL);
      URL.createObjectURL=blob=>{window.__exportBlob=blob;return realCreate(blob)};
      const realClick=HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click=function(){if(this.download){window.__downloadName=this.download;return;}return realClick.call(this)};
    }''', {'store': store or {}, 'snapshot': SNAPSHOT})
    for is_module, code, path in scripts:
        if is_module:
            page.add_script_tag(type='module', content=f'import {json.dumps(module_uri(path))};')
        else:
            # Supply the page URL at the environment boundary for shared navigation.
            code = code.replace('window.location.origin', '"https://renatus.technology"').replace('window.location.pathname', json.dumps('/' + slug))
            page.add_script_tag(content=code)
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    if any(t['id'] == slug for t in CATALOG['tools']):
        expect(page.locator('#tool-app')).to_be_visible()
    elif slug == 'free-business-tools':
        expect(page.locator('.tool-filters')).to_be_visible()
    page.wait_for_timeout(30)
    return context, page

SAMPLE = {'minutes':30,'weekly':10,'weeks':50,'hourly':40,'reduction':50,'monthlyTools':100,'setup':2000,'build':12000,'hours':40,'cash':200,'running':300,'months':12,'year':2020}

def complete(page, tool: dict, overrides: dict | None = None):
    overrides = overrides or {}
    for _ in range(12):
        if page.locator('#tool-results').is_visible():
            return
        for q in tool['questions']:
            loc = page.locator('#answer-' + q['id'])
            if not loc.is_visible():
                continue
            if q['id'] in overrides:
                value = overrides[q['id']]
            elif q.get('optional'):
                value = ''
            elif q['type'] == 'select':
                value = q['options'][0]['value']
            elif q['type'] == 'url':
                value = 'example.org' if q['id'] == 'competitor' else 'example.com'
            else:
                value = SAMPLE.get(q['id'], max(q.get('min', 0), 1))
            if q['type'] == 'select':
                loc.select_option(str(value))
            else:
                loc.fill(str(value))
        page.locator('#tool-next').click()
        page.wait_for_timeout(35)
        if page.locator('#tool-error').is_visible():
            raise AssertionError(page.locator('#tool-error').inner_text())
    raise AssertionError('Questionnaire did not finish: ' + tool['id'])

def no_overflow(page) -> bool:
    ok = page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    if not ok:
        print('OVERFLOW', page.evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,id:e.id,class:e.className,text:e.textContent.slice(0,130),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).slice(0,20)})"), flush=True)
        page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT / 'overflow-debug.png'), full_page=True)
    return ok

def events(page, name=None):
    result = page.evaluate("(window.dataLayer||[]).map(x=>Array.from(x)).filter(x=>x[0]==='event')")
    return [x for x in result if name is None or x[1] == name]

def main():
    with sync_playwright() as p:
        binary = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
        browser = p.chromium.launch(**({'executable_path': binary} if binary else {}), headless=True, args=['--no-sandbox'])
        ctx, page = load(browser, 'free-business-tools')
        check(page.locator('#tool-cards .tool-card:visible').count() == 14, 'Hub exposes all 14 tools')
        page.locator('[data-filter="Operations"]').click()
        check(page.locator('#tool-cards .tool-card:visible').count() == sum(t['category'] == 'Operations' for t in CATALOG['tools']), 'Category filter changes results and count')
        page.locator('[data-filter="All"]').focus();page.keyboard.press('Enter')
        check(page.locator('#tool-cards .tool-card:visible').count() == 14, 'Keyboard restores the complete tool library')
        page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT / 'toolkit-desktop.png'), full_page=True)
        page.set_viewport_size({'width':390,'height':844});check(no_overflow(page), 'Hub fits 390px viewport')
        page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT / 'toolkit-mobile.png'), full_page=True);ctx.close()
        for tool in CATALOG['tools']:
            ctx, page = load(browser, tool['id'])
            page.locator('#tool-next').click()
            # Optional-only first steps can legitimately advance; required fields cannot.
            required_first = any(not q.get('optional') for q in tool['questions'][:4])
            if required_first:
                check(page.locator('.tool-step[data-step="0"]').is_visible(), tool['id'] + ': required first-step validation')
            complete(page, tool)
            check(page.locator('#tool-results').is_visible() and len(page.locator('#review-summary').input_value()) > 100, tool['id'] + ': result and shareable report')
            check(no_overflow(page), tool['id'] + ': desktop result fits')
            check(len(events(page, 'business_tool_complete')) == 1, tool['id'] + ': one completion event')
            page.set_viewport_size({'width':360,'height':800});check(no_overflow(page), tool['id'] + ': 360px result fits')
            if tool['id'] == 'custom-software-roi-calculator':
                check('$1,500.00' in page.locator('#result-metrics').inner_text(), 'ROI displays the calculated net monthly benefit')
                page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT / 'roi-result-mobile.png'), full_page=True)
                page.locator('#download-result').click()
                exported = page.evaluate('window.__exportBlob.text()')
                check('12000' in exported and 'Method' in exported, 'Export contains scenario assumptions and method')
                page.locator('#print-result').click();check(page.evaluate('window.__printed') is True, 'Print action invokes native print boundary')
                page.emulate_media(media='print');check(not page.locator('#personal-review').is_visible(), 'Print view excludes contact form')
                page.emulate_media(media='screen')
                page.locator('#edit-answers').click()
                check(page.locator('#answer-build').input_value() == '12000', 'Edit preserves earlier answers')
                check(not page.locator('#shared-report-preview').is_visible(), 'Edit clears stale shared result')
                complete(page, tool, {'build':0})
                check('Infinity' not in page.locator('#result-metrics').inner_text() and 'No upfront cost' in page.locator('#result-metrics').inner_text(), 'Zero-cost scenario does not invent an infinite ROI')
            ctx.close()
        tool = next(t for t in CATALOG['tools'] if t['id'] == 'website-security-check')
        ctx, page = load(browser, tool['id'], width=390)
        complete(page, tool, {q['id']:'unknown' for q in tool['questions']})
        check('Not enough' in page.locator('#result-metrics').inner_text() or 'Unknown' in page.locator('#result-metrics').inner_text(), 'All-unknown answers do not become a low score')
        check('Check first' not in page.locator('#result-actions').inner_text(), 'Unknowns remain verification tasks, not asserted defects')
        ctx.close()
        health = next(t for t in CATALOG['tools'] if t['id'] == 'website-health-check')
        ctx, page = load(browser, health['id'], width=390)
        page.locator('#answer-website').fill('http://127.0.0.1');page.locator('#tool-next').click()
        check(page.evaluate('window.__scans.length') == 0, 'Private homepage URL never reaches fetch')
        page.evaluate("window.__scanMode='429'");complete(page, health)
        check('unavailable' in page.locator('#result-heading').inner_text().lower(), 'Rate-limited check is explicitly unavailable')
        ctx.close()
        compare = next(t for t in CATALOG['tools'] if t['id'] == 'competitor-website-comparison')
        ctx, page = load(browser, compare['id'], width=1440);page.evaluate("window.__scanMode='partial'");complete(page, compare)
        check(page.locator('.tool-report-table tbody tr').count() == 12, 'Comparison renders 12 evidence rows')
        check('Unavailable' in page.locator('.tool-report-table').inner_text(), 'Failed competitor is not treated as missing features')
        page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT / 'comparison-desktop.png'), full_page=True);ctx.close()
        # Lead failure, retry, report payload, confirmation, reload, and analytics privacy.
        ctx, page = load(browser, 'custom-software-roi-calculator')
        roi = next(t for t in CATALOG['tools'] if t['id'] == 'custom-software-roi-calculator');complete(page, roi)
        page.locator('#review-name').fill('Test Visitor');page.locator('#review-email').fill('fixture@example.com');page.locator('#review-business').fill('Fixture Co')
        page.locator('#send-review').click();check(page.evaluate('window.__posts.length') == 0, 'Lead consent is required before POST')
        page.locator('input[name="consent"]').check();page.evaluate('window.__postStatus=500');page.locator('#send-review').click()
        expect(page.locator('#review-error')).to_be_visible()
        check(page.locator('#review-email').input_value() == 'fixture@example.com' and len(page.locator('#review-summary').input_value()) > 100, 'Failed submission preserves email and report')
        check(not page.evaluate('window.__stored["renatus:business-review:accepted"] || null'), 'Failed submission creates no confirmation marker')
        page.evaluate('window.__postStatus=200');page.locator('#send-review').click();page.wait_for_timeout(50)
        check(page.evaluate('window.__assigned') == '/business-review-thank-you.html', 'Successful retry requests the confirmation route')
        payload = page.evaluate('Object.fromEntries(new URLSearchParams(window.__posts.at(-1).body))')
        check(payload['form-name'] == 'renatus-business-review' and payload['source-tool'] == roi['id'] and '12000' in payload['result-summary'], 'Lead payload includes the correct source, consent, and result')
        stored = page.evaluate('window.__stored')
        check('fixture@example.com' not in json.dumps(stored), 'Session marker stores no contact details')
        check('fixture@example.com' not in json.dumps(events(page)) and '12000' not in json.dumps(events(page)), 'Analytics events exclude answers, amounts, and contact fields')
        ctx.close()
        ctx, page = load(browser, 'business-review-thank-you', store=stored)
        check(len(events(page, 'generate_lead')) == 1, 'Confirmed submission records one lead event')
        consumed = page.evaluate('window.__stored');ctx.close()
        ctx, page = load(browser, 'business-review-thank-you', store=consumed)
        check(len(events(page, 'generate_lead')) == 0, 'Refresh or direct confirmation visit does not count another lead');ctx.close()
        # All generated routes have accessible small-screen content and static nav.
        for slug in ['industries'] + [x['id'] for x in CATALOG['industries']]:
            ctx, page = load(browser, slug, width=390)
            check(no_overflow(page) and page.locator('h1').count() == 1, slug + ': mobile layout and one H1')
            ctx.close()
        ctx, page = load(browser, 'website-health-check', width=390, js=False)
        check(page.locator('#business-review-form').is_visible() and 'needs JavaScript' in page.locator('noscript').inner_text(), 'No-JavaScript visitor can still request a review')
        ctx.close()
        ctx, page = load(browser, 'website-cost-check')
        check(page.locator('#cost-questionnaire').count() == 1 and page.locator('#cost-next').is_visible(), 'Existing cost checker still initializes');ctx.close()
        ctx, page = load(browser, 'index', width=390)
        check(page.locator('a[href="/free-business-tools"]').count() > 0 and no_overflow(page), 'Homepage links to toolkit and fits mobile viewport')
        ctx.close()
        check(not ERRORS, 'No uncaught JavaScript errors: ' + repr(ERRORS))
        browser.close()
    (OUT / 'browser-results.json').write_text(json.dumps({'passed':len(CASES),'mode':'offline browser fixtures; no live provider requests','cases':CASES,'errors':ERRORS}, indent=2)+'\n')
    print(f'Passed {len(CASES)} browser fixture assertions. Screenshots: {OUT}')

if __name__ == "__main__":
    main()
