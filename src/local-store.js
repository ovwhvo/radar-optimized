import { HttpError, fail, object, string, ids, validateProfile, validateRecord, validateAssessmentScope, expectedRevision, writableRecord } from './local-lib/validation.mjs';

// Private data stays in one atomic localStorage document on this browser/origin.
// There is no fallback that sends profiles, records or feedback to the server.
export const STORAGE_SCOPE = 'policyradar.selfhost.demo.v1';
export const STORE_KEY = STORAGE_SCOPE + '.store.v1';
export const MAX_RECORD_BYTES = 384 * 1024;
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

export class BrowserStoreError extends HttpError {
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
export function handlesLocal(endpoint) {
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
export function createBrowserStore({storage, lock, dataset, loadDataset, now = timestamp, newId = uuid} = {}) {
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
export const localRequest = (endpoint, options = {}) => defaultStore.request(endpoint, options);
