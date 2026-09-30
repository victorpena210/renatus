import {readFile,access,readdir} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {TOOLS,ALL_TOOLS} from '../js/business-tools-data.mjs';import {INDUSTRIES} from '../js/business-industries-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const pages=['free-business-tools','industries','business-review-thank-you',...TOOLS.map(t=>t.id),...INDUSTRIES.map(t=>t.id)];const issues=[];
const fields=['form-name','source-tool','source-page','method-version','result-summary','bot-field','name','email','business','website','timeline','budget','message','consent'];
for(const id of pages){
 const html=await readFile(path.join(root,id+'.html'),'utf8');
 for(const token of [`<link rel="canonical" href="https://renatus.technology/${id}">`,'aria-label="Main navigation"','/free-business-tools','/privacy-policy'])if(!html.includes(token))issues.push(`${id}: missing ${token}`);
 if((html.match(/<h1\b/g)||[]).length!==1)issues.push(`${id}: must have exactly one H1`);
 const ids=[...html.matchAll(/(?<![-\w])id="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)issues.push(`${id}: duplicate DOM IDs`);
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))try{JSON.parse(m[1]);}catch{issues.push(`${id}: invalid structured JSON`);}
 for(const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
  const pathname=m[1];if(pathname.startsWith('/.netlify/'))continue;
  let file=path.join(root,pathname==='/'?'index.html':pathname);if(!path.extname(file))file+='.html';try{await access(file);}catch{issues.push(`${id}: unresolved local path ${pathname}`);}
 }
 if(TOOLS.some(t=>t.id===id)||INDUSTRIES.some(t=>t.id===id)){
  const form=html.match(/<form id="business-review-form"[\s\S]*?<\/form>/)?.[0]??'';
  for(const f of fields)if(!form.includes(`name="${f}"`))issues.push(`${id}: missing static lead field ${f}`);
  for(const token of ['data-netlify="true"','data-netlify-honeypot="bot-field"','action="/business-review-thank-you.html"'])if(!form.includes(token))issues.push(`${id}: missing form setup ${token}`);
 }
}
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');
for(const id of [...ALL_TOOLS,...INDUSTRIES].map(t=>t.id))if(!sitemap.includes(`<loc>https://renatus.technology/${id}</loc>`))issues.push(`Sitemap missing ${id}`);
if(sitemap.includes('business-review-thank-you'))issues.push('Confirmation page must not be in sitemap');
for(const folder of ['netlify','lib','tests','scripts','.git'])try{await access(path.join(root,folder));issues.push(`Private source directory leaked to dist: ${folder}`);}catch{}
const thank=await readFile(path.join(root,'business-review-thank-you.html'),'utf8');if(!thank.includes('noindex, follow'))issues.push('Thank-you page must be noindex');
if(issues.length)throw new Error(issues.join('\n'));
console.log(`Validated ${pages.length} new pages, lead schemas, local links, canonical metadata, sitemap, and private-source exclusions.`);
