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

export function decorateDisclosures(root, context = activeContext) {
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
export function setDisclosureOpen(details, desired, {animate = false} = {}) {
  setDisclosure(details, desired, animate);
}

export function captureInteractions(root) {
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

export function restoreInteractions(root, context, previous = [], workScope = '') {
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

export function toggleInlinePanel(panel, desired, {finish, animate = pointerMode && !reduced()} = {}) {
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
