import {METHOD_VERSION, getTool} from './business-tools-data.mjs';
export const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
export const decimal=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(value);
export function normalizeWebsite(raw){
 if(typeof raw!=='string'||!raw.trim()||raw.length>2048) throw new Error('Enter a public website such as yourbusiness.com.');
 let input=raw.trim();
 if(!/^[a-z][a-z\d+.-]*:\/\//i.test(input)) input=`https://${input}`;
 let u;try{u=new URL(input);}catch{throw new Error('Enter a valid public website address.');}
 const h=u.hostname.toLowerCase().replace(/\.$/,'');
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port||h.length>253||!h.includes('.')||h.includes(':')||/^\d+(\.\d+){3}$/.test(h)||!h.split('.').every(v=>/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(v))||/(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid|example|onion|arpa)$/.test(h)) throw new Error('Use a public business domain on standard HTTP or HTTPS, without credentials or a custom port.');
 return `${u.protocol}//${h}/`;
}
export function validateAnswers(tool,raw){
 const answers={};
 for(const question of tool.questions){
  const value=raw[question.id];
  const empty=value===undefined||value===null||String(value).trim()==='';
  if(empty){if(question.optional){answers[question.id]=null;continue;}throw new Error(`Please answer: ${question.label}`);}
  if(question.type==='number'){
   if(!['number','string'].includes(typeof value))throw new Error(`Enter a number for ${question.label}.`);
   const number=Number(value);
   if(!Number.isFinite(number)||number<question.min||number>question.max||(question.step==='1'&&!Number.isInteger(number)))throw new Error(`Enter ${question.step==='1'?'a whole number':'a number'} from ${question.min} to ${question.max} for ${question.label}.`);
   if(question.id==='year'&&number>new Date().getFullYear())throw new Error('The last rebuild year cannot be in the future.');
   answers[question.id]=number;
  }else if(question.type==='url'){answers[question.id]=normalizeWebsite(value);}
  else{
   if(!question.options.some(option=>option.value===value))throw new Error(`Choose an available answer for ${question.label}.`);
   answers[question.id]=value;
  }
 }
 if(tool.id==='website-lead-check'&&answers.visits===0&&answers.inquiries>0)throw new Error('You entered inquiries but zero visits. Check that both figures cover the same source and date range.');
 if(tool.kind==='comparison'){
  const domains=[answers.website,answers.competitor,answers.competitor2].filter(Boolean).map(v=>new URL(v).hostname.replace(/^www\./,''));
  if(new Set(domains).size!==domains.length)throw new Error('Choose different business domains for a meaningful comparison.');
 }
 return answers;
}
function base(tool){return {toolId:tool.id,title:'Your next steps',summary:'',metrics:[],actions:[],strengths:[],unknowns:[],groups:[],snapshots:[],method:tool.content.limits,version:METHOD_VERSION};}
const action=(title,detail,priority='Improve')=>({title,detail,priority});
export function checklistResult(tool,answers){
 const out=base(tool), questions=tool.questions.filter(q=>q.action);
 let known=0,points=0;const groups=new Map();
 for(const q of questions){
  const option=q.options.find(o=>o.value===answers[q.id]);
  const group=groups.get(q.category)||{name:q.category,known:0,total:0,points:0};group.total++;
  if(option.points===null){out.unknowns.push(q.label);out.actions.push(action(`Verify: ${q.action.toLowerCase()}`,q.detail,'Verify'));}
  else{
   known++;points+=option.points;group.known++;group.points+=option.points;
   if(option.points===2)out.strengths.push(q.label);
   else out.actions.push(action(q.action,q.detail,option.points===0?q.priority:'Improve'));
  }
  groups.set(q.category,group);
 }
 out.groups=[...groups.values()].map(g=>({...g,score:g.known?Math.round(g.points/(g.known*2)*100):null}));
 out.known=known;out.total=questions.length;
 out.score=known>=Math.ceil(questions.length/2)?Math.round(points/(known*2)*100):null;
 out.metrics=[{label:'Readiness · known answers',value:out.score===null?'Not enough information':`${out.score}/100`,detail:'Your self-reported checklist; not an industry benchmark.'},{label:'Evidence coverage',value:`${known} of ${questions.length}`,detail:`${questions.length-known} not yet verified. Unknowns do not reduce the score.`}];
 const improvements=out.actions.filter(a=>a.priority!=='Verify').length;
 out.title=known===0?'Start by checking what you know':improvements? 'A focused list of next steps':'Keep what is already working';
 out.summary=`${improvements} self-reported improvement ${improvements===1?'area':'areas'} and ${out.unknowns.length} ${out.unknowns.length===1?'answer':'answers'} to verify. These are not independently confirmed defects.`;
 out.actions.sort((a,b)=>({'Check first':0,Improve:1,Verify:2}[a.priority]-{'Check first':0,Improve:1,Verify:2}[b.priority]));
 out.method+=' Scoring: Yes = 2, Partly = 1, No = 0. Unknown is excluded. Known-answer points ÷ maximum known-answer points × 100; no overall score until at least half the checklist is known.';
 if(tool.id==='website-lead-check'){
  const {visits,inquiries}=answers;
  out.metrics.push({label:'Inquiries per 100 visits',value:visits>0&&inquiries!==null?decimal(inquiries/visits*100):'Not calculated',detail:'Same-period ratio; repeat inquiries may make this exceed 100. Not a unique-visitor conversion rate.'});
  if(visits===null||inquiries===null)out.unknowns.push('Visits and inquiries for the same period were not both supplied.');
 }
 if(tool.id==='website-modernization-check'&&answers.year!==null)out.metrics.push({label:'Approximate rebuild age',value:`${new Date().getFullYear()-answers.year} years`,detail:'User-supplied year; not part of the readiness score.'});
 return out;
}
export function evaluate(toolId,raw){
 const tool=getTool(toolId);if(!tool)throw new Error('Unknown assessment.');
 const a=validateAnswers(tool,raw);let r;
 if(['checklist','seo','maintenance'].includes(tool.kind))r=checklistResult(tool,a);else r=base(tool);
 if(tool.kind==='automation'){
  const hours=a.minutes*a.weekly*a.weeks/60, labor=hours*a.hourly,savedHours=hours*a.reduction/100,savedValue=labor*a.reduction/100,net=savedValue-a.monthlyTools*12;
  r.title='Your automation scenario';r.summary='This values capacity in a task you described. It does not promise that the time can be eliminated or that labor value becomes cash savings.';
  r.metrics=[{label:'Current task time per year',value:`${decimal(hours)} hours`},{label:'Current annual labor value',value:money(labor)},{label:'Modeled hours released per year',value:`${decimal(savedHours)} hours`},{label:'Net annual capacity value',value:money(net),detail:'Modeled labor value released minus new annual running costs; before setup.'},{label:'First-year net value',value:money(net-a.setup),detail:'After modeled running costs and one-time implementation.'},{label:'Steady-state break-even',value:a.setup===0?'No upfront cost':net>0?`${decimal(a.setup/(net/12))} months`:'Not reached',detail:'Spreads annual activity evenly; ignores ramp-up and seasonal cash flow.'}];
  r.actions=[action('Validate one representative workflow','Time a sample of real occurrences. Confirm the frequency and the steps that still need human judgment.','Check first'),action('Check existing tools before building','Review software features you already pay for, then compare a small integration with a new application.'),action('Run a limited pilot','Measure actual time and error rates before applying the scenario to the entire business.')];
  r.calculations={hours,labor,savedHours,savedValue,net,firstYear:net-a.setup};
 }else if(tool.kind==='roi'){
  const gross=a.hours*a.hourly+a.cash,net=gross-a.running,period=net*a.months-a.build,roi=a.build>0?period/a.build*100:null;
  r.title=net>0?'A scenario to validate':'This scenario does not create a positive monthly benefit';
  r.summary='Labor time is valued capacity, not guaranteed budget savings. Benefits are assumed to start immediately; financing, tax effects, ramp-up, and revenue growth are not modeled.';
  r.metrics=[{label:'Modeled monthly gross benefit',value:money(gross)},{label:'Modeled net monthly benefit',value:money(net),detail:'After the new monthly costs you entered.'},{label:`Net value over ${a.months} months`,value:money(period),detail:'Includes the one-time project cost.'},{label:'Simple scenario ROI',value:roi===null?'Undefined (zero investment)':`${decimal(roi)}%`},{label:'Simple break-even',value:a.build===0?'No upfront cost':net>0?`${decimal(a.build/net)} months`:'Not reached',detail:net>0&&a.build/net>a.months?'Beyond your evaluation period.':'Assumes constant benefits and costs.'}];
  r.actions=[action('Verify the biggest benefit assumption','Check the hours saved against actual activity. Remove overlapping or speculative benefits.','Check first'),action('Include the full running cost','Confirm maintenance, licensing, hosting, monitoring, data migration, and staff training.'),action('Compare smaller alternatives','A process change or off-the-shelf product may solve the problem with less investment.')];r.calculations={gross,net,period,roi};
 }else if(tool.kind==='project'){
  const fit=a.pages==='1-5'&&a.purpose==='business'&&a.content==='ready'&&a.migration==='no';
  r.title='Your website scope and first-year worksheet';r.summary=fit?'Your answers resemble the base informational-site scope. Renatus must still review the requirements and confirm eligibility.':'Your scope needs a personal review. The base offer is not a like-for-like quote for these requirements.';
  const total=a.projectQuote!==null&&a.recurring!==null?a.projectQuote+12*a.recurring:null;
  r.metrics=[{label:'Your first-year cost scenario',value:total===null?'Incomplete':money(total),detail:'Your entered one-time amount + 12 monthly payments; excludes unreported fees and tax.'},{label:'Published subscription reference',value:'$299/month',detail:'1–5 page site; 12-month initial commitment ($3,588). Not a maintenance-only quote.'},{label:'Published one-time starting price',value:'$3,500',detail:'Starting price only. Scope and ongoing costs need confirmation.'}];
  r.actions=[action('Confirm the scope in writing','Specify pages, content, migrations, integrations, revisions, ownership, and support.'),action('Compare equivalent deliverables','Check ongoing charges and exit terms, not just the initial build amount.')];
  if(a.content!=='ready')r.actions.unshift(action('Plan content creation','Agree who writes, reviews, supplies images, and approves the service information.','Check first'));
  if(a.migration!=='no')r.actions.push(action('Review the migration','Inventory existing URLs, content, access, and data. Plan redirects and rollback before changes.'));
  if(total===null)r.unknowns.push('Supply both the one-time and recurring amount to complete the first-year scenario.');
  r.calculations={total,fit};
 }else if(tool.kind==='maintenance'){
  const externalKnown=(a.hosting??0)*12+(a.supportCost??0)*12+(a.licenses??0),externalComplete=[a.hosting,a.supportCost,a.licenses].every(v=>v!==null),labor=a.hours===0?0:a.hours!==null&&a.hourly!==null?a.hours*a.hourly*12:null;
  r.title='Your maintenance cost and responsibility review';
  r.metrics.unshift({label:externalComplete?'Annual external costs':'Known annual external charges',value:money(externalKnown),detail:externalComplete?'Hosting + support + separate annual licenses.':'Partial subtotal only. Unknown charges are not assumed zero.'},{label:'Annual internal time value',value:labor===null?'Not fully valued':money(labor),detail:'Capacity value, not another external bill.'},{label:'Combined annual cost and time value',value:externalComplete&&labor!==null?money(externalKnown+labor):'Incomplete'});
  if(!externalComplete)r.unknowns.push('One or more external cost categories are unknown; the subtotal is incomplete.');
  if(labor===null)r.unknowns.push('Internal time has not been fully valued. Enter hours and hourly value, or explicitly enter zero hours.');
  r.calculations={externalKnown,externalComplete,labor};
 }else if(['scan','comparison'].includes(tool.kind)){
  r.title=tool.kind==='comparison'?'Your public-page comparison':'Your homepage HTML snapshot';
  r.summary='Observable signals only. No overall quality, security, or search visibility score is assigned.';
 }
 return {answers:a,result:r};
}
export function attachSnapshots(result,snapshots){
 const next={...result,snapshots};
 const available=snapshots.filter(s=>s.ok).length;
 if(!available&&snapshots.length&&['website-health-check','competitor-website-comparison'].includes(result.toolId)){
  next.title='The website check is unavailable';next.summary='No technical result was inferred. Review the reason below, retry later, or request a manual review.';
 }else if(available<snapshots.length)next.summary+=' Some requested pages could not be checked; their results are explicitly unavailable.';
 return next;
}
export function reportText(tool,answers,result){
 const lines=[`RENATUS | ${tool.short}`,`Prepared: ${new Date().toISOString()}`,`Method version: ${METHOD_VERSION}`,`Method: https://renatus.technology/${tool.id}#method`,'',result.title,result.summary,'',...result.metrics.map(m=>`${m.label}: ${m.value}${m.detail?' — '+m.detail:''}`),'','NEXT STEPS',...result.actions.map(a=>`[${a.priority}] ${a.title}: ${a.detail}`),'','ANSWERS YOU PROVIDED'];
 for(const q of tool.questions){const value=answers[q.id];lines.push(`${q.label}: ${value===null||value===undefined?'Not supplied':q.options?q.options.find(o=>o.value===value)?.label??value:value}`);}
 for(const s of result.snapshots||[]){lines.push('',`HOMEPAGE: ${s.requestedUrl}`,s.ok?`Retrieved: ${s.checkedAt}; final page: ${s.url}`:`Unavailable: ${s.error}`);if(s.ok)for(const c of s.checks)lines.push(`${c.label} [${c.status}]: ${c.detail}`);}
 lines.push('','LIMITATIONS',result.method,'Public HTML checks do not establish actual search ranking, speed, accessibility compliance, security, or form delivery.');
 return lines.join('\n');
}
