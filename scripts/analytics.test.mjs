import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const bootstrap = readFileSync(new URL('../js/analytics-config.js', import.meta.url), 'utf8');
const lead = readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');
const memory = (entries = []) => {
  const map = new Map(entries);
  return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};
};
function boot(url, storage = memory()) {
  const scripts = [];
  const context = {window:{location:new URL(url)}, document:{referrer:'https://example.com/page?email=private@example.com',head:{appendChild:x=>scripts.push(x)},createElement:()=>({})},localStorage:storage,URL,URLSearchParams};
  vm.runInNewContext(bootstrap,context);
  return {...context, scripts};
}
test('only public HTTPS domains load Analytics; localhost, previews, lookalikes and file pages stay quiet',()=>{
 for(const url of ['http://127.0.0.1:4173/','http://localhost/','https://preview.netlify.app/','https://renatus.technology.evil.test/','http://renatus.technology/','file:///tmp/index.html']) {
  const x=boot(url);x.window.gtag('event','generate_lead');assert.equal(x.scripts.length,0,url);assert.equal(x.window.renatusAnalyticsEnabled,false);
 }
 for(const url of ['https://renatus.technology/','https://www.renatus.technology/']) assert.equal(boot(url).scripts.length,1);
});
test('owner opt-out persists and explicit opt-in restores collection; duplicate loader is harmless',()=>{
 const storage=memory();
 assert.equal(boot('https://renatus.technology/?analytics=off',storage).scripts.length,0);
 assert.equal(boot('https://renatus.technology/pricing',storage).scripts.length,0);
 const x=boot('https://renatus.technology/?analytics=on',storage);
 assert.equal(x.scripts.length,1);vm.runInNewContext(bootstrap,x);assert.equal(x.scripts.length,1);
});
test('tracking URLs exclude free text and keep campaign attribution',()=>{
 const x=boot('https://renatus.technology/?email=private@example.com&utm_source=newsletter#private');
 const config=x.window.dataLayer.find(a=>a[0]==='config')[2];
 assert.equal(config.page_location,'https://renatus.technology/?utm_source=newsletter');
 assert.equal(config.page_referrer,'https://example.com/page');
});
function leadEnv({storage=memory(),confirm,fetcher=async()=>({ok:true})}={}) {
 const listeners={},events=[],destinations=[];
 class Form {
  dataset={gaLeadForm:'contact'};button={disabled:false};message=null;valid=true;
  elements={namedItem:()=>({value:''})};
  reportValidity(){return this.valid;}
  getAttribute(name){return {'action':'/thank-you.html','data-netlify-honeypot':'bot-field'}[name]??null;}
  querySelectorAll(){return [this.button];}
  querySelector(){return this.message;}
  appendChild(m){this.message=m;}
 }
 const context={document:{body:{dataset:confirm?{gaConfirmLead:confirm}:{}},readyState:'complete',addEventListener:(n,fn)=>listeners[n]=fn,createElement:()=>({dataset:{},setAttribute(){}})},window:{location:{href:'https://renatus.technology/',origin:'https://renatus.technology',assign:url=>destinations.push(url)},gtag:(...args)=>events.push(args)},sessionStorage:storage,HTMLFormElement:Form,FormData:class{*[Symbol.iterator](){yield ['form-name','contact'];}},URL,URLSearchParams,AbortController,setTimeout,clearTimeout,fetch:fetcher};
 vm.runInNewContext(lead,context);
 return {context,listeners,events,destinations,Form,storage,submit(form){return listeners.submit({target:form,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}});}};
}
test('failed and invalid submissions never become leads and failed forms remain retryable',async()=>{
 const x=leadEnv({fetcher:async()=>({ok:false})}),form=new x.Form();
 await x.submit(form);assert.equal(x.storage.map.size,0);assert.equal(x.destinations.length,0);assert.equal(form.button.disabled,false);assert.match(form.message.textContent,/could not be confirmed/);
 const invalid=new x.Form();invalid.valid=false;await x.submit(invalid);assert.equal(x.storage.map.size,0);
});
test('only one POST runs during double submit; accepted form counts once after confirmation',async()=>{
 let resolve,calls=0;const x=leadEnv({fetcher:()=>{calls++;return new Promise(r=>resolve=r);}}),form=new x.Form();
 const first=x.submit(form);await x.submit(form);assert.equal(calls,1);assert.equal(x.storage.map.size,0);
 resolve({ok:true});await first;assert.equal(x.destinations.length,1);
 const confirmation=leadEnv({storage:x.storage,confirm:'contact'});assert.equal(confirmation.events.length,1);
 assert.equal(confirmation.events[0][1],'generate_lead');
 assert.equal(leadEnv({storage:x.storage,confirm:'contact'}).events.length,0);
});
test('direct, stale, future and old attempt-marker visits are never counted',()=>{
 for (const entries of [[],[['renatus:pending-lead:contact',String(Date.now())]],[['renatus:accepted-lead:v2:contact',String(Date.now()-700000)]],[['renatus:accepted-lead:v2:contact',String(Date.now()+60000)]]]) {
  assert.equal(leadEnv({storage:memory(entries),confirm:'contact'}).events.length,0);
 }
});
test('network failure never sets a marker; storage failures do not break accepted form navigation',async()=>{
 const x=leadEnv({fetcher:async()=>{throw Error('network');}}),form=new x.Form();await x.submit(form);assert.equal(x.storage.map.size,0);
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 const y=leadEnv({storage:broken});await y.submit(new y.Form());assert.equal(y.destinations.length,1);assert.equal(leadEnv({storage:broken,confirm:'contact'}).events.length,0);
});

