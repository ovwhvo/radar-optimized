import {S,selected,activePolicy} from './state.js';
import {esc,icon} from './utils.js';

export function home(){
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
export function setHomeExpanded(expanded,{animate=false}={}){
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
