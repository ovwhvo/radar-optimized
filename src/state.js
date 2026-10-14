const accountId = document.querySelector('#app')?.dataset.storageScope;
if (!accountId) throw new Error('浏览器存储尚未就绪，请刷新页面。');
export const ACCOUNT_SCOPE = 'policyradar.selfhost.demo.v1';
export const SESSION_KEY = ACCOUNT_SCOPE + '.workspace.v2';
export const PREVIOUS_WORK_KEY = ACCOUNT_SCOPE + '.previous-work';
const TAB_KEY = ACCOUNT_SCOPE + '.tab';
function tabKey(storage){try{if(storage!==globalThis.localStorage||!globalThis.sessionStorage)return null;let id=sessionStorage.getItem(TAB_KEY);if(!id){id=globalThis.crypto.randomUUID();sessionStorage.setItem(TAB_KEY,id);}return SESSION_KEY+'.tab.'+id;}catch{return null;}}
export const emptyWork = () => ({question:'',selected:[],excluded:[],activePolicyId:null,stage:'discover',task:'eligibility',assessments:{},checks:{},steps:{},formDrafts:{},drafts:{},notes:'',analysis:null,analysisBasis:null,analysisStale:false,profileSnapshot:null,sourceVersions:[],recordId:null,recordRevision:null,recordTitle:'',status:'preparing',historical:false,messages:[],updatedAt:null,lastReviewedAt:null});
export const S = {view:'radar',policies:[],dataset:{},visible:[],searchMeta:null,discovery:null,hasSearched:false,editingQuery:false,homeExpanded:false,fieldIndex:0,showAllConditions:false,assistantOpen:false,query:'',region:'',category:'',applicationStatus:'',searching:false,searchError:'',searchNotice:'',profile:{},profileRevision:0,profileDraft:{},profileDirty:false,records:[],recordFilter:'',recordQuery:'',health:null,work:emptyWork(),tab:'materials',busy:new Set(),error:null,autosaveOk:true,autosaveAt:null,restored:false,menuOpen:false};
export const clone = value => structuredClone(value);
const preparationTabs = ['steps','materials','fields','review'];
export const selected = () => S.work.selected.map(policyForWork).filter(Boolean);
export const profileForWork = () => S.work.profileSnapshot || S.profile;
export const activePolicy = () => policyForWork(S.work.selected.includes(S.work.activePolicyId) ? S.work.activePolicyId : S.work.selected[0]);
export function policyForWork(id) {
  const p=S.policies.find(p=>p.id===id);
  const old=S.work.sourceVersions.find(v=>v.id===id);
  if(!p)return old || null;
  return S.work.historical && old?.materials ? {...p,...old,source:old.source || {...p.source,url:old.url || p.source?.url}} : p;
}
export function policyChanges(old,current){if(!current)return ['当前库已移除此事项'];const labels={version:'政策版本',conditions:'适用条件',materials:'材料要求',steps:'办理步骤',formGuide:'填写口径',window:'办理窗口',applicationStatus:'办理状态',policyStatus:'规则效力',source:'来源与核验信息',relatedDocuments:'关联依据'};return Object.entries(labels).filter(([key])=>JSON.stringify(old?.[key])!==JSON.stringify(current[key])).map(([,label])=>label);}
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])) : value;
export const analysisBasis = () => JSON.stringify(canonical({policyIds:[...S.work.selected].sort(),question:S.work.question,profile:profileForWork(),assessments:Object.fromEntries(Object.entries(S.work.assessments).filter(([id])=>S.work.selected.includes(id)))}));
export function invalidateAnalysis(){if(S.work.analysis)S.work.analysisStale=true;S.work.lastReviewedAt=null;}
export function choosePolicy(id,checked){
  if(S.work.selected.includes(id)===checked)return;
  if(checked){if(!S.work.sourceVersions.some(p=>p.id===id)){const p=S.policies.find(p=>p.id===id);if(p)S.work.sourceVersions.push(compactPolicy(p));}S.work.selected=[...new Set([...S.work.selected,id])];S.work.excluded=S.work.excluded.filter(x=>x!==id);}
  else {S.work.selected=S.work.selected.filter(x=>x!==id);S.work.excluded=[...new Set([...S.work.excluded,id])];}
  if(!S.work.selected.includes(S.work.activePolicyId))S.work.activePolicyId=S.work.selected[0]||null;
  invalidateAnalysis();
}
export function compactPolicy(p){if(!p)return null;return clone({id:p.id,title:p.title,category:p.category,region:p.region,authority:p.authority,summary:p.summary,audience:p.audience,benefit:p.benefit,version:p.version,publishedAt:p.publishedAt,verifiedAt:p.verifiedAt,policyStatus:p.policyStatus,applicationStatus:p.applicationStatus,window:p.window,source:p.source,url:p.source?.url,relatedDocuments:p.relatedDocuments,conditions:p.conditions,materials:p.materials,steps:p.steps,formGuide:p.formGuide,limitations:p.limitations});}
export function rememberSources(){S.work.sourceVersions=selected().map(compactPolicy);}
export function recordPayload(){
  const take=map=>clone(Object.fromEntries(Object.entries(map||{}).filter(([id])=>S.work.selected.includes(id))));
  const sources=S.work.selected.map(id=>compactPolicy(policyForWork(id))).filter(Boolean);
  return {title:S.work.recordTitle || `${profileForWork().companyName||'企业政策'} · ${activePolicy()?.title||'准备记录'}`,status:S.work.status,policyId:activePolicy()?.id,policyIds:[...S.work.selected],question:S.work.question,task:S.work.task||S.work.analysis?.task||'eligibility',profileSnapshot:clone(profileForWork()),assessments:take(S.work.assessments),analysisSnapshot:S.work.analysisStale?null:clone(S.work.analysis),analysisVersion:S.work.analysisStale?null:S.work.analysis?.contractVersion||null,checklist:take(S.work.checks),stepsProgress:take(S.work.steps),formDrafts:take(S.work.formDrafts),draft:take(S.work.drafts),notes:S.work.notes,sourceVersions:sources,workflow:{stage:S.work.stage,activePolicyId:activePolicy()?.id||null,preparationTab:preparationTabs.includes(S.tab)?S.tab:'steps',nextAction:S.work.analysisStale?'重新核对资料与条件':S.work.stage==='review'?'按当期官方要求复核':'继续准备当前事项',blockers:S.work.notes?[S.work.notes]:[],lastReviewedAt:S.work.lastReviewedAt},messages:clone(S.work.messages.slice(-30)),mode:'mock'};
}
// Compare editable business content with the same confirmed server revision.
// Navigation and automatic invalidation do not mean that a user's draft changed.
function recordBusinessContent(r){
  const ids=[...(r.policyIds||[r.policyId]).filter(Boolean)].sort();
  const take=map=>Object.fromEntries(Object.entries(map||{}).filter(([id])=>ids.includes(id)));
  const meaningful=(value,progress=false)=>{
    if(value&&typeof value==='object'&&!Array.isArray(value))return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,meaningful(v,progress)]).filter(([,v])=>v!==undefined&&(!(v&&typeof v==='object')||Object.keys(v).length)));
    return value===null||value===undefined||value===''||(progress&&value===false)?undefined:value;
  };
  const sources=(r.sourceVersions||[]).filter(p=>ids.includes(p.id)).map(compactPolicy).sort((a,b)=>a.id.localeCompare(b.id));
  const draft=typeof r.draft==='string'?{[r.policyId]:r.draft}:r.draft;
  return canonical({title:r.title||'',status:r.status||'preparing',question:r.question||'',policyIds:ids,
    profile:meaningful(r.profileSnapshot||{}),assessments:meaningful(take(r.assessments)),
    materials:meaningful(take(r.checklist),true),steps:meaningful(take(r.stepsProgress),true),
    fields:meaningful(take(r.formDrafts)),drafts:meaningful(take(draft)),notes:r.notes||'',
    sources,analysis:r.analysisSnapshot||null,messages:r.messages||[],lastReviewedAt:r.workflow?.lastReviewedAt||null});
}
export function recordSaveState(){
  if(!S.work.recordId)return {kind:'unsaved',label:'尚未保存为记录'};
  const baseline=S.records.find(r=>r.id===S.work.recordId&&r.revision===S.work.recordRevision);
  if(!baseline)return {kind:'unavailable',label:'暂无法确认记录保存状态'};
  const current=recordPayload();
  // Reopening marks historical analysis stale, but keeps its original content.
  // A stale analysis excluded by an actual save must not make that save look dirty.
  current.analysisSnapshot=S.work.analysisStale?(baseline.analysisSnapshot?S.work.analysis:null):S.work.analysis;
  const changed=JSON.stringify(recordBusinessContent(current))!==JSON.stringify(recordBusinessContent(baseline));
  return changed?{kind:'dirty',label:'有修改尚未更新记录'}:{kind:'saved',label:'已保存为本浏览器记录 · 版本 '+S.work.recordRevision};
}
export function restoreRecord(r){
  S.work={...emptyWork(),question:r.question||'',task:r.task||'eligibility',selected:(r.policyIds||[r.policyId]).filter(id=>S.policies.some(p=>p.id===id)||(r.sourceVersions||[]).some(p=>p.id===id)),activePolicyId:r.workflow?.activePolicyId||r.policyId,assessments:clone(r.assessments||{}),checks:clone(r.checklist||{}),steps:clone(r.stepsProgress||{}),formDrafts:clone(r.formDrafts||{}),drafts:clone(typeof r.draft==='object'&&r.draft?r.draft:{[r.policyId]:r.draft||''}),notes:r.notes||'',analysis:clone(r.analysisSnapshot||null),analysisStale:!!r.analysisSnapshot,profileSnapshot:clone(r.profileSnapshot||S.profile),sourceVersions:clone(r.sourceVersions||[]),recordId:r.id,recordRevision:r.revision,recordTitle:r.title||'',status:r.status||'preparing',stage:r.workflow?.stage||'prepare',historical:true,messages:clone(r.messages||[]),lastReviewedAt:r.workflow?.lastReviewedAt||null,updatedAt:r.updatedAt};
  if(!S.work.selected.includes(S.work.activePolicyId))S.work.activePolicyId=S.work.selected[0]||null;
  S.tab=preparationTabs.includes(r.workflow?.preparationTab)?r.workflow.preparationTab:r.workflow?.stage==='review'?'review':({forms:'fields',form:'fields',steps:'steps',materials:'materials',explain:'steps'}[r.task]||'materials');S.query=S.work.question;S.hasSearched=false;S.discovery=null;S.visible=[];S.fieldIndex=0;S.assistantOpen=r.task==='explain'&&S.tab==='steps'&&S.work.messages.length>0;
}
export function saveSession(storage=globalThis.localStorage){
  try{S.work.updatedAt=new Date().toISOString();const data=JSON.stringify({schemaVersion:2,work:S.work,profileDraft:S.profileDraft,profileDirty:S.profileDirty,view:S.view,tab:S.tab,query:S.query,region:S.region,category:S.category,applicationStatus:S.applicationStatus,discovery:S.discovery,hasSearched:S.hasSearched,fieldIndex:S.fieldIndex,datasetVersion:S.dataset.verifiedAt,updatedAt:S.work.updatedAt});storage.setItem(SESSION_KEY,data);const own=tabKey(storage);if(own)storage.setItem(own,data);S.autosaveOk=true;S.autosaveAt=S.work.updatedAt;return true;}catch{S.autosaveOk=false;return false;}
}
export function restoreSession(storage=globalThis.localStorage){
  try{const own=tabKey(storage);const raw=(own&&storage.getItem(own))||storage.getItem(SESSION_KEY);if(!raw)return false;const d=JSON.parse(raw);if(d.schemaVersion!==2||!d.work||!Array.isArray(d.work.selected))return false;S.work={...emptyWork(),...d.work,selected:d.work.selected.filter(id=>S.policies.some(p=>p.id===id)||(d.work.sourceVersions||[]).some(p=>p.id===id))};S.profileDraft=d.profileDraft||clone(S.profile);S.profileDirty=!!d.profileDirty;S.view=['radar','analyze','workspace','records','sources','profile','settings'].includes(d.view)?d.view:'radar';S.tab=d.tab||'materials';S.assistantOpen=S.work.task==='explain'&&S.tab==='steps'&&S.work.messages.length>0;S.query=d.query||'';S.discovery=d.discovery||null;S.hasSearched=!!(d.hasSearched&&S.query.trim());S.fieldIndex=d.fieldIndex||0;S.region=d.region||'';S.category=d.category||'';S.applicationStatus=d.applicationStatus||'';if(S.work.analysis&&typeof S.work.analysisBasis==='string'&&S.work.analysisBasis!==analysisBasis())invalidateAnalysis();if(d.datasetVersion!==S.dataset.verifiedAt||S.work.selected.some(id=>{const current=S.policies.find(p=>p.id===id),old=S.work.sourceVersions.find(p=>p.id===id);return !old||policyChanges(old,current).length>0;})){invalidateAnalysis();if(S.work.sourceVersions.length)S.work.historical=true;}S.autosaveAt=d.updatedAt;S.restored=!!(S.work.selected.length||S.profileDirty||S.work.question);return S.restored;}catch{S.autosaveOk=false;return false;}
}
export function newWork(storage=globalThis.localStorage){S.work=emptyWork();S.query='';S.region='';S.category='';S.applicationStatus='';S.visible=[];S.searchMeta=null;S.discovery=null;S.hasSearched=false;S.searchError='';S.searchNotice='';S.editingQuery=false;S.homeExpanded=false;S.tab='steps';S.fieldIndex=0;S.showAllConditions=false;S.assistantOpen=false;S.view='radar';S.restored=false;saveSession(storage);}
