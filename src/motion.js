// motion.js —— GSAP 动效层（gsap-core skill：from 入场、stagger、matchMedia 静音）
// 突出重点：候选卡片阶梯入场、核对数字滚动、选中态脉冲、浮条滑入。
const g = () => window.gsap || null;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function enhance(root) {
  const gsap = g();
  if (!gsap || !root || reduced()) return;
  // 候选卡片：阶梯入场（重点内容首屏聚焦）
  const cards = root.querySelectorAll('.policy-card');
  if (cards.length) gsap.from(cards, { y: 18, opacity: 0, duration: 0.38, stagger: 0.06, ease: 'power2.out', clearProps: 'transform,opacity' });
  // 底部行动条：滑入（提示“下一步在这里”）
  const bar = root.querySelector('.stage-actions');
  if (bar) gsap.from(bar, { y: 26, opacity: 0, duration: 0.32, ease: 'power3.out', clearProps: 'transform,opacity' });
  // 核对结论卡：轻弹入场
  const focus = root.querySelector('.focus-overview');
  if (focus) gsap.from(focus, { y: 14, opacity: 0, scale: 0.985, duration: 0.4, ease: 'back.out(1.4)', clearProps: 'transform,opacity' });
  // 四色统计数字：滚动到位（凸显能不能申）
  root.querySelectorAll('.counts strong').forEach(el => {
    const to = Number(el.textContent) || 0;
    if (!to) return;
    gsap.fromTo(el, { textContent: 0 }, {
      textContent: to, duration: 0.6, ease: 'power1.out',
      snap: { textContent: 1 }, clearProps: 'textContent'
    });
  });
  // 条件行：短距淡入
  const rows = root.querySelectorAll('.condition-list .condition, .check-row');
  if (rows.length) gsap.from(rows, { y: 10, opacity: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' });
}

export function pop(el) {
  const gsap = g();
  if (!gsap || !el || reduced()) return;
  gsap.fromTo(el, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(2)', clearProps: 'transform,opacity' });
}
