/* 政策补贴雷达 · 单文件产物（由 build.py 从 src/ 模块打包，勿手改） */

/* ===== ./state.js ===== */
const __m___state_js = (() => {
const accountId = document.querySelector('#app')?.dataset.storageScope;
if (!accountId) throw new Error('浏览器存储尚未就绪，请刷新页面。');
const ACCOUNT_SCOPE = 'policyradar.selfhost.demo.v1';
const SESSION_KEY = ACCOUNT_SCOPE + '.workspace.v2';
const PREVIOUS_WORK_KEY = ACCOUNT_SCOPE + '.previous-work';
const TAB_KEY = ACCOUNT_SCOPE + '.tab';
function tabKey(storage){try{if(storage!==globalThis.localStorage||!globalThis.sessionStorage)return null;let id=sessionStorage.getItem(TAB_KEY);if(!id){id=globalThis.crypto.randomUUID();sessionStorage.setItem(TAB_KEY,id);}return SESSION_KEY+'.tab.'+id;}catch{return null;}}
const emptyWork = () => ({question:'',selected:[],excluded:[],activePolicyId:null,stage:'discover',task:'eligibility',assessments:{},checks:{},steps:{},formDrafts:{},drafts:{},notes:'',analysis:null,analysisBasis:null,analysisStale:false,profileSnapshot:null,sourceVersions:[],recordId:null,recordRevision:null,recordTitle:'',status:'preparing',historical:false,messages:[],updatedAt:null,lastReviewedAt:null});
const S = {view:'radar',policies:[],dataset:{},visible:[],searchMeta:null,discovery:null,hasSearched:false,editingQuery:false,homeExpanded:false,fieldIndex:0,showAllConditions:false,assistantOpen:false,query:'',region:'',category:'',applicationStatus:'',searching:false,searchError:'',searchNotice:'',profile:{},profileRevision:0,profileDraft:{},profileDirty:false,records:[],recordFilter:'',recordQuery:'',health:null,work:emptyWork(),tab:'materials',busy:new Set(),error:null,autosaveOk:true,autosaveAt:null,restored:false,menuOpen:false};
const clone = value => structuredClone(value);
const preparationTabs = ['steps','materials','fields','review'];
const selected = () => S.work.selected.map(policyForWork).filter(Boolean);
const profileForWork = () => S.work.profileSnapshot || S.profile;
const activePolicy = () => policyForWork(S.work.selected.includes(S.work.activePolicyId) ? S.work.activePolicyId : S.work.selected[0]);
function policyForWork(id) {
  const p=S.policies.find(p=>p.id===id);
  const old=S.work.sourceVersions.find(v=>v.id===id);
  if(!p)return old || null;
  return S.work.historical && old?.materials ? {...p,...old,source:old.source || {...p.source,url:old.url || p.source?.url}} : p;
}
function policyChanges(old,current){if(!current)return ['当前库已移除此事项'];const labels={version:'政策版本',conditions:'适用条件',materials:'材料要求',steps:'办理步骤',formGuide:'填写口径',window:'办理窗口',applicationStatus:'办理状态',policyStatus:'规则效力',source:'来源与核验信息',relatedDocuments:'关联依据'};return Object.entries(labels).filter(([key])=>JSON.stringify(old?.[key])!==JSON.stringify(current[key])).map(([,label])=>label);}
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])) : value;
const analysisBasis = () => JSON.stringify(canonical({policyIds:[...S.work.selected].sort(),question:S.work.question,profile:profileForWork(),assessments:Object.fromEntries(Object.entries(S.work.assessments).filter(([id])=>S.work.selected.includes(id)))}));
function invalidateAnalysis(){if(S.work.analysis)S.work.analysisStale=true;S.work.lastReviewedAt=null;}
function choosePolicy(id,checked){
  if(S.work.selected.includes(id)===checked)return;
  if(checked){if(!S.work.sourceVersions.some(p=>p.id===id)){const p=S.policies.find(p=>p.id===id);if(p)S.work.sourceVersions.push(compactPolicy(p));}S.work.selected=[...new Set([...S.work.selected,id])];S.work.excluded=S.work.excluded.filter(x=>x!==id);}
  else {S.work.selected=S.work.selected.filter(x=>x!==id);S.work.excluded=[...new Set([...S.work.excluded,id])];}
  if(!S.work.selected.includes(S.work.activePolicyId))S.work.activePolicyId=S.work.selected[0]||null;
  invalidateAnalysis();
}
function compactPolicy(p){if(!p)return null;return clone({id:p.id,title:p.title,category:p.category,region:p.region,authority:p.authority,summary:p.summary,audience:p.audience,benefit:p.benefit,version:p.version,publishedAt:p.publishedAt,verifiedAt:p.verifiedAt,policyStatus:p.policyStatus,applicationStatus:p.applicationStatus,window:p.window,source:p.source,url:p.source?.url,relatedDocuments:p.relatedDocuments,conditions:p.conditions,materials:p.materials,steps:p.steps,formGuide:p.formGuide,limitations:p.limitations});}
function rememberSources(){S.work.sourceVersions=selected().map(compactPolicy);}
function recordPayload(){
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
function recordSaveState(){
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
function restoreRecord(r){
  S.work={...emptyWork(),question:r.question||'',task:r.task||'eligibility',selected:(r.policyIds||[r.policyId]).filter(id=>S.policies.some(p=>p.id===id)||(r.sourceVersions||[]).some(p=>p.id===id)),activePolicyId:r.workflow?.activePolicyId||r.policyId,assessments:clone(r.assessments||{}),checks:clone(r.checklist||{}),steps:clone(r.stepsProgress||{}),formDrafts:clone(r.formDrafts||{}),drafts:clone(typeof r.draft==='object'&&r.draft?r.draft:{[r.policyId]:r.draft||''}),notes:r.notes||'',analysis:clone(r.analysisSnapshot||null),analysisStale:!!r.analysisSnapshot,profileSnapshot:clone(r.profileSnapshot||S.profile),sourceVersions:clone(r.sourceVersions||[]),recordId:r.id,recordRevision:r.revision,recordTitle:r.title||'',status:r.status||'preparing',stage:r.workflow?.stage||'prepare',historical:true,messages:clone(r.messages||[]),lastReviewedAt:r.workflow?.lastReviewedAt||null,updatedAt:r.updatedAt};
  if(!S.work.selected.includes(S.work.activePolicyId))S.work.activePolicyId=S.work.selected[0]||null;
  S.tab=preparationTabs.includes(r.workflow?.preparationTab)?r.workflow.preparationTab:r.workflow?.stage==='review'?'review':({forms:'fields',form:'fields',steps:'steps',materials:'materials',explain:'steps'}[r.task]||'materials');S.query=S.work.question;S.hasSearched=false;S.discovery=null;S.visible=[];S.fieldIndex=0;S.assistantOpen=r.task==='explain'&&S.tab==='steps'&&S.work.messages.length>0;
}
function saveSession(storage=globalThis.localStorage){
  try{S.work.updatedAt=new Date().toISOString();const data=JSON.stringify({schemaVersion:2,work:S.work,profileDraft:S.profileDraft,profileDirty:S.profileDirty,view:S.view,tab:S.tab,query:S.query,region:S.region,category:S.category,applicationStatus:S.applicationStatus,discovery:S.discovery,hasSearched:S.hasSearched,fieldIndex:S.fieldIndex,datasetVersion:S.dataset.verifiedAt,updatedAt:S.work.updatedAt});storage.setItem(SESSION_KEY,data);const own=tabKey(storage);if(own)storage.setItem(own,data);S.autosaveOk=true;S.autosaveAt=S.work.updatedAt;return true;}catch{S.autosaveOk=false;return false;}
}
function restoreSession(storage=globalThis.localStorage){
  try{const own=tabKey(storage);const raw=(own&&storage.getItem(own))||storage.getItem(SESSION_KEY);if(!raw)return false;const d=JSON.parse(raw);if(d.schemaVersion!==2||!d.work||!Array.isArray(d.work.selected))return false;S.work={...emptyWork(),...d.work,selected:d.work.selected.filter(id=>S.policies.some(p=>p.id===id)||(d.work.sourceVersions||[]).some(p=>p.id===id))};S.profileDraft=d.profileDraft||clone(S.profile);S.profileDirty=!!d.profileDirty;S.view=['radar','analyze','workspace','records','sources','profile','settings'].includes(d.view)?d.view:'radar';S.tab=d.tab||'materials';S.assistantOpen=S.work.task==='explain'&&S.tab==='steps'&&S.work.messages.length>0;S.query=d.query||'';S.discovery=d.discovery||null;S.hasSearched=!!(d.hasSearched&&S.query.trim());S.fieldIndex=d.fieldIndex||0;S.region=d.region||'';S.category=d.category||'';S.applicationStatus=d.applicationStatus||'';if(S.work.analysis&&typeof S.work.analysisBasis==='string'&&S.work.analysisBasis!==analysisBasis())invalidateAnalysis();if(d.datasetVersion!==S.dataset.verifiedAt||S.work.selected.some(id=>{const current=S.policies.find(p=>p.id===id),old=S.work.sourceVersions.find(p=>p.id===id);return !old||policyChanges(old,current).length>0;})){invalidateAnalysis();if(S.work.sourceVersions.length)S.work.historical=true;}S.autosaveAt=d.updatedAt;S.restored=!!(S.work.selected.length||S.profileDirty||S.work.question);return S.restored;}catch{S.autosaveOk=false;return false;}
}
function newWork(storage=globalThis.localStorage){S.work=emptyWork();S.query='';S.region='';S.category='';S.applicationStatus='';S.visible=[];S.searchMeta=null;S.discovery=null;S.hasSearched=false;S.searchError='';S.searchNotice='';S.editingQuery=false;S.homeExpanded=false;S.tab='steps';S.fieldIndex=0;S.showAllConditions=false;S.assistantOpen=false;S.view='radar';S.restored=false;saveSession(storage);}

return {ACCOUNT_SCOPE, SESSION_KEY, PREVIOUS_WORK_KEY, emptyWork, S, clone, selected, profileForWork, activePolicy, policyForWork, policyChanges, analysisBasis, invalidateAnalysis, choosePolicy, compactPolicy, rememberSources, recordPayload, recordSaveState, restoreRecord, saveSession, restoreSession, newWork};
})();

/* ===== ./local-api.js ===== */
const __m___local_api_js = (() => {
// ============================================================================
// local-api.js —— 浏览器内本地 API（完全脱离原站 radar.huixiang17.cn 的运行时依赖）
// 端点：GET /health /sources；POST /discover /analyze /assistant
// 契约对拍基准：tests/reference/（原站 2026-10-14 捕获）；等价性测试：tests/
// 指纹算法与 local-store.js fingerprint() 完全同构，保证记录保存校验互通。
// ============================================================================
const LIMITATIONS = [
  '仅搜索本地已收录政策样本；不代表全部政策或匹配资格。',
  '语义别名与排除词使用可解释规则，未调用大模型。',
  '自然语言理解为本地规则模拟，未调用大模型。',
  '候选中的历史批次和未知窗口不表示当前可办理，须核对主管部门最新通知。',
  '地区与主题仅为你描述的检索范围，未确认企业注册地、行业、人数、收入、年度或任何资格。'
];
const DISCLAIMER = '原型演示：企业事实由用户或示例提供，分析和问答是确定性模拟结果，不是官方审核结论。来源中的历史批次与未核验窗口不代表当前开放。';
const ASSIST_LIMITATIONS = [DISCLAIMER, '仅依据已选政策样本回答；不核验附件真伪、不抓取最新通知、不推测审批结果。'];
const UNSUPPORTED_ANSWER = '这份模拟问答无法可靠回答该问题。你可以改问所选政策的解释、申报条件、材料、填写、卡点、流程或办理窗口，并通过官方来源核验。';

// ---------------------------------------------------------------- 数据加载
let datasetPromise = null;
async function dataset() {
  if (!datasetPromise) {
    datasetPromise = Promise.all([
      fetch('data/policies.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('dataset unavailable'); return r.json(); }),
      fetch('data/sources.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('sources unavailable'); return r.json(); })
    ]).then(([pol, src]) => {
      if (!Array.isArray(pol?.policies)) throw new Error('invalid dataset');
      return { policies: pol.policies, datasetDate: pol.datasetDate, sources: Array.isArray(src?.items) ? src.items : [] };
    }).catch(e => { datasetPromise = undefined; throw e; });
  }
  return datasetPromise;
}
function canonical(value) {
  return Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, canonical(value[k])]))
      : value;
}
async function fingerprint(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonical(value)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------------ 词典
const REGION_RULES = [
  ['龙岗区', ['龙岗']], ['南山区', ['南山']], ['福田区', ['福田']], ['宝安区', ['宝安']],
  ['龙华区', ['龙华']], ['坪山区', ['坪山']], ['光明区', ['光明']], ['大鹏新区', ['大鹏']],
  ['深汕特别合作区', ['深汕']], ['深圳市', ['深圳']], ['长沙市', ['长沙']], ['全国', ['全国']]
];
const TOPIC_RULES = [
  { id: 'contract', label: '技术合同认定登记', task: 'steps', primary: true, aliases: ['技术合同', '合同登记', '技术登记'] },
  { id: 'income-tax', label: '企业所得税优惠', task: 'eligibility', primary: true, aliases: ['企业所得税', '所得税优惠'] },
  { id: 'small', label: '小型微利企业所得税优惠', task: 'eligibility', primary: true, aliases: ['小微企业', '小型微利'] },
  { id: 'rdtax', label: '研发费用税前加计扣除', task: 'eligibility', primary: true, aliases: ['加计扣除', '研发费用'] },
  { id: 'rd', label: '研发投入支持', task: 'eligibility', primary: true, aliases: ['研发投入', '研发扶持'] },
  { id: 'techsme', label: '科技型中小企业评价入库', task: 'eligibility', primary: true, aliases: ['科技型中小企业'] },
  { id: 'hightech', label: '高新技术企业认定', task: 'eligibility', primary: true, aliases: ['高新技术企业', '高企'] },
  { id: 'software', label: '软件与信息技术方向', task: 'eligibility', primary: true, aliases: ['软件', '信息技术'] },
  { id: 'recognition', label: '企业资质认定', task: 'eligibility', primary: false, aliases: ['认定', '认证', '资质'] }
];
// 区→市归属（用于"地区覆盖"加分：龙岗区问题下的深圳市政策算覆盖）
const DISTRICT_CITY = { '龙岗区': '深圳市', '南山区': '深圳市', '福田区': '深圳市', '宝安区': '深圳市', '龙华区': '深圳市', '坪山区': '深圳市', '光明区': '深圳市', '大鹏新区': '深圳市', '深汕特别合作区': '深圳市' };
const STOPWORDS = new Set(['我们', '你们', '他们', '大家', '企业', '公司', '想', '了解', '怎么', '如何', '请问', '一下', '一个', '哪些', '什么', '这个', '那个', '的', '了', '是', '和', '与', '及', '或', '在', '做', '有', '到', '要', '能', '可以', '能不能', '可不可以', '申请', '办理', '支持', '政策', '查找', '帮助']);

function detectRegions(question) {
  const hits = [];
  for (const [label, aliases] of REGION_RULES) {
    let idx = -1;
    for (const a of aliases) { const i = question.indexOf(a); if (i >= 0 && (idx < 0 || i < idx)) idx = i; }
    if (idx >= 0) hits.push({ label, idx });
  }
  hits.sort((a, b) => a.idx - b.idx);
  return hits.map(h => h.label);
}
function detectTopics(question) {
  // 输出顺序 = 词典顺序（对齐原站：live [rd, software]、q2 [techsme, hightech, recognition]、q3 [income-tax, small]）
  const hits = [];
  const used = [];
  for (const t of TOPIC_RULES) {
    for (const alias of [...t.aliases].sort((a, b) => b.length - a.length)) {
      let idx = question.indexOf(alias);
      while (idx >= 0 && used.some(u => !(idx + alias.length <= u.start || idx >= u.start + u.end))) idx = question.indexOf(alias, idx + 1);
      if (idx >= 0) { hits.push({ ...t, matchedText: alias, idx }); used.push({ start: idx, end: alias.length }); break; }
    }
  }
  return hits;
}
function unmatchedFragments(question, reserved) {
  const fragments = [];
  const re = /[\u4e00-\u9fa5]+/g;
  let m;
  while ((m = re.exec(question))) {
    let seg = m[0];
    for (const r of reserved) seg = seg.split(r).join(' ');
    for (const s of STOPWORDS) while (seg.includes(s)) seg = seg.split(s).join(' ');
    for (const piece of seg.split(' ')) if (piece) fragments.push(piece);
  }
  return fragments;
}
function detectExcluded(question) {
  const out = [];
  const re = /(?:不含|不涉及|排除|不要|不是)([\u4e00-\u9fa5]{2,8})/g;
  let m; while ((m = re.exec(question))) out.push(m[1]);
  return out;
}

// ------------------------------------------------------------------ 检索
// 可匹配字段 = 标题/标签/概要/适用范围/支持内容/填写指引帮助（对齐原站：
// 条件问答中出现的词不参与打分，例如 techsme 的"企业所得税"只在条件里，不命中 q3）。
// 权重经 tests/reference 四组问题反解标定：q2 需要 概要(10) > 标签(8) 时
// hightech(标题+概要) 才排在 techsme(标题+标签) 之前。
const FIELDS_BY_WEIGHT = [
  ['title', 15, t => `标题匹配“${t}”`],
  ['tags', 8, t => `方向标签匹配“${t}”`],
  ['summary', 10, t => `政策概要匹配“${t}”`],
  ['audience', 4, t => `适用范围匹配“${t}”`],
  ['benefit', 4, t => `支持内容匹配“${t}”`],
  ['formGuideHelp', 4, t => `填写指引匹配“${t}”`]
];
// 词干白名单：概要级词干模糊仅对显式登记的语义别名生效（原站 limitations 亦声明
// "语义别名使用可解释规则"）。通用两字词干（企业/技术/所得…）会误伤，不做模糊。
const STEM_WHITELIST = { '研发投入': '研发', '研发费用': '研发', '研发扶持': '研发' };
function fieldText(policy, key) {
  if (key === 'tags') return Array.isArray(policy.tags) ? policy.tags.join(' ') : '';
  if (key === 'formGuideHelp') return (policy.formGuide?.fields ?? []).map(f => f.help ?? '').join(' ');
  const v = policy[key];
  return typeof v === 'string' ? v : '';
}
function scorePolicy(policy, terms, regionLabel) {
  let score = 0;
  const matched = [], reasons = [];
  for (const term of terms) {
    let hit = false;
    const stem = STEM_WHITELIST[term] ?? null;
    const tags = Array.isArray(policy.tags) ? policy.tags : [];
    for (const [key, weight, fmt] of FIELDS_BY_WEIGHT) {
      const text = fieldText(policy, key);
      if (!text) continue;
      if (text.includes(term)) { score += weight; hit = true; if (reasons.length < 5) reasons.push(fmt(term)); continue; }
      if (key === 'tags') {
        // 标签前缀包含（如标签"高新技术" ← 词"高新技术企业"）
        const tagPrefix = tags.find(tag => tag.length >= 2 && term.startsWith(tag));
        if (tagPrefix) { score += 6; hit = true; if (reasons.length < 5) reasons.push(`方向标签匹配“${tagPrefix}”`); continue; }
      }
      if (stem && key === 'tags' && tags.some(tag => tag === stem)) { score += 6; hit = true; if (reasons.length < 5) reasons.push(`方向标签匹配“${stem}”`); continue; }
      if (stem && key === 'summary' && text.includes(stem)) { score += 4; hit = true; if (reasons.length < 5) reasons.push(`政策概要匹配“${stem}”`); continue; }
      if (term.length >= 4 && text.includes(term.slice(0, -1))) { score += Math.ceil(weight * 0.5); hit = true; if (reasons.length < 5) reasons.push(fmt(term.slice(0, -1))); }
    }
    if (hit) matched.push(term);
  }
  if (regionLabel && score > 0) {
    const city = DISTRICT_CITY[regionLabel] ?? null;
    const covers = policy.region === '全国' || policy.region === regionLabel || (city && policy.region === city);
    if (covers) { score += policy.region === '全国' ? 4 : 2; reasons.push(`地区覆盖：${policy.region}覆盖${regionLabel}`); }
  }
  if (score > 0) reasons.push('部分语句未识别，已按明确主题检索；未识别片段没有作为资格或数值条件');
  return { score, matchedTerms: matched, reasons };
}
async function discover(body) {
  const question = String(body?.question ?? '').trim();
  const { policies, datasetDate } = await dataset();
  const regions = detectRegions(question);
  const region = regions[0] ?? null;
  const topics = detectTopics(question);
  const excludedTerms = detectExcluded(question);
  const positiveTerms = [...topics.map(t => t.matchedText), ...regions.map(r => REGION_RULES.find(([label]) => label === r)[1][0])];
  const topicTerms = topics.filter(t => t.primary).map(t => t.matchedText);
  const unresolvedTerms = question ? unmatchedFragments(question, [...new Set([...positiveTerms, ...excludedTerms])]).filter(f => !excludedTerms.includes(f)) : [];
  const matchTerms = topicTerms; // 仅主题词参与打分（非 primary 的"认定"等泛主题只进解释）
  const scored = [];
  for (const p of policies) {
    if (excludedTerms.some(term => fieldText(p, 'title').includes(term) || fieldText(p, 'summary').includes(term))) continue;
    const r = scorePolicy(p, matchTerms, region);
    if (r.score > 0) scored.push({ policy: p, retrieval: r });
  }
  scored.sort((a, b) => b.retrieval.score - a.retrieval.score || (a.policy.id < b.policy.id ? -1 : 1));
  // F2 前置拦截：识别到未覆盖地区时立即说明，不返回弱相关结果。
  const uncovered = regions.length > 0 && regions.every(r => !COVERED_REGIONS.has(r));
  if (uncovered) scored.length = 0;
  const items = scored.map(s => ({ ...s.policy, retrieval: s.retrieval }));
  const status = items.length ? 'ready' : (topics.length || regions.length ? 'no_candidates' : 'needs_clarification');
  const closed = items.filter(i => i.applicationStatus === 'closed').length;
  const unknown = items.filter(i => (i.applicationStatus || 'unknown') === 'unknown').length;
  const primaryLabels = topics.filter(t => t.primary).map(t => t.label);
  let summary;
  if (uncovered) summary = `已识别检索地区为${regions.join('、')}，当前样本暂未覆盖该地区。已收录的覆盖范围：深圳市（含各区）与全国政策。`;
  else if (!topics.length) summary = '还需要说明你想解决的具体业务问题，才能提供有依据的候选事项。';
  else {
    summary = `你想了解${primaryLabels.join('、')}${region ? `，检索地区为${region}` : ''}。已找到 ${items.length} 个有真实来源的候选，请选择要进一步核对的事项。`;
    if (closed) summary += ` 其中 ${closed} 项对应已截止历史批次，只能作为后续准备参考。`;
    if (unknown) summary += ` 其中 ${unknown} 项办理窗口尚未核验。`;
  }
  const followUpQuestions = [];
  if (unresolvedTerms.length) followUpQuestions.push(`描述中的“${unresolvedTerms.join('、')}”尚未准确对应规则；可补充业务目的或事项名称，数字和年度不会自动成为企业事实。`);
  if (uncovered) followUpQuestions.push('当前样本只覆盖深圳市（含各区）与全国政策。可以改问这两类范围的事项，或前往当地政务服务平台查询办理。');
  else if (!regions.length && topics.length) followUpQuestions.push('你希望查哪个城市或区的事项？这个地区只用于发现范围，后续仍需提供真实注册或经营依据。');
  if (!items.length && topics.length && !uncovered) {
    // F3 无结果兜底：给出标签最接近的样本方向，而不是沉默或弱相关结果。
    const near = policies.filter(p => (p.tags ?? []).some(tag => topics.some(tp => tp.aliases.some(a => tag.includes(a) || a.includes(tag))))).slice(0, 2);
    followUpQuestions.push(near.length
      ? `暂时没有直接匹配的事项。相近的样本方向：${near.map(p => p.title).join('、')}，可以就这些方向继续提问。`
      : '可以换一个支持方向或事项名称再试，或先查看当前资料的覆盖范围。');
  }
  return {
    mode: 'mock',
    question,
    interpretation: {
      summary, status,
      suggestedTask: (topics.find(t => t.primary) ?? topics[0] ?? { task: 'eligibility' }).task,
      topics: topics.map(({ id, label, matchedText }) => ({ id, label, matchedText })),
      region, regions, excludedTerms, unresolvedTerms, companyFactsInferred: false
    },
    items,
    meta: {
      mode: 'deterministic',
      query: { positiveTerms, excludedTerms, unresolvedTerms, residualHandling: topics.length ? 'soft' : 'literal', topicTerms, message: topics.length ? '已按明确主题检索；未识别片段未参与地区、资格、行业或数值判断。' : null },
      totalAvailable: policies.length,
      excluded: excludedTerms.map(term => ({ term })),
      limitations: LIMITATIONS,
      modelUsed: false, understanding: 'dictionary_rules', totalReturned: items.length,
      catalogueSuppressed: false, selectionRequired: true, companyFactsInferred: false
    },
    followUpQuestions,
    sources: items.map(p => ({ policyId: p.id, ...(p.source ?? {}), version: p.version ?? null })),
    datasetDate,
    generatedAt: new Date().toISOString()
  };
}

// ------------------------------------------------------------------ 核对
const FACT_MISSING = '尚未提供本条专项事实与期间';
const FACT_VERIFY = '需专项资料核验（已有基础字段不能替代）';
const REASON_MISSING = '请补充本条要求的具体资料、专项事实及对应期间；基础档案不能替代原文的专项口径。';
const REASON_VERIFY = '该条件需要材料或人工核验，模拟服务无法确认；基础档案不能替代原文要求的专项事实、统计期间和口径。';
const REASON_USER_MET = '用户自报的具体资料及期间提供了初步满足依据；未经材料验证或官方审核，不代表取得资格。';
const REASON_USER_UNMET = '用户自报该项暂未满足，保留具体资料及期间；应回读原文并核实，不是官方审核结论。';
const REASON_USER_UNKNOWN = '已保留用户自报资料；该条件涉及复合规则或专项审核，答案不能替代材料、适用路径和官方核验。';
const REASON_PROFILE_MET = '所填企业事实满足这一结构化条件；仍需官方材料验证。';
const REASON_PROFILE_UNMET = '所填企业事实与这一结构化条件不一致。';
const REASON_PROFILE_MISSING = '企业档案缺少这项事实，请补充后再评估。';

function matchStructured(value, operator, expected) {
  switch (operator) {
    case 'in': {
      const list = Array.isArray(expected) ? expected : String(expected).split(/[,，、]/);
      return list.some(item => String(value) === String(item) || String(value).includes(String(item)));
    }
    case 'lte': return Number(value) <= Number(expected);
    case 'gte': return Number(value) >= Number(expected);
    case 'lt': return Number(value) < Number(expected);
    case 'gt': return Number(value) > Number(expected);
    case 'eq': return String(value) === String(expected);
    default: return false;
  }
}
function evaluateCondition(cond, profile, assessment) {
  const structured = cond.operator && cond.operator !== 'manual' && cond.field && cond.value !== undefined && cond.value !== null;
  if (structured) {
    const value = profile?.[cond.field];
    const missing = value === undefined || value === null || value === '';
    const ok = !missing && matchStructured(value, cond.operator, cond.value);
    return {
      fact: missing ? null : value,
      status: missing ? 'missing' : (ok ? 'met' : 'unmet'),
      reason: missing ? REASON_PROFILE_MISSING : (ok ? REASON_PROFILE_MET : REASON_PROFILE_UNMET),
      evidenceOrigin: 'user_profile', assessment: null, fromAssessment: false,
      fieldMissing: missing ? cond.field : null, requires: null
    };
  }
  if (assessment && ['yes', 'no', 'unknown'].includes(assessment.answer)) {
    const note = assessment.note ?? '', period = assessment.period ?? '';
    const joined = [note, period ? `期间：${period}` : ''].filter(Boolean).join('；');
    const yes = assessment.answer === 'yes', no = assessment.answer === 'no';
    return {
      fact: yes ? `是（用户自报）：${joined}` : no ? `否（用户自报）：${joined}` : '用户暂未确认',
      status: yes ? 'met' : no ? 'unmet' : 'verify',
      reason: yes ? REASON_USER_MET : no ? REASON_USER_UNMET : REASON_USER_UNKNOWN,
      evidenceOrigin: 'user_report', fieldMissing: null, fromAssessment: true,
      assessment: { period, source: assessment.source ?? 'user', note, answer: assessment.answer },
      requires: null
    };
  }
  if (cond.assessmentAllowed) {
    return { fact: FACT_MISSING, status: 'missing', reason: REASON_MISSING, evidenceOrigin: 'unverified', assessment: null, fromAssessment: false, fieldMissing: null, requires: 'assessment' };
  }
  return { fact: FACT_VERIFY, status: 'verify', reason: REASON_VERIFY, evidenceOrigin: 'unverified', assessment: null, fromAssessment: false, fieldMissing: null, requires: null };
}
function windowStatusOf(policy) { return policy.applicationStatus || 'unknown'; }
function windowSentence(status) {
  if (status === 'closed') return '此历史申报批次已截止，不能视为当前可申报。';
  if (status === 'tax_filing') return '办理时间需按原文及主管部门最新要求确认。';
  if (status === 'open') return '当前显示的办理状态来自已收录资料，仍需以官方最新通知为准。';
  if (status === 'active') return '办理窗口与批次状态以官方最新通知为准。';
  return '当前申报窗口未核验。';
}
async function analyze(body) {
  const policyIds = Array.isArray(body?.policyIds) ? body.policyIds : [];
  const profile = body?.profile ?? {};
  const assessments = body?.assessments ?? {};
  const { policies } = await dataset();
  const byId = new Map(policies.map(p => [p.id, p]));
  const inputFingerprint = await fingerprint({ profile, policyIds: [...policyIds].sort(), assessments });
  const assessmentsFingerprint = await fingerprint(assessments);
  const results = [], policyVersions = [];
  for (const id of policyIds) {
    const p = byId.get(id);
    if (!p) continue;
    policyVersions.push({ policyId: id, version: p.version ?? null, verifiedAt: p.verifiedAt ?? null });
    const evaluated = (p.conditions ?? []).map(c => {
      const ev = evaluateCondition(c, profile, assessments[id]?.[c.id]);
      const ordered = {
        conditionId: c.id, label: c.label, field: c.field ?? null,
        fact: ev.fact, status: ev.status, reason: ev.reason,
        evidence: c.evidence ?? null, sourceUrl: c.sourceUrl ?? null, question: c.question ?? null,
        inputType: c.inputType ?? 'evidence', assessmentAllowed: !!c.assessmentAllowed,
        evidenceOrigin: ev.evidenceOrigin, periodRequired: !!c.periodRequired,
        expectedPeriod: c.expectedPeriod ?? null
      };
      if (ev.assessment) ordered.assessment = ev.assessment;
      if (ev.requires === 'assessment') { ordered.missingFields = []; ordered.requiredInput = 'assessment'; }
      return { ...ordered, __fromAssessment: ev.fromAssessment, __fieldMissing: ev.fieldMissing };
    });
    const counts = { met: 0, unmet: 0, missing: 0, verify: 0 };
    let assessmentBacked = 0;
    const fieldMissingList = [];
    for (const c of evaluated) {
      counts[c.status] += 1;
      if (c.__fromAssessment && (c.status === 'met' || c.status === 'unmet')) assessmentBacked += 1;
      if (c.__fieldMissing) fieldMissingList.push(c.__fieldMissing);
    }
    const wstatus = windowStatusOf(p);
    const segs = [];
    if (counts.unmet > 0) segs.push(`已填写信息中有 ${counts.unmet} 项未满足条件。`);
    else if (counts.met > 0) segs.push('已提供事实未发现明确不匹配；已满足项仅为初步依据。');
    else segs.push('尚未提供足够事实完成初筛。');
    if (counts.missing > 0) segs.push(`还有 ${counts.missing} 项企业事实或期间缺失。`);
    if (counts.verify > 0) segs.push(`${counts.verify} 项条件需要人工核验。`);
    if (assessmentBacked > 0) segs.push(`${assessmentBacked} 项依据用户专项自报，尚未审核证明材料。`);
    segs.push(windowSentence(wstatus));
    const nextSteps = [];
    if (counts.missing > 0) nextSteps.push('补充缺失的具体企业事实、资料依据和指定数据期间。');
    if (counts.unmet > 0) nextSteps.push('核对不匹配条件及企业事实，必要时调整申报方向。');
    nextSteps.push('逐项准备材料，并由经办人确认人工核验条件。');
    nextSteps.push(wstatus === 'closed' ? '等待或查阅主管部门下一批正式通知；不沿用历史截止日期。' : '打开官方来源，核验当前办理窗口、材料版本和申报渠道。');
    const followUpQuestions = evaluated.filter(c => c.status === 'missing' || c.status === 'verify').map(c => ({
      policyId: id, conditionId: c.conditionId, question: c.question, inputType: c.inputType,
      assessmentAllowed: c.assessmentAllowed, expectedPeriod: c.expectedPeriod, reason: c.reason
    }));
    results.push({
      policyId: id, title: p.title, policyVersion: p.version ?? null, source: p.source ?? null,
      verifiedAt: p.verifiedAt ?? null, applicationStatus: p.applicationStatus ?? 'unknown',
      conditions: evaluated.map(({ __fromAssessment, __fieldMissing, ...c }) => c),
      summary: segs.join(' '), counts, nextSteps,
      missingFields: [...new Set(fieldMissingList)], followUpQuestions,
      window: { open: p.window?.open ?? null, close: p.window?.close ?? null, note: p.window?.note ?? null, status: wstatus },
      sourceUrl: p.source?.url ?? null, mode: 'mock'
    });
  }
  return {
    mode: 'mock', contractVersion: 2, inputFingerprint, assessmentsFingerprint,
    policyVersions, results, task: body?.task || 'eligibility',
    generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER
  };
}

// ------------------------------------------------------------------ 问答
function explainAnswer(p) {
  const conds = (p.conditions ?? []).slice(0, 4);
  return `${p.title}：以下为依据公开样本的整理说明，请对照原文理解。政策概要：${p.summary ?? ''}支持内容：${p.benefit ?? ''}关键依据：${conds.map(c => `${c.label}：${c.evidence ?? ''}`).join('；')}整理说明不构成资格、材料完整性或获批确认。`;
}
function explainEvidence(p) {
  const out = [{ policyId: p.id, title: p.title, sourceUrl: p.source?.url ?? null, anchor: 'summary', evidence: p.summary ?? '' }];
  for (const c of (p.conditions ?? []).slice(0, 4)) out.push({ policyId: p.id, title: p.title, sourceUrl: c.sourceUrl ?? null, anchor: `condition:${c.id}`, evidence: c.evidence ?? '' });
  return out.slice(0, 5);
}
async function assistant(body) {
  const task = body?.task || 'explain';
  const { policies } = await dataset();
  const byId = new Map(policies.map(p => [p.id, p]));
  const picked = (Array.isArray(body?.policyIds) ? body.policyIds : []).map(id => byId.get(id)).filter(Boolean);
  const stamp = { mode: 'mock', limitations: ASSIST_LIMITATIONS, generatedAt: new Date().toISOString() };
  if (!picked.length || !['explain', 'materials', 'steps', 'review', 'forms'].includes(task)) {
    return { ...stamp, task: 'unsupported', answer: UNSUPPORTED_ANSWER, evidence: [] };
  }
  const p = picked[0];
  if (task === 'explain') return { ...stamp, task, answer: explainAnswer(p), evidence: explainEvidence(p) };
  if (task === 'materials') {
    const mats = (p.materials ?? []).slice(0, 8);
    return {
      ...stamp, task,
      answer: `${p.title}：以下为依据公开样本整理的材料清单，请对照本批官方指南核对。${mats.map(m => `${m.name}：${m.note ?? ''}`).join('；')}。材料清单以官方最新指南为准，本整理不构成完整性确认。`,
      evidence: mats.slice(0, 5).map(m => ({ policyId: p.id, title: p.title, sourceUrl: m.sourceUrl ?? null, anchor: `material:${m.id}`, evidence: m.note ?? '' }))
    };
  }
  if (task === 'steps') {
    const steps = (p.steps ?? []).slice(0, 6);
    return {
      ...stamp, task,
      answer: `${p.title}：办理流程按公开样本整理如下。${steps.map((s, i) => `第${i + 1}步 ${s.title}：${s.description ?? ''}`).join('；')}。流程以官方最新通知为准，本整理不构成办理承诺。`,
      evidence: steps.slice(0, 5).map((s, i) => ({ policyId: p.id, title: p.title, sourceUrl: s.sourceUrl ?? null, anchor: `step:${i}`, evidence: s.description ?? '' }))
    };
  }
  if (task === 'forms') {
    const fields = (p.formGuide?.fields ?? []).slice(0, 6);
    return {
      ...stamp, task,
      answer: `${p.title}：填写口径按现行指引样本整理。${fields.map(f => `${f.label}：${f.help ?? ''}`).join('；')}。填写不代表获批，须以官方表格和本批指南为准。`,
      evidence: fields.map(f => ({ policyId: p.id, title: p.title, sourceUrl: f.sourceUrl ?? p.formGuide?.sourceUrl ?? null, anchor: `field:${f.id}`, evidence: f.help ?? '' }))
    };
  }
  return {
    ...stamp, task,
    answer: `${p.title}：复查提示。${(p.limitations ?? []).slice(0, 3).join('')}请按官方原文逐项确认条件、材料、窗口与版本后再提交，本模拟不构成审核结论。`,
    evidence: (p.relatedDocuments ?? []).slice(0, 5).map(d => ({ policyId: p.id, title: p.title, sourceUrl: d.url ?? null, anchor: `related:${d.id}`, evidence: d.title ?? '' }))
  };
}

// ------------------------------------------------------------------ 入口
const HANDLED = ['/health', '/sources', '/discover', '/analyze', '/assistant'];
// 供应用层复用：从问题中识别地区（I1 信息复用）。
function regionsOf(question) { return detectRegions(String(question ?? '')); }
// 当前样本的覆盖范围（F2 前置拦截）：全部政策的 region 取值集合。
const COVERED_REGIONS = new Set(['深圳市', '龙岗区', '南山区', '福田区', '宝安区', '龙华区', '坪山区', '光明区', '大鹏新区', '深汕特别合作区', '全国']);
function handlesLocalApi(endpoint) {
  return typeof endpoint === 'string' && HANDLED.includes(endpoint.split('?')[0]);
}
async function localApiRequest(endpoint, options = {}) {
  if (options.signal?.aborted) throw new DOMException('已取消过期请求', 'AbortError');
  const path = endpoint.split('?')[0];
  const method = (options.method ?? 'GET').toUpperCase();
  if (path === '/health' && method === 'GET') {
    const origin = location.origin;
    return {
      status: 'ok', mode: 'mock', configuredLlmMode: 'mock', localOnly: false,
      hosting: 'static_bundle', authentication: 'none', storage: 'visitor_browser',
      services: { web: { baseUrl: origin }, api: { baseUrl: origin + '/api/v1', sameOriginPath: '/api/v1', contract: '/openapi.json' } },
      capabilities: { retrieval: 'deterministic', naturalLanguageDiscovery: true, conditionAssessments: true, recordRevision: true, workflowPersistence: 'browser_only', llm: 'mock', sourceUpdates: 'mock_queue', maxRequestBytes: 393216 },
      privacy: { serverPersistence: false, crossDeviceSync: false, analysisInputs: 'processed transiently; never saved by this service' },
      time: new Date().toISOString()
    };
  }
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body ?? {});
  if (path === '/sources' && method === 'GET') return { items: (await dataset()).sources };
  if (path === '/discover' && method === 'POST') return discover(body);
  if (path === '/analyze' && method === 'POST') return analyze(body);
  if (path === '/assistant' && method === 'POST') return assistant(body);
  const err = new Error('本地 API 路由不存在。');
  err.status = 404; err.code = 'ROUTE_NOT_FOUND';
  throw err;
}

return {HANDLED, regionsOf, handlesLocalApi, localApiRequest};
})();

/* ===== ./local-lib/validation.mjs ===== */
const __m___local_lib_validation_mjs = (() => {
class HttpError extends Error {
  constructor(status,code,message,details) { super(message); this.status=status; this.code=code; if (details) this.details=details; }
}
const fail=(message,status=400,code='INVALID_REQUEST')=>{throw new HttpError(status,code,message);};
function object(value,label='请求体') {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key=>['__proto__','constructor','prototype'].includes(key))) fail(`${label}必须是普通 JSON 对象。`);
  return value;
}
function string(value,label,max=2000,allowEmpty=true) {
  if (typeof value !== 'string' || value.length>max || (!allowEmpty && !value.trim())) fail(`${label}必须是长度不超过 ${max} 的${allowEmpty?'':'非空'}字符串。`);
  return value.trim();
}
const numeric=new Set(['employees','revenue','rdRatio','ageYears']);
const boolean=new Set(['highTech','techSme','smallProfit','compliant','exporter','hasIp']);
const textual=new Set(['companyName','region','industry','period']);
function validateProfile(input) {
  object(input,'profile'); const profile={};
  for (const [key,value] of Object.entries(input)) {
    if (!numeric.has(key)&&!boolean.has(key)&&!textual.has(key)&&key!=='origin') fail(`不支持的企业档案字段：${key}`);
    if (value===null || value==='') {profile[key]=value;continue;}
    if (numeric.has(key)) {
      if (typeof value!=='number'||!Number.isFinite(value)||value<0||(key==='employees'&&!Number.isInteger(value))) fail(`${key}必须是非负${key==='employees'?'整数':'数值'}或空值。`);
      if (key==='rdRatio'&&value>100) fail('rdRatio 使用百分比数值，范围为 0–100。');
    } else if (boolean.has(key)) {if (typeof value!=='boolean') fail(`${key}必须是布尔值或空值。`);}
    else if (key==='origin') {if (!['user','demo'].includes(value)) fail('origin 必须是 user 或 demo。');}
    else string(value,key,300);
    profile[key]=value;
  }
  return profile;
}
const idPattern=/^[a-zA-Z0-9_-]{1,120}$/;
function validId(value,label) {if (typeof value!=='string'||!idPattern.test(value)) fail(`${label}必须为有效 ID。`);return value;}
function ids(input,label='policyIds',optional=true) {
  if (input===undefined&&optional) return [];
  if (!Array.isArray(input)||input.length>32||input.some(id=>typeof id!=='string'||!idPattern.test(id))) fail(`${label}必须是最多 32 个有效 ID 的数组。`);
  return [...new Set(input)];
}
function allowedKeys(value,keys,label) {object(value,label);for(const key of Object.keys(value)) if(!keys.includes(key)) fail(`${label}不支持字段：${key}`);}
function boundedMap(value,label,limit,visit) {
  object(value,label);if(Object.keys(value).length>limit) fail(`${label}条目不得超过 ${limit}。`);
  for(const [key,item] of Object.entries(value)) {validId(key,`${label}键`);visit(item,`${label}.${key}`);}return value;
}
function validateAssessments(input={}) {
  return boundedMap(input,'assessments',32,(conditions,label)=>boundedMap(conditions,label,100,(assessment,name)=>{
    allowedKeys(assessment,['answer','note','period','source'],name);
    if(!['yes','no','unknown'].includes(assessment.answer)) fail(`${name}.answer 必须为 yes/no/unknown。`);
    if(assessment.note!==undefined) string(assessment.note,name+'.note',4000);
    if(assessment.period!==undefined) string(assessment.period,name+'.period',300);
    if(assessment.source!=='user') fail(`${name}.source 必须为 user；用户自报不代表官方审核。`);
  }));
}
function validateAssessmentScope(assessments,policies,selectedIds) {
  for(const [policyId,answers] of Object.entries(assessments)) {
    const policy=policies.find(p=>p.id===policyId);
    if(!policy||!selectedIds.includes(policyId)) fail('专项回答只能属于所选政策。',400,'ASSESSMENT_SCOPE_INVALID');
    for(const id of Object.keys(answers)) if(!(policy.conditions??[]).some(c=>c.id===id||c.conditionId===id)) fail('专项回答的条件 ID 不存在。',400,'ASSESSMENT_CONDITION_INVALID');
  }
}
function analyzeInput(input) {
  allowedKeys(input,['policyIds','profile','assessments','task','question'],'分析请求');return {policyIds:ids(input.policyIds),profile:validateProfile(input.profile??{}),assessments:validateAssessments(input.assessments??{}),task:input.task===undefined?'eligibility':string(input.task,'task',100),question:input.question===undefined?'':string(input.question,'question',4000)};
}
function discoverInput(input) {
  allowedKeys(input,['question'],'自然语言发现请求');return {question:string(input.question,'question',4000,false)};
}
// All snapshots are bounded recursively as well as at their public schema boundaries.
function boundedJson(value,label,depth=0,budget={nodes:0}) {
  if(++budget.nodes>18000||depth>10) fail(`${label}结构过深或条目过多。`);
  if(value===null||typeof value==='boolean') return;
  if(typeof value==='number') {if(!Number.isFinite(value)) fail(`${label}必须为有限数值。`);return;}
  if(typeof value==='string') {string(value,label,18000);return;}
  if(Array.isArray(value)) {if(value.length>160) fail(`${label}数组最多 160 项。`);for(const item of value) boundedJson(item,label,depth+1,budget);return;}
  object(value,label);if(Object.keys(value).length>120) fail(`${label}字段过多。`);
  for(const [key,item] of Object.entries(value)) {if(key.length>160) fail(`${label}键过长。`);boundedJson(item,label,depth+1,budget);}
}
function booleanProgress(value,label) {boundedMap(value,label,32,(entries,name)=>boundedMap(entries,name,100,(flag,path)=>{if(typeof flag!=='boolean') fail(`${path}必须为布尔值。`);}));}
function validateAnalysis(value) {
  allowedKeys(value,['mode','results','task','generatedAt','disclaimer','contractVersion','inputFingerprint','assessmentsFingerprint','policyVersions'],'analysisSnapshot');
  if(value.mode!=='mock'||!Array.isArray(value.results)||value.results.length>32) fail('analysisSnapshot 需为最多32项的模拟分析结果。');
  if(value.contractVersion!==undefined && value.contractVersion!==2) fail('analysisSnapshot.contractVersion 只支持 2。');
  for(const key of ['inputFingerprint','assessmentsFingerprint']) if(value[key]!==undefined && !/^[a-f0-9]{64}$/.test(value[key])) fail(`analysisSnapshot.${key}无效。`);
  for(const result of value.results) {
    object(result,'analysisSnapshot.results');validId(result.policyId,'result.policyId');
    if(!Array.isArray(result.conditions)||result.conditions.length>100) fail('每政策条件最多100项。');
    for(const condition of result.conditions) {
      object(condition,'condition');if(!['met','unmet','missing','verify'].includes(condition.status)) fail('condition.status无效。');
      validId(condition.conditionId,'conditionId');
      if(condition.assessment) validateAssessments({[result.policyId]:{[condition.conditionId]:condition.assessment}});
    }
  }
  boundedJson(value,'analysisSnapshot');
}
const recordFields=new Set(['policyId','policyIds','title','status','notes','checklist','dueDate','question','analysisSnapshot','profileSnapshot','draft','sourceVersions','task','mode','assessments','stepsProgress','formDrafts','workflow','analysisVersion','messages']);
const statuses=['saved','evaluating','preparing','submitted','approved','rejected','archived'];
function validateRecord(input) {
  object(input);const output={};
  for(const [key,value] of Object.entries(input)) {
    if(!recordFields.has(key)) fail(`不支持的记录字段：${key}`);
    if(key==='status'&&!statuses.includes(value)) fail(`status 需为 ${statuses.join(', ')}。`);
    if(key==='policyId'&&value!==null) validId(value,key);
    if(['title','dueDate','question','task'].includes(key)&&value!==null) string(value,key,key==='question'?4000:500);
    if(key==='dueDate'&&value!==null&&value!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('dueDate 需为 YYYY-MM-DD 日期或空值。');
    if(key==='notes'&&value!==null) {
      if(Array.isArray(value)) {if(value.length>80) fail('notes最多80项。');for(const text of value) string(text,'notes',2000);} else string(value,key,16000);
    }
    if(key==='policyIds') output[key]=ids(value);
    if(key==='profileSnapshot'&&value!==null) output[key]=validateProfile(value);
    if(key==='analysisSnapshot'&&value!==null) validateAnalysis(value);
    if(['checklist','stepsProgress'].includes(key)&&value!==null) booleanProgress(value,key);
    if(key==='draft'&&value!==null) {if(typeof value==='string') string(value,key,18000);else boundedMap(value,key,32,(text,path)=>string(text,path,18000));}
    if(key==='formDrafts'&&value!==null) boundedMap(value,key,32,(fields,name)=>boundedMap(fields,name,100,(field,path)=>{if(field===null)return;if(typeof field==='number'){if(!Number.isFinite(field)||Math.abs(field)>1e15)fail(`${path}数值无效。`);}else string(field,path,8000);}));
    if(key==='assessments'&&value!==null) validateAssessments(value);
    if(key==='workflow'&&value!==null) {
      allowedKeys(value,['stage','activePolicyId','preparationTab','nextAction','blockers','lastReviewedAt'],'workflow');
      if(value.stage!==undefined&&!['discover','evaluate','prepare','review','submitted'].includes(value.stage)) fail('workflow.stage 无效。');
      if(value.preparationTab!==undefined&&!['steps','materials','fields','review'].includes(value.preparationTab)) fail('workflow.preparationTab 无效。');
      if(value.activePolicyId!==undefined&&value.activePolicyId!==null) validId(value.activePolicyId,'workflow.activePolicyId');
      if(value.nextAction!==undefined) string(value.nextAction,'workflow.nextAction',2000);
      if(value.blockers!==undefined) {if(!Array.isArray(value.blockers)||value.blockers.length>40) fail('workflow.blockers最多40项。');for(const text of value.blockers)string(text,'blocker',16000);}
      if(value.lastReviewedAt!==undefined&&value.lastReviewedAt!==null&&!/^\d{4}-\d{2}-\d{2}T/.test(string(value.lastReviewedAt,'workflow.lastReviewedAt',100))) fail('lastReviewedAt需为ISO时间。');
    }
    if(key==='messages'&&value!==null) {
      if(!Array.isArray(value)||value.length>30)fail('messages最多保留30项。');
      for(const message of value) {
        allowedKeys(message,['role','text','evidence','task','policyIds','at'],'message');
        if(!['user','assistant'].includes(message.role))fail('message.role无效。');
        string(message.text,'message.text',12000);
        if(message.task!==undefined)string(message.task,'message.task',100);
        if(message.policyIds!==undefined)ids(message.policyIds);
        if(message.at!==undefined && !Number.isFinite(Date.parse(string(message.at,'message.at',100))))fail('message.at需为有效时间。');
        if(message.evidence!==undefined) {
          if(!Array.isArray(message.evidence)||message.evidence.length>100)fail('message.evidence最多100项。');
          for(const evidence of message.evidence) {
            allowedKeys(evidence,['policyId','title','sourceUrl','anchor','evidence'],'message.evidence');
            if(evidence.policyId!==undefined)validId(evidence.policyId,'evidence.policyId');
            for(const key of ['title','sourceUrl','anchor','evidence'])if(evidence[key]!==undefined&&evidence[key]!==null)string(evidence[key],'evidence.'+key,key==='evidence'?4000:1000);
          }
        }
      }
    }
    if(key==='sourceVersions'&&value!==null) {
      if(!Array.isArray(value)||value.length>32) fail('sourceVersions最多32项。');
      for(const source of value) {allowedKeys(source,['id','title','publishedAt','verifiedAt','url','policyStatus','applicationStatus','version','materials','steps','conditions','formGuide','limitations','source','window','validity','retrievedAt','category','region','authority','summary','audience','benefit','relatedDocuments'],'sourceVersions');validId(source.id,'sourceVersion.id');for(const key of ['category','region','authority','summary','audience','benefit'])if(source[key]!==undefined&&source[key]!==null)string(source[key],'sourceVersion.'+key,8000);boundedJson(source,'sourceVersions');}
    }
    if(key==='analysisVersion'&&value!==null&&value!==2) fail('analysisVersion只支持2。');
    if(key==='mode'&&value!=='mock') fail('当前本地记录 mode 只支持 mock。');
    if(!(key in output)) output[key]=value;
  }
  return output;
}
function expectedRevision(value) {if(!Number.isInteger(value)||value<0) fail('expectedRevision需为非负整数。');return value;}
const writableRecord = record => Object.fromEntries(Object.entries(record).filter(([key])=>recordFields.has(key)));

return {HttpError, fail, object, string, validateProfile, ids, validateAssessments, validateAssessmentScope, analyzeInput, discoverInput, validateRecord, expectedRevision, writableRecord};
})();

/* ===== ./local-store.js ===== */
const __m___local_store_js = (() => {
const {HttpError, fail, object, string, ids, validateProfile, validateRecord, validateAssessmentScope, expectedRevision, writableRecord} = __m___local_lib_validation_mjs;

// Private data stays in one atomic localStorage document on this browser/origin.
// There is no fallback that sends profiles, records or feedback to the server.
const STORAGE_SCOPE = 'policyradar.selfhost.demo.v1';
const STORE_KEY = STORAGE_SCOPE + '.store.v1';
const MAX_RECORD_BYTES = 384 * 1024;
const LOCK_NAME = STORAGE_SCOPE + '.write';
const VERSION = 1;
const MAX_RECORDS = 1000;
const MAX_HISTORY_PER_RECORD = 20;
const MAX_HISTORY_TOTAL = 200;
const MAX_FEEDBACK = 1000;
const MAX_CHECKS = 1000;
const encoder = new TextEncoder();
const clone = value => JSON.parse(JSON.stringify(value));
const byteLength = value => encoder.encode(typeof value === 'string' ? value : JSON.stringify(value)).byteLength;
const idPattern = /^[a-zA-Z0-9_-]{1,120}$/;
const timestamp = () => new Date().toISOString();
const emptyStore = () => ({version:VERSION, revision:0, profile:{}, profileRevision:0, records:[], history:[], feedback:[], checks:[]});

class BrowserStoreError extends HttpError {
  constructor(status, code, message, details) { super(status, code, message, details); this.name = 'BrowserStoreError'; }
}
const error = (status, code, message, details) => { throw new BrowserStoreError(status, code, message, details); };
function canonical(value) {
  return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, canonical(value[key])])) : value;
}
async function fingerprint(value) {
  if (!globalThis.crypto?.subtle) error(503, 'LOCAL_WRITE_LOCK_UNAVAILABLE', '请使用 HTTPS 或本地 localhost 访问，浏览器安全保存暂不可用；当前输入仍可导出。');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(canonical(value))));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) error(503, 'LOCAL_STORAGE_UNAVAILABLE', '当前浏览器无法安全生成记录标识，请更换浏览器后重试；当前输入未保存。');
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function plainKeys(value, keys, label) {
  object(value, label);
  if (Object.keys(value).some(key => !keys.includes(key))) fail(`${label}包含不支持的字段。`);
}
function storedId(value) { if (typeof value !== 'string' || !idPattern.test(value)) fail('保存标识无效。'); }
function storedDate(value) { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) fail('保存时间无效。'); }
function storedRecord(record) {
  const editable = writableRecord(record);
  plainKeys(record, [...Object.keys(editable), 'id', 'revision', 'createdAt', 'updatedAt'], '保存记录');
  storedId(record.id); if (!Number.isInteger(record.revision) || record.revision < 1) fail('保存版本无效。');
  storedDate(record.createdAt); storedDate(record.updatedAt); validateRecord(editable);
  if (byteLength(record) > MAX_RECORD_BYTES) fail('保存记录超过大小上限。');
}
function storedFeedback(item) {
  plainKeys(item, ['id','comment','rating','policyIds','recordId','createdAt','status','delivery'], '保存反馈');
  storedId(item.id); string(item.comment, 'comment', 4000); ids(item.policyIds);
  if (item.rating !== null && !['helpful','unhelpful',1,2,3,4,5].includes(item.rating)) fail('保存反馈评分无效。');
  if (item.recordId !== null) string(item.recordId, 'recordId', 120);
  storedDate(item.createdAt); if (item.status !== 'saved_local' || item.delivery !== 'browser_local') fail('保存反馈模式无效。');
}
function storedCheck(item) {
  plainKeys(item, ['id','sourceIds','policyIds','status','mode','createdAt','completedAt','fetched'], '保存模拟任务');
  storedId(item.id); ids(item.sourceIds, 'sourceIds'); ids(item.policyIds); storedDate(item.createdAt);
  if (item.status !== 'queued_mock' || item.mode !== 'mock' || item.completedAt !== null || item.fetched !== false) fail('保存模拟任务模式无效。');
}
function validateStore(doc) {
  plainKeys(doc, ['version','revision','profile','profileRevision','records','history','feedback','checks'], '浏览器保存文档');
  if (doc.version !== VERSION || !Number.isInteger(doc.revision) || doc.revision < 0 || !Number.isInteger(doc.profileRevision) || doc.profileRevision < 0 || doc.profileRevision > doc.revision) fail('浏览器保存文档版本无效。');
  validateProfile(doc.profile);
  for (const [key, limit] of [['records',MAX_RECORDS], ['history',MAX_HISTORY_TOTAL], ['feedback',MAX_FEEDBACK], ['checks',MAX_CHECKS]]) {
    if (!Array.isArray(doc[key]) || doc[key].length > limit) fail('浏览器保存文档条目无效。');
  }
  const records = new Map(), historyIds = new Set(), counts = new Map();
  for (const record of doc.records) {
    storedRecord(record); if (records.has(record.id)) fail('保存记录标识重复。'); records.set(record.id, record);
  }
  for (const entry of doc.history) {
    plainKeys(entry, ['recordId','savedAt','sequence','snapshot'], '保存历史');
    storedId(entry.recordId); storedDate(entry.savedAt); storedRecord(entry.snapshot);
    const current = records.get(entry.recordId), key = `${entry.recordId}/${entry.snapshot.revision}`;
    if (!current || entry.snapshot.id !== entry.recordId || entry.snapshot.revision >= current.revision || historyIds.has(key)) fail('保存历史与记录不一致。');
    if (!Number.isInteger(entry.sequence) || entry.sequence < 1 || entry.sequence > doc.revision) fail('保存历史顺序无效。');
    historyIds.add(key); counts.set(entry.recordId, (counts.get(entry.recordId) ?? 0) + 1);
    if (counts.get(entry.recordId) > MAX_HISTORY_PER_RECORD) fail('保存历史数量无效。');
  }
  for (const key of ['feedback','checks']) {
    const unique = new Set();
    for (const item of doc[key]) {
      (key === 'feedback' ? storedFeedback : storedCheck)(item);
      if (unique.has(item.id)) fail('保存条目标识重复。'); unique.add(item.id);
    }
  }
  return doc;
}
function expected(headers, input = {}) {
  const raw = new Headers(headers ?? {}).get('if-match'); let header;
  if (raw !== null) {
    const match = raw.match(/^"?(\d+)"?$/); if (!match) fail('If-Match 必须使用当前版本号。');
    header = expectedRevision(Number(match[1]));
  }
  const supplied = input.expectedRevision === undefined ? header : expectedRevision(input.expectedRevision);
  if (supplied === undefined) error(428, 'PRECONDITION_REQUIRED', '请先读取当前版本，再带 expectedRevision 或 If-Match 保存，避免覆盖另一页面的修改。');
  if (header !== undefined && header !== supplied) fail('If-Match 与 expectedRevision 不一致。');
  return supplied;
}
function ensureRevision(actual, revision, code) {
  if (actual !== revision) error(409, code, '内容已被另一页面修改。请重新读取并比较后保存；当前修改尚未写入。', {currentRevision:actual, expectedRevision:revision});
}
function requestBody(value) {
  let raw;
  try { raw = typeof value === 'string' ? value : JSON.stringify(value); }
  catch { error(400, 'INVALID_JSON', '请求体不是有效的 JSON。'); }
  if (typeof raw !== 'string') error(400, 'INVALID_JSON', '请求体不是有效的 JSON。');
  if (byteLength(raw) > MAX_RECORD_BYTES) error(413, 'BODY_TOO_LARGE', '请求体不得超过 384 KiB。');
  try { return object(JSON.parse(raw)); }
  catch (cause) { if (cause instanceof HttpError) throw cause; error(400, 'INVALID_JSON', '请求体不是有效的 JSON。'); }
}
function endpointUrl(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('/') || endpoint.startsWith('//')) error(400, 'INVALID_PATH', '本地保存接口路径无效。');
  const url = new URL(endpoint, 'https://browser-local.invalid');
  try { url.pathname = decodeURIComponent(url.pathname); } catch { error(400, 'INVALID_PATH', 'URL 编码无效。'); }
  return url;
}
function handlesLocal(endpoint) {
  if (typeof endpoint !== 'string') return false;
  return /^\/(profile|records|feedback|source-check)(?:[/?#]|$)/.test(endpoint);
}
function selectPolicies(policies, selected) {
  const found = selected.map(id => policies.find(policy => policy.id === id));
  if (found.some(policy => !policy)) error(404, 'POLICY_NOT_FOUND', '所选政策 ID 不存在。');
  return found;
}
// This follows the public source-list contract, without fetching official URLs.
function sourceList(dataset) {
  const byUrl = new Map();
  const add = (url, policy, extra = {}) => {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return;
    if (!byUrl.has(url)) byUrl.set(url, {id:extra.id ?? `source-${byUrl.size+1}`, policyIds:[]});
    if (policy && !byUrl.get(url).policyIds.includes(policy.id)) byUrl.get(url).policyIds.push(policy.id);
  };
  for (const source of dataset.sources ?? []) add(source.url, null, source);
  for (const policy of dataset.policies) {
    add(policy.source?.url, policy, policy.source ?? {});
    if (policy.formGuide) { add(policy.formGuide.sourceUrl, policy, policy.formGuide); add(policy.formGuide.templateUrl, policy, policy.formGuide); }
    for (const entry of [...(policy.relatedDocuments??[]), ...(policy.conditions??[]), ...(policy.materials??[]), ...(policy.steps??[]), ...(policy.formGuide?.fields??[])]) {
      if (typeof entry === 'object' && entry) add(entry.sourceUrl ?? entry.url, policy, entry);
    }
  }
  return [...byUrl.values()];
}
async function ensureSnapshot(record) {
  const snapshot = record.analysisSnapshot;
  if (!snapshot || snapshot.contractVersion !== 2) return;
  const policyIds = record.policyIds ?? (record.policyId ? [record.policyId] : []), assessments = record.assessments ?? {};
  const inputFingerprint = await fingerprint({profile:record.profileSnapshot ?? {}, policyIds:[...policyIds].sort(), assessments});
  if (snapshot.inputFingerprint !== inputFingerprint || snapshot.assessmentsFingerprint !== await fingerprint(assessments)) error(409, 'ANALYSIS_SNAPSHOT_STALE', '企业事实、研究范围或专项回答与这份分析不一致，请重新核对后保存。');
  if ([...new Set(snapshot.results.map(item => item.policyId))].sort().join(',') !== [...policyIds].sort().join(',')) fail('分析快照与记录研究范围不一致。');
  if (record.sourceVersions) for (const result of snapshot.results) {
    const source = record.sourceVersions.find(item => item.id === result.policyId);
    if (!source || (source.version ?? null) !== (result.policyVersion ?? null) || (source.verifiedAt ?? null) !== (result.verifiedAt ?? null)) error(409, 'ANALYSIS_VERSION_MISMATCH', '分析和来源快照的版本不一致，请重新核对并一起保存。');
  }
}

/** Storage and lock can be injected for tests. lock(callback) must serialize all
 * writers sharing that Storage. The browser default uses origin-scoped Web Locks.
 * Importing this module never accesses localStorage or makes a network request. */
function createBrowserStore({storage, lock, dataset, loadDataset, now = timestamp, newId = uuid} = {}) {
  let datasetPromise;
  const getStorage = () => {
    try { const value = typeof storage === 'function' ? storage() : storage ?? globalThis.localStorage; if (!value?.getItem || !value?.setItem) throw new Error('Unavailable'); return value; }
    catch { error(503, 'LOCAL_STORAGE_UNAVAILABLE', '浏览器保存不可用，请检查浏览器的隐私或存储设置；当前输入未保存。'); }
  };
  const read = () => {
    let raw;
    try { raw = getStorage().getItem(STORE_KEY); } catch (cause) { if (cause instanceof BrowserStoreError) throw cause; error(503, 'LOCAL_STORAGE_UNAVAILABLE', '浏览器保存暂时无法读取；当前输入未保存。'); }
    if (raw === null) return emptyStore();
    try { return validateStore(JSON.parse(raw)); }
    catch { error(500, 'LOCAL_STORAGE_CORRUPT', '已保存的浏览器资料无法读取；不会覆盖损坏数据。请先备份浏览器保存内容，当前编辑仍可导出。'); }
  };
  const checkAbort = signal => { if (signal?.aborted) throw new DOMException('已取消过期请求', 'AbortError'); };
  const withLock = callback => {
    if (typeof lock === 'function') return lock(callback);
    const locks = lock ?? globalThis.navigator?.locks;
    if (locks?.request) return locks.request(LOCK_NAME, {mode:'exclusive'}, callback);
    // A read/modify/write CAS on localStorage cannot safely protect two tabs.
    // Refuse unsafe writes instead of silently overwriting a concurrent edit.
    error(503, 'LOCAL_WRITE_LOCK_UNAVAILABLE', '请使用 HTTPS 或本地 localhost 访问，浏览器安全保存暂不可用；当前输入仍可导出。');
  };
  const mutate = (change, signal) => withLock(async () => {
    checkAbort(signal); const doc = read(), result = await change(doc);
    checkAbort(signal); doc.revision += 1; validateStore(doc);
    const encoded = JSON.stringify(doc);
    try { getStorage().setItem(STORE_KEY, encoded); }
    catch (cause) {
      if (cause instanceof BrowserStoreError) throw cause;
      if (cause?.name === 'QuotaExceededError' || cause?.code === 22 || cause?.code === 1014) error(507, 'LOCAL_STORAGE_FULL', '浏览器保存空间不足，本次修改未写入。请先导出重要记录，再删除旧记录后重试。');
      error(503, 'LOCAL_STORAGE_WRITE_FAILED', '浏览器未能保存本次修改，原有资料仍保留；当前输入可先导出。');
    }
    return clone(result);
  });
  const publicDataset = async () => {
    if (!datasetPromise) datasetPromise = Promise.resolve().then(async () => {
      const value = dataset ?? await (loadDataset ? loadDataset() : fetch('data/policies.json', {cache:'no-cache'}).then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); }));
      if (!Array.isArray(value?.policies)) throw new Error('Invalid dataset'); return value;
    }).catch(() => { datasetPromise = undefined; error(503, 'DATASET_UNAVAILABLE', '政策样本暂时无法读取，请稍后重试；当前修改尚未保存。'); });
    return datasetPromise;
  };
  const validateSavedInput = async (record, data) => {
    const selected = record.policyIds ?? (record.policyId ? [record.policyId] : []);
    selectPolicies(data.policies, selected); validateAssessmentScope(record.assessments ?? {}, data.policies, selected); await ensureSnapshot(record);
    if (byteLength(record) > MAX_RECORD_BYTES) error(413, 'RECORD_TOO_LARGE', '单条记录不得超过 384 KiB。');
  };
  async function request(endpoint, options = {}) {
    checkAbort(options.signal);
    const url = endpointUrl(endpoint), path = url.pathname, method = (options.method ?? 'GET').toUpperCase();
    if (path === '/profile') {
      if (method === 'GET') { const doc = read(); return clone({profile:doc.profile, revision:doc.profileRevision}); }
      if (['POST','PUT','PATCH'].includes(method)) {
        const input = requestBody(options.body), revision = expected(options.headers, input);
        const profile = validateProfile(input.profile ?? Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'expectedRevision')));
        return mutate(doc => { ensureRevision(doc.profileRevision, revision, 'PROFILE_CONFLICT'); doc.profile = method === 'PATCH' ? {...doc.profile, ...profile} : profile; doc.profileRevision += 1; return {profile:doc.profile, revision:doc.profileRevision}; }, options.signal);
      }
    }
    if (path === '/records' && method === 'GET') {
      const status = url.searchParams.get('status'); return clone({items:read().records.filter(record => !status || record.status === status)});
    }
    if (path === '/records' && method === 'POST') {
      const input = validateRecord(requestBody(options.body)), data = await publicDataset();
      return mutate(async doc => {
        if (doc.records.length >= MAX_RECORDS) error(409, 'RECORD_LIMIT', '本浏览器最多保留 1000 条记录，请先导出并删除旧记录。');
        const time = now(), record = {...input, id:newId(), status:input.status ?? 'saved', mode:'mock', revision:1, createdAt:time, updatedAt:time};
        await validateSavedInput(record, data); doc.records.unshift(record); return {record};
      }, options.signal);
    }
    const recordMatch = path.match(/^\/records\/([a-zA-Z0-9_-]{1,120})$/);
    const historyMatch = path.match(/^\/records\/([a-zA-Z0-9_-]{1,120})\/(history|revisions\/(\d+))$/);
    if (historyMatch && method === 'GET') {
      const doc = read(), current = doc.records.find(record => record.id === historyMatch[1]);
      if (!current) error(404, 'RECORD_NOT_FOUND', '记录不存在。');
      if (historyMatch[2] === 'history') {
        const previous = doc.history.filter(entry => entry.recordId === current.id).map(entry => entry.snapshot);
        return clone({items:[current,...previous].sort((a,b) => b.revision-a.revision).map(record => ({revision:record.revision, updatedAt:record.updatedAt, title:record.title, status:record.status, current:record.revision === current.revision})), limit:MAX_HISTORY_PER_RECORD});
      }
      const revision = Number(historyMatch[3]), record = revision === current.revision ? current : doc.history.find(entry => entry.recordId === current.id && entry.snapshot.revision === revision)?.snapshot;
      if (!record) error(404, 'RECORD_VERSION_NOT_FOUND', '该历史版本不存在或已超出本浏览器的保留范围。');
      return clone({record, historical:record.revision !== current.revision, currentRevision:current.revision});
    }
    if (recordMatch && ['GET','PATCH','DELETE'].includes(method)) {
      const id = recordMatch[1];
      if (method === 'GET') { const record = read().records.find(item => item.id === id); if (!record) error(404, 'RECORD_NOT_FOUND', '记录不存在。'); return clone({record}); }
      const raw = method === 'PATCH' ? requestBody(options.body) : {}, revision = expected(options.headers, raw);
      const input = method === 'PATCH' ? validateRecord(Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'expectedRevision'))) : null;
      const data = method === 'PATCH' ? await publicDataset() : null;
      return mutate(async doc => {
        const index = doc.records.findIndex(record => record.id === id), current = doc.records[index];
        if (!current) error(404, 'RECORD_NOT_FOUND', '记录不存在。'); ensureRevision(current.revision, revision, 'RECORD_CONFLICT');
        if (method === 'DELETE') { doc.records.splice(index,1); doc.history = doc.history.filter(entry => entry.recordId !== id); return null; }
        const record = {...current,...input, mode:'mock', revision:revision+1, updatedAt:now()};
        validateRecord(writableRecord(record)); await validateSavedInput(record, data);
        doc.history.unshift({recordId:id, savedAt:now(), sequence:doc.revision+1, snapshot:current});
        let count = 0; doc.history = doc.history.filter(entry => entry.recordId !== id || ++count <= MAX_HISTORY_PER_RECORD).slice(0,MAX_HISTORY_TOTAL);
        doc.records[index] = record; return {record};
      }, options.signal);
    }
    if (path === '/feedback') {
      if (method === 'GET') return clone({items:read().feedback});
      if (method === 'POST') {
        const input = requestBody(options.body), comment = input.comment ?? input.message ?? ''; string(comment,'comment',4000);
        if (input.rating !== undefined && !['helpful','unhelpful',1,2,3,4,5].includes(input.rating)) fail('rating 必须是 helpful/unhelpful 或 1–5。');
        const feedback = {id:newId(), comment, rating:input.rating ?? null, policyIds:ids(input.policyIds), recordId:input.recordId === undefined ? null : string(input.recordId,'recordId',120), createdAt:now(), status:'saved_local', delivery:'browser_local'};
        return mutate(doc => { doc.feedback.unshift(feedback); doc.feedback = doc.feedback.slice(0,MAX_FEEDBACK); return {feedback}; }, options.signal);
      }
    }
    if (path === '/source-check') {
      if (method === 'GET') return clone({items:read().checks});
      if (method === 'POST') {
        const input = requestBody(options.body), data = await publicDataset(), sources = sourceList(data), selectedIds = ids(input.sourceIds,'sourceIds'), selectedPolicies = ids(input.policyIds);
        if (selectedIds.some(id => !sources.some(source => source.id === id))) error(404, 'SOURCE_NOT_FOUND', '所选来源不存在。');
        selectPolicies(data.policies, selectedPolicies);
        const sourceIds = selectedIds.length ? selectedIds : sources.filter(source => !selectedPolicies.length || source.policyIds.some(id => selectedPolicies.includes(id))).map(source => source.id);
        const check = {id:newId(), sourceIds, policyIds:selectedPolicies, status:'queued_mock', mode:'mock', createdAt:now(), completedAt:null, fetched:false};
        return mutate(doc => { doc.checks.unshift(check); doc.checks = doc.checks.slice(0,MAX_CHECKS); return {check, mode:'mock', message:'模拟核验任务已保存在本浏览器。未访问官方来源、未获取新版本、未更新核验时间。'}; }, options.signal);
      }
    }
    error(404, 'ROUTE_NOT_FOUND', '本地保存接口不存在或 HTTP 方法不支持。');
  }
  return {request, handlesLocal};
}

const defaultStore = createBrowserStore();
const localRequest = (endpoint, options = {}) => defaultStore.request(endpoint, options);

return {STORAGE_SCOPE, STORE_KEY, MAX_RECORD_BYTES, BrowserStoreError, handlesLocal, createBrowserStore, localRequest};
})();

/* ===== ./api.js ===== */
const __m___api_js = (() => {
const {handlesLocal, localRequest} = __m___local_store_js;
const {handlesLocalApi, localApiRequest} = __m___local_api_js;
class ApiError extends Error {constructor(message,{status=0,code='NETWORK_ERROR',details=null}={}){super(message);this.name='ApiError';this.status=status;this.code=code;this.details=details;}}
async function request(endpoint,options={}){
  if(handlesLocal(endpoint)){try{return await localRequest(endpoint,options);}catch(error){if(error.name==='AbortError')throw error;throw new ApiError(error.message,{status:error.status??0,code:error.code??'BROWSER_STORAGE_ERROR',details:error.details??null});}}
  if(handlesLocalApi(endpoint)){try{return await localApiRequest(endpoint,options);}catch(error){if(error.name==='AbortError')throw error;throw new ApiError(error.message,{status:error.status??0,code:error.code??'LOCAL_API_ERROR',details:error.details??null});}}
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  const relay=()=>controller.abort();if(options.signal?.aborted)controller.abort();options.signal?.addEventListener('abort',relay,{once:true});
  try{const r=await fetch('/api/v1'+endpoint,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
    if(r.status===204)return null;
    const data=await r.json().catch(()=>{throw new ApiError('服务返回无法读取，请重试。',{status:r.status,code:'INVALID_RESPONSE'})});
    
    if(!r.ok)throw new ApiError(data.error?.message||'操作暂未完成，请重试。',{status:r.status,code:data.error?.code,details:data.error?.details});return data;
  }catch(error){if(error instanceof ApiError)throw error;if(options.signal?.aborted)throw new DOMException('已取消过期请求','AbortError');if(error.name==='AbortError')throw new ApiError('在线服务响应超时。已保留你的输入，请重试。',{code:'TIMEOUT'});throw new ApiError('暂时无法连接在线服务。请检查网络后重试；当前输入已保留。');}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',relay);}
}

return {ApiError, request};
})();

/* ===== ./presentation.js ===== */
const __m___presentation_js = (() => {
// Display summaries only; official policy evidence and exported snapshots stay intact.
const purposes={
  'lg-rd-investment-2026':'为符合条件的龙岗科技企业提供研发投入补助。',
  'national-rd-tax-2023':'符合规定的研发费用可增加税前扣除，降低所得税负担。',
  'national-smallprofit-tax-2023':'符合小型微利企业条件，可按优惠规则缴纳企业所得税。',
  'sz-hightech-recognition-2026':'申请高新技术企业资格；取得资格后，其他优惠另行核对。',
  'sz-techsme-evaluation-2026':'申请年度科技型中小企业入库编号，衔接相关政策。',
  'sz-tech-contract-2026':'为已签订的技术合同申请登记证明，相关税费优惠另行核对。'
};
const policyPurpose=p=>purposes[p.id]||p.summary;
function windowCopy(p){
 const deadline=p.window?.close?.slice(0,10);
 switch(p.applicationStatus){
 case 'open':return {label:'官方指南：全年可申请',detail:'没有集中申请截止日。办理前请确认官方系统和最新要求。',kind:'available'};
 case 'tax_filing':case 'ongoing':return {label:'随企业所得税申报办理',detail:'在适用的预缴或年度汇算清缴时申报享受，按税务要求确认适用期间。',kind:'available'};
 case 'closed':return {label:deadline?'已收录批次于 '+deadline+' 截止':'已收录的申请批次已截止',detail:'目前收录的是已结束的批次。可以先准备资料，新申请请查主管部门后续通知。',kind:'ended'};
 case 'not_applicable':return {label:'办理时间请查看官方说明',detail:p.window?.note||'该事项没有集中申请批次。',kind:'uncertain'};
 default:return {label:'申请时间尚未确认',detail:'已查到政策规定，尚未确认对应申请通知和时间。可以先了解要求，暂不能据此判断现在可申请。',kind:'uncertain'};
 }
}
const preparationOrder=['steps','materials','fields','review'];
const preparationLabels={steps:'了解办理流程',materials:'收集所需材料',fields:'整理填写草稿',review:'检查并导出'};
const taskDestination=task=>({materials:'查看所需材料',steps:'了解办理流程',forms:'整理填写草稿',explain:'了解这项政策'})[task]||'核对这项政策是否适合你';


return {policyPurpose, windowCopy, preparationOrder, preparationLabels, taskDestination};
})();

/* ===== ./utils.js ===== */
const __m___utils_js = (() => {
const {windowCopy} = __m___presentation_js;
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => { try { const u=new URL(value,location.origin); return ['http:','https:'].includes(u.protocol)?u.href:'#'; } catch { return '#'; } };
const link = (url,label,cls='text-link') => `<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon('external')}</a>`;
// 快照/附件已全部随包发布：解析为相对当前页面的 URL（兼容 GitHub Pages 子路径），
// 不再回链任何外部站点。
const siteUrl = p => new URL(String(p).replace(/^\//, ''), location.href).href;
const paths={chevron:'<path d="m7 10 5 5 5-5"/>',radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v9l7-5"/><circle cx="8" cy="16" r="1"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',check:'<path d="m5 12 4 4L19 6"/>',cross:'<path d="m6 6 12 12M6 18 18 6"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01"/>',shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m8 12 3 3 5-6"/>',file:'<path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h6"/>',brief:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',external:'<path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',spark:'<path d="m12 3 2 6 7 3-7 3-2 6-2-6-7-3 7-3z"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'};
function icon(name,extraClass=''){return `<svg class="icon ${extraClass}" aria-hidden="true" viewBox="0 0 24 24">${paths[name]||paths.file}</svg>`;}
const date = v => v ? String(v).slice(0,10) : '未确认';
const formatFact = v => v===true?'是':v===false?'否':v===null||v===undefined||v===''?'未提供':String(v);
const appStatus = p => {const w=windowCopy(p);return [w.label,w.kind==='available'?'green':'gold'];};
const policyStatus = p => ({active:'规则有效 · 仍需核验',unknown:'效力待核验',historical:'历史规则',expired:'已失效'})[p.policyStatus]||p.policyStatusLabel||p.policyStatus||'效力待核验';
const badge = p => {const [label,cls]=appStatus(p);return `<span class="pill ${cls}">${esc(label)}</span>`;};
const stateBadge = s => `<span class="status ${esc(s)}">${icon({met:'check',unmet:'cross',missing:'help',verify:'info'}[s])}${{met:'初步满足',unmet:'初步不符',missing:'待补信息',verify:'待核规则'}[s]||'待核规则'}</span>`;
const fields = {companyName:'企业名称',region:'企业注册地区',industry:'主营行业',employees:'从业人数',revenue:'营业收入（万元）',rdRatio:'研发费用占比（%）',ageYears:'成立年限（年）',highTech:'有效高企资格',techSme:'科技型中小企业',smallProfit:'小型微利企业身份',compliant:'无严重失信记录',exporter:'有出口业务',hasIp:'具有相关知识产权',period:'企业数据所属期间'};
function download(name,text,type='text/markdown;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

return {esc, safeUrl, link, siteUrl, icon, date, formatFact, appStatus, policyStatus, badge, stateBadge, fields, download};
})();

/* ===== ./home.js ===== */
const __m___home_js = (() => {
const {S, selected, activePolicy} = __m___state_js;
const {esc, icon} = __m___utils_js;

function home(){
 const expanded=S.homeExpanded||!!S.query;
 const starters=[['我们在龙岗做软件研发，想了解研发投入扶持和税收优惠','研发投入支持'],['我们在深圳做技术服务，想减轻企业所得税负担','企业所得税优惠'],['深圳企业做技术开发，技术合同该怎么登记？','技术合同登记']];
 const regions=[...new Set(S.policies.map(p=>p.region))].map(r=>({'全国':'全国税惠','深圳市':'深圳','龙岗区':'龙岗'})[r]||r).join(' · ');
 const starterMarkup=`<div class="home-start"><div class="home-start-examples" role="group" aria-label="从示例开始"><span>试试这样问</span>${starters.map(([q,label])=>`<button class="btn subtle home-starter" data-fill-query="${esc(q)}" data-home-example>${esc(label)} ${icon('arrow')}</button>`).join('')}</div><div class="home-coverage"><span>当前 ${S.policies.length} 项官方精选样本 · ${esc(regions)}</span><button class="text-link" data-nav="sources">查看覆盖范围 ${icon('arrow')}</button></div></div>`;
 return `<section class="home-stage ${expanded?'is-expanded':''}" aria-label="查找企业政策"><div class="home-ambient" aria-hidden="true" inert><span class="home-aurora home-aurora-blue"></span><span class="home-aurora home-aurora-cyan"></span><span class="home-aurora home-aurora-accent"></span></div><div class="home-heading"><h1 tabindex="-1">企业政策，<br><span>从你的问题开始。</span></h1><p>用一句话找到相关政策，再把办理资料整理清楚。</p></div><form id="search-form" class="home-composer"><label class="sr-only" for="query">描述你的经营问题</label><textarea id="query" name="q" rows="1" maxlength="4000" placeholder="描述你的经营问题" aria-describedby="home-input-guide">${esc(S.query)}</textarea><div class="home-compose-actions"><span id="home-input-guide">说说地区、业务，以及希望得到的支持。</span><button class="btn primary" type="submit">查找政策 ${icon('arrow')}</button></div></form>${starterMarkup}<div class="home-guidance" ${expanded?'':'hidden'}><div class="home-guide-heading"><h2>不知道怎么问？从一个具体问题开始。</h2><button class="text-link" data-action="collapse-home">收起引导</button></div><div class="home-examples">${[
 ['我们在龙岗做软件研发，想了解研发投入扶持和税收优惠','研发投入能获得哪些支持？','例如：龙岗软件企业，准备了解研发扶持'],
 ['我们在深圳做技术服务，想减轻企业所得税负担','企业所得税能不能少交一些？','例如：深圳小企业，想核对税收优惠'],
 ['深圳企业做技术开发，技术合同该怎么登记？','签了技术合同，怎么申请登记？','例如：深圳技术开发合同，想了解办理流程']
 ].map(([q,l,s])=>`<button data-fill-query="${esc(q)}"><strong>${l}</strong><span>${s}</span></button>`).join('')}</div><p class="home-guide-note">查找相关政策 → 选择想了解的事项 → 按需核对与准备。企业信息可以之后再补。</p></div>${S.work.selected.length?`<button class="home-resume" data-action="continue-work">${icon('clock')}<span>继续之前的准备 <small>${esc(S.work.recordTitle||activePolicy()?.title)} · 已选 ${selected().length} 项</small></span>${icon('arrow')}</button>`:''}</section>`;
}

let animations=[];
function setHomeExpanded(expanded,{animate=false}={}){
 const stage=document.querySelector('.home-stage');if(!stage)return;
 S.homeExpanded=expanded;if(stage.classList.contains('is-expanded')===expanded)return;
 const nodes=[stage.querySelector('.home-heading h1'),stage.querySelector('.home-heading p'),stage.querySelector('.home-composer')];
 // Continue from the live visual position when an interaction interrupts a transition.
 const before=nodes.map(el=>{const styles=getComputedStyle(el),matrix=styles.transform==='none'?null:new DOMMatrixReadOnly(styles.transform);return {rect:el.getBoundingClientRect(),font:Number.parseFloat(styles.fontSize)*(matrix?Math.hypot(matrix.a,matrix.b):1)};});
 animations.forEach(a=>a.cancel());animations=[];
 stage.classList.toggle('is-expanded',expanded);
 stage.querySelector('.home-guidance').hidden=!expanded;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(animate&&!reduce){
  nodes.forEach((el,i)=>{
   const after=el.getBoundingClientRect(),old=before[i].rect;
   // Keep typography proportional; only the composer uses two-axis FLIP scaling.
   const ratio=before[i].font/Number.parseFloat(getComputedStyle(el).fontSize);
   const scale=i===2?`${old.width/after.width},${old.height/after.height}`:i===0?`${ratio}`:'1';
   animations.push(el.animate([
    {transform:`translate(${old.x-after.x}px,${old.y-after.y}px) scale(${scale})`},
    {transform:'translate(0,0) scale(1)'}
   ],{duration:240,easing:'cubic-bezier(0.23, 1, 0.32, 1)'}));
  });
  if(expanded)animations.push(stage.querySelector('.home-guidance').animate([{opacity:0},{opacity:1}],{duration:180,easing:'cubic-bezier(0.23, 1, 0.32, 1)'}));
 }
}

return {home, setHomeExpanded};
})();

/* ===== ./policy-surfaces.js ===== */
const __m___policy_surfaces_js = (() => {
const {S} = __m___state_js;
const {esc, link, date, icon, siteUrl} = __m___utils_js;
const {windowCopy} = __m___presentation_js;

function renderPolicyDetails(p,{context=false}={}){
 const time=windowCopy(p);
 return `<div class="policy-reading-content"><section class="reading-overview"><span class="eyebrow">${esc(p.region)} · 支持内容</span><p>${esc(p.benefit)}</p><div class="reading-time ${time.kind}">${icon('clock')}<span>${esc(time.label)}</span></div></section><div class="reading-sections"><section><h3>政策概要</h3><p>${esc(p.summary)}</p></section><section><h3>适用对象</h3><p>${esc(p.audience)}</p><p class="meta">具体资格需要结合企业事实和正式材料核对。</p></section><section><h3>办理时间与状态</h3><p>${esc(time.detail)}</p>${p.window?.note?`<p>${esc(p.window.note)}</p>`:''}</section><section class="reading-source"><h3>官方依据与版本</h3><p>${esc(p.authority)}</p><p class="meta">${esc(p.version)} · 发布 ${date(p.publishedAt)} · 核验 ${date(p.verifiedAt)}</p><p class="meta">核验日期表示资料检查时间，不代表实时办理系统状态。</p><div class="button-row">${link(p.source?.url,'官方原文','btn')}${p.source?.snapshotPath?link(siteUrl('/'+p.source.snapshotPath),'留存原文快照','btn'):''}</div></section></div>${context?'<div class="reading-actions"><button class="btn" data-action="close">返回当前步骤</button></div>':`<div class="reading-actions"><button class="btn" data-action="close">返回政策列表</button><button class="btn primary" data-add="${esc(p.id)}">选择并继续 ${icon('arrow')}</button></div>`}</div>`;
}

function renderSearchScope(){
 const d=S.discovery,interpretation=d?.interpretation;
 const regions=[...new Set(S.policies.map(p=>p.region))];
 const categories=[...new Set(S.policies.map(p=>p.category))];
 return `<section class="reading-overview scope-overview"><span class="eyebrow">本次检索 · 有限样本</span><div class="scope-stat"><strong>${S.visible.length}<small>项相关候选</small></strong><span>来自当前收录的 <b>${S.policies.length}</b> 项政策样本</span></div><p>未收录不代表现实中不存在，也不代表你的企业不符合政策。</p></section><div class="reading-sections scope-sections"><section><h3>目前覆盖哪些资料</h3><p>${esc(S.dataset.coverage||regions.join('、'))}</p><dl class="scope-facts"><div><dt>政策区域</dt><dd>${esc(regions.join('、'))}</dd></div><div><dt>政策分类</dt><dd>${esc(categories.join('、'))}</dd></div><div><dt>官方资料</dt><dd>${S.sources.length} 份 · 核验 ${date(S.dataset.verifiedAt)}</dd></div></dl></section><section><h3>这次怎样理解你的问题</h3><p>${d?.meta?.modelUsed===true?'本次需求理解使用模型服务。':'本次使用模拟需求理解，未调用真实大模型。'}候选依据当前收录的官方资料筛选，适用条件需另行核对。</p>${interpretation?.excludedTerms?.length?`<p><strong>本次排除：</strong>${esc(interpretation.excludedTerms.join('、'))}</p>`:''}${interpretation?.unresolvedTerms?.length?`<p><strong>尚待识别：</strong>${esc(interpretation.unresolvedTerms.join('、'))}</p>`:''}</section></div><div class="reading-actions"><button class="btn" data-action="close">返回检索结果</button><button class="btn primary" data-nav="sources">查看官方来源 ${icon('arrow')}</button></div>`;
}

return {renderPolicyDetails, renderSearchScope};
})();

/* ===== ./preparation-surfaces.js ===== */
const __m___preparation_surfaces_js = (() => {
const {S} = __m___state_js;
const {esc, link, icon, siteUrl} = __m___utils_js;

const hasValue = value => value !== undefined && value !== null && value !== '';
const options = (items,value) => items.map(([key,label]) => `<option value="${esc(key)}" ${key===value?'selected':''}>${esc(label)}</option>`).join('');

function renderMaterials(p) {
 const done=p.materials.filter(material=>S.work.checks[p.id]?.[material.id]).length;
 return `<div class="section-heading"><div><h2>需要准备的材料</h2><p>准备要求直接列在材料下方。备好后勾选，可随时取消。</p></div><span id="material-progress">${done}/${p.materials.length} 已准备</span></div><div class="progress-track" role="progressbar" aria-label="材料准备进度" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${p.materials.length}"><span style="width:${p.materials.length?done/p.materials.length*100:0}%"></span></div><p class="material-scope-note">这里只记录准备进度，不会向部门提交。</p>${p.materials.map(material=>`<div class="check-row material-row ${S.work.checks[p.id]?.[material.id]?'done':''}" data-material-row="${esc(p.id)}-${esc(material.id)}"><label><input type="checkbox" data-material="${esc(material.id)}" ${S.work.checks[p.id]?.[material.id]?'checked':''}><strong>${esc(material.name)}</strong><span class="material-done-label">${icon('check')}已备好</span></label><div class="material-requirement"><p>${esc(material.note)}</p>${material.verified?'':'<span class="material-unverified">完整要求仍需向官方确认</span>'}${link(material.sourceUrl,'官方材料依据')}</div></div>`).join('')}<div class="panel-tail">${(p.formGuide?.localTemplatePath||p.formGuide?.snapshotPath)?link(siteUrl('/'+(p.formGuide.localTemplatePath||p.formGuide.snapshotPath)),'查看官方附件','text-link'):''}</div>`;
}

function fieldControl(field,value) {
 const attributes=`id="form-${esc(field.id)}" data-form-field="${esc(field.id)}" aria-describedby="help-${esc(field.id)} evidence-${esc(field.id)}"`;
 if(field.type==='textarea')return `<textarea ${attributes} rows="3" maxlength="8000">${esc(value)}</textarea>`;
 if(field.type==='select'&&field.options)return `<select ${attributes}><option value="">不清楚 / 待填</option>${options(field.options.map(option=>typeof option==='string'?[option,option]:[option.value,option.label]),value)}</select>`;
 return `<input ${attributes} type="${field.type==='number'?'number':'text'}" ${field.type==='number'?'step="any" min="0"':''} value="${esc(value)}" maxlength="8000">`;
}

function renderFormGuide(p) {
 const guide=p.formGuide;
 if(!guide?.fields?.length)return '<div class="hint" role="note">填写要求尚未确认，可先查看官方材料，或略过这一步。</div>';
 const filled=guide.fields.filter(field=>hasValue(S.work.formDrafts[p.id]?.[field.id])).length;
 return `<div class="draft-purpose"><h2>整理好信息，正式办理时更好填。</h2><p>填写后可预览、保存和导出，供正式办理时对照使用；这里不会替你提交申请。</p><p class="meta">${guide.completeness==='verified_fields'?'来自已核验的官方信息表，口径请按各项说明确认。':'依据官方资料整理的部分信息，非完整申报表。'} 未知可留空，预览时标为待补。</p></div><div class="draft-progress"><span id="field-progress">共 ${guide.fields.length} 项 · 已填写 ${filled} 项</span><button class="text-link" data-action="export">导出当前记录</button></div><p class="draft-interaction-note">点击输入框，专注填写这一项，并查看对应的官方说明。</p><div class="draft-fields draft-focus-fields">${guide.fields.map((field,index)=>{
 const raw=S.work.formDrafts[p.id]?.[field.id],value=raw??'',completed=hasValue(raw);
 return `<div class="draft-field ${completed?'is-filled':''}" id="draft-field-${esc(field.id)}"><label class="field form-guide-field" for="form-${esc(field.id)}"><span class="draft-field-title"><span>${index+1}</span>${esc(field.label)}</span>${fieldControl(field,value)}<small id="help-${esc(field.id)}">${esc(field.help)}</small></label><div class="draft-field-foot"><span class="draft-field-state" data-field-status="${esc(field.id)}">${completed?'已保留在草稿':'尚未填写，可之后补充'}</span></div><section class="draft-focus-help" aria-label="${esc(field.label)}的填写依据" hidden><div class="draft-focus-help-heading"><span>填写说明与官方依据</span><button type="button" class="text-link" data-field-focus-close aria-label="结束填写${esc(field.label)}">完成 ${icon('check')}</button></div><p id="evidence-${esc(field.id)}">${esc(field.evidence||field.help)}</p>${field.locator?`<p class="draft-field-locator">${esc(field.locator)}</p>`:''}<div class="draft-evidence-actions">${link(field.sourceUrl||guide.sourceUrl,'官方字段依据')}<button type="button" class="text-link" data-ask="${esc('请解释'+field.label+'的填写口径')}">${icon('help')}这个字段怎么填？</button></div></section></div>`;
 }).join('')}</div><details class="guide-limitations"><summary class="disclosure-summary"><span class="disclosure-label">查看官方模板与草稿使用范围</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><p>${esc(guide.title)} · ${esc(guide.version||p.version)}</p><div class="button-row">${link(guide.sourceUrl,'资料来源')}${(guide.localTemplatePath||guide.snapshotPath)?link(siteUrl('/'+(guide.localTemplatePath||guide.snapshotPath)),'官方工作指引 / 附件','btn'):''}${guide.templateUrl?link(guide.templateUrl,'官方模板来源'):''}${guide.templateLandingUrl?link(guide.templateLandingUrl,'官方示范文本下载','btn'):''}</div>${guide.templateLandingNote?`<p>${esc(guide.templateLandingNote)}</p>`:''}<ul>${(guide.limitations||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div></details>`;
}

let activeField=null,scrim=null,frame=null,globalInstalled=false;
const installedRoots=new WeakSet();

function focusScrim() {
 if(!scrim?.isConnected) {
  scrim=document.createElement('div');
  scrim.className='draft-focus-scrim';
  scrim.setAttribute('aria-hidden','true');
  scrim.hidden=true;
  document.body.append(scrim);
 }
 return scrim;
}

function placeFieldHelp() {
 frame=null;
 if(!activeField?.isConnected){clearFieldFocus();return;}
 const viewport=window.visualViewport;
 const top=viewport?.offsetTop||0,height=viewport?.height||innerHeight;
 const bottom=top+height,rect=activeField.getBoundingClientRect();
 const help=activeField.querySelector('.draft-focus-help');
 if(!help)return;
 // Keep the editor where it is. Only its attached explanation changes sides.
 const actionBar=document.querySelector('.stage-actions');
 const actionRect=actionBar?.getBoundingClientRect();
 const visibleActionTop=actionRect&&actionRect.top>top&&actionRect.top<bottom?actionRect.top-12:bottom-12;
 const below=Math.max(0,visibleActionTop-rect.bottom-8),above=Math.max(0,rect.top-top-12);
 const desired=Math.min(help.scrollHeight||220,250);
 const before=below<Math.min(desired,150)&&above>below;
 activeField.classList.toggle('help-above',before);
 help.style.setProperty('--field-help-max-height',Math.max(72,Math.min(before?above:below,250))+'px');
}

function queuePlacement() {
 if(activeField&&!frame)frame=requestAnimationFrame(placeFieldHelp);
}

function clearFieldFocus({blur=false}={}) {
 if(frame){cancelAnimationFrame(frame);frame=null;}
 const prior=activeField;
 activeField=null;
 prior?.classList.remove('is-focused','help-above');
 const help=prior?.querySelector('.draft-focus-help');
 if(help)help.hidden=true;
 if(scrim)scrim.hidden=true;
 document.body.classList.remove('has-draft-focus');
 if(blur&&prior?.contains(document.activeElement))document.activeElement?.blur();
}

function focusField(field) {
 if(activeField===field){queuePlacement();return;}
 clearFieldFocus();
 // A page entrance transform creates a temporary stacking context. Let the
 // original editor rise immediately when someone starts typing during it.
 field.closest('.workspace-panel')?.getAnimations().forEach(animation=>{
  const timing=animation.effect?.getComputedTiming();
  if(timing&&Number.isFinite(timing.endTime))animation.cancel();
 });
 activeField=field;
 field.classList.add('is-focused');
 field.querySelector('.draft-focus-help').hidden=false;
 focusScrim().hidden=false;
 document.body.classList.add('has-draft-focus');
 placeFieldHelp();
}

function updateDraftField(input) {
 const field=input.closest('.draft-field');
 if(!field)return;
 // The string "0" is filled; an empty number input remains pending.
 const complete=hasValue(input.value);
 field.classList.toggle('is-filled',complete);
 const status=field.querySelector('[data-field-status]');
 if(status)status.textContent=complete?'已保留在草稿':'尚未填写，可之后补充';
 queuePlacement();
}

function installFieldFocus(root) {
 if(!globalInstalled){
  globalInstalled=true;
  document.addEventListener('pointerdown',event=>{
   if(activeField&&!activeField.contains(event.target))clearFieldFocus();
  },true);
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&activeField){event.preventDefault();clearFieldFocus({blur:true});}
  });
  window.addEventListener('scroll',queuePlacement,{passive:true});
  window.addEventListener('resize',queuePlacement,{passive:true});
  window.visualViewport?.addEventListener('resize',queuePlacement,{passive:true});
  window.visualViewport?.addEventListener('scroll',queuePlacement,{passive:true});
 }
 if(!installedRoots.has(root)){
  installedRoots.add(root);
  root.addEventListener('focusin',event=>{
   const field=event.target.closest('.draft-field');
   if(field&&field.querySelector('[data-form-field]'))focusField(field);
   else if(activeField)clearFieldFocus();
  });
  root.addEventListener('focusout',()=>queueMicrotask(()=>{
   if(activeField&&!activeField.contains(document.activeElement))clearFieldFocus();
  }));
  root.addEventListener('click',event=>{
   if(event.target.closest('[data-field-focus-close]'))clearFieldFocus({blur:true});
  });
 }
 const field=document.activeElement?.closest('.draft-field');
 if(field&&root.contains(field))focusField(field);
 else if(activeField&&!activeField.isConnected)clearFieldFocus();
}

return {renderMaterials, renderFormGuide, clearFieldFocus, updateDraftField, installFieldFocus};
})();

/* ===== ./views.js ===== */
const __m___views_js = (() => {
const {S, selected, activePolicy, profileForWork, policyForWork, recordSaveState} = __m___state_js;
const {esc, link, icon, date, formatFact, badge, stateBadge, fields, siteUrl} = __m___utils_js;
const {home} = __m___home_js;
const {renderPolicyDetails} = __m___policy_surfaces_js;
const {renderMaterials, renderFormGuide} = __m___preparation_surfaces_js;
const {policyPurpose, windowCopy, preparationOrder, preparationLabels, taskDestination} = __m___presentation_js;
const recStatus={saved:'已收藏',evaluating:'核对中',preparing:'准备中',submitted:'已自行提交',approved:'已获批（自报）',rejected:'未通过（自报）',archived:'已归档'};
const navs=[['radar','search','提出问题'],['analyze','shield','核对条件'],['workspace','brief','准备资料'],['records','clock','我的记录'],['profile','user','企业资料'],['sources','database','官方来源'],['settings','settings','工作设置']];
const options=(items,value)=>items.map(([k,l])=>`<option value="${esc(k)}" ${k===value?'selected':''}>${esc(l)}</option>`).join('');
const btn=(text,action,cls='',disabled=false)=>`<button class="btn ${cls}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const hint=(text,kind='')=>`<div class="hint ${kind}" role="${kind==='warning'?'status':'note'}">${text}</div>`;
const title=(label,h,sub,actions='')=>`<div class="page-title"><div><span class="eyebrow">${label}</span><h1 tabindex="-1">${h}</h1>${sub?`<p>${sub}</p>`:''}</div>${actions?`<div class="button-row">${actions}</div>`:''}</div>`;
const shortNames={'lg-rd-investment-2026':'研发投入扶持','national-rd-tax-2023':'研发费用加计扣除','national-smallprofit-tax-2023':'小型微利企业税惠','sz-hightech-recognition-2026':'高企认定','sz-techsme-evaluation-2026':'科技型中小企业评价','sz-tech-contract-2026':'技术合同登记'};
const short=p=>shortNames[p?.id]||p?.title||'政策事项';
const empty=(h,t)=>`<div class="empty">${icon('search')}<h2>${h}</h2><p>${t}</p><button class="btn primary" data-nav="radar">描述需求 ${icon('arrow')}</button></div>`;

function shell(content){
  const home=S.view==='radar'&&!S.hasSearched&&!S.searching;
  return `<div class="shell view-${S.view} ${home?'is-home':''}"><div class="demo-banner" role="note">演示原型 · 政策为 2026-10 样本快照，问答为确定性模拟，不构成官方依据。</div><div class="navigation-material"><header class="topbar"><button class="brand" data-nav="radar" aria-label="政策补贴雷达，返回问题页"><img src="favicon.svg" alt=""><span>政策补贴雷达</span></button><div class="top-actions">${S.work.selected.length||S.hasSearched?'<button class="btn subtle" data-action="new-work">'+icon('spark')+'新问题</button>':''}<button class="btn menu-trigger ${S.menuOpen?'active':''}" data-action="menu" aria-expanded="${S.menuOpen}" aria-controls="top-menu">${icon('menu')}<span>工作菜单</span></button></div><nav id="top-menu" class="top-menu" aria-label="工作菜单" ${S.menuOpen?'':'hidden'}><span class="menu-label">当前任务</span>${navs.slice(0,3).map(([v,i,l])=>`<button class="menu-item ${S.view===v?'active':''}" data-nav="${v}" ${v!=='radar'&&!selected().length?'disabled':''}>${icon(i)}<span>${l}</span>${S.view===v?icon('check'):''}</button>`).join('')}<div class="menu-divider"></div><span class="menu-label">资料与记录</span>${navs.slice(3).map(([v,i,l])=>`<button class="menu-item ${S.view===v?'active':''}" data-nav="${v}">${icon(i)}<span>${l}</span>${v==='records'&&S.records.length?`<small>${S.records.length}</small>`:''}</button>`).join('')}<button class="menu-item" data-action="about">${icon('info')}<span>关于本演示</span></button><p class="menu-foot">所有记录只保存在本浏览器</p></nav></header></div><main id="main" tabindex="-1" class="content ${home?'home-content':''}">${S.error?hint(esc(S.error)+' '+btn('重新连接','retry'),'warning'):''}${!S.autosaveOk?hint('自动保存暂不可用，请保存当前过程。','warning'):''}${S.restored&&S.work.selected.length&&!home?`<div class="restore-line">${icon('clock')}已恢复上次工作${btn('继续准备','continue-work','subtle')}${btn('收起','dismiss-restore','subtle')}</div>`:''}${['analyze','workspace'].includes(S.view)||(S.view==='radar'&&S.hasSearched)?journey():''}${content}</main><footer class="site-footer"><span>官方资料有据可查</span><span>展示原型 · 助手为模拟模式</span><button class="text-link" data-action="feedback">反馈</button><a class="text-link" href="https://radar.huixiang17.cn/" target="_blank" rel="noopener noreferrer">原站出处</a><a class="text-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026063004号</a><span id="autosave-status" class="sr-only">${S.autosaveOk?'当前编辑自动缓冲在本浏览器':'自动保存不可用'}</span></footer></div>`;
}
function journey(){return `<nav class="journey segmented-track" data-segment-context="journey" aria-label="当前任务流程"><span class="segmented-indicator" aria-hidden="true"></span>${[['radar','选择政策'],['analyze','核对条件'],['workspace','准备资料']].map(([v,l],i)=>`<button data-nav="${v}" ${v!=='radar'&&!selected().length?'disabled':''} ${S.view===v?'aria-current="step"':''}><span>${i+1}</span>${l}</button>${i<2?'<span class="journey-divider" aria-hidden="true"></span>':''}`).join('')}</nav>`;}
function composer(compact=false){return `<form id="search-form" class="composer ${compact?'compact':''}"><label for="query" class="${compact?'sr-only':'composer-label'}">${compact?'修改你的需求':'说说你想解决的经营问题'}</label><textarea id="query" name="q" rows="${compact?2:3}" maxlength="4000" placeholder="例如：我们在龙岗做软件研发，今年投入不少，想了解能用的扶持或税收优惠。" aria-describedby="prompt-hint">${esc(S.query)}</textarea><div class="composer-bottom"><span id="prompt-hint">${compact?'补充地区、业务或暂不考虑的方向':'不知道政策名称也没关系'}</span><button class="btn primary" type="submit" ${S.searching?'disabled':''}>${S.searching?'正在理解需求…':'查找相关政策'}${S.searching?'<span class="spinner"></span>':icon('arrow')}</button></div></form>`;}
function queryPanel(){if(S.editingQuery||S.searching||S.searchError)return composer(true);return `<div class="question-recap"><div><span>你的问题</span><p>${esc(S.discovery?.question||S.work.question||S.query)}</p></div>${btn('修改问题','edit-query','subtle')}</div>`;}

function examples(){return `<div class="examples"><span>试试这样问</span>${[['我们在龙岗做软件研发，想了解研发投入扶持和税收优惠','研发投入，有什么支持？'],['我们在深圳做技术服务，想减轻企业所得税负担','小企业，如何减轻税负？'],['深圳企业做技术开发，技术合同该怎么登记？','技术合同，怎么登记？']].map(([q,l])=>`<button class="chip" data-query="${esc(q)}">${l}${icon('arrow')}</button>`).join('')}</div>`;}
function radar(){
  if(!S.hasSearched&&!S.searching&&!S.searchError)return home();
  const d=S.discovery,interpretation=d?.interpretation;
  return title('选择政策','这些政策可能帮到你','先看看能解决什么问题，选择感兴趣的一项继续。')+queryPanel()+`${S.searching?'<div class="search-loading" role="status"><span class="spinner"></span><div><strong>正在理解你的问题</strong><p>查找相关事项与官方依据…</p></div></div>':S.searchError?hint(`${esc(S.searchError)} ${btn('重试','search')}`,'warning'):d&&S.visible.length?`<section class="understanding"><div class="understanding-icon">${icon('spark')}</div><div><h2>我理解你想…</h2><p>${esc((interpretation?.summary||'了解与当前经营问题相关的政策。').split('。')[0]+'。')}</p><div class="scope-tags">${interpretation?.region?`<span>${esc(interpretation.region)}</span>`:''}${(interpretation?.topics||[]).map(t=>`<span>${esc(t.label)}</span>`).join('')}</div></div><button class="btn reading-trigger retrieval-trigger" data-action="search-scope" aria-haspopup="dialog" aria-expanded="false"><span>检索范围</span>${icon('chevron','disclosure-chevron')}</button></section>`:''}${!S.searching&&!S.searchError?S.visible.length?`<div class="section-heading candidate-heading"><h2>相关政策 <span class="count">${S.visible.length}</span></h2><span>勾选想继续了解的事项</span></div><div class="policy-grid">${[...S.visible].sort((a,b)=>Number(a.applicationStatus==='closed')-Number(b.applicationStatus==='closed')).map(card).join('')}</div>`:`<section class="no-candidates"><div class="empty-symbol">${icon('search')}</div><h2>${interpretation?.status==='needs_clarification'?'再说具体一点，就能帮你找。':'已覆盖资料中，暂未找到相关事项。'}</h2><p>${esc(d?.followUpQuestions?.[0]||(interpretation?.status==='no_candidates'?'这类需求暂未收录。可以换个支持方向，或查看当前资料范围。':'补充企业所在地区，以及想解决的业务问题。'))}</p><div class="quick-queries">${(d?.followUpQuestions||[]).slice(1).map(q=>`<span class="meta">${esc(q)}</span>`).join('')}</div>${examples()}<p class="meta">当前资料覆盖有限，结果不代表完整政策范围。</p><button class="text-link" data-nav="sources">查看当前资料范围</button></section>`:''}${S.searchNotice&&!S.searching?hint(esc(S.searchNotice)):''}${S.work.selected.length&&!S.searching&&!S.searchError?`<div class="selection-summary"><span>已选 ${selected().length} 项</span>${selected().map(p=>`<button class="selection-chip" data-remove-policy="${esc(p.id)}" aria-label="取消选择 ${esc(p.title)}">${esc(short(p))}${icon('cross')}</button>`).join('')}${selected().length>1?'<button class="text-link" data-action="compare">对照所选事项</button>':''}</div>`:''}${selectionActions()}`;
}
function selectionActions(){
 if(!S.visible.length||S.searching||S.searchError)return '';
 const count=selected().length,task=S.discovery?.interpretation?.suggestedTask;
 return `<div class="stage-actions selection-actions"><div><strong>${count?'已选 '+count+' 项':'选择一项想了解的政策'}</strong><small>${count?'下一步：'+taskDestination(task):'选中后，点击继续。可以同时保留多个事项。'}</small></div><div class="button-row">${btn(S.busy.has('analyze')?'正在核对…':'继续 '+icon('arrow'),'start-task','primary',!count||S.busy.has('analyze'))}</div></div>`;
}
function candidateReason(p){const regions=S.discovery?.interpretation?.regions||[],terms=(p.retrieval?.matchedTerms||[]).filter(t=>!regions.some(r=>r.includes(t))).slice(0,3);return (terms.length?'与你提到的“'+terms.join('、')+'”相关':'与当前业务方向相关')+'；'+(p.region==='全国'?'全国政策范围':p.region+'事项')+'，适用条件仍需核对。';}
function card(p){
 const chosen=S.work.selected.includes(p.id),w=windowCopy(p);
 return `<article id="policy-${esc(p.id)}" data-policy-card="${esc(p.id)}" class="policy-card ${chosen?'selected':''}"><div class="candidate-main"><div class="candidate-title"><span class="candidate-region">${esc(p.region)}</span>${p.applicationStatus==='closed'?'<span class="pill closed">已截止</span>':''}<h2>${esc(p.title)}</h2></div><label class="check-select"><input type="checkbox" data-select="${esc(p.id)}" aria-label="选择 ${esc(p.title)}" ${chosen?'checked':''}><span>${chosen?'已选择':'选择'}</span></label></div><p class="card-purpose">${esc(policyPurpose(p))}</p><div class="candidate-window ${w.kind}">${icon('clock')}<span>${esc(w.label)}</span></div><button class="btn candidate-detail-trigger reading-trigger" data-detail="${esc(p.id)}" aria-haspopup="dialog" aria-expanded="false"><span>查看适用要求与依据</span>${icon('chevron','disclosure-chevron')}</button><div class="candidate-source">${link(p.source?.url,'官方原文')}<span>核验 ${date(p.verifiedAt)}</span></div></article>`;
}
const policyDetail=renderPolicyDetails;
function policyPicker(){return selected().length>1?`<div class="policy-picker segmented-track" data-segment-context="policy-picker-${esc(S.view)}-${esc(S.work.selected.join('-'))}" role="group" aria-label="切换当前政策"><span class="segmented-indicator" aria-hidden="true"></span>${selected().map(p=>`<button data-active-policy="${esc(p.id)}" class="${activePolicy()?.id===p.id?'active':''}" aria-pressed="${activePolicy()?.id===p.id}">${esc(short(p))}</button>`).join('')}</div>`:'';}
function policyContext(p){
 return `<section class="policy-context"><div><h2>${esc(p.title)}</h2><div class="context-meta"><span>${esc(p.region)}</span><span>${esc(windowCopy(p).label)}</span></div></div><button class="btn reading-trigger context-trigger" data-action="policy-context" aria-haspopup="dialog" aria-expanded="false"><span>政策与官方依据</span>${icon('chevron','disclosure-chevron')}</button></section>`;
}
function windowNote(p){return p.applicationStatus==='closed'||p.applicationStatus==='unknown'?hint(esc(windowCopy(p).detail),p.applicationStatus==='closed'?'warning':''):'';}
function analysis(){
  const p=activePolicy();if(!p)return title('核对条件','先选择要了解的政策。','核对会根据所选事项，按需追问企业信息。')+empty('还没有选择政策','描述业务问题后，在相关政策上点击“选择”。');
  const r=S.work.analysis?.results?.find(x=>x.policyId===p.id),stale=S.work.analysisStale;
  const pending=(r?.conditions.filter(c=>c.status!=='met')||[]).sort((a,b)=>({unmet:0,missing:1,verify:2}[a.status])-({unmet:0,missing:1,verify:2}[b.status])),missing=pending.filter(c=>c.status==='missing'),unmet=pending.filter(c=>c.status==='unmet'),verify=pending.filter(c=>c.status==='verify');
  return title('核对条件','核对适用条件','先确认关键信息，未知信息可暂时跳过。',btn(icon('spark')+'问助手','assistant-toggle','subtle'))+policyPicker()+policyContext(p)+windowNote(p)+`${S.work.historical?hint('正在使用保存时的政策快照。 '+btn('比较当前资料','refresh-sources','subtle'),'warning'):''}${stale?hint('事实或资料有变化，需要重新核对。 '+btn('重新核对','analyze','subtle'),'warning'):''}${r?`<section class="analysis-focus"><div class="focus-summary focus-overview"><span class="eyebrow">当前判断 · ${stale?'待更新':'根据已提供的事实'}</span><h2>${unmet.length?`有 ${unmet.length} 条信息初步不符合。`:missing.length?`还需要补充 ${missing.length} 条企业信息。`:verify.length?`有 ${verify.length} 条规则需要进一步核实。`:'已提供信息支持初步满足。'}</h2><p>${unmet.length?'先查看不符原因，判断是否值得继续准备。':missing.length?'从能确认的信息开始；不会把缺失信息当成不符合。':verify.length?'可先记录材料线索，复杂规则仍需人工核验。':'提交前仍需核验正式材料、办理时间与完整要求。'}</p><div class="counts">${Object.entries({met:'初步满足',unmet:'初步不符',missing:'待补信息',verify:'待核规则'}).map(([k,l])=>`<span class="count-${k}"><strong>${r.conditions.filter(c=>c.status===k).length}</strong> ${l}</span>`).join('')}</div></div>${pending.length?`<div class="section-heading"><h2>优先处理</h2><span>${S.showAllConditions?pending.length:Math.min(3,pending.length)}/${pending.length} 条</span></div><div class="condition-list">${(S.showAllConditions?pending:pending.slice(0,3)).map(c=>condition(c,p.id)).join('')}</div>${pending.length>3?btn(S.showAllConditions?'收起其他条件':'查看其余 '+(pending.length-3)+' 条条件','all-conditions','subtle expand-conditions'):''}`:''}${r.conditions.some(c=>c.status==='met')?`<details class="fulfilled-conditions"><summary class="disclosure-summary"><span class="disclosure-label">已初步满足的 ${r.conditions.filter(c=>c.status==='met').length} 条条件</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body">${r.conditions.filter(c=>c.status==='met').map(c=>condition(c,p.id)).join('')}</div></details>`:''}</section>`:`<div class="empty-analysis"><h2>从已有事实开始核对。</h2><p>无需先填写整份企业档案，缺什么再补什么。</p>${btn('开始核对','analyze','primary',S.busy.has('analyze'))}</div>`}<div class="stage-actions"><div><strong>${missing.length?'下一步：补充能确认的事实':'下一步：整理材料与办理路径'}</strong><small>能确认的先补充；暂不清楚也可以继续准备，未确认条件会保留。</small></div><div class="button-row">${missing[0]&&!stale?`<button class="btn" data-followup="${esc(p.id)}" data-condition="${esc(missing[0].conditionId)}">${esc(missing[0].field&&fields[missing[0].field]?'补充'+fields[missing[0].field]:'补充首项企业事实')}</button>`:''}<button class="btn primary" data-work="${esc(p.id)}">准备这项政策 ${icon('arrow')}</button></div></div>${assistant()}`;
}
function condition(c,id){return `<article class="condition" data-condition-card="${esc(id)}-${esc(c.conditionId)}"><div class="condition-main"><div class="condition-heading"><h3>${esc(c.label)}</h3>${stateBadge(c.status)}</div><p>${esc(c.status==='missing'?c.question||c.reason:c.reason)}</p><details><summary class="disclosure-summary"><span class="disclosure-label">企业事实与官方依据</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><p>企业事实：${esc(String(c.fact).startsWith('需专项资料')?'尚未记录专项事实':formatFact(c.fact))}${c.assessment?.period?' · '+esc(c.assessment.period):''}</p><p>${esc(c.evidence)}</p>${c.assessment?.note?`<p>资料说明：${esc(c.assessment.note)}</p>`:''}${link(c.sourceUrl,'官方原文')}</div></details></div><button class="btn small" data-followup="${esc(id)}" data-condition="${esc(c.conditionId)}">${c.status==='missing'?'补充信息':c.status==='verify'?'记录核验线索':'查看 / 修改事实'}</button></article>`;}
function workSaveStatus(){const saved=recordSaveState();return `<div class="work-save-status" aria-live="polite" aria-atomic="true"><span data-buffer-state="${S.autosaveOk?'saved':'failed'}">${S.autosaveOk?'本浏览器已暂存':'浏览器暂存失败，请保存记录'}</span><span data-save-state="${esc(saved.kind)}">${esc(saved.label)}</span></div>`;}
function workspace(){
 const p=activePolicy();if(!p)return title('准备资料','先选择一个准备事项。','办理流程、材料与草稿会按事项分别保存。')+empty('还没有准备中的事项','从相关政策中选择想继续了解的一项。');
 const at=preparationOrder.indexOf(S.tab),lead=S.work.task==='explain'&&S.assistantOpen;
 const sub={steps:'先了解在哪里办理、需要做什么。看完就可以开始准备材料。',materials:'准备好一项，就勾选一项。暂时拿不到的材料可以之后再补。',fields:'',review:'看看已经整理了什么、还缺什么，再保存或导出准备记录。'}[S.tab];
 return title('办理准备',lead?'了解这项政策':preparationLabels[S.tab]||preparationLabels.steps,lead?'先看支持内容与适用范围，再决定是否继续准备。':sub,'<button class="btn subtle" data-nav="radar">更换政策</button>'+btn('问助手','assistant-toggle','subtle'))+policyPicker()+policyContext(p)+`${S.work.historical?hint('这是保存时的资料快照。 '+btn('比较当前资料','refresh-sources','subtle'),'warning'):''}`+(['steps','review'].includes(S.tab)?windowNote(p):'')+` ${lead?assistant(true):''}<nav class="preparation-flow" aria-label="办理准备顺序"><ol class="segmented-track" data-segment-context="preparation-${esc(p.id)}"><li class="segmented-indicator" role="presentation" aria-hidden="true"></li>${preparationOrder.map((k,i)=>`<li><button id="prep-${k}" data-tab="${k}" aria-label="第 ${i+1} 步：${preparationLabels[k]}" ${S.tab===k?'aria-current="step"':''}><span>${i+1}</span><strong>${{steps:'办理流程',materials:'收集材料',fields:'填写草稿',review:'检查导出'}[k]}</strong></button></li>`).join('')}</ol><p>按顺序准备，或点击一步直接查看。可以略过，未处理项仍会保留。</p></nav><section id="workspace-panel" class="panel workspace-panel" aria-label="${preparationLabels[S.tab]}">${({materials,steps,fields:formGuide,review}[S.tab]||steps)(p)}</section><details class="work-notes" ${S.work.notes||S.work.drafts[p.id]?'open':''}><summary class="disclosure-summary"><span class="disclosure-label">${icon('file')}记录资料说明与未解决问题${S.work.notes?' · 已记录卡点':''}</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><div class="field-grid"><label class="field">这个事项的资料说明<textarea id="draft-text" rows="3" maxlength="16000" placeholder="材料名称、期间、具体情况或需要核对的口径…">${esc(S.work.drafts[p.id]||'')}</textarea></label><label class="field">整个任务的卡点与下一步<textarea id="notes-text" rows="3" maxlength="8000" placeholder="例如：研发报告尚未取得，周五向财务确认。">${esc(S.work.notes)}</textarea></label></div></div></details><div class="stage-actions preparation-actions"><div><strong>第 ${at+1} 步 / 共 4 步</strong><small>${S.tab==='review'?'导出后，在官方渠道完成正式办理。':'草稿与进度自动保留，可随时保存为记录。'}</small>${workSaveStatus()}</div><div class="button-row">${S.tab!=='review'?btn('暂时略过','prep-skip','subtle'):''}${btn('保存记录','save','subtle')}${S.tab==='review'?btn('导出准备记录 '+icon('download'),'export','primary'):btn(({steps:'继续准备材料',materials:'继续整理草稿',fields:'预览填写草稿'}[S.tab])+' '+icon('arrow'),'prep-next','primary')}</div></div>${!lead?assistant():''}`;
}
const materials=renderMaterials;
function steps(p){return `<div class="section-heading"><div><h2>正式办理时要做什么</h2><p>未完成的步骤直接展开。实际做完后勾选，已完成的步骤仍可点击查看。</p></div><span id="step-progress">${p.steps.filter((_,i)=>S.work.steps[p.id]?.['step-'+i]).length}/${p.steps.length} 已完成</span></div>${p.steps.map((s,i)=>{const done=!!S.work.steps[p.id]?.['step-'+i];return `<details class="step-row ${done?'is-done':''}" data-step-key="step-${i}" data-step-state="${done?'done':'pending'}" data-disclosure-key="step-${esc(p.id)}-${i}" ${done?'':'open'}><summary class="disclosure-summary"><span class="disclosure-label"><span class="step-number">${done?icon('check'):i+1}</span><span>${esc(s.title)}</span><small data-step-completion>${done?'已自行完成':''}</small></span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><div class="step-body"><p>${esc(s.description)}</p>${s.entryPath?`<p class="entry-path">${esc(s.entryPath)}</p>`:''}<div class="button-row">${s.entryUrl?link(s.entryUrl,s.entryLabel||'打开官方办理渠道','btn'):''}${link(s.sourceUrl,'办理依据')}<label class="step-check"><input type="checkbox" data-step="step-${i}" ${done?'checked':''}>我已实际完成这一步</label></div></div></div></details>`;}).join('')}`;}
function fieldValue(p,f){return S.work.formDrafts[p.id]?.[f.id];}
function hasFieldValue(p,f){const v=fieldValue(p,f);return v!==undefined&&v!==null&&v!=='';}
const formGuide=renderFormGuide;
function review(p){
 const r=S.work.analysis?.results?.find(x=>x.policyId===p.id),pending=r?.conditions.filter(c=>c.status!=='met').length||0,g=p.formGuide;
 const items=[['适用条件',r&&!S.work.analysisStale?`已核对，${pending} 条仍需处理`:'还没有有效的核对结果','analyze'],['办理时间',windowCopy(p).label,null],['材料准备',`${p.materials.filter(m=>S.work.checks[p.id]?.[m.id]).length}/${p.materials.length} 项已备好`,'materials'],['办理进度',`${p.steps.filter((_,i)=>S.work.steps[p.id]?.['step-'+i]).length}/${p.steps.length} 步已自行完成`,'steps'],['尚需解决',S.work.notes||'没有记录，请自行确认',null]];
 return `<div class="section-heading"><div><h2>你的办理准备记录</h2><p>导出文件包含填写草稿、材料进度、待处理事项和官方来源，可保存到电脑或用于整理后续办理。</p></div></div><section class="focus-overview review-overview" aria-label="当前准备摘要"><span class="eyebrow">当前准备状态</span><h3>${r&&!S.work.analysisStale?(pending?'仍有 '+pending+' 条条件需要处理':'条件已初步核对，正式办理前仍需核实'):'适用条件尚未有效核对'}</h3><p>先确认未处理项，再保存或导出。留空内容会在草稿中保留为“待补”。</p><div class="counts review-gaps"><div class="review-gap"><span><strong>${r&&!S.work.analysisStale?pending:'—'}</strong> ${r&&!S.work.analysisStale?'待处理条件':'条件待核对'}</span>${!r||S.work.analysisStale||pending?`<button class="btn subtle small" data-gap-action="conditions">${r&&!S.work.analysisStale?'处理条件':'去核对条件'} ${icon('arrow')}</button>`:''}</div><div class="review-gap"><span><strong data-review-missing-materials>${p.materials.length-p.materials.filter(m=>S.work.checks[p.id]?.[m.id]).length}</strong> 材料未记录备好</span>${p.materials.some(m=>!S.work.checks[p.id]?.[m.id])?`<button class="btn subtle small" data-gap-action="materials">继续收集材料 ${icon('arrow')}</button>`:''}</div><div class="review-gap"><span><strong data-review-empty-fields>${(g?.fields?.length||0)-(g?.fields?.filter(f=>hasFieldValue(p,f)).length||0)}</strong> 填写内容待补</span>${g?.fields?.some(f=>!hasFieldValue(p,f))?`<button class="btn subtle small" data-gap-action="fields">补充填写草稿 ${icon('arrow')}</button>`:''}</div></div></section><section class="draft-preview" aria-label="填写草稿预览"><div class="section-heading"><h2>填写草稿 <span class="count">${g?.fields?.filter(f=>hasFieldValue(p,f)).length||0}/${g?.fields?.length||0} 项已填写</span></h2><button class="text-link" data-tab="fields">继续填写</button></div><p class="meta">草稿用于对照正式资料，不是可直接提交的完整申请表。标记“待补”的项尚未记录。</p><dl>${(g?.fields||[]).map(f=>`<div><dt>${esc(f.label)}</dt><dd class="${hasFieldValue(p,f)?'':'draft-missing'}">${hasFieldValue(p,f)?esc(formatFact(fieldValue(p,f))):'待补'}</dd></div>`).join('')}</dl></section><details class="preparation-review-details"><summary class="disclosure-summary"><span class="disclosure-label">查看材料、办理进度和待处理事项</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><dl class="review-list">${items.map(([k,v,a])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd>${a?`<button class="text-link" ${a==='analyze'?'data-nav':'data-tab'}="${a}">补充 ${icon('arrow')}</button>`:''}</div>`).join('')}</dl></div></details><div class="review-channel"><h3>准备好了，去哪里使用？</h3><p>对照当期官方表单填写或上传资料。正式提交和审核在官方渠道完成。</p>${link(p.steps.find(s=>s.entryUrl)?.entryUrl||p.source.url,'查看官方办理渠道','btn')}<button class="text-link" data-action="reviewed">记录本次自行检查时间</button></div>${S.work.lastReviewedAt?`<p class="meta">上次自行检查：${esc(new Date(S.work.lastReviewedAt).toLocaleString('zh-CN'))}</p>`:''}`;
}
function explanationText(value){
 const sections=String(value).replace(/(政策概要|支持内容|关键依据)：/g,'\n$1：').replace(/整理说明不构成/g,'\n整理说明不构成').split(/\n+/).filter(Boolean);
 return `<div class="assistant-answer">${sections.map(part=>{const match=part.match(/^(政策概要|支持内容|关键依据)：([\s\S]*)$/);return match?`<section><h3>${esc(match[1])}</h3><p>${esc(match[2])}</p></section>`:`<p class="assistant-answer-note">${esc(part)}</p>`;}).join('')}</div>`;
}
function assistant(primary=false){if(!S.assistantOpen)return '';const p=activePolicy(),scoped=S.work.messages.filter(m=>!m.policyIds?.length||m.policyIds.includes(p.id)),thread=primary?scoped.slice(Math.max(0,scoped.findLastIndex(m=>m.role==='user'))):scoped.slice(-6);return `<section class="panel assistant ${primary?'assistant-lead':''}" aria-label="当前政策助手"><div class="section-heading"><div><h2>${primary?'政策说明':icon('spark')+'问问这项政策'}</h2><p>${esc(short(p))} · 模拟回答，保留官方依据</p></div>${btn(icon('cross'),'assistant-toggle','icon-button')}</div>${!primary?`<div class="quick-queries">${['解释这项政策','我缺哪些材料','下一步怎么办'].map(q=>`<button class="chip" data-ask="${q}">${q}</button>`).join('')}</div>`:''}${thread.length?`<div class="chat-history" aria-live="polite">${thread.map(m=>`<article class="chat-message ${m.role}"><strong>${m.role==='user'?'你的问题':'政策助手 · 模拟'}</strong>${primary&&m.role==='assistant'?explanationText(m.text):`<p>${esc(m.text)}</p>`}${m.evidence?.length?`<details><summary class="disclosure-summary"><span class="disclosure-label">查看回答依据</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body">${m.evidence.map(e=>link(e.sourceUrl,e.title||'官方依据')).join('<br>')}</div></details>`:''}</article>`).join('')}</div>`:''}${primary&&S.busy.has('assistant')?'<p class="assistant-thinking" role="status">正在整理支持内容与官方依据…</p>':''}<form id="assistant-form"><label class="sr-only" for="assistant-question">当前政策问题</label><div class="search-box"><input id="assistant-question" name="question" maxlength="1000" placeholder="描述你的卡点…"><button class="btn primary" ${S.busy.has('assistant')?'disabled':''}>${S.busy.has('assistant')?'整理中…':'发送'}${icon('arrow')}</button></div></form></section>`;}
function records(){const query=S.recordQuery.trim().toLocaleLowerCase('zh-CN'),list=S.records.filter(r=>(!S.recordFilter||r.status===S.recordFilter)&&(!query||[r.title,r.notes,r.question].join(' ').toLocaleLowerCase('zh-CN').includes(query))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));return title('我的记录','从上次的进度继续。','保存过的事实、资料和卡点，都在这里。','<button class="btn primary" data-action="new-work">新问题 '+icon('arrow')+'</button>')+`<div class="record-filters"><label class="field"><span class="sr-only">查找记录</span><input id="record-query" value="${esc(S.recordQuery)}" placeholder="查找名称、问题或卡点"></label><label class="record-filter-pill"><span>进度</span><select id="record-filter" aria-label="记录进度">${options([['','全部进度'],...Object.entries(recStatus)],S.recordFilter)}</select></label></div>${list.length?`<div class="record-list">${list.map(r=>`<article class="record-card" data-record-card="${esc(r.id)}" data-pointer-light><div class="record-main"><div class="record-meta"><span class="pill">${recStatus[r.status]||esc(r.status)}</span><span>${date(r.updatedAt)} · 版本 ${r.revision||1}</span></div><h2>${esc(r.title)}</h2><p>${esc(r.notes||r.question||'已保存准备过程')}</p></div><button class="btn primary" data-open-record="${esc(r.id)}">继续准备 ${icon('arrow')}</button><details class="record-more"><summary class="disclosure-summary"><span class="disclosure-label">更多操作</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><button class="btn" data-export-record="${esc(r.id)}">导出记录</button><button class="btn" data-history="${esc(r.id)}">保存版本</button><button class="btn danger subtle" data-delete-record="${esc(r.id)}">删除记录</button></div></details></article>`).join('')}</div>`:S.records.length?`<div class="empty record-empty" data-record-empty="filtered">${icon('search')}<h2>没有符合条件的记录</h2><p>你已保存的 ${S.records.length} 条记录仍然保留。调整关键词或进度，或清除筛选后查看全部。</p><button class="btn" data-action="clear-record-filters">清除筛选，查看全部记录</button></div>`:empty('还没有保存过准备过程','选择政策后，可以在准备页保存当前进度。')}`;}
function profile(){const p=S.profileDraft,nums=['employees','revenue','rdRatio','ageYears'],bools=['highTech','techSme','smallProfit','compliant','exporter','hasIp'];const input=k=>`<label class="field">${fields[k]}${bools.includes(k)?`<select name="${k}">${options([['','不清楚 / 未提供'],['true','是'],['false','否']],p[k]===true?'true':p[k]===false?'false':'')}</select>`:`<input name="${k}" type="${nums.includes(k)?'number':'text'}" ${nums.includes(k)?'min="0" step="any"':''} value="${esc(p[k]??'')}" maxlength="200">`}${k==='revenue'?'<small>营业收入不能代替应纳税所得额、资产或研发投入。</small>':k==='employees'?'<small>基础人数；平均人数等专项口径按政策补充。</small>':k==='period'?'<small>例如2025年度，专项资料另行确认。</small>':''}</label>`;return title('企业资料','只填写能确认的信息。','这份基础资料可以重复使用，专项条件会在核对时追问。')+`${S.profile.origin==='demo'?hint('当前是模拟企业资料，仅用于体验。','warning'):''}<form id="profile-form" class="panel profile-form"><div class="section-heading"><h2>基础资料</h2><span class="pill">${S.profileDirty?'有未保存修改':'已保存档案'}</span></div><div class="field-grid">${['companyName','region','industry','period'].map(input).join('')}</div><details class="profile-extra"><summary class="disclosure-summary"><span class="disclosure-label">规模与资格信息 · 可稍后补充</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><div class="field-grid">${Object.keys(fields).filter(k=>!['companyName','region','industry','period'].includes(k)).map(input).join('')}</div></div></details><div class="form-actions"><button class="btn primary" type="submit">保存企业资料</button><details class="profile-actions"><summary class="disclosure-summary"><span class="disclosure-label">体验与管理</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body">${btn('载入模拟资料','demo-profile')}${btn('清空档案','clear-profile','danger subtle')}</div></details></div><p class="meta">已保存任务保留各自的企业事实快照。</p></form>`;}
function sources(){return title('官方来源','每项资料，都可以追溯。','查看公开原文与留存快照，确认资料的新旧与覆盖范围。')+`<div class="source-summary"><strong>${S.policies.length} 项精选政策 · ${(S.sources||[]).length} 份官方资料</strong><p>${esc(S.dataset.coverage)}</p><span>资料核验 ${date(S.dataset.verifiedAt)} · 尚未接入自动更新</span></div><div class="source-list">${(S.sources||[]).map(s=>`<details class="source-row" data-source-key="${esc(s.id||s.title)}"><summary class="disclosure-summary"><span class="disclosure-label"><span><strong>${esc(s.title)}</strong><small>${esc(s.authority||'政府公开资料')} · 核验 ${date(s.verifiedAt)}</small></span></span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><div class="source-body"><p class="meta">发布 ${date(s.publishedAt)} · 成文 ${date(s.documentDate)}</p><div class="button-row">${link(s.url,'官方原文','btn')}${s.snapshotPath?link(siteUrl('/'+s.snapshotPath),'留存原文快照','btn'):''}</div></div></div></details>`).join('')}</div>`;}
function settings(){return title('工作设置','你的记录，保存在本浏览器。','管理模拟服务连接、浏览器记录与问题线索。')+`<section class="panel"><div class="section-heading"><h2>免登录展示原型</h2><span class="pill ${S.health?'green':'gold'}">${S.health?'服务已连接':'服务未连接'}</span></div><dl class="review-list"><div><dt>资料保存</dt><dd>企业资料、准备记录、历史版本与反馈：只在本浏览器保存。<br>当前编辑也会在本浏览器自动暂存。</dd></div><div><dt>政策助手</dt><dd>模拟模式 · 未调用真实大模型</dd></div><div><dt>保存范围</dt><dd>无需登录，不提供跨设备同步。其他访客看不到本浏览器记录。<br>清除本站浏览器数据、更换浏览器或设备会使这些记录不可用，请及时导出备份。</dd></div><div><dt>服务器处理</dt><dd>分析与助手请求会临时发送所填事实以产生模拟结果，服务器不保存企业资料或记录。建议展示时使用演示资料。</dd></div></dl><div class="button-row">${btn('重新连接','retry')}${btn('恢复上一任务','recover-work')}</div><details class="guide-limitations"><summary class="disclosure-summary"><span class="disclosure-label">接入配置与保存说明</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><p>同源 /api/v1 提供无状态政策发现、条件核对和模拟助手。浏览器保存独立于服务器；真实大模型、企业数据及自动采集服务保留接入接口，当前未启用。</p>${btn('查看接口契约','interfaces')}${btn('开始新任务','new-work')}</div></details></section><section class="panel"><div class="section-heading"><div><h2>问题线索</h2><p>仅保存在本浏览器，便于自行核实，不会发送给运营方。</p></div>${btn('记录线索','feedback')}</div>${(S.feedback||[]).length?S.feedback.map(f=>`<details class="feedback-item"><summary class="disclosure-summary"><span class="disclosure-label">${date(f.createdAt)} · 本浏览器线索</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><p>${esc(f.comment)}</p></div></details>`).join(''):'<p class="meta">暂无问题线索。</p>'}</section>`;}
const views={radar,analyze:analysis,workspace,records,profile,sources,settings};

return {recStatus, navs, empty, shell, policyDetail, views};
})();

/* ===== ./interaction.js ===== */
const __m___interaction_js = (() => {
// Motion communicates disclosure and selection changes; keyboard actions stay immediate.
const disclosureStates = new WeakMap();
const panelStates = new WeakMap();
const rememberedDisclosures = new Map();
let activeContext = '';
let installed = false;
let pointerMode = false;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const easing = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function disclosureKey(details, index) {
  if (details.dataset.disclosureKey) return details.dataset.disclosureKey;
  const anchor = details.closest('[data-policy-card],[data-condition-card],[data-material-row],[data-record-card],[data-source-key],.draft-field');
  const scope = anchor?.dataset.policyCard || anchor?.dataset.conditionCard || anchor?.dataset.materialRow || anchor?.dataset.recordCard || anchor?.dataset.sourceKey || anchor?.id || '';
  const summary = details.querySelector(':scope > summary');
  return `${scope}:${summary?.textContent.trim() || ''}:${scope ? '' : index}`;
}

function decorateDisclosures(root, context = activeContext) {
  root.querySelectorAll('details').forEach((details, index) => {
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;
    details.dataset.disclosureContext = context;
    details.dataset.disclosureKey = disclosureKey(details, index);
    summary.setAttribute('aria-expanded', String(details.open));
    // The summary still has its native details keyboard behavior and semantics.
    if (!details.classList.contains('disclosure-row') && !details.classList.contains('disclosure-compact')) {
      const fullRow = details.matches('.candidate-details,.source-row,.step-row,.fulfilled-conditions,.work-notes,.preparation-review-details,.profile-extra,.guide-limitations,.feedback-item');
      details.classList.add(fullRow ? 'disclosure-row' : 'disclosure-compact');
    }
  });
}

function currentHeight(node) { return node.getBoundingClientRect().height; }
function naturalHeight(node) {
  const height = node.style.height;
  node.style.height = 'auto';
  const value = currentHeight(node);
  node.style.height = height;
  return value;
}

// Height is used only for accordions. Each reversal starts at its presentation value.
function animateHeight(node, desired, states, { animate = pointerMode && !reduced(), finish } = {}) {
  const previous = states.get(node);
  const from = node.hidden ? 0 : currentHeight(node);
  const opacity = node.hidden ? 0 : Number(getComputedStyle(node).opacity);
  previous?.observer?.disconnect();
  previous?.animation?.cancel();
  const state = { desired, animation: null, observer: null, finish, target: 0 };
  states.set(node, state);
  node.hidden = false;
  const complete = () => {
    if (states.get(node) !== state) return;
    state.observer?.disconnect();
    node.style.removeProperty('height');
    node.style.removeProperty('opacity');
    node.style.removeProperty('overflow');
    state.animation = null;
    finish?.(desired);
  };
  if (!animate || !node.animate) { complete(); return; }
  node.style.height = `${from}px`;
  node.style.overflow = 'hidden';
  state.target = desired ? naturalHeight(node) : 0;
  const run = (start, alpha) => {
    state.animation = node.animate(
      [{height:`${start}px`,opacity:alpha},{height:`${state.target}px`,opacity:desired ? 1 : 0}],
      {duration:240,easing:easing('--ease-out'),fill:'forwards'}
    );
    state.animation.onfinish = () => { state.animation?.cancel(); complete(); };
  };
  run(from, Number.isFinite(opacity) ? opacity : 1);
  // If content changes while opening, redirect rather than leaving a clipped panel.
  if (desired && typeof ResizeObserver !== 'undefined') {
    state.observer = new ResizeObserver(() => {
      if (states.get(node) !== state || !state.animation) return;
      const shown = currentHeight(node), alpha = Number(getComputedStyle(node).opacity);
      state.animation.cancel();
      node.style.height = `${shown}px`;
      const target = naturalHeight(node);
      state.target = target;
      run(shown, alpha);
    });
    [...node.children].forEach(child => state.observer.observe(child));
  }
}

function setDisclosure(details, desired, animate) {
  const summary = details.querySelector(':scope > summary');
  const body = details.querySelector(':scope > .disclosure-body');
  if (!body) { details.open = desired; summary?.setAttribute('aria-expanded', String(desired)); return; }
  const wasOpen = details.open;
  if (!wasOpen && desired) { body.style.height = '0px'; body.style.opacity = '0'; }
  details.open = true;
  const logical = { desired };
  disclosureStates.set(details, logical);
  summary?.setAttribute('aria-expanded', String(desired));
  details.classList.toggle('is-closing', !desired);
  animateHeight(body, desired, panelStates, {animate, finish:open => {
    if (disclosureStates.get(details) !== logical) return;
    details.open = open;
    details.classList.remove('is-closing');
    summary?.setAttribute('aria-expanded', String(open));
    disclosureStates.delete(details);
  }});
}

// Programmatic completion must interrupt any current disclosure transition.
// Reuse the same logical state and cleanup as the native summary control.
function setDisclosureOpen(details, desired, {animate = false} = {}) {
  setDisclosure(details, desired, animate);
}

function captureInteractions(root) {
  root.querySelectorAll('details').forEach(details => {
    const desired = disclosureStates.get(details)?.desired ?? details.open;
    const key = `${details.dataset.disclosureContext || activeContext}|${details.dataset.disclosureKey}`;
    rememberedDisclosures.set(key, desired);
    const body = details.querySelector(':scope > .disclosure-body');
    const state = body && panelStates.get(body);
    state?.observer?.disconnect();
    state?.animation?.cancel();
  });
  root.querySelectorAll('.policy-inline-detail').forEach(panel => {
    const state = panelStates.get(panel);
    state?.observer?.disconnect();
    state?.animation?.cancel();
  });
  return [...root.querySelectorAll('.segmented-track')].map(track => {
    const indicator = track.querySelector(':scope > .segmented-indicator');
    return indicator && {context:track.dataset.segmentContext,rect:indicator.getBoundingClientRect(),scrollLeft:track.scrollLeft,scrollTop:track.scrollTop};
  }).filter(Boolean);
}

function restoreInteractions(root, context, previous = [], workScope = '') {
  activeContext = context;
  decorateDisclosures(root, context);
  root.querySelectorAll('details').forEach(details => {
    const key = `${context}|${details.dataset.disclosureKey}`;
    if (rememberedDisclosures.has(key)) details.open = rememberedDisclosures.get(key);
    details.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(details.open));
  });
  root.querySelectorAll('.segmented-track').forEach(track => {
    track.dataset.segmentContext = `${workScope}|${track.dataset.segmentContext}`;
    const old = previous.find(item => item.context === track.dataset.segmentContext);
    if (old) { track.scrollLeft = old.scrollLeft; track.scrollTop = old.scrollTop; }
  });
  positionIndicators(root, previous);
  installInteractions();
}

function positionIndicators(root, previous = []) {
  root.querySelectorAll('.segmented-track').forEach(track => {
    const indicator = track.querySelector(':scope > .segmented-indicator');
    const active = track.querySelector('button[aria-current="step"],button[aria-pressed="true"]');
    if (!indicator || !active) { if (indicator) indicator.hidden = true; return; }
    indicator.hidden = false;
    const outer = track.getBoundingClientRect(), target = active.getBoundingClientRect();
    // Measure the inset and border instead of assuming the decoration's coordinate origin.
    const inset = parseFloat(getComputedStyle(indicator).left) || 0;
    const translation = target.left - outer.left - track.clientLeft - inset + track.scrollLeft;
    indicator.style.width = `${target.width}px`;
    indicator.style.height = `${target.height}px`;
    indicator.style.top = `${target.top - outer.top - track.clientTop + track.scrollTop}px`;
    indicator.style.transform = `translateX(${translation}px)`;
    const origin = previous.find(item => item.context === track.dataset.segmentContext)?.rect;
    if (!origin || !pointerMode || reduced()) return;
    const final = indicator.getBoundingClientRect();
    const delta = origin.left - final.left, ratio = final.width ? origin.width / final.width : 1;
    if (Math.abs(delta) < .5 && Math.abs(ratio - 1) < .005) return;
    indicator.style.transformOrigin = 'left center';
    indicator.animate(
      [{transform:`translateX(${translation + delta}px) scaleX(${ratio})`},{transform:`translateX(${translation}px) scaleX(1)`}],
      {duration:200,easing:easing('--ease-in-out')}
    );
  });
}

function toggleInlinePanel(panel, desired, {finish, animate = pointerMode && !reduced()} = {}) {
  animateHeight(panel, desired, panelStates, {animate, finish:open => {
    panel.hidden = !open;
    finish?.(open);
  }});
}

function clearLight(node) {
  node?.removeAttribute('data-pointer-active');
  node?.style.removeProperty('--pointer-x');
  node?.style.removeProperty('--pointer-y');
}

function installInteractions() {
  if (installed) return;
  installed = true;
  document.addEventListener('pointerdown', () => { pointerMode = true; }, {capture:true});
  document.addEventListener('keydown', () => {
    pointerMode = false;
    document.querySelectorAll('[data-pointer-active]').forEach(clearLight);
  }, {capture:true});
  document.addEventListener('click', event => {
    const summary = event.target.closest('summary.disclosure-summary');
    if (!summary || event.target.closest('a,button,input,select,textarea')) return;
    const details = summary.parentElement;
    const desired = !(disclosureStates.get(details)?.desired ?? details.open);
    // Keyboard clicks preserve native details toggling, with an immediate state change.
    if (event.detail === 0 || reduced()) {
      const body = details.querySelector(':scope > .disclosure-body');
      const state = body && panelStates.get(body);
      state?.observer?.disconnect();
      state?.animation?.cancel();
      body?.style.removeProperty('height');
      body?.style.removeProperty('opacity');
      body?.style.removeProperty('overflow');
      if (disclosureStates.has(details)) { event.preventDefault(); details.open = desired; }
      disclosureStates.delete(details);
      details.classList.remove('is-closing');
      return;
    }
    event.preventDefault();
    setDisclosure(details, desired, true);
  }, {capture:true});
  document.addEventListener('toggle', event => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || disclosureStates.has(details)) return;
    details.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(details.open));
  }, {capture:true});
  window.addEventListener('resize', () => positionIndicators(document.querySelector('#app')), {passive:true});
  document.addEventListener('pointermove', event => {
    const node = event.target.closest('[data-pointer-light]');
    if (!node || event.pointerType !== 'mouse' || !matchMedia('(hover:hover) and (pointer:fine)').matches || reduced() || node.matches(':focus-within')) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--pointer-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
    node.style.setProperty('--pointer-y', `${(event.clientY - rect.top) / rect.height * 100}%`);
    node.dataset.pointerActive = '';
  }, {passive:true});
  document.addEventListener('pointerout', event => {
    const node = event.target.closest('[data-pointer-light]');
    if (node && !node.contains(event.relatedTarget)) clearLight(node);
  }, {passive:true});
  document.addEventListener('focusin', event => clearLight(event.target.closest('[data-pointer-light]')));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    if (event.matches) document.querySelectorAll('[data-pointer-active]').forEach(clearLight);
  });
}

return {decorateDisclosures, setDisclosureOpen, captureInteractions, restoreInteractions, toggleInlinePanel};
})();

/* ===== ./export.js ===== */
const __m___export_js = (() => {
const {windowCopy} = __m___presentation_js;
const STATUS = {met:'初步满足',unmet:'初步不符',missing:'待补信息',verify:'待核规则'};
const RECORD_STATUS = {saved:'已收藏',evaluating:'核对中',preparing:'准备中',submitted:'用户标记已提交',approved:'用户记录获批',rejected:'用户记录未获批',archived:'已归档'};
const PROFILE_FIELDS = {companyName:'企业名称',region:'企业注册地区',industry:'主营行业',employees:'从业人数（人）',revenue:'营业收入（万元）',rdRatio:'研发费用占比（%）',ageYears:'成立年限（年）',highTech:'有效高企资格',techSme:'科技型中小企业',smallProfit:'小型微利企业身份',compliant:'无严重失信记录',exporter:'有出口业务',hasIp:'具有相关知识产权',period:'企业数据所属期间'};
const DISCLAIMER = '本文件为私有政策研究与准备记录。条件结果由可解释规则和模拟助手生成；用户自报事实与官方条款分开保留。初步满足、材料勾选和填写进度不等于申报资格、正式提交或获批。填写草稿用于对照正式表单；本文件不是完整申请材料，也不会自动提交申请。请按主管部门当期官方通知复核窗口、统计口径、证明材料和附件版本。';
const plain = (value,fallback='未提供') => value===null||value===undefined||value==='' ? fallback : value===true?'是':value===false?'否':typeof value==='object'?JSON.stringify(value):String(value);
// Escape both HTML and Markdown syntax in any user or source text. Newlines remain readable.
const md = value => plain(value).replace(/\\/g,'\\\\').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([`*_{}\[\]()#+.!|~-])/g,'\\$1');
const cell = value => md(value).replace(/\r?\n/g,' / ');
const quote = value => md(value).split(/\r?\n/).map(line=>'> '+line).join('\n');
const line = (label,value) => `- ${label}：${md(value).replace(/\r?\n/g,'\n  ')}`;
const own = (object,key) => Object.prototype.hasOwnProperty.call(object||{},key);
const json = value => value===undefined||value===null?null:Array.isArray(value)?value.map(json):typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,json(v)])):typeof value==='number'&&!Number.isFinite(value)?null:value;
const safeLink = value => {
  if(typeof value!=='string')return null;
  try { const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href.replace(/[()<>"'\s]/g,c=>encodeURIComponent(c)):null; }
  catch { return /^\/?data\/(templates|snapshots)\/[a-zA-Z0-9_.-]+$/.test(value)?value:null; }
};
const link = (value,label='官方来源') => {const url=safeLink(value);return url?`[${md(label)}](${url})`:md(value||'未保存可用来源链接');};
const normalize = ({work={},profile={},policies=[]}={}) => {
  const ids = Array.isArray(work.selected)?work.selected:Array.isArray(work.policyIds)?work.policyIds:work.policyId?[work.policyId]:[];
  const sourceVersions=Array.isArray(work.sourceVersions)?work.sourceVersions:[];
  const historical=typeof work.historical==='boolean'?work.historical:!!work.id||!!work.recordId;
  const snapshots=ids.map(id=>{
    const saved=sourceVersions.find(p=>p.id===id),current=policies.find(p=>p.id===id);
    // Historical exports never replace missing saved materials or fields with a later guide.
    const policy=historical&&saved?saved:current||saved||{id,title:id};
    return {id,policy,saved,current};
  });
  const actualProfile=work.profileSnapshot||profile||{};
  const analysis=work.analysis??work.analysisSnapshot??null;
  const changed=snapshots.filter(({saved,current})=>saved&&current&&(saved.version!==current.version||saved.verifiedAt!==current.verifiedAt||(saved.source?.url||saved.url)!==(current.source?.url||current.url)));
  return {work,ids,snapshots,historical,profile:actualProfile,analysis,assessments:work.assessments||{},checks:work.checks||work.checklist||{},steps:work.steps||work.stepsProgress||{},formDrafts:work.formDrafts||{},drafts:work.drafts||work.draft||{},messages:Array.isArray(work.messages)?work.messages:[],stale:work.analysisStale===true||historical||changed.length>0,changedIds:changed.map(p=>p.id)};
};
const conditionRows = (policy,result) => {
  const definitions=Array.isArray(policy.conditions)?policy.conditions:[];
  const evaluated=Array.isArray(result?.conditions)?result.conditions:[];
  const ids=[...new Set([...definitions.map(c=>c.id??c.conditionId),...evaluated.map(c=>c.conditionId??c.id)].filter(Boolean))];
  return ids.map(id=>{const definition=definitions.find(c=>(c.id??c.conditionId)===id)||{},evaluation=evaluated.find(c=>(c.conditionId??c.id)===id)||{};return {...definition,...evaluation,conditionId:id,label:evaluation.label||definition.label||id};});
};
const resultFor = (ctx,id) => ctx.analysis?.results?.find(result=>result.policyId===id);
const userDraft = (drafts,id) => typeof drafts==='string'?drafts:own(drafts,id)?drafts[id]:null;
const checked = (map,id,key) => map[id]?.[key]===true;
const sourceUrl = policy => policy.source?.url||policy.url||null;

function exportArchive(input={}) {
  const ctx=normalize(input),w=ctx.work;
  return json({
    schemaVersion:2,artifactType:'policy-preparation-record',mode:ctx.analysis?.mode||w.mode||'mock',disclaimer:DISCLAIMER,
    record:{id:w.recordId||w.id||null,revision:w.recordRevision??w.revision??null,title:w.recordTitle||w.title||'政策准备记录',status:w.status||'preparing',question:w.question||'',stage:w.stage||w.workflow?.stage||'discover',activePolicyId:w.activePolicyId||w.workflow?.activePolicyId||w.policyId||ctx.ids[0]||null,updatedAt:w.updatedAt||null,lastReviewedAt:w.lastReviewedAt||w.workflow?.lastReviewedAt||null,historical:ctx.historical,analysisStale:ctx.stale,changedSourceIds:ctx.changedIds},
    profile:ctx.profile,
    policies:ctx.snapshots.map(({id,policy,saved,current})=>({
      policyId:id,sourceSnapshot:policy,sourceSnapshotOrigin:ctx.historical&&saved?'saved_record':current?'current_dataset':saved?'saved_record':'unavailable',currentPolicyAvailable:!!current,
      currentSource:{version:current?.version||null,verifiedAt:current?.verifiedAt||null,url:current?sourceUrl(current):null},
      analysis:resultFor(ctx,id)||null,assessments:ctx.assessments[id]||{},checklist:ctx.checks[id]||{},stepsProgress:ctx.steps[id]||{},formDraft:ctx.formDrafts[id]||{},draft:userDraft(ctx.drafts,id)
    })),
    analysis:ctx.analysis,blockers:w.notes||'',workflow:w.workflow||null,messages:ctx.messages
  });
}
const exportJson = input => JSON.stringify(exportArchive(input),null,2)+'\n';

function exportMarkdown(input={}) {
  const ctx=normalize(input),w=ctx.work;
  const out=[`# ${md(w.recordTitle||w.title||'政策准备记录')}`,'',DISCLAIMER,'',
    line('记录状态',RECORD_STATUS[w.status]||w.status||'准备中'),line('记录编号',w.recordId||w.id||'本次工作尚未保存'),line('记录修订',w.recordRevision??w.revision),
    line('工作更新时间',w.updatedAt),line('最后人工复核时间',w.lastReviewedAt||w.workflow?.lastReviewedAt),line('模式',ctx.analysis?.mode||w.mode||'mock'),
    line('历史记录',ctx.historical?'是；保留当时来源及企业事实':'否；当前工作'),line('条件结果有效性',!ctx.analysis?'尚未执行条件核对':ctx.stale?'历史或陈旧结果；需要重新核对，不能作为当前申报结论':'当前工作下的初步核对，仍需材料验证'),
    line('已发现来源变更',ctx.changedIds.length?ctx.changedIds.join('、'):'未发现已保存来源与当前样本的差异，或缺少可比较快照'),'',
    '## 问题与研究范围','',quote(w.question||'未填写经营问题；直接选择事项'),'',...ctx.snapshots.map(({policy})=>'- '+md(policy.title||policy.id)),'',
    '## 企业事实与统计期间','',line('事实来源',ctx.profile.origin==='demo'?'模拟企业，仅用于演示':'用户提供；需原始证明材料核实'),...Object.entries(PROFILE_FIELDS).map(([key,label])=>line(label,ctx.profile[key])),
    ...Object.entries(ctx.profile).filter(([key])=>!own(PROFILE_FIELDS,key)&&key!=='origin').map(([key,value])=>line(key,value)),'',
    '## 逐项条件、专项事实与依据',''];
  if(!ctx.ids.length)out.push('尚未选择事项。','');
  for(const {id,policy} of ctx.snapshots) {
    const result=resultFor(ctx,id),conditions=conditionRows(policy,result),assessments=ctx.assessments[id]||{};
    out.push(`### ${md(policy.title||id)}`,'',line('办理窗口',windowCopy({...policy,applicationStatus:result?.window?.status||policy.applicationStatus}).label),line('窗口说明',policy.window?.note||result?.window?.note),...(result?.window?.note&&result.window.note!==policy.window?.note?[line('核对时窗口说明',result.window.note)]:[]),line('核对摘要',result?.summary||'尚未执行条件核对'),line('结果用途',!ctx.analysis?'仅用于资料整理与准备草稿；尚未执行条件核对，不是官方审核结论':ctx.stale?'仅保留历史判断与过程，需重新核验':'初步准备辅助；不是官方审核结论'),'');
    if(!conditions.length)out.push('未保存逐条件内容；请查阅原文，不补写判断。','');
    for(const c of conditions) {
      out.push(`#### ${md(c.label)}`,'',line('状态',STATUS[c.status]||'尚未评估'),line('判断理由',c.reason),line('企业事实',c.fact),line('事实依据类型',c.evidenceOrigin==='user_report'?'用户专项自报':c.evidenceOrigin==='demo_profile'?'模拟企业字段':c.evidenceOrigin==='user_profile'?'用户企业档案':c.evidenceOrigin==='unverified'?'尚待核验':c.evidenceOrigin||'未保存'),line('需补充的问题',c.question),line('期间要求',c.expectedPeriod||c.periodRequirement||'按原文和当期指南核对'),line('条款依据',c.evidence),'原文链接：'+link(c.sourceUrl||sourceUrl(policy)),'');
      const assessment=assessments[c.conditionId]||c.assessment;
      if(assessment)out.push('用户专项事实（自报，非官方证明）：',line('自报答案',{yes:'是',no:'否',unknown:'暂未确认'}[assessment.answer]||assessment.answer),line('具体材料说明',assessment.note),line('适用期间',assessment.period),line('专项事实来源',assessment.source||'用户自报'),'');
    }
    for(const [conditionId,assessment] of Object.entries(assessments))if(!conditions.some(c=>c.conditionId===conditionId))out.push(`#### 未保留条款定义的专项资料：${md(conditionId)}`,'',line('自报答案',assessment.answer),line('具体材料说明',assessment.note),line('适用期间',assessment.period),'该条款定义未保存；不据此生成条件判断。','');
    if(result?.nextSteps?.length)out.push('下一步建议：',...result.nextSteps.map(item=>'- '+md(item)),'');
  }
  out.push('## 材料勾选与推进步骤','');
  for(const {id,policy} of ctx.snapshots) {
    out.push(`### ${md(policy.title||id)}`,'','材料清单（勾选仅表示用户已准备该项）：','');
    if(!policy.materials?.length)out.push('未保存官方材料清单，需核验当期附件。','');
    for(const [i,m] of (policy.materials||[]).entries())out.push(`- [${checked(ctx.checks,id,m.id||`material-${i}`)?'x':' '}] ${md(m.name||m.title||`材料 ${i+1}`)}（${m.verified===true?'来源列明':'建议准备，要求待核验'}）`,line('材料说明',m.note||m.description),'  依据：'+link(m.sourceUrl||sourceUrl(policy)),...(m.templateUrl?['  官方模板：'+link(m.templateUrl,'来源提供的模板')]:[]),'');
    out.push('步骤进度（完成状态为用户记录）：','');
    if(!policy.steps?.length)out.push('未保存完整办理步骤，不补写官方流程。','');
    for(const [i,step] of (policy.steps||[]).entries())out.push(`- [${checked(ctx.steps,id,step.id||`step-${i}`)?'x':' '}] ${i+1}\. ${md(step.title||`步骤 ${i+1}`)}`,line('具体操作',step.description),'  依据：'+link(step.sourceUrl||sourceUrl(policy)),'');
  }
  out.push('## 来源列明字段与用户填写','');
  for(const {id,policy} of ctx.snapshots) {
    const guide=policy.formGuide,draft=ctx.formDrafts[id]||{};
    out.push(`### ${md(policy.title||id)}`,'');
    if(!guide) {out.push('未保存来源可验证的表单或字段指引；没有生成官方字段。','');if(Object.keys(draft).length)out.push('以下为已存填写内容，因缺少当时字段定义，需人工核验：',...Object.entries(draft).map(([key,value])=>line(key,value)),'');continue;}
    out.push(line('字段指引',guide.title),line('指引版本',guide.version),line('完整程度',guide.completeness==='verified_fields'?'来源明确列明的字段；完整性仍以官方原件为准':guide.completeness==='partial'?'部分资料整理字段，非完整官方申报表':guide.completeness),'指引依据：'+link(guide.sourceUrl||sourceUrl(policy)),...(guide.templateUrl?['官方原件：'+link(guide.templateUrl,'官方附件')]:[]),...((guide.localTemplatePath||guide.snapshotPath)?['留存官方附件：'+link(guide.localTemplatePath||guide.snapshotPath,'已留存官方附件')]:[]),'');
    out.push('| 来源字段 | 用户填写 | 填写帮助 / 口径 | 字段依据 |','| --- | --- | --- | --- |');
    for(const field of guide.fields||[])out.push(`| ${cell(field.label||field.id)} | ${cell(own(draft,field.id)?draft[field.id]:'未填写')} | ${cell(field.help||field.evidence)} | ${link(field.sourceUrl||guide.sourceUrl||sourceUrl(policy),'字段来源')} |`);
    out.push('');
    for(const field of guide.fields||[])if(field.evidence)out.push(line(`“${field.label||field.id}”来源摘记`,field.evidence));
    const defined=new Set((guide.fields||[]).map(field=>field.id));
    for(const [key,value] of Object.entries(draft))if(!defined.has(key))out.push(line(`已存附加字段（定义未保存）${key}`,value));
    if(guide.limitations?.length)out.push('指引限制：',...guide.limitations.map(item=>'- '+md(item)),'');
  }
  out.push('## 各事项准备说明草稿','');
  for(const {id,policy} of ctx.snapshots)out.push(`### ${md(policy.title||id)}`,'',quote(userDraft(ctx.drafts,id)??'尚未填写；不编造企业事实。'),'');
  out.push('## 已做事项、卡点与下一步','',quote(w.notes||'尚未记录卡点。'),'');
  if(w.workflow?.nextAction)out.push(line('已存下一步',w.workflow.nextAction),'');
  if(w.workflow?.blockers?.length)out.push('已存工作流卡点：',...w.workflow.blockers.map(item=>'- '+md(item)),'');
  out.push('## 来源版本与核验时间','');
  for(const {id,policy,saved,current} of ctx.snapshots) {
    const source=policy.source||{};
    out.push(`### ${md(policy.title||id)}`,'',line('资料采用方式',ctx.historical&&saved?'已保存记录中的历史资料':current?'当前精选样本资料':'仅有保存资料，当前样本未找到'),line('政策版本',policy.version),line('政策效力',policy.policyStatus),line('当时办理状态',windowCopy(policy).label),line('发布日',policy.publishedAt||source.publishedAt),line('公文日期',source.documentDate),line('条目核验时间',policy.verifiedAt),line('来源核验时间',source.verifiedAt),line('获取时间',source.retrievedAt),'原文：'+link(sourceUrl(policy)),...(source.snapshotPath?['留存原文：'+link(source.snapshotPath,'留存官方资料快照')]:[]),'');
    if(ctx.historical)out.push(line('当前样本政策版本',current?.version),line('当前样本核验时间',current?.verifiedAt),line('当前样本存在',!!current),'历史资料保留原样；当前版本和当期窗口需另行复核。','');
    for(const related of policy.relatedDocuments||[])out.push('- 关联依据：'+link(related.url||related.sourceUrl,related.title||related.name||'官方关联文件'));
    if(policy.limitations?.length)out.push('资料限制：',...policy.limitations.map(item=>'- '+md(item)),'');
  }
  out.push('## 问答历史与引用','');
  if(!ctx.messages.length)out.push('尚未保存问答历史。','');
  for(const [i,message] of ctx.messages.entries()) {
    const role=message.role==='user'?'用户问题':message.role==='assistant'?'模拟助手回复':message.role||'过程消息';
    out.push(`### ${i+1}\. ${md(role)}`,'',line('时间',message.createdAt||message.at||message.generatedAt),quote(message.content??message.text??message.answer??message.question??'未保存消息内容'),'');
    for(const evidence of message.evidence||message.response?.evidence||[])out.push('- 引用：'+link(evidence.sourceUrl||evidence.url,evidence.title||evidence.anchor||evidence.policyId||'资料来源'));
    for(const limitation of message.limitations||message.response?.limitations||[])out.push(line('回答限制',limitation));
    out.push('');
  }
  out.push('## 使用前复核','',DISCLAIMER,'历史或陈旧条件判断须重新核对；保存时间不是政府网站的最新更新时间。未提供或未知的企业事实保留为未知，不替换为 0 或“否”。','');
  return out.join('\n');
}


return {exportArchive, exportJson, exportMarkdown};
})();

/* ===== ./layers.js ===== */
const __m___layers_js = (() => {
// Reading layers preserve the exact task, scroll position and invoking control.
const {esc, icon} = __m___utils_js;
let current=null,historyClose=null,serial=0;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease=()=>getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
const activeLayer=()=>current;
async function finishLayerClose(){await Promise.all([historyClose?.promise,current?.closing].filter(Boolean));}
function openLayer(app,overlay,title,html,{kind='',historyEntry=false,trigger=document.activeElement,origin=null,animate=false}={}){
 const prior=current;
 const reuseHistory=!!(prior?.historyEntry&&!prior.closing&&history.state?.policyRadarLayer===prior.token);
 const scroll=prior?.scroll??scrollY,token=reuseHistory?prior.token:'reading-'+(++serial),previousOverflow=prior?.previousOverflow??document.body.style.overflow;
 // Version views can replace a dialog. Keep the original page return point.
 if(prior){trigger=prior.trigger;origin=origin||prior.origin;prior.animations.forEach(a=>a.cancel());}
 historyEntry=historyEntry||reuseHistory;
 const session={app,overlay,trigger,origin,scroll,token,historyEntry,previousOverflow,animations:[],closing:null};
 current=session;
 if(trigger?.hasAttribute('aria-haspopup'))trigger.setAttribute('aria-expanded','true');
 overlay.innerHTML=`<div class="modal-backdrop ${kind?'reading-backdrop':''}"><div class="dialog-frame"><section class="dialog ${kind}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><div class="dialog-heading"><h2 id="dialog-title">${esc(title)}</h2><button class="btn icon-button" data-action="close" aria-label="返回原页面">${icon('cross')}</button></div>${html}</section></div></div>`;
 if(historyEntry&&!reuseHistory)history.pushState({...history.state,policyRadarLayer:token},'',location.href);
 document.body.style.overflow='hidden';app.inert=true;
 const surface=overlay.querySelector('.dialog'),frame=surface.parentElement;
 surface.focus({preventScroll:true});
 if(animate&&!reduced()){
  const target=frame.getBoundingClientRect(),source=origin?.getBoundingClientRect();
  const dx=source?(source.left+source.width/2)-(target.left+target.width/2):0;
  const dy=source?(source.top+source.height/2)-(target.top+target.height/2):8;
  session.startTransform=`translate(${dx}px,${dy}px) scale(.96)`;
  session.animations.push(frame.animate([{opacity:0,transform:session.startTransform},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:250,easing:ease()}));
  session.animations.push(overlay.firstElementChild.animate([{opacity:0},{opacity:1}],{duration:200,easing:ease()}));
 }
 return surface;
}
function closeLayer({fromHistory=false,animate=false,restoreFocus=true}={}){
 const session=current;if(!session)return historyClose?.promise||Promise.resolve();
 if(session.closing)return session.closing;
 const {app,overlay}=session;
 let historyDone=Promise.resolve();
 if(session.historyEntry&&!fromHistory&&history.state?.policyRadarLayer===session.token){
  let resolve;historyDone=new Promise(r=>{resolve=r;});
  historyClose={promise:historyDone,resolve};history.back();
 }
 let visual=Promise.resolve();
 const surface=overlay.querySelector('.dialog-frame');
 if(surface&&session.historyEntry&&animate&&!reduced()){
  // Read the currently presented value so an interrupted entrance never jumps.
  const style=getComputedStyle(surface),from={opacity:style.opacity,transform:style.transform};
  session.animations.forEach(a=>a.cancel());
  const animation=surface.animate([from,{opacity:0,transform:session.startTransform||'scale(.96)'}],{duration:200,easing:ease(),fill:'forwards'});
  overlay.firstElementChild.animate([{opacity:1},{opacity:0}],{duration:200,easing:ease(),fill:'forwards'});
  visual=animation.finished.catch(()=>{});
 }
 const restore=()=>{
  if(current!==session)return;
  session.animations.forEach(a=>a.cancel());overlay.innerHTML='';app.inert=false;
  document.body.style.overflow=session.previousOverflow;current=null;
  if(session.trigger?.hasAttribute('aria-haspopup'))session.trigger.setAttribute('aria-expanded','false');
  if(restoreFocus){if(session.trigger?.isConnected)session.trigger.focus({preventScroll:true});else app.querySelector('h1')?.focus({preventScroll:true});window.scrollTo(0,session.scroll);}
 };
 if(!animate||!session.historyEntry||reduced())restore();else visual.then(restore);
 session.closing=Promise.all([historyDone,visual]).then(restore);
 return session.closing;
}
// Return true when Back was consumed by a reading layer, not task navigation.
function handleLayerHistory(){
 if(historyClose){const pending=historyClose;historyClose=null;pending.resolve();return true;}
 if(current?.historyEntry&&history.state?.policyRadarLayer!==current.token){closeLayer({fromHistory:true});return true;}
 if(history.state?.policyRadarLayer&&!current){const state={...history.state};delete state.policyRadarLayer;history.replaceState(state,'',location.href);return true;}
 return false;
}

return {activeLayer, finishLayerClose, openLayer, closeLayer, handleLayerHistory};
})();

/* ===== app.js（入口，保留顶层 await） ===== */
const {S, SESSION_KEY, PREVIOUS_WORK_KEY, clone, selected, activePolicy, profileForWork, policyForWork, analysisBasis, invalidateAnalysis, choosePolicy, rememberSources, policyChanges, recordPayload, restoreRecord, saveSession, restoreSession, newWork, recordSaveState} = __m___state_js;
const {regionsOf} = __m___local_api_js;
const {request, ApiError} = __m___api_js;
const {esc, link, icon, date, formatFact, fields, download, badge} = __m___utils_js;
const {shell, views, recStatus, policyDetail} = __m___views_js;
const {captureInteractions, restoreInteractions, decorateDisclosures, toggleInlinePanel, setDisclosureOpen} = __m___interaction_js;
const {exportMarkdown, exportJson} = __m___export_js;
const {setHomeExpanded} = __m___home_js;
const {preparationOrder, windowCopy} = __m___presentation_js;
const {renderSearchScope} = __m___policy_surfaces_js;
const {installFieldFocus, updateDraftField, clearFieldFocus} = __m___preparation_surfaces_js;
const {openLayer, closeLayer, activeLayer, handleLayerHistory, finishLayerClose} = __m___layers_js;
const app=document.querySelector('#app'),overlay=document.querySelector('#overlay');
let initialized=false;
let toastTimer,searchController,searchSerial=0,analysisSerial=0,chatSerial=0,sessionTimer;
const numbers=['employees','revenue','rdRatio','ageYears'],booleans=['highTech','techSme','smallProfit','compliant','exporter','hasIp'];
let pointerInitiated=false;
const interactionScopes=new WeakMap();
let interactionScopeSerial=0;
function workInteractionScope(){if(!interactionScopes.has(S.work))interactionScopes.set(S.work,String(++interactionScopeSerial));return interactionScopes.get(S.work);}
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function surfaceEntrance(node,kind='page'){
 if(!node||!pointerInitiated||reducedMotion())return;
 const transform=kind==='dialog'?'translateY(8px) scale(.97)':kind==='menu'?'translateY(-4px) scale(.97)':'translateY(6px)';
 node.style.transformOrigin=kind==='menu'?'top right':'center';
 node.animate([{opacity:0,transform},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:kind==='dialog'?250:kind==='menu'?180:200,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim()});
}
function taskEntrance(){
 surfaceEntrance(app.querySelector('.page-title'));
 surfaceEntrance(app.querySelector('.workspace-panel,.policy-grid,.record-list,.profile-form,.source-summary'));
}
document.addEventListener('pointerdown',()=>{pointerInitiated=true;document.body.classList.add('pointer-mode');},{capture:true});
document.addEventListener('keydown',()=>{pointerInitiated=false;document.body.classList.remove('pointer-mode');},{capture:true});


const scopeAssessments=ids=>Object.fromEntries(Object.entries(S.work.assessments).filter(([id])=>ids.includes(id)));
function updateWorkSaveStatus({pending=false}={}){
 const buffer=document.querySelector('[data-buffer-state]');
 if(buffer){const kind=pending?'pending':S.autosaveOk?'saved':'failed',label=pending?'正在暂存到本浏览器…':S.autosaveOk?'本浏览器已暂存':'浏览器暂存失败，请保存记录';buffer.dataset.bufferState=kind;if(buffer.textContent!==label)buffer.textContent=label;}
 const saved=document.querySelector('[data-save-state]');
 if(saved){const state=recordSaveState();saved.dataset.saveState=state.kind;if(saved.textContent!==state.label)saved.textContent=state.label;}
}
function persist(){if(!initialized)return;saveSession();const el=document.querySelector('#autosave-status');if(el)el.textContent=S.autosaveOk?'当前编辑已自动缓冲 · 本浏览器':'自动保存失败，请保存过程记录';updateWorkSaveStatus();}
function laterPersist(){clearTimeout(sessionTimer);updateWorkSaveStatus({pending:true});sessionTimer=setTimeout(persist,250);}
// Per-keystroke rendering is coalesced to one frame: the full-shell re-render
// stays responsive while typing in high-frequency inputs (e.g. record search).
let renderFrame=0;
function scheduleRender(){if(renderFrame)return;renderFrame=requestAnimationFrame(()=>{renderFrame=0;render();});}
function positionToast(){
 const el=document.querySelector('#toast'),bar=document.querySelector('.stage-actions'),rect=bar?.getBoundingClientRect();
 const bottom=rect&&rect.bottom>0&&rect.top<innerHeight?Math.max(27,innerHeight-rect.top+16):27;
 el.style.bottom=`calc(${bottom}px + env(safe-area-inset-bottom, 0px))`;
}
let toastFrame;
function repositionVisibleToast(){if(!document.querySelector('#toast.show')||toastFrame)return;toastFrame=requestAnimationFrame(()=>{toastFrame=null;positionToast();});}
window.addEventListener('scroll',repositionVisibleToast,{passive:true});
window.addEventListener('resize',repositionVisibleToast,{passive:true});
function toast(text){const el=document.querySelector('#toast');el.textContent=text;positionToast();el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),5000);}
function syncStepRows(){
 if(S.view!=='workspace'||S.tab!=='steps')return;
 const p=activePolicy();if(!p)return;
 // A saved completion is authoritative on entry, ahead of disclosure memory.
 app.querySelectorAll('.step-row[data-step-key]').forEach(row=>{
  const done=!!S.work.steps[p.id]?.[row.dataset.stepKey];
  row.open=!done;
  row.querySelector(':scope > summary')?.setAttribute('aria-expanded',String(!done));
 });
}
function render({focus=false}={}){
 clearFieldFocus();
 const interactions=captureInteractions(app);
 const old=document.activeElement,key=old?.tagName==='H1'&&app.contains(old)?{heading:true}:old?.tagName==='SUMMARY'&&app.contains(old)?{disclosure:old.parentElement.dataset.disclosureKey}:old?.id?{id:old.id}:old?.dataset?Object.entries(old.dataset).find(([k])=>['select','material','step','tab','nav','formField','action','work','followup','ask','activePolicy','removePolicy','detail','detailClose'].includes(k)):null;
 const selectionStart=old?.selectionStart,selectionEnd=old?.selectionEnd,scroll=window.scrollY;
 app.innerHTML=shell(views[S.view]());app.inert=!!overlay.innerHTML;app.removeAttribute('aria-busy');const workScope=workInteractionScope();const disclosurePolicy=['analyze','workspace'].includes(S.view)?activePolicy()?.id||'':S.view==='radar'?S.work.question:'';restoreInteractions(app,S.view+'|'+workScope+'|'+disclosurePolicy+'|'+(S.view==='workspace'?S.tab:''),interactions,workScope);syncStepRows();positionToast();
 if(focus){installFieldFocus(app);document.querySelector('h1')?.focus();window.scrollTo(0,0);return;}
 let next;if(key?.heading)next=app.querySelector('h1');else if(key?.id)next=document.getElementById(key.id);else if(key?.disclosure)next=[...app.querySelectorAll('details')].find(node=>node.dataset.disclosureKey===key.disclosure)?.querySelector(':scope > summary');else if(Array.isArray(key)){const[k,v]=key;next=[...app.querySelectorAll('[data-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+']')].find(n=>n.dataset[k]===v);}
 if(next){for(let parent=next.tagName==='SUMMARY'?next.parentElement.parentElement?.closest('details'):next.closest('details');parent;parent=parent.parentElement?.closest('details'))parent.open=true;next.focus({preventScroll:true});if(typeof selectionStart==='number'){try{next.setSelectionRange(selectionStart,selectionEnd);}catch{}}}
 window.scrollTo(0,scroll);
 installFieldFocus(app);
}
function go(view,{replace=false}={}){if(!views[view])return;const previousView=S.view;S.view=view;S.menuOpen=false;if(view==='analyze')S.work.task='eligibility';else if(view==='workspace'&&!(S.work.task==='explain'&&S.assistantOpen&&S.tab==='steps'))S.work.task=S.tab==='fields'?'forms':S.tab;S.work.stage=({radar:'discover',analyze:'evaluate',workspace:S.tab==='review'?'review':((S.work.analysis&&!S.work.analysisStale)||S.work.historical?'prepare':'evaluate')}[view])||S.work.stage;if(location.hash!=='#'+view)history[replace?'replaceState':'pushState'](null,'','#'+view);persist();render({focus:true});if(previousView!==view)taskEntrance();}
function prepareView(tab){S.tab=preparationOrder.includes(tab)?tab:'steps';S.work.task=S.tab==='fields'?'forms':S.tab;go('workspace');}
function openReviewGap(kind){
 const p=activePolicy();if(!p)return;
 let target,anchor;
 if(kind==='conditions'){
  go('analyze');
  target=app.querySelector(S.work.analysisStale?'[data-action="analyze"]':'.condition-list [data-followup]')||app.querySelector('.empty-analysis [data-action="analyze"]');
  anchor=target?.closest('.condition')||target;
 }else if(kind==='materials'){
  const missing=p.materials.find(material=>!S.work.checks[p.id]?.[material.id]);
  prepareView('materials');
  if(missing)target=app.querySelector('[data-material="'+CSS.escape(missing.id)+'"]');
  anchor=target?.closest('[data-material-row]')||target;
 }else if(kind==='fields'){
  const missing=p.formGuide?.fields?.find(field=>{const value=S.work.formDrafts[p.id]?.[field.id];return value===undefined||value===null||value==='';});
  prepareView('fields');
  if(missing)target=app.querySelector('[data-form-field="'+CSS.escape(missing.id)+'"]');
  anchor=target?.closest('.draft-field')||target;
 }else return;
 target?.focus({preventScroll:true});
 anchor?.scrollIntoView({block:'center',behavior:'instant'});
}
function dialog(title,html,options={}){clearFieldFocus();const node=openLayer(app,overlay,title,html,{animate:pointerInitiated,...options});decorateDisclosures(overlay,'dialog:'+title);if(!options.historyEntry)node.querySelector('input,textarea,button')?.focus({preventScroll:true});}
function closeDialog(options={}){S.expandedPolicyId=null;return closeLayer({animate:pointerInitiated,...options});}
function handleError(error){if(error.name==='AbortError')return;toast(error.message||'操作未完成，请重试。输入已保留。');}
async function search(){
  const question=S.query.trim(),serial=++searchSerial;
  searchController?.abort();
  if(!question){S.visible=[];S.discovery=null;S.searchMeta=null;S.hasSearched=false;S.searching=false;S.searchError='';persist();render();document.getElementById('query')?.focus();return;}
  searchController=new AbortController();S.searching=true;S.hasSearched=true;S.searchError='';S.visible=[];S.discovery=null;render();
  try{const data=await request('/discover',{method:'POST',body:{question},signal:searchController.signal});if(serial!==searchSerial)return;
    S.visible=data.items;S.discovery=data;S.editingQuery=false;S.searchMeta=data.meta||null;S.searchNotice='';
    const removed=S.work.selected.filter(id=>!data.items.some(p=>p.id===id));
    if(removed.length){localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));for(const id of removed)choosePolicy(id,false);S.searchNotice=`已移出本次候选之外的 ${removed.length} 项。之前的准备已备份，可在工作设置恢复。`;if(!S.work.selected.length){S.work.recordId=null;S.work.recordRevision=null;S.work.recordTitle='';}}
    if(S.work.question!==question)invalidateAnalysis();S.work.question=question;persist();const identified=regionsOf(question).find(r=>r!=='全国');if(identified&&!profileForWork().region){S.profileDraft.region=identified;S.profileDirty=true;laterPersist();setTimeout(()=>toast('已从问题中识别地区：'+identified+'，已暂存到企业档案；可在“企业资料”确认或修改。'),80);}
  }catch(e){if(e.name!=='AbortError'&&serial===searchSerial){S.searchError=e.message;S.visible=[];S.discovery=null;S.searchMeta=null;persist();}}
  finally{if(serial===searchSerial){S.searching=false;render();if(S.view==='radar'&&!S.searchError)taskEntrance();}}
}
async function analyze(){if(S.work.historical){refreshSources();return;}if(!S.work.selected.length){go('radar');toast('先选择要核对的事项');return;}if(S.busy.has('analyze'))return;const basis=analysisBasis(),serial=++analysisSerial,ids=[...S.work.selected],record=S.work.recordId;S.busy.add('analyze');render();try{const a=await request('/analyze',{method:'POST',body:{policyIds:ids,profile:profileForWork(),assessments:scopeAssessments(ids),task:'eligibility',question:S.work.question}});if(serial!==analysisSerial||basis!==analysisBasis()||record!==S.work.recordId){toast('资料已变更，已忽略先前核对结果；请重新核对。');return;}S.work.analysis=a;S.work.analysisBasis=basis;S.work.analysisStale=false;rememberSources();persist();if(['radar','analyze'].includes(S.view))go('analyze');else toast('当前事实已重新核对');}finally{S.busy.delete('analyze');render();}}
async function detail(id,trigger){
 const p=policyForWork(id)||S.policies.find(x=>x.id===id);if(!p)return;
 await finishLayerClose();S.expandedPolicyId=id;
 dialog(p.title,policyDetail(p),{kind:'policy-detail-dialog',historyEntry:true,trigger,origin:trigger.closest('.policy-card')});
}
async function scopeDialog(){await finishLayerClose();dialog('检索范围与资料覆盖',renderSearchScope(),{kind:'scope-dialog',historyEntry:true,trigger:document.activeElement});}
async function contextDialog(){const p=activePolicy();if(!p)return;await finishLayerClose();dialog(p.title,policyDetail(p,{context:true}),{kind:'policy-context-dialog',historyEntry:true,trigger:document.activeElement});}
async function aboutDialog(){await finishLayerClose();dialog('关于本演示',`<p><strong>这是一个展示原型。</strong>政策资料为 2026-10-10 核验的 6 条公开官方样本快照（龙岗 / 深圳 / 全国税惠），不是全量政策库；检索、条件核对与问答均为浏览器内的确定性模拟，不构成官方依据、资格判断或审批结论。</p><p>企业资料、草稿与过程记录只保存在本浏览器（localStorage），不上传任何服务器；换设备或清理缓存会丢失，请用“导出”备份。</p><p>提交前请以官方原文与当期申报指南为准：每条政策与条件都附有官方来源与留存快照链接，可在“官方来源”页逐一核对。</p><p>本项目由原站 <a href="https://radar.huixiang17.cn/" target="_blank" rel="noopener noreferrer">radar.huixiang17.cn</a> 的公开前端逆向优化而来，已在本地完整重写检索/核对/问答实现，运行时不依赖原站。</p>`);}
function followUp(id,cid){if(S.work.historical){refreshSources();return;}const p=policyForWork(id),c=p?.conditions?.find(c=>c.id===cid);if(!c)return;const a=S.work.assessments[id]?.[cid]||{};const basic=c.operator!=='manual'&&c.field;const fact=profileForWork()[c.field];dialog('补充这条条件的事实',`<h3>${esc(c.label)}</h3><p>${esc(c.question)}</p><div class="hint">${esc(c.periodRequirement||c.expectedPeriod||'按适用申报期间核对原始材料')}</div><form id="followup-form" data-policy="${esc(id)}" data-condition="${esc(cid)}">${basic?`<label class="field">${esc(fields[c.field]||c.field)}${numbers.includes(c.field)?`<input name="fact" type="number" min="0" step="any" value="${esc(fact??'')}">`:booleans.includes(c.field)?`<select name="fact"><option value="">未知</option><option value="true" ${fact===true?'selected':''}>是</option><option value="false" ${fact===false?'selected':''}>否</option></select>`:`<input name="fact" value="${esc(fact??'')}" maxlength="300">`}</label><label class="field">数据所属期间<input name="period" value="${esc(profileForWork().period||'')}" placeholder="${esc(c.expectedPeriod||'例如2025年度')}" maxlength="300"></label><p class="meta">这是本次任务内的基础事实，保存档案需要在企业档案中操作。</p>`:`<label class="field">是否满足这条具体要求？<select name="answer">${[['unknown','尚未确认 / 不清楚'],['yes','是，有资料说明'],['no','否，有资料说明']].map(([v,l])=>`<option value="${v}" ${v===(a.answer||'unknown')?'selected':''}>${l}</option>`).join('')}</select></label><label class="field">资料依据与具体数值 / 情况<textarea name="note" rows="4" maxlength="4000" placeholder="写真实金额、计算口径、材料名称与页码；不要用一句“已满足”代替。">${esc(a.note||'')}</textarea></label><label class="field">对应期间<input name="period" value="${esc(a.period||'')}" maxlength="300" placeholder="${esc(c.expectedPeriod||c.periodRequirement||'例如2025年度')}"></label>${!c.assessmentAllowed?'<div class="hint warning">这一条件涉及复合规则或专项审核，信息会保留为核验线索，不能转为确定资格。</div>':'<div class="hint">有具体依据和适用期间的单项自报可用于初筛，仍需证明材料核验。</div>'}`}<details><summary class="disclosure-summary"><span class="disclosure-label">官方规则依据</span>${icon('chevron','disclosure-chevron')}</summary><div class="disclosure-body"><p>${esc(c.evidence)}</p>${link(c.sourceUrl,'官方原文')}</div></details><div class="form-actions"><button class="btn" type="button" data-action="close">取消</button><button class="btn primary">保存并继续核对</button></div></form>`);}
function showSave(){if(!selected().length){toast('先选择要保存的事项');return;}const p=recordPayload();dialog(S.work.recordId?'更新这条准备过程':'保存准备过程',`<form id="save-form"><label class="field">记录名称<input name="title" value="${esc(p.title)}" required maxlength="200"></label><label class="field">实际进度<select name="status">${Object.entries(recStatus).map(([k,l])=>`<option value="${k}" ${p.status===k?'selected':''}>${l}</option>`).join('')}</select></label><p class="meta">提交与审核结果由你自行记录。保存包含材料、步骤、字段、问答与当时来源。</p>${S.work.analysis&&S.work.analysisStale?'<div class="hint warning">旧核对结果已过期，本次将保存资料与进度，待重新核对后再形成新判断。</div>':''}<div class="form-actions"><button class="btn" type="button" data-action="close">取消</button><button class="btn primary">${S.work.recordId?'更新过程':'保存过程'}</button></div></form>`);}
async function refreshRecords(){S.records=(await request('/records')).items;}
function exportWork(work=S.work,format='md'){const data={work,profile:profileForWork(),policies:S.policies};download('PolicyRadar-'+date(new Date().toISOString())+'.'+format,format==='json'?exportJson(data):exportMarkdown(data),format==='json'?'application/json;charset=utf-8':'text/markdown;charset=utf-8');toast('已导出含事实、字段和来源的准备记录');}
function switchRecord(r){restoreRecord(r);persist();go('workspace');toast('已打开当时的记录快照；当前申报前请重新核验。');}
async function openRecord(id){const r=S.records.find(x=>x.id===id);if(!r)return;if(S.work.selected.length&&S.work.recordId!==id){dialog('切换前，保存当前工作',`<p>当前浏览器缓冲会切换到“${esc(r.title)}”。可以先导出当前成果，再继续打开。</p><div class="button-row"><button class="btn" data-action="export">导出当前成果</button><button class="btn primary" data-switch-record="${esc(id)}">保留自动缓冲副本并切换</button><button class="btn" data-action="close">取消</button></div>`);return;}switchRecord(r);}
function refreshSources(){
 const timing=p=>`<p>${esc(windowCopy(p).label)}</p>${p.window?.open||p.window?.close?`<p class="meta">${p.window.open?'申请开始：'+date(p.window.open):''}${p.window.open&&p.window.close?' · ':''}${p.window.close?'截止：'+date(p.window.close):''}</p>`:''}${p.window?.note?`<p class="meta">${esc(p.window.note)}</p>`:''}`;
 const rule=p=>({active:'规则有效',unknown:'规则效力尚待确认',historical:'历史规则',expired:'规则已失效'})[p.policyStatus]||'规则效力请查官方原文';
 const changes=S.work.selected.map(id=>{
  const old=policyForWork(id),now=S.policies.find(p=>p.id===id),diff=policyChanges(old,now);
  const changedTiming=now&&(diff.includes('办理窗口')||diff.includes('办理状态'));
  const comparison=changedTiming?`<div class="source-change-pair"><div><strong>保存时</strong>${timing(old)}</div><div><strong>当前收录资料</strong>${timing(now)}</div></div>`:'';
  const changedRule=now&&diff.includes('规则效力')?`<p>规则效力：保存时为“${esc(rule(old))}”，当前为“${esc(rule(now))}”。</p>`:'';
  return `<li><strong>${esc(old?.title||id)}</strong><p>${diff.length?esc(diff.join('、'))+'有变化，请重新核对':'条件、材料、步骤、填写口径、窗口与版本均未发现变化'}</p>${comparison}${changedRule}</li>`;
 });
 dialog('比较记录与当前资料',`<ul class="source-change-list">${changes.join('')}</ul><p>使用当前资料后，旧版本仍可在记录版本中查看。只有要求未变的材料和步骤保留进度；原成果可以先导出。</p><div class="button-row"><button class="btn" data-action="export">导出原成果</button><button class="btn primary" data-action="confirm-refresh-sources">用当前资料重新核对</button><button class="btn" data-action="close">取消</button></div>`);
}

async function historyDialog(id){const d=await request('/records/'+id+'/history');dialog('记录的保存版本',`<p>最多保留最近20个版本。旧版本可独立查看与导出。</p><div class="version-list">${d.items.map(r=>`<div><strong>版本 ${r.revision} ${r.current?'· 当前':''}</strong><p>${esc(r.title)} · ${date(r.updatedAt)}</p><button class="btn" data-revision="${id}" data-number="${r.revision}">查看这次成果</button></div>`).join('')}</div>`);}
async function ask(question){if(!selected().length)return toast('先选择需要解释的事项');if(S.busy.has('assistant'))return;const ids=[activePolicy().id],task=S.work.task==='explain'?'explain':S.view==='workspace'?S.tab==='fields'?'forms':S.tab:'explain',serial=++chatSerial,basis=analysisBasis(),record=S.work.recordId;const at=new Date().toISOString();S.work.messages.push({role:'user',text:question,policyIds:ids,task,at});S.work.messages=S.work.messages.slice(-30);persist();S.busy.add('assistant');render();try{const d=await request('/assistant',{method:'POST',body:{question,policyIds:ids,profile:profileForWork(),assessments:scopeAssessments(ids),task}});if(serial!==chatSerial||basis!==analysisBasis()||record!==S.work.recordId)return toast('任务资料已变化，请在当前事项重新提问。');S.work.messages.push({role:'assistant',text:d.answer,evidence:d.evidence||[],policyIds:ids,task,at:d.generatedAt||new Date().toISOString()});S.work.messages=S.work.messages.slice(-30);persist();}catch(e){S.work.messages.push({role:'assistant',text:'本次请求未完成：'+e.message,policyIds:ids,task,at:new Date().toISOString()});persist();throw e;}finally{S.busy.delete('assistant');render();}}
async function saveProfile(profile){try{const d=await request('/profile',{method:'PUT',body:{profile,expectedRevision:S.profileRevision}});S.profile=d.profile;S.profileRevision=d.revision;S.profileDraft=clone(S.profile);S.profileDirty=false;if(!S.work.profileSnapshot)invalidateAnalysis();persist();render();toast('企业档案已保存到本浏览器');}catch(e){if(e.status===409){dialog('企业档案已在另一页面修改',`<p>你的编辑缓冲已保留。可以重载最新档案后继续编辑，或先导出本次任务事实。</p><div class="button-row"><button class="btn primary" data-action="reload-profile">读取最新档案</button><button class="btn" data-action="close">继续保留我的编辑</button></div>`);return;}throw e;}}
async function action(a,{pointer=false}={}){switch(a){case 'about':await aboutDialog();return;case 'search-scope':await scopeDialog();return;case 'policy-context':await contextDialog();return;case 'collapse-home':setHomeExpanded(false,{animate:pointer});document.querySelector('.home-heading h1')?.focus({preventScroll:true});return;case 'prep-next':case 'prep-skip':{const current=S.tab,next=preparationOrder[preparationOrder.indexOf(current)+1];if(next)prepareView(next);if(a==='prep-skip')toast('已略过这一步；未处理内容仍保留，未标记为完成。');return;}case 'menu':S.menuOpen=!S.menuOpen;render();if(S.menuOpen){document.querySelector('.top-menu .menu-item:not(:disabled)')?.focus();surfaceEntrance(document.querySelector('.top-menu'),'menu');}return;case 'edit-query':S.editingQuery=true;render();document.getElementById('query')?.focus();return;case 'start-task':{if(S.searching||S.searchError||!S.visible.some(p=>S.work.selected.includes(p.id))){toast('请先选择本次问题的相关政策。');return;}const task=S.discovery?.interpretation?.suggestedTask||'eligibility';if(task==='eligibility')await analyze();else{S.tab={materials:'materials',steps:'steps',forms:'fields',explain:'steps'}[task]||'steps';S.fieldIndex=0;S.work.task=task;S.assistantOpen=task==='explain';go('workspace');if(task==='explain')await ask(S.work.question);}return;}case 'continue-work':go(S.work.stage==='evaluate'?'analyze':'workspace');return;case 'all-conditions':S.showAllConditions=!S.showAllConditions;render();return;case 'assistant-toggle':S.assistantOpen=!S.assistantOpen;if(!S.assistantOpen&&S.work.task==='explain')S.work.task='steps';persist();render();if(S.assistantOpen){document.querySelector('.assistant')?.scrollIntoView({block:'start',behavior:'instant'});document.getElementById('assistant-question')?.focus({preventScroll:true});}return;case 'field-next':S.fieldIndex=Math.min(S.fieldIndex+1,(activePolicy()?.formGuide?.fields.length||1)-1);persist();render();document.querySelector('[data-form-field]')?.focus({preventScroll:true});return;case 'field-prev':S.fieldIndex=Math.max(S.fieldIndex-1,0);persist();render();document.querySelector('[data-form-field]')?.focus({preventScroll:true});return;case 'close':await closeDialog();return;case 'dismiss-restore':S.restored=false;render();return;case 'search':await search();return;case 'clear-search':S.query=S.region=S.category=S.applicationStatus='';await search();return;case 'clear-record-filters':S.recordQuery='';S.recordFilter='';render();document.getElementById('record-query')?.focus();return;case 'retry':await initialize(false);return;case 'analyze':await analyze();return;case 'save':showSave();return;case 'export':exportWork();return;case 'reviewed':S.work.lastReviewedAt=new Date().toISOString();S.work.stage='review';persist();render();toast('已记录本次自行复核时间');return;case 'refresh-sources':refreshSources();return;case 'confirm-refresh-sources':{const before=S.work.selected.map(policyForWork);S.work.historical=false;S.work.selected=S.work.selected.filter(id=>S.policies.some(p=>p.id===id));for(const p of selected()){const old=before.find(x=>x.id===p.id);S.work.checks[p.id]=Object.fromEntries(Object.entries(S.work.checks[p.id]||{}).filter(([id])=>p.materials.some(m=>m.id===id&&JSON.stringify(m)===JSON.stringify(old?.materials?.find(x=>x.id===id)))));const progress=S.work.steps[p.id]||{};S.work.steps[p.id]=Object.fromEntries(p.steps.map((step,i)=>{const prior=old?.steps?.findIndex(x=>JSON.stringify(x)===JSON.stringify(step));return ['step-'+i,prior>=0&&progress['step-'+prior]===true];}));}invalidateAnalysis();rememberSources();closeDialog();await analyze();return;}case 'compare':{const ps=selected();dialog('所选事项对照',`<p>并列比较适用对象、办理方式和缺口，不叠加不同项目金额。</p><div class="compare-grid">${ps.map(p=>`<article><h3>${esc(p.title)}</h3>${badge(p)}<p><strong>对象：</strong>${esc(p.audience)}</p><p><strong>支持：</strong>${esc(p.benefit)}</p><p>${esc(p.window?.note)}</p>${link(p.source?.url,'依据')}</article>`).join('')}</div><div class="form-actions"><button class="btn primary" data-action="analyze">逐项核对条件</button><button class="btn" data-action="close">关闭</button></div>`);return;}case 'recover-work':{const raw=localStorage.getItem(PREVIOUS_WORK_KEY);if(!raw)return toast('暂无上一任务缓冲');const old=JSON.parse(raw);dialog('恢复上一个任务缓冲',`<p>将恢复上一任务的选材、事实与准备成果，当前缓冲会先备份。</p><div class="button-row"><button class="btn primary" id="recover-confirm">备份并恢复</button><button class="btn" data-action="close">取消</button></div>`);document.getElementById('recover-confirm').onclick=()=>{localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));S.work={...S.work,...old};S.query=S.work.question||'';S.hasSearched=false;S.discovery=null;S.visible=[];++analysisSerial;++chatSerial;persist();closeDialog();go('workspace');};return;}case 'new-work':if(S.work.selected.length||S.work.question||S.work.notes)localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));++analysisSerial;++chatSerial;++searchSerial;searchController?.abort();S.searching=false;newWork();go('radar');toast('已开始新问题；上一任务可从工作设置恢复。');return;case 'confirm-new':localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));++analysisSerial;++chatSerial;newWork();closeDialog();go('radar');return;case 'feedback':dialog('保留问题与核实线索',`<form id="feedback-form"><label class="field">需要核实什么？<textarea name="comment" required maxlength="4000" rows="5" placeholder="写政策名称、条款、具体错误或未解决卡点。"></textarea></label><p class="meta">仅保存在本浏览器，便于自行核实；不会发送给运营方或改写官方依据。</p><div class="form-actions"><button class="btn" type="button" data-action="close">取消</button><button class="btn primary">保存反馈</button></div></form>`);return;case 'interfaces':dialog('后台接入与接口契约',`<p>真实大模型、企业数据、政策采集和消息服务均预留独立 adapter 接口；在线原型使用模拟助手。</p>${link('/openapi.json','查看 OpenAPI 契约','btn')}<p>前端通过同源 /api/v1 调用后台服务。浏览器保存、官方来源展示与模拟助手服务已接入；真实 API 可在对应 adapter 中接入。</p><button class="btn" data-action="close">关闭</button>`);return;case 'demo-profile':dialog('载入模拟企业资料',`<p>仅用于体验。模拟人员、收入、研发比例不代表任何真实企业，专项条件仍需补问。</p><div class="button-row"><button class="btn primary" data-action="confirm-demo">载入并保存模拟资料</button><button class="btn" data-action="close">取消</button></div>`);return;case 'confirm-demo':closeDialog();await saveProfile({companyName:'某龙岗研发企业（模拟）',region:'龙岗区',industry:'软件与技术服务',employees:40,revenue:800,rdRatio:5,ageYears:3,highTech:null,techSme:null,smallProfit:null,compliant:true,exporter:false,hasIp:true,period:'2025年度（模拟）',origin:'demo'});return;case 'clear-profile':dialog('清空本浏览器企业档案',`<p>当前基础档案将清空，任务与归档记录的独立快照保留。</p><div class="button-row"><button class="btn danger" data-action="confirm-clear">清空档案</button><button class="btn" data-action="close">取消</button></div>`);return;case 'confirm-clear':closeDialog();await saveProfile({});return;case 'reload-profile':{const d=await request('/profile');S.profile=d.profile;S.profileRevision=d.revision;S.profileDraft=clone(d.profile);S.profileDirty=false;closeDialog();persist();render();return;}}}
document.addEventListener('click',async e=>{const card=e.target.closest?.('.policy-card');if(card&&!e.target.closest('button,a,label,input,select,textarea,summary,details,[data-action],[data-detail]')){const cb=card.querySelector('[data-select]');if(cb){cb.checked=!cb.checked;cb.dispatchEvent(new Event('change',{bubbles:true}));return;}}const t=e.target.closest('button,[data-nav]');if(!t)return;try{if(t.dataset.gapAction){openReviewGap(t.dataset.gapAction);return;}if(t.dataset.nav){if(activeLayer())await closeDialog({restoreFocus:false});go(t.dataset.nav);return;}if(t.dataset.action){if(['analyze'].includes(t.dataset.action)&&overlay.innerHTML)await closeDialog();await action(t.dataset.action,{pointer:e.detail>0});return;}if(t.dataset.fillQuery){S.query=t.dataset.fillQuery;S.homeExpanded=true;const q=document.getElementById('query');if(q){q.value=S.query;setHomeExpanded(true,{animate:false});q.focus();}persist();return;}if(t.dataset.query){S.query=t.dataset.query;await search();return;}if(t.dataset.removePolicy){choosePolicy(t.dataset.removePolicy,false);persist();render();return;}if(t.dataset.activePolicy){S.work.activePolicyId=t.dataset.activePolicy;S.fieldIndex=0;S.showAllConditions=false;persist();render();return;}if(t.dataset.detail){await detail(t.dataset.detail,t);return;}if(t.dataset.detailClose){await closeDialog();return;}if(t.dataset.followup){followUp(t.dataset.followup,t.dataset.condition);return;}if(t.dataset.add){choosePolicy(t.dataset.add,true);S.work.activePolicyId=t.dataset.add;S.fieldIndex=0;S.showAllConditions=false;await closeDialog({restoreFocus:false});persist();await action('start-task');return;}if(t.dataset.work){choosePolicy(t.dataset.work,true);S.work.activePolicyId=t.dataset.work;S.fieldIndex=0;await closeDialog({restoreFocus:false});prepareView('steps');return;}if(t.dataset.tab){prepareView(t.dataset.tab);return;}if(t.dataset.ask){S.assistantOpen=true;await ask(t.dataset.ask);return;}if(t.dataset.openRecord){await openRecord(t.dataset.openRecord);return;}if(t.dataset.switchRecord){localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));const r=S.records.find(r=>r.id===t.dataset.switchRecord);closeDialog();switchRecord(r);return;}if(t.dataset.exportRecord){exportWork(S.records.find(r=>r.id===t.dataset.exportRecord));return;}if(t.dataset.history){await historyDialog(t.dataset.history);return;}if(t.dataset.revision){const d=await request('/records/'+t.dataset.revision+'/revisions/'+t.dataset.number);dialog('版本 '+t.dataset.number+' 的准备成果',`<p>${esc(d.record.title)} · ${date(d.record.updatedAt)}</p><p>此版本作为历史成果查看。恢复编辑将另存为新记录，避免覆盖当前版本。</p><div class="button-row"><button class="btn" id="export-revision">导出这个版本</button><button class="btn primary" id="restore-revision">备份当前并复制</button><button class="btn" data-action="close">关闭</button></div>`);document.getElementById('export-revision').onclick=()=>exportWork(d.record);document.getElementById('restore-revision').onclick=()=>{localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));const copy=clone(d.record);delete copy.id;copy.revision=null;copy.title+=' · 历史版本副本';closeDialog();switchRecord(copy);};return;}if(t.dataset.deleteRecord){const r=S.records.find(x=>x.id===t.dataset.deleteRecord);dialog('删除这条过程记录',`<p>${esc(r.title)}</p><p>记录及其历史版本将从本浏览器删除，当前工作缓冲和企业档案保留。</p><div class="button-row"><button class="btn danger" data-confirm-delete="${esc(r.id)}">删除记录与版本</button><button class="btn" data-action="close">取消</button></div>`);return;}if(t.dataset.confirmDelete){const r=S.records.find(x=>x.id===t.dataset.confirmDelete);await request('/records/'+r.id,{method:'DELETE',headers:{'If-Match':'"'+r.revision+'"'}});if(S.work.recordId===r.id){S.work.recordId=null;S.work.recordRevision=null;}await refreshRecords();closeDialog();persist();render();toast('记录及其版本已删除');return;}}catch(error){handleError(error);}});
document.addEventListener('pointerdown',e=>{if(e.target.closest('.home-composer'))setHomeExpanded(true,{animate:true});});
document.addEventListener('focusin',e=>{if(e.target.id==='query'&&e.target.closest('.home-stage'))setHomeExpanded(true,{animate:false});});
document.addEventListener('change',async e=>{const t=e.target;try{if(t.dataset.select){choosePolicy(t.dataset.select,t.checked);persist();render();return;}if(['filter-region','filter-category','filter-status'].includes(t.id)){S.region=document.getElementById('filter-region').value;S.category=document.getElementById('filter-category').value;S.applicationStatus=document.getElementById('filter-status').value;persist();await search();return;}if(t.id==='field-jump'){S.fieldIndex=Number(t.value);persist();render();return;}if(t.id==='active-policy'){S.work.activePolicyId=t.value;persist();render();return;}if(t.dataset.material){const p=activePolicy();S.work.checks[p.id]||={};S.work.checks[p.id][t.dataset.material]=t.checked;persist();t.closest('.check-row')?.classList.toggle('done',t.checked);const track=document.querySelector('.progress-track');const completed=p.materials.filter(m=>S.work.checks[p.id]?.[m.id]).length;if(track){track.setAttribute('aria-valuenow',completed);track.querySelector('span').style.width=(completed/p.materials.length*100)+'%';}const progress=document.getElementById('material-progress');const count=p.materials.filter(m=>S.work.checks[p.id]?.[m.id]).length;if(progress)progress.textContent=count+'/'+p.materials.length+' 已准备';const bar=document.getElementById('workspace-material-progress');if(bar)bar.textContent=count+'/'+p.materials.length+' 项材料已备';return;}if(t.dataset.step){const p=activePolicy();S.work.steps[p.id]||={};S.work.steps[p.id][t.dataset.step]=t.checked;persist();const row=t.closest('.step-row');if(row){setDisclosureOpen(row,!t.checked);row.classList.toggle('is-done',t.checked);row.dataset.stepState=t.checked?'done':'pending';const summary=row.querySelector(':scope > summary');summary?.setAttribute('aria-expanded',String(!t.checked));const number=row.querySelector('.step-number');if(number)number.innerHTML=t.checked?icon('check'):String(Number(t.dataset.step.slice(5))+1);const completion=row.querySelector('[data-step-completion]');if(completion)completion.textContent=t.checked?'已自行完成':'';if(t.checked)summary?.focus({preventScroll:true});}const progress=document.getElementById('step-progress');if(progress)progress.textContent=p.steps.filter((_,i)=>S.work.steps[p.id]?.['step-'+i]).length+'/'+p.steps.length+' 已完成';return;}if(t.id==='record-filter'){S.recordFilter=t.value;render();return;}}catch(error){handleError(error);}});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='query'){S.query=t.value;laterPersist();if((S.searching||!t.value.trim())&&(S.hasSearched||S.searching||S.searchError)){++searchSerial;searchController?.abort();S.searching=false;S.visible=[];S.discovery=null;S.searchMeta=null;S.hasSearched=false;S.editingQuery=false;S.searchError='';persist();render();}return;}if(t.id==='draft-text'){S.work.drafts[activePolicy().id]=t.value;laterPersist();}if(t.id==='notes-text'){S.work.notes=t.value;laterPersist();}if(t.dataset.formField){const p=activePolicy();S.work.formDrafts[p.id]||={};S.work.formDrafts[p.id][t.dataset.formField]=t.type==='number'?(t.value===''?null:Number(t.value)):t.value;laterPersist();const guide=p.formGuide;const count=guide.fields.filter(f=>S.work.formDrafts[p.id]?.[f.id]!==undefined&&S.work.formDrafts[p.id]?.[f.id]!==null&&S.work.formDrafts[p.id]?.[f.id]!=='').length;const progress=document.getElementById('field-progress');if(progress)progress.textContent='共 '+guide.fields.length+' 项 · 已填写 '+count+' 项';const status=document.querySelector('[data-field-status="'+CSS.escape(t.dataset.formField)+'"]');if(status)status.textContent=t.value!==''?'已保留在草稿':'尚未填写，可之后补充';updateDraftField(t);}if(t.closest('#profile-form')&&t.name){S.profileDraft[t.name]=t.value===''?null:booleans.includes(t.name)?t.value==='true':numbers.includes(t.name)?Number(t.value):t.value;S.profileDirty=true;laterPersist();}if(t.id==='record-query'){S.recordQuery=t.value;scheduleRender();}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,fd=new FormData(f),submit=f.querySelector('button:not([type]),button[type="submit"]');if(submit)submit.disabled=true;try{if(f.id==='search-form'){S.query=String(fd.get('q')||'').trim();await search();return;}if(f.id==='profile-form'){const p={...S.profileDraft};for(const[k,v]of fd){p[k]=v===''?null:booleans.includes(k)?v==='true':numbers.includes(k)?Number(v):v;}p.origin='user';await saveProfile(p);return;}if(f.id==='followup-form'){const id=f.dataset.policy,cid=f.dataset.condition,c=policyForWork(id).conditions.find(c=>c.id===cid);if(c.operator!=='manual'&&c.field){S.work.profileSnapshot=clone(profileForWork());const v=fd.get('fact');S.work.profileSnapshot[c.field]=v===''?null:numbers.includes(c.field)?Number(v):booleans.includes(c.field)?v==='true':v;S.work.profileSnapshot.period=String(fd.get('period')||'');delete S.work.assessments[id]?.[cid];}else{S.work.assessments[id]||={};S.work.assessments[id][cid]={answer:fd.get('answer'),note:String(fd.get('note')||''),period:String(fd.get('period')||''),source:'user'};}invalidateAnalysis();persist();closeDialog();await analyze();return;}if(f.id==='assistant-form'){const q=String(fd.get('question')||'').trim();if(q)await ask(q);return;}if(f.id==='save-form'){S.work.recordTitle=String(fd.get('title'));S.work.status=String(fd.get('status'));persist();const payload=recordPayload();try{const d=await request('/records'+(S.work.recordId?'/'+S.work.recordId:''),{method:S.work.recordId?'PATCH':'POST',body:{...payload,...(S.work.recordId?{expectedRevision:S.work.recordRevision}:{})}});S.work.recordId=d.record.id;S.work.recordRevision=d.record.revision;await refreshRecords();closeDialog();persist();render();toast('过程已保存 · 版本 '+d.record.revision);}catch(error){if(error.status===409){closeDialog();dialog('这条记录已在另一页面更新',`<p>你的输入已保留。可以另存为新记录，或先读取最新版本再决定如何合并。</p><div class="button-row"><button class="btn primary" id="save-conflict-copy">另存我的成果</button><button class="btn" id="load-conflict">读取最新版本</button><button class="btn" data-action="close">继续保留当前编辑</button></div>`);document.getElementById('save-conflict-copy').onclick=()=>{S.work.recordId=null;S.work.recordRevision=null;S.work.recordTitle+=' · 副本';persist();closeDialog();showSave();};document.getElementById('load-conflict').onclick=async()=>{localStorage.setItem(PREVIOUS_WORK_KEY,JSON.stringify(S.work));await refreshRecords();const r=S.records.find(r=>r.id===S.work.recordId);closeDialog();switchRecord(r);};return;}throw error;}return;}if(f.id==='feedback-form'){await request('/feedback',{method:'POST',body:{comment:String(fd.get('comment')),policyIds:S.work.selected,recordId:S.work.recordId||undefined}});S.feedback=(await request('/feedback')).items;closeDialog();render();toast('问题线索已保存在本浏览器，可在设置中查看');return;}}catch(error){handleError(error);}finally{if(submit?.isConnected)submit.disabled=false;}});
document.addEventListener('click',e=>{if(S.menuOpen&&!e.target.closest('.top-menu,.menu-trigger')){S.menuOpen=false;const menu=document.getElementById('top-menu');if(menu)menu.hidden=true;document.querySelector('.menu-trigger')?.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{
 const d=document.querySelector('.dialog');
 if(!d){
  if(e.target.id==='query'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();e.target.form?.requestSubmit();return;}
  if(e.key==='Escape'&&S.menuOpen){S.menuOpen=false;render();document.querySelector('.menu-trigger')?.focus();return;}
  const tab=e.target.closest('[role="tab"]');if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){const keys=['materials','steps','fields','review'],at=keys.indexOf(S.tab);S.tab=e.key==='Home'?keys[0]:e.key==='End'?keys.at(-1):keys[(at+(e.key==='ArrowRight'?1:3))%4];e.preventDefault();S.work.task=S.tab==='fields'?'forms':S.tab;S.work.stage=S.tab==='review'?'review':'prepare';persist();render();document.getElementById('tab-'+S.tab)?.focus();return;}
  if(S.menuOpen&&['ArrowDown','ArrowUp'].includes(e.key)){const nodes=[...document.querySelectorAll('.top-menu button:not(:disabled)')],at=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(at+(e.key==='ArrowDown'?1:nodes.length-1))%nodes.length]?.focus();}
  return;
 }
 if(e.key==='Escape'){e.preventDefault();closeDialog();}
 if(e.key==='Tab'){const nodes=[...d.querySelectorAll('a[href],button:not(:disabled),input,select,textarea,summary,[tabindex="0"]')].filter(x=>x.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===d)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===d)){e.preventDefault();first?.focus();}}
});
window.addEventListener('popstate',()=>{const view=location.hash.slice(1);if(handleLayerHistory()){S.expandedPolicyId=null;if(views[view]&&view!==S.view)go(view,{replace:true});return;}if(activeLayer())closeDialog({fromHistory:true,restoreFocus:false});if(views[view])go(view,{replace:true});});
overlay.addEventListener('click',e=>{if(e.target.matches('.modal-backdrop'))closeDialog();});
window.addEventListener('pagehide',persist);

window.addEventListener('storage',e=>{if(e.key===SESSION_KEY)toast('另一页面的工作缓冲有更新；当前输入继续保留，记录保存会检查版本冲突。');});
async function initialize(restore=true){try{
 // 改进：政策数据是唯一关键依赖；档案/记录/健康检查/来源/反馈任一失败只降级，不阻断启动。
 const data=await fetch('data/policies.json').then(r=>{if(!r.ok)throw new Error('政策资料读取失败');return r.json();});
 const results=await Promise.allSettled([request('/profile'),request('/records'),request('/health'),request('/sources'),request('/feedback')]);
 const [pr,rr,hr,sr,fr]=results.map(r=>r.status==='fulfilled'?r.value:null);
 const failures=results.filter(r=>r.status==='rejected').map(r=>r.reason?.message||'部分资料暂不可用');
 if(hr?.user?.id && hr.user.id!==document.querySelector('#app').dataset.storageScope)throw new Error('浏览器存储范围已变化，请刷新页面后继续。');
 S.dataset=data;S.policies=data.policies;S.visible=[];S.profile=pr?.profile||{};S.profileRevision=pr?.revision??0;S.records=rr?.items||[];S.health=hr;S.sources=sr?.items||[];S.feedback=fr?.items||[];if(!S.profileDirty)S.profileDraft=clone(S.profile);if(restore||!initialized)restoreSession();initialized=true;S.visible=S.hasSearched?(S.discovery?.items||[]).map(item=>{const p=S.policies.find(p=>p.id===item.id);return p?{...p,retrieval:item.retrieval}:null;}).filter(Boolean):[];const view=location.hash.slice(1);if(views[view])S.view=view;else S.view='radar';S.error=failures.length?failures[0]:null;render();if(S.view==='radar'&&S.hasSearched&&S.query.trim())await search();}catch(error){S.error=error.message;render();}}
await initialize();

