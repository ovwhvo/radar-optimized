import {S} from './state.js';
import {esc,link,icon,siteUrl} from './utils.js';

const hasValue = value => value !== undefined && value !== null && value !== '';
const options = (items,value) => items.map(([key,label]) => `<option value="${esc(key)}" ${key===value?'selected':''}>${esc(label)}</option>`).join('');

export function renderMaterials(p) {
 const done=p.materials.filter(material=>S.work.checks[p.id]?.[material.id]).length;
 return `<div class="section-heading"><div><h2>需要准备的材料</h2><p>准备要求直接列在材料下方。备好后勾选，可随时取消。</p></div><span id="material-progress">${done}/${p.materials.length} 已准备</span></div><div class="progress-track" role="progressbar" aria-label="材料准备进度" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${p.materials.length}"><span style="width:${p.materials.length?done/p.materials.length*100:0}%"></span></div><p class="material-scope-note">这里只记录准备进度，不会向部门提交。</p>${p.materials.map(material=>`<div class="check-row material-row ${S.work.checks[p.id]?.[material.id]?'done':''}" data-material-row="${esc(p.id)}-${esc(material.id)}"><label><input type="checkbox" data-material="${esc(material.id)}" ${S.work.checks[p.id]?.[material.id]?'checked':''}><strong>${esc(material.name)}</strong><span class="material-done-label">${icon('check')}已备好</span></label><div class="material-requirement"><p>${esc(material.note)}</p>${material.verified?'':'<span class="material-unverified">完整要求仍需向官方确认</span>'}${link(material.sourceUrl,'官方材料依据')}</div></div>`).join('')}<div class="panel-tail">${(p.formGuide?.localTemplatePath||p.formGuide?.snapshotPath)?link(siteUrl('/'+(p.formGuide.localTemplatePath||p.formGuide.snapshotPath)),'查看官方附件','text-link'):''}</div>`;
}

function fieldControl(field,value) {
 const attributes=`id="form-${esc(field.id)}" data-form-field="${esc(field.id)}" aria-describedby="help-${esc(field.id)} evidence-${esc(field.id)}"`;
 if(field.type==='textarea')return `<textarea ${attributes} rows="3" maxlength="8000">${esc(value)}</textarea>`;
 if(field.type==='select'&&field.options)return `<select ${attributes}><option value="">不清楚 / 待填</option>${options(field.options.map(option=>typeof option==='string'?[option,option]:[option.value,option.label]),value)}</select>`;
 return `<input ${attributes} type="${field.type==='number'?'number':'text'}" ${field.type==='number'?'step="any" min="0"':''} value="${esc(value)}" maxlength="8000">`;
}

export function renderFormGuide(p) {
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

export function clearFieldFocus({blur=false}={}) {
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

export function updateDraftField(input) {
 const field=input.closest('.draft-field');
 if(!field)return;
 // The string "0" is filled; an empty number input remains pending.
 const complete=hasValue(input.value);
 field.classList.toggle('is-filled',complete);
 const status=field.querySelector('[data-field-status]');
 if(status)status.textContent=complete?'已保留在草稿':'尚未填写，可之后补充';
 queuePlacement();
}

export function installFieldFocus(root) {
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
