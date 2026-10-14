import {windowCopy} from './presentation.js';
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

export function exportArchive(input={}) {
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
export const exportJson = input => JSON.stringify(exportArchive(input),null,2)+'\n';

export function exportMarkdown(input={}) {
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

