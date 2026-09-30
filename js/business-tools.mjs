import {getTool,ALL_TOOLS} from './business-tools-data.mjs';
import {INDUSTRIES} from './business-industries-data.mjs';
import {evaluate,attachSnapshots,normalizeWebsite,reportText} from './business-tools-model.mjs';
const $=id=>document.getElementById(id);
const knownSources=new Set([...ALL_TOOLS,...INDUSTRIES].map(t=>t.id));
const sourceId=knownSources.has(document.body.dataset.sourceId)?document.body.dataset.sourceId:'free-business-tools';
function track(name,extra={}){if(typeof window.gtag==='function')window.gtag('event',name,{tool_id:sourceId,...extra});}
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function focus(id){$(id)?.focus({preventScroll:true});$(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}

// Fixed categories only; no free-text search or private information is tracked.
const filters=document.querySelector('.tool-filters');
if(filters){
 filters.hidden=false;
 for(const button of filters.querySelectorAll('button'))button.addEventListener('click',()=>{
  const category=button.dataset.filter;let count=0;
  for(const other of filters.querySelectorAll('button'))other.setAttribute('aria-pressed',String(other===button));
  for(const card of document.querySelectorAll('#tool-cards .tool-card')){card.hidden=category!=='All'&&card.dataset.category!==category;if(!card.hidden)count++;}
  $('tool-count').textContent=`${count} ${count===1?'tool':'tools'} available${category==='All'?'':` · ${category}`}`;
 });
}

// One marker is written only after a successful POST; it contains no contact data.
if(document.body.dataset.sourceId==='business-review-thank-you'){
 try{
  const raw=sessionStorage.getItem('renatus:business-review:accepted');
  sessionStorage.removeItem('renatus:business-review:accepted');
  if(raw){const marker=JSON.parse(raw),elapsed=Date.now()-marker.at;
   if(knownSources.has(marker.sourceId)&&elapsed>=0&&elapsed<=600000){
    $('confirmation-title').textContent='Your request has been received.';
    $('confirmation-copy').textContent='The form endpoint accepted your request. Renatus can now review the details you chose to send.';
    if(typeof window.gtag==='function')window.gtag('event','generate_lead',{form_name:'renatus-business-review',lead_source:'Business toolkit',tool_id:marker.sourceId});
   }
  }
 }catch{/* A blocked storage API must not break the confirmation page. */}
}

const tool=getTool(document.body.dataset.toolId);
let currentResult=null,currentAnswers=null,currentReport='';
function clearSharedReport(){
 currentResult=null;currentAnswers=null;currentReport='';
 if($('review-summary'))$('review-summary').value=`Personal review requested without a completed assessment: ${tool?.short??sourceId}.`;
 if($('shared-report-preview')){$('shared-report-preview').hidden=true;$('shared-report-text').textContent='';}
}
function renderSnapshots(snapshots){
 const root=$('result-snapshots');root.replaceChildren();if(!snapshots.length)return;
 root.append(element('h3','Public homepage observations'));
 root.append(element('p','Only the HTML returned by the site is checked. JavaScript-rendered content, browser behavior, and business outcomes may differ.','tool-help'));
 for(const s of snapshots){
  if(!s.ok){const notice=element('div',undefined,'tool-notice');notice.append(element('strong',`${s.requestedUrl} — unavailable`),element('p',s.error));root.append(notice);}
  else root.append(element('p',`${s.requestedUrl} → ${s.url} · retrieved ${new Date(s.checkedAt).toLocaleString()}${s.cached?' · recent cached snapshot':''}`,'tool-help'));
 }
 const valid=snapshots.filter(s=>s.ok);if(!valid.length)return;
 const wrap=element('div',undefined,'tool-report-table-wrap');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Scrollable homepage evidence comparison');
 const table=element('table',undefined,'tool-report-table');table.append(element('caption','Observed signals — not a ranking or overall quality score'));
 const head=element('thead'),headRow=element('tr'),first=element('th','Check');first.scope='col';headRow.append(first);
 for(const s of snapshots){const th=element('th',new URL(s.requestedUrl).hostname);th.scope='col';headRow.append(th);}head.append(headRow);table.append(head);
 const tbody=element('tbody');
 for(const check of valid[0].checks){
  const row=element('tr'),name=element('th',check.label);name.scope='row';row.append(name);
  for(const s of snapshots){const td=element('td');const c=s.ok?s.checks.find(v=>v.key===check.key):null;
   const label=c?({'observed':'Observed','not-observed':'Not observed','review':'Review in context','not-applicable':'Not applicable'}[c.status]??'Unavailable'):'Unavailable';
   const status=element('span',label,'tool-check-status');status.dataset.status=c?.status??'unavailable';td.append(status,element('span',c?.detail??'No evidence retrieved for this site.'));row.append(td);
  }tbody.append(row);
 }
 table.append(tbody);wrap.append(table);root.append(wrap);
 const next=element('p',undefined,'tool-help');next.append(document.createTextNode('For a separate browser-based performance test, use '));
 const link=element('a','Google PageSpeed Insights');link.href='https://pagespeed.web.dev/';link.target='_blank';link.rel='noopener noreferrer';next.append(link,document.createTextNode('. No performance score is invented here.'));root.append(next);
}
function renderResult(answers,result){
 currentAnswers=answers;currentResult=result;currentReport=reportText(tool,answers,result);
 $('result-heading').textContent=result.title;$('result-intro').textContent=result.summary;
 $('result-metrics').replaceChildren(...result.metrics.map(m=>{const card=element('div',undefined,'tool-metric');card.append(element('span',m.label,'metric-label'),element('strong',m.value));if(m.detail)card.append(element('p',m.detail));return card;}));
 renderSnapshots(result.snapshots);
 const groups=$('result-groups');groups.replaceChildren();
 if(result.groups?.length>1){groups.append(element('h3','Readiness by area · self-reported'));const list=element('div',undefined,'tool-groups');for(const g of result.groups){const card=element('div',undefined,'tool-group');card.append(element('strong',g.name),element('span',`${g.score===null?'Unknown':`${g.score}/100`} · ${g.known}/${g.total} known`));list.append(card);}groups.append(list);}
 const actions=$('result-actions');actions.replaceChildren();
 if(result.actions.length){actions.append(element('h3','A practical action list'));for(const a of result.actions){const item=element('article',undefined,'tool-action');item.dataset.priority=a.priority;item.append(element('span',a.priority,'priority'),element('h4',a.title),element('p',a.detail));actions.append(item);}}
 else if(!result.snapshots.length)actions.append(element('p','No specific improvement was identified from your known answers. Keep testing the real workflow and revisit any unknowns.','tool-notice'));
 const unknowns=$('result-unknowns');unknowns.replaceChildren();
 if(result.unknowns.length){unknowns.append(element('h3','Not yet verified'));const list=element('ul',undefined,'tool-unknown-list');for(const v of result.unknowns)list.append(element('li',v));unknowns.append(list);}
 $('result-method').textContent=result.method;$('result-date').textContent=new Date().toLocaleString();$('result-text').textContent=currentReport;
 $('review-summary').value=currentReport;$('shared-report-text').textContent=currentReport;$('shared-report-preview').hidden=false;
 if(answers.website&&!$('review-website').value)$('review-website').value=answers.website;
 $('tool-results').hidden=false;$('tool-app').hidden=true;focus('result-heading');
}
async function scanSite(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch('/.netlify/functions/site-snapshot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url}),signal:controller.signal,credentials:'same-origin'});
  if(response.status===429)return {ok:false,requestedUrl:url,error:'The request limit has been reached. Retry later or request a personal review.'};
  const data=await response.json();
  if(!response.ok||!data.ok)return {ok:false,requestedUrl:url,error:typeof data.error==='string'?data.error:'The homepage check is unavailable.'};
  if(!Array.isArray(data.checks)||!data.url||!data.checkedAt)throw new Error('Incomplete response');
  return {...data,requestedUrl:url};
 }catch{return {ok:false,requestedUrl:url,error:'The check could not be completed. The scanner may be unavailable, the connection may have timed out, or this may be a static-only preview. No result was inferred.'};}
 finally{clearTimeout(timer);}
}
if(tool){
 const questionnaire=$('tool-questionnaire'),steps=[...document.querySelectorAll('.tool-step')];let step=0,busy=false,started=false;
 const scanning=['scan','seo','comparison'].includes(tool.kind);
 function showStep(next){
  step=next;steps.forEach((field,i)=>{field.hidden=i!==step;field.disabled=i!==step;});$('tool-back').hidden=step===0;$('tool-next').textContent=step===steps.length-1?(scanning?'Run the check':'Show my result'):'Continue';$('step-label').textContent=`Step ${step+1} of ${steps.length}`;$('tool-progress').value=step+1;$('tool-error').hidden=true;
 }
 function rawAnswers(){return Object.fromEntries(tool.questions.map(q=>[q.id,questionnaire.elements.namedItem(q.id).value]));}
 function validateStep(){
  for(const input of steps[step].querySelectorAll('input,select')){
   input.setCustomValidity('');
   const question=tool.questions.find(q=>q.id===input.name);
   if(question.type==='url'&&input.value.trim())try{normalizeWebsite(input.value);}catch(error){input.setCustomValidity(error.message);}
   if(!input.reportValidity())return false;
  }return true;
 }
 questionnaire.addEventListener('input',event=>{event.target.setCustomValidity?.('');$('tool-error').hidden=true;if(!started){track('business_tool_start');started=true;}});
 questionnaire.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!validateStep())return;
  if(!started){track('business_tool_start');started=true;}
  if(step<steps.length-1){track('business_tool_step',{step_number:step+1});showStep(step+1);focus(`step-title-${step}`);return;}
  let evaluation;try{evaluation=evaluate(tool.id,rawAnswers());}catch(error){$('tool-error').textContent=error.message;$('tool-error').hidden=false;return;}
  busy=true;$('tool-next').disabled=true;$('tool-back').disabled=true;steps[step].disabled=true;$('tool-status').textContent=scanning?'Checking the public homepage HTML. Some sites may decline automated requests…':'';
  try{
   let {answers,result}=evaluation;
   if(scanning){const targets=[answers.website,...(tool.kind==='comparison'?[answers.competitor,answers.competitor2]:[])].filter(Boolean);const snapshots=await Promise.all(targets.map(scanSite));result=attachSnapshots(result,snapshots);}
   renderResult(answers,result);track('business_tool_complete',{result_type:scanning?(result.snapshots.some(s=>s.ok)?'html_snapshot':'unavailable'):'self_report'});
  }catch{$('tool-error').textContent='The result could not be prepared. Your answers are still here. Please try again.';$('tool-error').hidden=false;}
  finally{busy=false;$('tool-next').disabled=false;$('tool-back').disabled=false;steps[step].disabled=false;$('tool-status').textContent='';}
 });
 $('tool-back').addEventListener('click',()=>{showStep(Math.max(0,step-1));focus(`step-title-${step}`);});
 $('edit-answers').addEventListener('click',()=>{clearSharedReport();$('tool-results').hidden=true;$('tool-app').hidden=false;showStep(0);focus('step-title-0');});
 $('print-result').addEventListener('click',()=>{track('business_tool_print');window.print();});
 $('download-result').addEventListener('click',()=>{
  if(!currentReport)return;const blob=new Blob([currentReport],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=`renatus-${tool.id}-report.txt`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);track('business_tool_export');
 });
 $('request-review').addEventListener('click',()=>track('business_tool_review_click'));
 showStep(0);$('tool-app').hidden=false;
}

const review=$('business-review-form');
if(review){let sending=false;
 for(const field of review.querySelectorAll('input,textarea'))field.addEventListener('input',()=>{field.setCustomValidity('');$('review-error').hidden=true;});
 review.addEventListener('submit',async event=>{
  event.preventDefault();if(sending)return;
  for(const name of ['name','email','business','website','message'])review.elements.namedItem(name).value=review.elements.namedItem(name).value.trim();
  const website=$('review-website');website.setCustomValidity('');
  if(website.value)try{website.value=normalizeWebsite(website.value);}catch(error){website.setCustomValidity(error.message);website.reportValidity();return;}
  if(!review.reportValidity())return;
  sending=true;$('send-review').disabled=true;$('send-review').textContent='Sending…';$('review-error').hidden=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(review)).toString(),signal:controller.signal});
   if(!response.ok)throw new Error('Request not accepted');
   try{sessionStorage.setItem('renatus:business-review:accepted',JSON.stringify({sourceId,at:Date.now()}));}catch{/* Tracking may be unavailable; the submission still succeeded. */}
   window.location.assign(review.getAttribute('action'));
  }catch{
   $('review-error').textContent='Your request could not be confirmed. Your details and result are still here. Please retry, or email victor@renatus.technology. After a timeout, check before resending to avoid a duplicate request.';$('review-error').hidden=false;
   sending=false;$('send-review').disabled=false;$('send-review').textContent='Send my review request';
  }finally{clearTimeout(timeout);}
 });
}
