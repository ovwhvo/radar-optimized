// motion.js —— GSAP 动效层（gsap-core skill：from 入场、stagger、matchMedia 静音）
// 突出重点：候选卡片阶梯入场、核对数字滚动、选中态脉冲、浮条滑入。
const g = () => window.gsap || null;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function enhance(root) {
  const gsap = g();
  if (!gsap || !root || reduced()) return;
  // 雷达扫描线：常驻缓慢摆动（主题动效，只起一次）
  const sweep = root.querySelector('.radar-sweep');
  if (sweep && !sweep._tween) {
    sweep._tween = gsap.fromTo(sweep, { rotation: -26 }, {
      rotation: 16, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1,
      transformOrigin: 'right center'
    });
  }
  // 候选卡片：大幅阶梯入场（重点内容首屏聚焦）
  const cards = root.querySelectorAll('.policy-card');
  if (cards.length) gsap.from(cards, { y: 30, opacity: 0, scale: 0.97, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity,scale' });
  // 底部行动条：滑入（提示"下一步在这里"）
  const bar = root.querySelector('.stage-actions');
  if (bar) gsap.from(bar, { y: 40, opacity: 0, duration: 0.4, ease: 'back.out(1.2)', clearProps: 'transform,opacity' });
  // 核对结论卡：弹入
  const focus = root.querySelector('.focus-overview');
  if (focus) gsap.from(focus, { y: 20, opacity: 0, scale: 0.97, duration: 0.5, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
  // 四色统计数字：滚动到位（凸显能不能申）
  root.querySelectorAll('.counts strong').forEach(el => {
    const to = Number(el.textContent) || 0;
    if (!to) return;
    gsap.fromTo(el, { textContent: 0 }, {
      textContent: to, duration: 0.7, ease: 'power2.out',
      snap: { textContent: 1 }, clearProps: 'textContent'
    });
  });
  // 条件行：短距淡入
  const rows = root.querySelectorAll('.condition-list .condition, .check-row');
  if (rows.length) gsap.from(rows, { y: 14, opacity: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'transform,opacity' });
  // 选中徽章：弹一下
  const badge = root.querySelector('.policy-card.selected .check-select');
  if (badge) gsap.fromTo(badge, { scale: 0.9 }, { scale: 1, duration: 0.25, ease: 'back.out(2.4)', clearProps: 'transform' });
}

export function pop(el) {
  const gsap = g();
  if (!gsap || !el || reduced()) return;
  gsap.fromTo(el, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(2)', clearProps: 'transform,opacity' });
}
