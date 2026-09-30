/** Public, read-only homepage retrieval. No authentication, cookies or arbitrary ports.
 * IPv4-only egress is intentional: IPv6-only sites return unavailable instead of
 * broadening the SSRF surface. Each DNS answer and redirect is validated and the
 * chosen address is pinned into the TLS/HTTP request's lookup callback.
 */
import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import {normalizeWebsite} from '../js/business-tools-model.mjs';

function ipv4Number(address){
 const parts=address.split('.');
 if(parts.length!==4||parts.some(p=>!/^\d{1,3}$/.test(p)||Number(p)>255))return null;
 return parts.reduce((n,p)=>(n*256+Number(p))>>>0,0);
}
const BLOCKED=[['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]].map(([network,bits])=>[ipv4Number(network),(0xffffffff<<(32-bits))>>>0]);
export function isPublicIPv4(address){const n=ipv4Number(address);return n!==null&&!BLOCKED.some(([network,mask])=>(n&mask)===(network&mask));}
function beforeDeadline(promise,ms,message){
 let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})]).finally(()=>clearTimeout(timer));
}
export async function resolvePublicIPv4(hostname,lookup=dns.lookup){
 const answers=await beforeDeadline(lookup(hostname,{all:true,family:4,verbatim:true}),2500,'DNS lookup timed out.');
 if(!answers.length||answers.some(a=>a.family!==4||!isPublicIPv4(a.address)))throw new Error('This domain does not resolve exclusively to supported public IPv4 addresses.');
 return answers[0].address;
}
export function validateRedirect(value){
 const u=new URL(value);
 // Validate the original URL first so credentials and nonstandard ports cannot be dropped silently.
 normalizeWebsite(u.href);
 u.hostname=u.hostname.replace(/\.$/,'');u.search='';u.hash='';
 if(u.href.length>2048)throw new Error('The redirect address is too long.');
 return u;
}
export function pinnedLookup(address){
 if(!isPublicIPv4(address))throw new Error('A public address is required.');
 return (_hostname,options,callback)=>{
  if(typeof options==='function'){callback=options;options={};}
  if(options?.all)callback(null,[{address,family:4}]);else callback(null,address,4);
 };
}
async function requestOnce(url,{maxBytes,deadline,lookup=dns.lookup}){
 const address=await resolvePublicIPv4(url.hostname,lookup);
 const remaining=Math.min(6500,deadline-Date.now());if(remaining<=0)throw new Error('The website check timed out.');
 return new Promise((resolve,reject)=>{
  let settled=false,timer;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};
  const transport=url.protocol==='https:'?https:http;
  const req=transport.request(url,{
   method:'GET',agent:false,family:4,autoSelectFamily:false,lookup:pinnedLookup(address),maxHeaderSize:16384,
   headers:{'User-Agent':'RenatusCheck/1.0 (+https://renatus.technology/free-business-tools)','Accept':'text/html,text/plain;q=0.9,*/*;q=0.1','Accept-Encoding':'identity'}
  },res=>{
   const code=res.statusCode??0;
   if([301,302,303,307,308].includes(code)){res.destroy();finish(null,{status:code,headers:res.headers,body:''});return;}
   const size=Number(res.headers['content-length']||0);
   if(size>maxBytes){res.destroy();finish(new Error('The page exceeds the safe response-size limit.'));return;}
   if(res.headers['content-encoding']&&!['identity'].includes(res.headers['content-encoding'])){res.destroy();finish(new Error('The website returned an unsupported encoded response.'));return;}
   const parts=[];let bytes=0;
   res.on('data',chunk=>{bytes+=chunk.length;if(bytes>maxBytes){res.destroy();finish(new Error('The page exceeds the safe response-size limit.'));}else parts.push(chunk);});
   res.on('end',()=>finish(null,{status:code,headers:res.headers,body:Buffer.concat(parts).toString('utf8')}));
   res.on('error',error=>finish(error));res.on('aborted',()=>finish(new Error('The website response was interrupted.')));
  });
  timer=setTimeout(()=>{req.destroy();finish(new Error('The website check timed out.'));},remaining);
  req.on('error',error=>finish(error));req.end();
 });
}
export async function fetchPublic(value,{maxBytes=1024*1024,deadline=Date.now()+16000,beforeRequest,lookup,request=requestOnce}={}){
 let url=validateRedirect(value);
 for(let hop=0;hop<=3;hop++){
  if(Date.now()>=deadline)throw new Error('The website check timed out.');
  if(beforeRequest)await beforeRequest(url);
  const result=await request(url,{maxBytes,deadline,lookup});
  if(![301,302,303,307,308].includes(result.status))return {...result,url:url.href};
  if(hop===3)throw new Error('Too many homepage redirects.');
  if(typeof result.headers.location!=='string')throw new Error('The website returned an incomplete redirect.');
  url=validateRedirect(new URL(result.headers.location,url).href);
 }
 throw new Error('Unable to retrieve the homepage.');
}
// Greedy wildcard matching avoids constructing attacker-supplied regular
// expressions. The bounded robots file and URL lengths cap the work.
function pathMatches(pattern,text){
 const anchored=pattern.endsWith('$');pattern=anchored?pattern.slice(0,-1):pattern+'*';
 let p=0,t=0,star=-1,retry=0;
 while(t<text.length){
  if(pattern[p]==='*'){star=p++;retry=t;}
  else if(p<pattern.length&&pattern[p]===text[t]){p++;t++;}
  else if(star>=0){p=star+1;t=++retry;}
  else return false;
 }
 while(pattern[p]==='*')p++;return p===pattern.length;
}
export function robotsAllows(text,path='/',agent='renatuscheck'){
 const groups=[];let group=null,hasRules=false;
 for(const raw of text.split(/\r?\n/)){
  const line=raw.replace(/#.*/,'').trim();const colon=line.indexOf(':');if(colon<0)continue;
  const key=line.slice(0,colon).trim().toLowerCase(),value=line.slice(colon+1).trim();
  if(key==='user-agent'){
   if(!group||hasRules){group={agents:[],rules:[]};groups.push(group);hasRules=false;}
   group.agents.push(value.toLowerCase());
  }else if(group&&['allow','disallow'].includes(key)){hasRules=true;if(value)group.rules.push({allow:key==='allow',value});}
 }
 const product=agent.toLowerCase();
 const specificity=g=>Math.max(0,...g.agents.filter(a=>a!=='*'&&a&&product.includes(a)).map(a=>a.length));
 const longest=Math.max(0,...groups.map(specificity));
 const chosen=longest?groups.filter(g=>specificity(g)===longest):groups.filter(g=>g.agents.includes('*'));
 const matches=[];
 for(const rule of chosen.flatMap(g=>g.rules)){
  if(pathMatches(rule.value,path))matches.push({...rule,length:rule.value.replace(/\$$/,'').replaceAll('*','').length});
 }
 matches.sort((a,b)=>b.length-a.length||Number(b.allow)-Number(a.allow));return matches.length?matches[0].allow:true;
}
export async function getHomepage(raw,{fetcher=fetchPublic}={}){
 const requestedUrl=normalizeWebsite(raw),deadline=Date.now()+20000,robots=new Map();
 async function checkRobots(url){
  if(!robots.has(url.origin)){
   const r=await fetcher(`${url.origin}/robots.txt`,{maxBytes:65536,deadline});
   if(r.status===401||r.status===403||r.status===429||r.status>=500)throw new Error('The website’s crawler policy could not be safely confirmed.');
   robots.set(url.origin,r.status===200?r.body:'');
  }
  if(!robotsAllows(robots.get(url.origin),url.pathname))throw new Error('The website’s robots.txt disallows this automated check.');
 }
 const response=await fetcher(requestedUrl,{deadline,beforeRequest:checkRobots});
 if(response.status!==200)throw new Error(`The homepage returned HTTP ${response.status}; no page assessment was generated.`);
 if(!/\btext\/html\b|\bapplication\/xhtml\+xml\b/i.test(response.headers['content-type']||''))throw new Error('The homepage did not return supported HTML.');
 return {...response,requestedUrl};
}
