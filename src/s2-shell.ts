/**
 * S2 句子训练的**页面外壳**（`GET /s2`）。
 *
 * 和 `/pron` 同一个做法：Worker 服务端拼一张完整 HTML，不走静态资源。
 * 不同的是 S2 那一块**自带样式**（`S2_MOD` 里有自己的 `<style>`），所以这里的外壳只负责
 * 文档骨架和一点页面留白，不需要把工作台的设计变量搬过来。
 *
 * 和发音训练一样的硬约束（《项目地图》不能破坏的约定）：
 *  - 页面上**没有一句语法讲解是这里写的**。每一句要么来自 `src/s2-content.ts`（课件原文），
 *    要么是 `src/s2-derive.ts` 按课件规则推出来的，要么是纯界面用语（底线 3）。
 *  - 不调任何 AI、不读数据库、不发任何请求：整页是静态的，**不花一分钱**（C117）。
 */
import { S2_JS, S2_MOD } from './s2-page';

const SHELL_CSS = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;background:#F3F5F8;color:#13203A;
  font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"PingFang SC","Microsoft YaHei",sans-serif;
  padding-left:max(16px,env(safe-area-inset-left,0px));
  padding-right:max(16px,env(safe-area-inset-right,0px));
  padding-block:18px calc(36px + env(safe-area-inset-bottom,0px))}
@media (prefers-color-scheme:dark){body{background:#0f1115;color:#e8ebf1}}
h1{font-size:19px;margin:0 auto 14px;max-width:560px;font-weight:600}
h1 small{display:block;font-size:12.5px;font-weight:400;opacity:.72;margin-top:3px}
`;

export const S2_PAGE = `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow"><title>S2 句子训练</title>
<style>${SHELL_CSS}</style></head><body>
<h1>S2 句子训练<small>13 课 · 一屏一步 · 每一句都标出处</small></h1>
${S2_MOD}
<script>${S2_JS}</script>
<script>try{window.s2Draw&&window.s2Draw();}catch(e){}</script>
</body></html>`;

export const s2Shell = (): Response =>
  new Response(S2_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
