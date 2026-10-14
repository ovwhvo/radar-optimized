// 本地 API 等价性测试：对拍 tests/reference/ 中原站 2026-10-14 捕获的响应。
// 由 tests/api-equivalence.html 加载（外部模块，符合 CSP script-src 'self'）。
import { localApiRequest } from './local-api.js';

const out = document.getElementById('out');
const results = { pass: 0, fail: [], warn: [] };
const log = (cls, msg) => {
  const line = document.createElement('div');
  line.className = cls; line.textContent = msg;
  out.appendChild(line);
};
function assertEq(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { results.pass++; log('pass', `PASS ${name}`); }
  else { results.fail.push(name); log('fail', `FAIL ${name}\n    got:  ${String(g).slice(0, 400)}\n    want: ${String(w).slice(0, 400)}`); }
}
function assertSoft(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { results.pass++; log('pass', `PASS ${name}`); }
  else { results.warn.push(name); log('warn', `WARN ${name}（软断言）\n    got:  ${String(g).slice(0, 200)}\n    want: ${String(w).slice(0, 200)}`); }
}
const ref = async name => (await fetch(`reference/${name}`, { cache: 'no-store' })).json();
// 注意：各参考捕获时的档案字段有差异（companyName/industry），指纹断言必须逐参考还原。
const P = over => ({ companyName: '深圳测试', region: '深圳市龙岗区', industry: '软件和信息技术服务业', employees: 50, revenue: 800, rdRatio: 8, ageYears: 6, highTech: true, techSme: true, smallProfit: true, compliant: true, exporter: false, hasIp: true, period: '2025年度', ...over });
const profileFull = P({});                                  // analyze-hightech-full
const profileSingle = P({ companyName: '深圳测试科技有限公司' }); // analyze-single
const profileSoft = P({ industry: '软件' });                 // analyze-assessed / analyze-techsme-full
const profileEmpty = { companyName: null, region: null, industry: null, employees: null, revenue: null, rdRatio: null, ageYears: null, highTech: null, techSme: null, smallProfit: null, compliant: null, exporter: null, hasIp: null, period: null };
const profileMismatch = P({ companyName: '长沙测试', region: '湖南省长沙市', industry: '软件', highTech: false, hasIp: false });

try {
  const h = await localApiRequest('/health');
  assertEq('health.status', h.status, 'ok');
  assertEq('health.user 不存在（与原站一致）', 'user' in h, false);

  const s = await localApiRequest('/sources');
  const sRef = await ref('sources.json');
  assertEq('sources items 数量', s.items.length, sRef.items.length);
  assertEq('sources 逐项一致', s.items, sRef.items);

  const discovers = [
    ['我们在龙岗做软件研发，想了解研发投入扶持', 'discover-live.json'],
    ['深圳企业做技术开发，技术合同该怎么登记？', 'discover-q1.json'],
    ['我们是科技型中小企业，想申请高新技术企业认定', 'discover-q2.json'],
    ['小微企业想少交一点企业所得税', 'discover-q3.json']
  ];
  for (const [q, file] of discovers) {
    const got = await localApiRequest('/discover', { method: 'POST', body: { question: q } });
    const want = await ref(file);
    assertEq(`discover[${file}] items 顺序`, got.items.map(i => i.id), want.items.map(i => i.id));
    assertEq(`discover[${file}] status`, got.interpretation.status, want.interpretation.status);
    assertEq(`discover[${file}] suggestedTask`, got.interpretation.suggestedTask, want.interpretation.suggestedTask);
    assertEq(`discover[${file}] region`, got.interpretation.region, want.interpretation.region);
    assertSoft(`discover[${file}] topics`, got.interpretation.topics.map(t => t.id), want.interpretation.topics.map(t => t.id));
    assertSoft(`discover[${file}] unresolvedTerms`, got.interpretation.unresolvedTerms, want.interpretation.unresolvedTerms);
  }
  const clarify = await localApiRequest('/discover', { method: 'POST', body: { question: '????????' } });
  assertEq('discover 乱码问题 → needs_clarification', clarify.interpretation.status, 'needs_clarification');

  const analyzes = [
    ['analyze-single.json', ['lg-rd-investment-2026'], profileSingle, {}],
    ['analyze-assessed.json', ['lg-rd-investment-2026'], profileSoft, { 'lg-rd-investment-2026': { 'lg-region': { answer: 'yes', note: '租赁合同与水电费单据', period: '2025年度', source: 'user' }, 'lg-rd-amount': { answer: 'no', note: '审计报告研发投入200万元', period: '2025年度', source: 'user' }, 'lg-qualification': { answer: 'unknown', note: '', period: '', source: 'user' } } }],
    ['analyze-empty.json', ['lg-rd-investment-2026', 'national-rd-tax-2023'], profileEmpty, {}],
    ['analyze-hightech-full.json', ['sz-hightech-recognition-2026'], profileFull, {}],
    ['analyze-hightech-empty.json', ['sz-hightech-recognition-2026'], profileEmpty, {}],
    ['analyze-hightech-mismatch.json', ['sz-hightech-recognition-2026'], profileMismatch, {}],
    ['analyze-techsme-full.json', ['sz-techsme-evaluation-2026'], profileSoft, {}]
  ];
  for (const [file, policyIds, profile, assessments] of analyzes) {
    const got = await localApiRequest('/analyze', { method: 'POST', body: { policyIds, profile, assessments, task: 'eligibility', question: '核对' } });
    const want = await ref(file);
    assertEq(`analyze[${file}] inputFingerprint`, got.inputFingerprint, want.inputFingerprint);
    assertEq(`analyze[${file}] assessmentsFingerprint`, got.assessmentsFingerprint, want.assessmentsFingerprint);
    assertEq(`analyze[${file}] counts`, got.results.map(r => r.counts), want.results.map(r => r.counts));
    assertEq(`analyze[${file}] summary`, got.results.map(r => r.summary), want.results.map(r => r.summary));
    assertEq(`analyze[${file}] nextSteps`, got.results.map(r => r.nextSteps), want.results.map(r => r.nextSteps));
    assertEq(`analyze[${file}] missingFields`, got.results.map(r => r.missingFields), want.results.map(r => r.missingFields));
    assertEq(`analyze[${file}] window`, got.results.map(r => r.window), want.results.map(r => r.window));
    for (let i = 0; i < want.results.length; i++) {
      const gc = got.results[i].conditions, wc = want.results[i].conditions;
      assertEq(`analyze[${file}] #${i} 条件数`, gc.length, wc.length);
      for (let j = 0; j < wc.length; j++) {
        for (const key of ['status', 'fact', 'reason', 'evidenceOrigin', 'periodRequired', 'expectedPeriod', 'assessmentAllowed', 'missingFields', 'requiredInput', 'assessment']) {
          assertEq(`analyze[${file}] ${wc[j].conditionId}.${key}`, gc[j][key], wc[j][key]);
        }
      }
      assertSoft(`analyze[${file}] #${i} followUp 数量`, got.results[i].followUpQuestions.length, want.results[i].followUpQuestions.length);
    }
  }

  const ex = await localApiRequest('/assistant', { method: 'POST', body: { question: '这项政策怎么解释？', policyIds: ['lg-rd-investment-2026'], profile: profileFull, assessments: {}, task: 'explain' } });
  const exRef = await ref('assistant-explain.json');
  assertEq('assistant[explain] answer', ex.answer, exRef.answer);
  assertEq('assistant[explain] evidence', ex.evidence, exRef.evidence);
  assertEq('assistant[explain] limitations', ex.limitations, exRef.limitations);
  const un = await localApiRequest('/assistant', { method: 'POST', body: { question: '政策核对', policyIds: ['lg-rd-investment-2026'], profile: profileFull, assessments: {}, task: 'eligibility' } });
  assertEq('assistant[unsupported] answer', un.answer, (await ref('assistant.json')).answer);
  assertEq('assistant[unsupported] task', un.task, 'unsupported');
} catch (e) {
  results.fail.push('EXCEPTION'); log('fail', '异常: ' + (e && e.stack || e));
}

log(results.fail.length ? 'fail' : 'pass', `PASS=${results.pass}  FAIL=${results.fail.length}  WARN=${results.warn.length}`);
document.title = results.fail.length ? `FAIL ${results.fail.length}` : 'ALL PASS';
document.getElementById('VERIFY').textContent =
  `VERIFY :: pass=${results.pass};fail=${results.fail.length};warn=${results.warn.length};` +
  (results.fail.length ? `failed=${results.fail.slice(0, 10).join('|')}` : 'all-green');
