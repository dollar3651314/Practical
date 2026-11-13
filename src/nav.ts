/**
 * 三块东西之间的菜单（盲听卡 / 发音训练 / 句子训练）。
 *
 * 2026-11-12 发音训练和 S2 上了生产，但**首页一个链接都没有** —— 除了手打网址没法到达。
 * Amos 当场问：「practical 菜单下 为什么没有」。这是漏的，不是设计。
 * （他说过：「不要让我思考 不要让我自己组装 你要带着我做 把用户当成小白」）
 *
 * 规矩：
 *  - 盲听卡那边**只放在首屏**（`#s-home` 里），题目区一个字都不许多（《项目地图》约定 1）。
 *  - 这里只有链接，没有脚本、不发请求、不花钱。
 */
export interface 去处 { 路径: string; 名: string; 说: string }

export const 菜单: 去处[] = [
  { 路径: '/', 名: '盲听卡', 说: '听 2 秒，四选一' },
  { 路径: '/pron', 名: '发音训练', 说: 'S1 · 七组易错音' },
  { 路径: '/s2', 名: '句子训练', 说: 'S2 · 13 课语法' },
];

export const NAV_CSS = `
.nav{display:flex;gap:8px;flex-wrap:wrap;max-width:560px;margin:0 auto 16px}
.nav a{flex:1 1 150px;min-width:0;display:block;text-decoration:none;padding:10px 12px;border-radius:11px;
  border:1px solid var(--nav-line,#dfe3ea);background:var(--nav-bg,#fff);color:inherit;min-height:56px}
.nav a b{display:block;font-size:15px;font-weight:600}
.nav a span{display:block;font-size:11.5px;opacity:.7;margin-top:2px}
.nav a[aria-current="page"]{border-color:var(--nav-now,#1d4ed8);color:var(--nav-now,#1d4ed8)}
@media (prefers-color-scheme:dark){.nav a{--nav-line:#2a2f3a;--nav-bg:#171a21;--nav-now:#7ea2ff}}
`;

/** 这一页的菜单。`这里` 是当前路径，会标上 aria-current 并且不再可点自己。 */
export const navHtml = (这里: string): string =>
  `<nav class="nav" aria-label="换一块练">` +
  菜单.map((d) => (d.路径 === 这里
    ? `<a href="${d.路径}" aria-current="page"><b>${d.名}</b><span>${d.说}</span></a>`
    : `<a href="${d.路径}"><b>${d.名}</b><span>${d.说}</span></a>`)).join('') +
  `</nav>`;
