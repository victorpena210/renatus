import test from 'node:test';import assert from 'node:assert/strict';
import {isPublicIPv4,resolvePublicIPv4,pinnedLookup,validateRedirect,fetchPublic,robotsAllows,getHomepage} from '../lib/public-web.mjs';
import {htmlSignals,decodeEntities} from '../lib/html-signals.mjs';
import {createHandler,config} from '../netlify/functions/site-snapshot.mjs';
const HTML='<!doctype html><html lang="en"><head><title>A &amp; B</title><meta name="description" content="Useful services"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization"}</script></head><body><main><h1>A service</h1><img src="/photo.png" alt=""></main></body></html>';
test('public IPv4 filter blocks every special or private test range',()=>{for(const ip of ['0.1.2.3','10.1.2.3','100.64.1.1','127.0.0.1','169.254.169.254','172.16.0.1','172.31.255.255','192.168.1.1','192.0.0.9','192.0.2.1','192.88.99.1','198.18.0.1','198.51.100.1','203.0.113.1','224.0.0.1','255.255.255.255','::1','::ffff:127.0.0.1','bad','8.8.8.999'])assert.equal(isPublicIPv4(ip),false,ip);for(const ip of ['1.1.1.1','8.8.8.8','172.32.0.1','100.63.255.255'])assert.equal(isPublicIPv4(ip),true,ip);});
test('DNS rejects mixed public/private answers and IPv6-only hosts',async()=>{await assert.rejects(resolvePublicIPv4('fixture.com',async()=>[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}]));await assert.rejects(resolvePublicIPv4('fixture.com',async()=>[]));await assert.rejects(resolvePublicIPv4('fixture.com',async()=>[{address:'::1',family:6}]));});
test('DNS chooses only an explicitly validated address',async()=>{assert.equal(await resolvePublicIPv4('fixture.com',async()=>[{address:'8.8.8.8',family:4}]),'8.8.8.8');});
test('pinned socket lookup never performs a second DNS request',()=>{pinnedLookup('8.8.8.8')('rebind.example.com',{},(error,address,family)=>{assert.equal(error,null);assert.equal(address,'8.8.8.8');assert.equal(family,4);});pinnedLookup('8.8.8.8')('anything',{all:true},(error,list)=>assert.deepEqual(list,[{address:'8.8.8.8',family:4}]));assert.throws(()=>pinnedLookup('127.0.0.1'));});
test('redirect validation does not lose credentials before rejecting them',()=>{for(const value of ['http://127.0.0.1/','https://user:password@example.com/path','https://example.com:8443/x','file:///x'])assert.throws(()=>validateRedirect(value));assert.equal(validateRedirect('https://example.com/en?token=private#x').href,'https://example.com/en');});
test('redirects are validated before the next network request',async()=>{let calls=0;await assert.rejects(fetchPublic('https://example.com/',{request:async()=>{calls++;return {status:302,headers:{location:'http://127.0.0.1/admin'}};}}));assert.equal(calls,1);});
test('redirect loops are bounded',async()=>{let count=0;await assert.rejects(fetchPublic('https://example.com/',{request:async()=>{count++;return {status:302,headers:{location:'/again'}};}}),/Too many/);assert.equal(count,4);});
test('robots respects root disallow, a longer allow, and specific agent group',()=>{assert.equal(robotsAllows('User-agent: *\nDisallow: /'),false);assert.equal(robotsAllows('User-agent: *\nDisallow: /\nAllow: /public','/public'),true);assert.equal(robotsAllows('User-agent: *\nDisallow: /\nUser-agent: RenatusCheck\nAllow: /'),true);assert.equal(robotsAllows('User-agent: *\nDisallow: /*.php$','/x.php'),false);assert.equal(robotsAllows('User-agent: *\nDisallow: /*.php$','/x.php/more'),true);});
test('homepage retrieval requests crawler policy and honors disallow',async()=>{let pageReads=0;const fetcher=async(url,options)=>{if(url.endsWith('/robots.txt'))return {status:200,body:'User-agent: *\nDisallow: /',headers:{}};await options.beforeRequest(new URL(url));pageReads++;return {status:200,body:HTML,headers:{'content-type':'text/html'},url};};await assert.rejects(getHomepage('example.com',{fetcher}),/disallows/);assert.equal(pageReads,0);});
test('homepage does not turn 403 or non-HTML responses into a report',async()=>{await assert.rejects(getHomepage('example.com',{fetcher:async()=>({status:403,headers:{},body:''})}),/HTTP 403/);await assert.rejects(getHomepage('example.com',{fetcher:async()=>({status:200,headers:{'content-type':'application/pdf'},body:''})}),/supported HTML/);});
test('HTML checker returns specific observations, not a security/SEO score',()=>{const r=htmlSignals(HTML,'https://example.com/');assert.equal(r.title,'A & B');assert.equal(r.checks.length,12);assert.equal(r.score,undefined);assert.equal(r.checks.find(c=>c.key==='structured').status,'observed');assert.equal(r.checks.find(c=>c.key==='alt').status,'observed');});
test('comments, script strings, and body metadata are not head evidence',()=>{const html='<html><head><!-- <title>fake</title> --><script>const h="<meta name=description content=fake><h1>fake</h1>";</script></head><body><meta name="description" content="fake"></body></html>';const r=htmlSignals(html,'https://example.com');for(const k of ['title','description','heading'])assert.equal(r.checks.find(c=>c.key===k).status,'not-observed');});
test('noindex is contextual review, not proof a site is broken',()=>{assert.equal(htmlSignals(HTML,'https://example.com',{'x-robots-tag':'noindex'}).checks.find(c=>c.key==='indexing').status,'review');});
test('image alt presence is distinguished from quality and not applicable',()=>{const r=htmlSignals('<html><body><img src=x><img alt=""></body></html>','https://example.com');assert.equal(r.checks.find(c=>c.key==='alt').status,'review');assert.match(r.checks.find(c=>c.key==='alt').detail,/1 without/);assert.equal(htmlSignals('','https://example.com').checks.find(c=>c.key==='alt').status,'not-applicable');});
test('malformed JSON-LD does not produce a structured-data claim',()=>{assert.equal(htmlSignals('<script type="application/ld+json">{oops}</script>','https://example.com').checks.find(c=>c.key==='structured').status,'not-observed');});
test('entity decoding is bounded and safe for malformed code points',()=>{assert.equal(decodeEntities('&#x41; &amp; &#1114112;'),'A & �');});
const request=(body={url:'https://fixture-business.com'},patch={})=>new Request('https://renatus.technology/.netlify/functions/site-snapshot',{method:'POST',headers:{origin:'https://renatus.technology','content-type':'application/json',...patch.headers},body:JSON.stringify(body),...Object.fromEntries(Object.entries(patch).filter(([k])=>k!=='headers'))});
test('function requires same origin and JSON and rejects private URLs',async()=>{const handler=createHandler();assert.equal((await handler(request({}, {headers:{origin:'https://elsewhere.com'}}))).status,403);assert.equal((await handler(request({}, {headers:{'content-type':'text/plain'}}))).status,415);assert.equal((await handler(request({url:'http://127.0.0.1'}))).status,400);});
test('function rejects oversized request body',async()=>{assert.equal((await createHandler()(request({url:'x'.repeat(5000)}))).status,400);});
test('function returns only derived signals and timestamps',async()=>{const handler=createHandler({homepage:async url=>({body:HTML,headers:{},url}),now:()=>2000000000000});const response=await handler(request({url:'https://snapshot-fixture.com'}));assert.equal(response.status,200);const result=await response.json();assert.equal(result.ok,true);assert.equal(result.body,undefined);assert.equal(result.checkedAt,'2033-05-18T03:33:20.000Z');});
test('function does not leak arbitrary network error detail',async()=>{const response=await createHandler({homepage:async()=>{throw new Error('connect ECONNREFUSED 10.0.0.1 password=secret');}})(request({url:'https://failed-fixture.com'}));const r=await response.json();assert.equal(response.status,422);assert.doesNotMatch(r.error,/10\.0|secret/);});
test('edge rate limit is configured rather than faked in browser storage',()=>{assert.equal(config.rateLimit.windowLimit,12);assert.deepEqual(config.rateLimit.aggregateBy,['ip']);});
test('resource observations include script and iframe sources, not canonical targets',()=>{
 const r=htmlSignals('<html><head><link rel="canonical" href="http://example.com/"><script src="http://example.com/a.js"></script></head><body><iframe src="http://example.com/frame"></iframe></body></html>','https://example.com');
 assert.match(r.checks.find(c=>c.key==='mixed').detail,/2 supported/);
});
test('nested inert template markup is not counted as live headings',()=>{
 const r=htmlSignals('<template><template><h1>Not live</h1></template><h1>Still not live</h1></template><h1>Live</h1>','https://example.com');
 assert.match(r.checks.find(c=>c.key==='heading').detail,/^1 H1/);
});
test('large malformed tag sequences finish without catastrophic backtracking',()=>{
 const r=htmlSignals('<a '.repeat(20000)+'<h1>Only valid heading</h1>','https://example.com');assert.match(r.checks.find(c=>c.key==='heading').detail,/^1 H1/);
});
test('robots uses longest matching product token and literal punctuation',()=>{
 assert.equal(robotsAllows('User-agent: Renatus\nDisallow: /\nUser-agent: RenatusCheck\nAllow: /'),true);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /a.b$','/axb'),true);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /a.b$','/a.b'),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /'+'*a'.repeat(100)+'b$', '/'+ 'a'.repeat(400)),true);
});
test('function cache reuses success, expires, and does not mix handler instances',async()=>{
 let at=2000000000000,calls=0;const handler=createHandler({homepage:async url=>{calls++;return {url,body:HTML,headers:{}};},now:()=>at});
 await handler(request());assert.equal((await (await handler(request())).json()).cached,true);assert.equal(calls,1);
 at+=600001;await handler(request());assert.equal(calls,2);
 const separate=createHandler({homepage:async()=>{throw new Error('No network in this fixture');}});assert.equal((await separate(request())).status,422);
});
