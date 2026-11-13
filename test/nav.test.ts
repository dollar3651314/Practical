/**
 * 三块东西之间能不能互相走到（盲听卡 / 发音训练 / 句子训练）。
 *
 * 为什么有这个文件：2026-11-12 发音训练和 S2 上了生产，**首页一个链接都没有** ——
 * 除了手打网址没法到达。测试全绿、e2e 全绿、线上内容也核过，就是没人问过
 * 「他怎么走到那一页」。Amos 当场问：「practical 菜单下 为什么没有」。
 *
 * 所以这里守的是一件别的测试都没守的事：**上线的东西要有人能走到。**
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRON_PAGE } from '../src/pron-shell';
import { S2_PAGE } from '../src/s2-shell';
import { 菜单, navHtml } from '../src/nav';

const web = (f: string) => readFileSync(path.join(__dirname, '..', 'web', f), 'utf8');
const INDEX = web('index.html');
const CSS = web('app.css');

describe('1. 首页：走得到另外两块', () => {
  it('首页有通往 /pron 和 /s2 的链接', () => {
    expect(INDEX).toMatch(/href="\/pron"/);
    expect(INDEX).toMatch(/href="\/s2"/);
  });

  it('这两个链接**只在首屏**（`#s-home` 里），做题时跟着整块隐藏', () => {
    const i = INDEX.indexOf('<section id="s-home"');
    expect(i).toBeGreaterThan(-1);
    // 下一个 <section 之前就是 #s-home 的范围
    const j = INDEX.indexOf('<section', i + 10);
    const 首屏 = INDEX.slice(i, j > 0 ? j : undefined);
    expect(首屏).toMatch(/href="\/pron"/);
    expect(首屏).toMatch(/href="\/s2"/);
    // 整份文件里这两个链接只出现在首屏，别处一个都没有（题目区一个字都不许多，约定 1）
    expect((INDEX.match(/href="\/pron"/g) ?? []).length).toBe(1);
    expect((INDEX.match(/href="\/s2"/g) ?? []).length).toBe(1);
  });

  it('首屏那块是 hidden 的（做题时整块不在屏幕上）', () => {
    expect(INDEX).toMatch(/<section id="s-home" hidden>/);
  });
});

describe('2. 两个新页面：菜单上三块都在，当前那块标出来', () => {
  it('/pron 的菜单有三块，当前是发音训练', () => {
    for (const d of 菜单) expect([d.路径, PRON_PAGE.includes('href="' + d.路径 + '"')]).toEqual([d.路径, true]);
    expect(PRON_PAGE).toMatch(/href="\/pron" aria-current="page"/);
  });
  it('/s2 的菜单有三块，当前是句子训练', () => {
    for (const d of 菜单) expect([d.路径, S2_PAGE.includes('href="' + d.路径 + '"')]).toEqual([d.路径, true]);
    expect(S2_PAGE).toMatch(/href="\/s2" aria-current="page"/);
  });
  it('菜单里只有链接，没有脚本、不发请求（这一层不许花钱）', () => {
    const n = navHtml('/pron');
    expect(n).not.toMatch(/<script|onclick|fetch\(/);
  });
  it('菜单上的每一块都真的有路由（不许指向 404）', () => {
    const index = readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8');
    for (const d of 菜单) {
      if (d.路径 === '/') continue;          // 首页由静态资源发
      expect([d.路径, index.includes("p === '" + d.路径 + "'")]).toEqual([d.路径, true]);
    }
  });
});

describe('3. CSS 里不许用没定义过的变量', () => {
  // 2026-11-12 的真事：给入口卡写了 background:var(--card)，而 app.css 里根本没有 --card
  // （它叫 --surface）。页面不会报错，只会悄悄变透明 —— 这种错只有肉眼看才看得见，所以钉一条。
  it('app.css 里每个 var(--x) 都在 app.css 里定义过', () => {
    const 定义 = new Set([...CSS.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const 用到 = [...CSS.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
    const 没定义 = [...new Set(用到)].filter((v) => !定义.has(v));
    expect(没定义).toEqual([]);
  });
});
