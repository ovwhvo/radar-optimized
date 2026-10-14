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
export const HANDLED = ['/health', '/sources', '/discover', '/analyze', '/assistant'];
// 供应用层复用：从问题中识别地区（I1 信息复用）。
export function regionsOf(question) { return detectRegions(String(question ?? '')); }
// 当前样本的覆盖范围（F2 前置拦截）：全部政策的 region 取值集合。
const COVERED_REGIONS = new Set(['深圳市', '龙岗区', '南山区', '福田区', '宝安区', '龙华区', '坪山区', '光明区', '大鹏新区', '深汕特别合作区', '全国']);
export function handlesLocalApi(endpoint) {
  return typeof endpoint === 'string' && HANDLED.includes(endpoint.split('?')[0]);
}
export async function localApiRequest(endpoint, options = {}) {
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
