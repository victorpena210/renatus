/** Conservative source-HTML observations, not a browser DOM, performance score,
 * rendered accessibility audit, or security verdict. Raw markup is never returned.
 */
export function decodeEntities(text){
 const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
 return String(text).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,v)=>{
  if(v[0]!=='#')return named[v.toLowerCase()]??_;
  const point=v[1].toLowerCase()==='x'?parseInt(v.slice(2),16):parseInt(v.slice(1),10);
  return point>0&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)?String.fromCodePoint(point):'�';
 });
}
function attributes(source){
 const values=Object.create(null);let i=0;
 while(i<source.length){
  while(i<source.length&&/[\s/]/.test(source[i]))i++;
  const begin=i;while(i<source.length&&!/[\s=/>]/.test(source[i]))i++;
  if(i===begin){i++;continue;}
  const key=source.slice(begin,i).toLowerCase();while(i<source.length&&/\s/.test(source[i]))i++;
  let value='';
  if(source[i]==='='){
   i++;while(i<source.length&&/\s/.test(source[i]))i++;
   const quote=source[i];
   if(quote==='"'||quote==="'"){const begin=++i;while(i<source.length&&source[i]!==quote)i++;value=source.slice(begin,i);if(i<source.length)i++;}
   else{const begin=i;while(i<source.length&&!/[\s>]/.test(source[i]))i++;value=source.slice(begin,i);}
  }
  if(!(key in values))values[key]=decodeEntities(value);
 }
 return values;
}
// A bounded source lexer, deliberately not an HTML5 browser parser. Each tag is
// scanned once; malformed nested '<' sequences cannot trigger regex backtracking.
function* sourceTags(source){
 const lower=source.toLowerCase();let cursor=0;
 const rawNames=new Set(['script','style','noscript','textarea','title','iframe','xmp','noembed']);
 while(cursor<source.length){
  const start=source.indexOf('<',cursor);if(start<0)return;
  if(source.startsWith('<!--',start)){const end=source.indexOf('-->',start+4);cursor=end<0?source.length:end+3;continue;}
  let i=start+1;const closing=source[i]==='/';if(closing)i++;
  if(!/[a-z]/i.test(source[i]??'')){cursor=i+1;continue;}
  const nameStart=i;while(i<source.length&&/[a-z\d:-]/i.test(source[i]))i++;
  const name=lower.slice(nameStart,i),attrStart=i;
  if(i<source.length&&!/[\s/>]/.test(source[i])){cursor=i+1;continue;}
  let quote=null;
  for(;i<source.length;i++){
   const char=source[i];
   if(quote){if(char===quote)quote=null;continue;}
   if(char==='"'||char==="'"){quote=char;continue;}
   if(char==='>'||char==='<')break;
  }
  if(i>=source.length)return;
  if(source[i]==='<'){cursor=i;continue;}
  const attrs=attributes(source.slice(attrStart,i));cursor=i+1;let content='';
  if(!closing&&name==='plaintext')return;
  if(!closing&&rawNames.has(name)){
   let close=lower.indexOf(`</${name}`,cursor),end=-1;
   while(close>=0){
    let j=close+name.length+2;while(j<source.length&&/\s/.test(source[j]))j++;
    if(source[j]==='>'){end=j;break;}
    close=lower.indexOf(`</${name}`,close+name.length+2);
   }
   content=source.slice(cursor,close<0?source.length:close);cursor=end<0?source.length:end+1;
  }
  yield {closing,name,attrs,content};
 }
}
export function htmlSignals(html,url,headers={}){
 const tags=[],jsonld=[];let head=true,title='',templateDepth=0;
 for(const {closing,name,attrs,content} of sourceTags(String(html))){
  if(name==='template'){templateDepth=Math.max(0,templateDepth+(closing?-1:1));continue;}
  if(templateDepth)continue;
  if(name==='body')head=false;
  if(closing){if(name==='head')head=false;continue;}
  if(name==='script'&&attrs.type?.toLowerCase()==='application/ld+json'){
   try{jsonld.push(JSON.parse(content));}catch{jsonld.push(null);}
  }
  if(name==='title'&&head&&!title)title=decodeEntities(content).replace(/\s+/g,' ').trim().slice(0,240);
  tags.push({name,attrs,head});
 }
 const find=(name,predicate=()=>true)=>tags.filter(t=>t.name===name&&predicate(t));
 const metas=find('meta',t=>t.head),getMeta=name=>metas.find(t=>t.attrs.name?.toLowerCase()===name)?.attrs.content??'';
 const description=getMeta('description').trim().slice(0,400),viewport=getMeta('viewport'),language=find('html')[0]?.attrs.lang?.trim()??'';
 const canonicalTag=find('link',t=>t.head&&t.attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'))[0];
 let canonical='';try{const c=new URL(canonicalTag?.attrs.href??'',url);if(canonicalTag?.attrs.href&&['http:','https:'].includes(c.protocol)&&!c.username&&!c.password)canonical=c.origin+c.pathname;}catch{/* Unusable declaration. */}
 const robots=[getMeta('robots'),getMeta('googlebot'),headers['x-robots-tag']??''].join(',');
 const noindex=/(?:^|[\s,:])(?:noindex|none)(?:$|[\s,;])/i.test(robots);
 const images=find('img'),missing=images.filter(t=>!Object.hasOwn(t.attrs,'alt')).length;
 const h1=find('h1').length,main=find('main').length+tags.filter(t=>t.attrs.role==='main').length;
 const mixed=tags.filter(t=>(['script','img','iframe','source','video','audio'].includes(t.name)||(t.name==='link'&&/^(?:stylesheet|preload|modulepreload|icon)$/i.test(t.attrs.rel??'')))&&/^http:\/\//i.test(t.attrs.src??t.attrs.href??'')).length;
 const https=new URL(url).protocol==='https:';
 const types=new Set();
 function visit(value,depth=0){if(depth>12||value===null||typeof value!=='object')return;if(Array.isArray(value)){value.slice(0,100).forEach(v=>visit(v,depth+1));return;}const type=value['@type'];if(typeof type==='string')types.add(type.slice(0,80));else if(Array.isArray(type))type.filter(t=>typeof t==='string').slice(0,20).forEach(t=>types.add(t.slice(0,80)));if(value['@graph'])visit(value['@graph'],depth+1);}
 jsonld.forEach(v=>visit(v));
 const checks=[];const add=(key,label,condition,yes,no)=>checks.push({key,label,status:condition?'observed':'not-observed',detail:condition?yes:no});
 add('https','HTTPS page address',https,'The retrieved page used HTTPS with normal TLS certificate validation. This does not establish overall security.','The final page used HTTP. Review HTTPS availability and the intended redirects.');
 add('title','Page title',!!title,`Observed title: ${title}`,'No non-empty title was observed in the returned source. Check the rendered page too.');
 add('description','Meta description',!!description,`Observed description: ${description}`,'No non-empty meta description was observed in the source.');
 add('viewport','Viewport declaration',!!viewport,`Observed: ${viewport.slice(0,180)}. This does not prove mobile usability.`,'No viewport declaration was observed. Review the mobile rendering separately.');
 add('heading','Main heading markup',h1>0,`${h1} H1 element${h1===1?'':'s'} observed. Heading clarity and hierarchy need human review.`,'No H1 element was observed in returned HTML. JavaScript-rendered content may differ.');
 add('language','Document language',!!language,`Declared language: ${language.slice(0,60)}. Accuracy is not evaluated.`,'No non-empty lang attribute was observed on the HTML element.');
 add('canonical','Canonical declaration',!!canonical,`Declared: ${canonical}. Destination, indexing and appropriateness are not verified.`,'No usable HTTP(S) canonical declaration was observed; whether one is needed requires context.');
 checks.push({key:'indexing',label:'Explicit indexing directive',status:noindex?'review':'observed',detail:noindex?'An explicit noindex/none directive was observed. Confirm whether exclusion is intentional.':'No explicit noindex marker was observed in supported meta tags or the response header. This does not prove crawlability or indexing.'});
 add('structured','JSON-LD markup',types.size>0,`Declared types: ${[...types].slice(0,12).join(', ')}. Not a schema validation or rich-result guarantee.`,'No recognized JSON-LD @type was observed. Other markup formats are not evaluated; markup is not required for every page.');
 checks.push({key:'alt',label:'Image alt attributes',status:images.length===0?'not-applicable':missing?'review':'observed',detail:images.length===0?'No IMG elements observed; rendered images and CSS backgrounds are not evaluated.':`${images.length} IMG elements; ${missing} without an alt attribute. Empty alt may be appropriate for decorative images; text quality is not assessed.`});
 add('landmark','Main-content landmark',main>0,'A main element or role=main was observed. Keyboard navigation and landmark structure are not verified.','No main-content landmark was observed in source HTML.');
 checks.push({key:'mixed',label:'Plain-HTTP resource declarations',status:!https?'not-applicable':mixed?'review':'observed',detail:!https?'Mixed-content review applies to an HTTPS page.':mixed?`${mixed} supported resource tag(s) declare a plain-HTTP source. Confirm browser behavior and the complete dependency chain.`:'No plain-HTTP resource URL was observed in the supported source attributes. CSS, dynamic requests, and srcset are not exhaustively checked.'});
 return {checks,title,description,limits:'HTML source only. No JavaScript execution, visual inspection, speed measurement, security testing, full accessibility audit, live rankings, or form-delivery test.'};
}
