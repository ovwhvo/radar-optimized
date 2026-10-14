import {S} from './state.js';
import {esc,link,date,icon,siteUrl} from './utils.js';
import {windowCopy} from './presentation.js';

export function renderPolicyDetails(p,{context=false}={}){
 const time=windowCopy(p);
 return `<div class="policy-reading-content"><section class="reading-overview"><span class="eyebrow">${esc(p.region)} · 支持内容</span><p>${esc(p.benefit)}</p><div class="reading-time ${time.kind}">${icon('clock')}<span>${esc(time.label)}</span></div></section><div class="reading-sections"><section><h3>政策概要</h3><p>${esc(p.summary)}</p></section><section><h3>适用对象</h3><p>${esc(p.audience)}</p><p class="meta">具体资格需要结合企业事实和正式材料核对。</p></section><section><h3>办理时间与状态</h3><p>${esc(time.detail)}</p>${p.window?.note?`<p>${esc(p.window.note)}</p>`:''}</section><section class="reading-source"><h3>官方依据与版本</h3><p>${esc(p.authority)}</p><p class="meta">${esc(p.version)} · 发布 ${date(p.publishedAt)} · 核验 ${date(p.verifiedAt)}</p><p class="meta">核验日期表示资料检查时间，不代表实时办理系统状态。</p><div class="button-row">${link(p.source?.url,'官方原文','btn')}${p.source?.snapshotPath?link(siteUrl('/'+p.source.snapshotPath),'留存原文快照','btn'):''}</div></section></div>${context?'<div class="reading-actions"><button class="btn" data-action="close">返回当前步骤</button></div>':`<div class="reading-actions"><button class="btn" data-action="close">返回政策列表</button><button class="btn primary" data-add="${esc(p.id)}">选择并继续 ${icon('arrow')}</button></div>`}</div>`;
}

export function renderSearchScope(){
 const d=S.discovery,interpretation=d?.interpretation;
 const regions=[...new Set(S.policies.map(p=>p.region))];
 const categories=[...new Set(S.policies.map(p=>p.category))];
 return `<section class="reading-overview scope-overview"><span class="eyebrow">本次检索 · 有限样本</span><div class="scope-stat"><strong>${S.visible.length}<small>项相关候选</small></strong><span>来自当前收录的 <b>${S.policies.length}</b> 项政策样本</span></div><p>未收录不代表现实中不存在，也不代表你的企业不符合政策。</p></section><div class="reading-sections scope-sections"><section><h3>目前覆盖哪些资料</h3><p>${esc(S.dataset.coverage||regions.join('、'))}</p><dl class="scope-facts"><div><dt>政策区域</dt><dd>${esc(regions.join('、'))}</dd></div><div><dt>政策分类</dt><dd>${esc(categories.join('、'))}</dd></div><div><dt>官方资料</dt><dd>${S.sources.length} 份 · 核验 ${date(S.dataset.verifiedAt)}</dd></div></dl></section><section><h3>这次怎样理解你的问题</h3><p>${d?.meta?.modelUsed===true?'本次需求理解使用模型服务。':'本次使用模拟需求理解，未调用真实大模型。'}候选依据当前收录的官方资料筛选，适用条件需另行核对。</p>${interpretation?.excludedTerms?.length?`<p><strong>本次排除：</strong>${esc(interpretation.excludedTerms.join('、'))}</p>`:''}${interpretation?.unresolvedTerms?.length?`<p><strong>尚待识别：</strong>${esc(interpretation.unresolvedTerms.join('、'))}</p>`:''}</section></div><div class="reading-actions"><button class="btn" data-action="close">返回检索结果</button><button class="btn primary" data-nav="sources">查看官方来源 ${icon('arrow')}</button></div>`;
}
