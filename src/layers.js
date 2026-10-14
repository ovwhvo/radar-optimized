// Reading layers preserve the exact task, scroll position and invoking control.
import {esc,icon} from './utils.js';
let current=null,historyClose=null,serial=0;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease=()=>getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
export const activeLayer=()=>current;
export async function finishLayerClose(){await Promise.all([historyClose?.promise,current?.closing].filter(Boolean));}
export function openLayer(app,overlay,title,html,{kind='',historyEntry=false,trigger=document.activeElement,origin=null,animate=false}={}){
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
export function closeLayer({fromHistory=false,animate=false,restoreFocus=true}={}){
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
export function handleLayerHistory(){
 if(historyClose){const pending=historyClose;historyClose=null;pending.resolve();return true;}
 if(current?.historyEntry&&history.state?.policyRadarLayer!==current.token){closeLayer({fromHistory:true});return true;}
 if(history.state?.policyRadarLayer&&!current){const state={...history.state};delete state.policyRadarLayer;history.replaceState(state,'',location.href);return true;}
 return false;
}
