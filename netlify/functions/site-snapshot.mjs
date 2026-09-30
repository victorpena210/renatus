import {getHomepage} from '../../lib/public-web.mjs';
import {htmlSignals} from '../../lib/html-signals.mjs';
import {normalizeWebsite} from '../../js/business-tools-model.mjs';

// Netlify enforces this at its edge; not a process-local request counter.
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip'],windowSize:60,windowLimit:12}};
const TTL=10*60*1000;
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function limitedBody(request){
 const reader=request.body?.getReader();if(!reader)throw new Error('A JSON request is required.');
 let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw new Error('The request is too large.');}chunks.push(value);}}
 finally{reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createHandler({homepage=getHomepage,signals=htmlSignals,now=Date.now}={}){
 const cache=new Map();
 return async function handler(request){
  if(request.method!=='POST')return json({error:'Use POST for a homepage check.'},405);
  // A same-origin browser request is required. This is not authentication: the
  // platform rate limit, destination checks and bounded fetches are still needed.
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin)return json({error:'Start the check from the Renatus website.'},403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??''))return json({error:'Send a JSON request.'},415);
  if(Number(request.headers.get('content-length')??0)>4096)return json({error:'The request is too large.'},413);
  let requestedUrl;
  try{const input=await limitedBody(request);requestedUrl=normalizeWebsite(input.url);}
  catch{return json({error:'Enter a public business domain without credentials or a custom port.'},400);}
  if(process.env.DISABLE_SITE_CHECKS==='true')return json({error:'Automated checks are temporarily disabled. You can still request a personal review.'},503);
  const stored=cache.get(requestedUrl);if(stored&&now()-stored.at<TTL)return json({...stored.value,cached:true});
  try{
   const page=await homepage(requestedUrl);
   const value={ok:true,requestedUrl,url:page.url,checkedAt:new Date(now()).toISOString(),...signals(page.body,page.url,page.headers),cached:false};
   if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(requestedUrl,{at:now(),value});
   return json(value);
  }catch(error){
   // Do not expose network internals, resolved addresses, stack traces, or HTML.
   const known=/^(?:The (?:website|homepage|page)|This domain|Too many|DNS lookup|Unable to retrieve)/.test(error.message??'');
   return json({ok:false,requestedUrl,error:known?error.message:'This public homepage could not be retrieved. The site may block automated requests or be temporarily unavailable.'},422);
  }
 };
}
export default createHandler();
