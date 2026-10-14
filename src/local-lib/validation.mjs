export class HttpError extends Error {
  constructor(status,code,message,details) { super(message); this.status=status; this.code=code; if (details) this.details=details; }
}
export const fail=(message,status=400,code='INVALID_REQUEST')=>{throw new HttpError(status,code,message);};
export function object(value,label='请求体') {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key=>['__proto__','constructor','prototype'].includes(key))) fail(`${label}必须是普通 JSON 对象。`);
  return value;
}
export function string(value,label,max=2000,allowEmpty=true) {
  if (typeof value !== 'string' || value.length>max || (!allowEmpty && !value.trim())) fail(`${label}必须是长度不超过 ${max} 的${allowEmpty?'':'非空'}字符串。`);
  return value.trim();
}
const numeric=new Set(['employees','revenue','rdRatio','ageYears']);
const boolean=new Set(['highTech','techSme','smallProfit','compliant','exporter','hasIp']);
const textual=new Set(['companyName','region','industry','period']);
export function validateProfile(input) {
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
export function ids(input,label='policyIds',optional=true) {
  if (input===undefined&&optional) return [];
  if (!Array.isArray(input)||input.length>32||input.some(id=>typeof id!=='string'||!idPattern.test(id))) fail(`${label}必须是最多 32 个有效 ID 的数组。`);
  return [...new Set(input)];
}
function allowedKeys(value,keys,label) {object(value,label);for(const key of Object.keys(value)) if(!keys.includes(key)) fail(`${label}不支持字段：${key}`);}
function boundedMap(value,label,limit,visit) {
  object(value,label);if(Object.keys(value).length>limit) fail(`${label}条目不得超过 ${limit}。`);
  for(const [key,item] of Object.entries(value)) {validId(key,`${label}键`);visit(item,`${label}.${key}`);}return value;
}
export function validateAssessments(input={}) {
  return boundedMap(input,'assessments',32,(conditions,label)=>boundedMap(conditions,label,100,(assessment,name)=>{
    allowedKeys(assessment,['answer','note','period','source'],name);
    if(!['yes','no','unknown'].includes(assessment.answer)) fail(`${name}.answer 必须为 yes/no/unknown。`);
    if(assessment.note!==undefined) string(assessment.note,name+'.note',4000);
    if(assessment.period!==undefined) string(assessment.period,name+'.period',300);
    if(assessment.source!=='user') fail(`${name}.source 必须为 user；用户自报不代表官方审核。`);
  }));
}
export function validateAssessmentScope(assessments,policies,selectedIds) {
  for(const [policyId,answers] of Object.entries(assessments)) {
    const policy=policies.find(p=>p.id===policyId);
    if(!policy||!selectedIds.includes(policyId)) fail('专项回答只能属于所选政策。',400,'ASSESSMENT_SCOPE_INVALID');
    for(const id of Object.keys(answers)) if(!(policy.conditions??[]).some(c=>c.id===id||c.conditionId===id)) fail('专项回答的条件 ID 不存在。',400,'ASSESSMENT_CONDITION_INVALID');
  }
}
export function analyzeInput(input) {
  allowedKeys(input,['policyIds','profile','assessments','task','question'],'分析请求');return {policyIds:ids(input.policyIds),profile:validateProfile(input.profile??{}),assessments:validateAssessments(input.assessments??{}),task:input.task===undefined?'eligibility':string(input.task,'task',100),question:input.question===undefined?'':string(input.question,'question',4000)};
}
export function discoverInput(input) {
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
export function validateRecord(input) {
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
export function expectedRevision(value) {if(!Number.isInteger(value)||value<0) fail('expectedRevision需为非负整数。');return value;}
export const writableRecord = record => Object.fromEntries(Object.entries(record).filter(([key])=>recordFields.has(key)));
