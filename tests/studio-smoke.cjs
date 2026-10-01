/** Offline redesign regression: render every route, exercise menus and tools.
 * npm install --no-save playwright && npx playwright install chromium
 * npm run test:design (after npm run build). Optional CHROMIUM_PATH override.
 * All requests are fulfilled from dist or fixtures; no forms leave this test.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '', 'playwright')); }
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.ico':'image/x-icon'};
const sample = {minutes:30,weekly:10,weeks:50,hourly:40,reduction:50,monthlyTools:100,setup:2000,build:12000,hours:40,cash:200,running:300,months:12,year:2020};
async function main() {
 const {TOOLS}=await import(pathToFileURL(path.join(root,'js/business-tools-data.mjs')));
 const snapshot=JSON.parse(await fs.readFile(path.join(__dirname,'fixtures/homepage-snapshot.json')));
 const browser=await playwright.chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[],missing=[],posts=[];
 let postStatus=500;
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.hostname!=='renatus.test') return route.abort();
  if(u.pathname==='/.netlify/functions/site-snapshot')return route.fulfill({status:200,json:snapshot});
  if(req.method()==='POST'){posts.push(req.postData());return route.fulfill({status:postStatus,body:'Offline test only'});}
  let file=path.join(dist,u.pathname==='/'?'index.html':decodeURIComponent(u.pathname));
  try{try{await fs.stat(file)}catch{file+='.html'}await route.fulfill({status:200,body:await fs.readFile(file),contentType:mime[path.extname(file)]});}
  catch{missing.push(u.pathname);await route.fulfill({status:404,body:'Missing asset'});}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 async function go(slug=''){await page.goto('http://renatus.test/'+slug,{waitUntil:'load'});}
 async function fits(label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' has horizontal overflow');}
 let pages=0;
 for(const name of (await fs.readdir(dist)).filter(n=>n.endsWith('.html'))){
  await go(name);for(const width of [1440,768,360]){await page.setViewportSize({width,height:900});await fits(name+' '+width);}
  assert.equal(await page.locator('nav[aria-label="Main navigation"]').count(),1,name+' main navigation');pages++;
 }
 await go();
 const toggle=page.locator('.nav-toggle');await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
 await page.getByText('What we build',{exact:true}).click();assert(await page.locator('.nav-submenu').first().isVisible());
 await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(await toggle.evaluate(e=>e===document.activeElement));
 await page.setViewportSize({width:1440,height:1000});
 await page.getByText('What we build',{exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-menu[open]').count(),0);
 assert.equal(await page.locator('[data-testimonial-list] .testimonial-card').count(),2,'Approved reviews must still render');
 await page.locator('#contact-form button[type=submit]').click();assert.equal(posts.length,0,'Invalid form must not submit');
 await page.locator('#contact-name').fill('Offline Test');await page.locator('#contact-email').fill('test@example.invalid');await page.locator('#contact-message').fill('Offline fixture only.');
 await page.evaluate(()=>{document.querySelector('#contact-form').addEventListener('submit',e=>{e.preventDefault();window.__validContact=new FormData(e.target).get('message')},{once:true});});
 await page.locator('#contact-form button[type=submit]').click();assert.equal(await page.evaluate(()=>window.__validContact),'Offline fixture only.');assert.equal(posts.length,0);
 await go('free-business-tools');assert.equal(await page.locator('#tool-cards .tool-card:visible').count(),14);
 await page.locator('[data-filter="Operations"]').click();assert.equal(await page.locator('#tool-cards .tool-card:visible').count(),TOOLS.filter(t=>t.category==='Operations').length);
 await page.locator('[data-filter="All"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#tool-cards .tool-card:visible').count(),14);
 for(const tool of TOOLS){console.log('Checking',tool.id);
  await go(tool.id);await page.setViewportSize({width:390,height:900});
  for(let step=0;step<12&&!await page.locator('#tool-results').isVisible();step++){
   for(const q of tool.questions){const el=page.locator('#answer-'+q.id);if(!await el.isVisible())continue;const value=q.optional?'':q.type==='select'?q.options[0].value:q.type==='url'?(q.id==='competitor'?'example.org':'example.com'):(sample[q.id]??Math.max(q.min||0,1));if(q.type==='select')await el.selectOption(String(value));else await el.fill(String(value));}
   await page.locator('#tool-next').click();await page.waitForFunction(()=>!document.querySelector('#tool-next').disabled);
  }
  assert(await page.locator('#tool-results').isVisible(),tool.id+' should produce a result');assert((await page.locator('#review-summary').inputValue()).length>100);await fits(tool.id+' result');
  if(tool.id==='custom-software-roi-calculator')assert.match(await page.locator('#result-metrics').innerText(),/\$1,500\.00/);
 }
 // A failed review must keep the user's input, with a working retry path.
 await page.locator('#review-name').fill('Offline Test');await page.locator('#review-email').fill('test@example.invalid');
 const consent=page.locator('#business-review-form input[type=checkbox]');if(await consent.count())await consent.first().check();
 await page.locator('#business-review-form button[type=submit]').click();await page.locator('#review-error').waitFor({state:'visible'});assert.equal(await page.locator('#review-name').inputValue(),'Offline Test');assert(posts.length>=1);
 postStatus=200;await page.locator('#business-review-form button[type=submit]').click();await page.waitForURL('**/business-review-thank-you*');assert.match(await page.locator('#confirmation-title').innerText(),/received|thank|request/i);
 await go('is-the-shuttle-running');await page.locator('[data-shuttle-state="paused"]').click();assert.equal(await page.locator('[data-shuttle-state="paused"]').getAttribute('aria-pressed'),'true');
 assert.deepEqual(errors,[],'Uncaught JavaScript errors');assert.deepEqual(missing,[],'Missing local assets');
 await browser.close();console.log(`Passed: ${pages} pages at 3 widths, navigation, approved reviews, contact validation, 13 tool flows, result layout, review failure/retry, shuttle preview. No live submissions.`);
}
main().catch(e=>{console.error(e);process.exit(1)});
