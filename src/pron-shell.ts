/**
 * 发音训练的**页面外壳**（`GET /pron`）。
 *
 * 2026-11-12 把工作台的「发音训练」整块搬到 Practical（Amos 原话：「把后续的所有内容包括发音训练
 * 整体挪到 practical 项目中吧，以后就在 practical 项目中更新」）。他对这件事的判断是
 * 「**只是页面的结构的修改调整**」—— 就是这个文件要做的事，**功能一个字都没改**。
 *
 * Marketing 那边：`src/pron-page.ts` 的 `PRON_CSS / PRON_MOD / PRON_JS` 被拼进 `src/admin-page.ts`
 * 那张后台大页面，发音训练是工作台二级菜单 7 项里的一项。
 * Practical 这边**没有后台**（《项目地图》第 8 条：不加后台管理页）：这里只把发音训练那一块
 * 需要的外壳抽出来——设计变量（`:root`）、`.card / .mod / .mh / .btn` 这些基础样式、
 * 以及宿主要设的 `window.__pronBase`——拼上 `PRON_MOD` + `PRON_JS` 自成一页。
 * **二级菜单、公共工具、其它 6 个模块一个都没带过来**，那些是工作平台的东西。
 *
 * 几处必须照抄、不能"顺手简化"的：
 *  - 外层那个 `id="v-work"`：`PRON_CSS` 里的大按钮写成 `#w-pron .pn-one .btn{min-height:56px}`（1-2-0），
 *    就是为了压过外框那条 `:is(#v-work,…) .btn{min-height:38px}`（1-1-0）。
 *    这里保留同样具体度（specificity）的 `#v-work .btn{…min-height:38px}`，按钮才还是 56px 高、手机上单手够得着。
 *  - `window.pronStop`：Marketing 在切二级菜单和 `visibilitychange` 时调它（关摄像头、停朗读、清播放意图）。
 *    Practical 没有二级菜单，`visibilitychange` 那条在 `PRON_JS` 里**原样留着**；
 *    这里再补一条 `pagehide`——**离开 /pron 这一页，摄像头指示灯必须灭**。
 *  - 页面上**没有一句关于"这个音怎么发"的话是这里写的**：每一句要么来自 `src/pron-lesson.ts`，
 *    要么是纯界面用语（底线 3）。这个文件只有样式和外壳。
 */
import { NAV_CSS, navHtml } from './nav';
import { PRON_CSS, PRON_JS, PRON_MOD } from './pron-page';

/**
 * 外壳样式：从 Marketing `src/admin-page.ts` 的 `<style>` 里抽出发音训练真正用到的那些
 * （设计变量、`.card`、`.mod`、`.mh`、`.lead`、`.mbody`、`details.more`、`.btn`），**一条都没改写**。
 * 后台菜单、工作台别的模块、公共工具那些选择器一条都没带过来。
 */
const SHELL_CSS = `
:root{--bg:#F3F5F8;--surface:#fff;--surface-2:#F7F9FB;--ink:#13203A;--ink-2:#3D4A60;--muted:#616D80;--line:#E4E8EF;--navy:#0F1B33;
  --teal:#14B8A6;--teal-ink:#0B7A6E;--teal-soft:#E2F6F3;--amber:#B45309;--amber-soft:#FEF3E2;--ok:#147A3A;--ok-soft:#E5F5EA;--err:#C0262D;--err-soft:#FDECEC;--gray-soft:#EEF1F5;--stale:#8A94A6;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--shadow:0 1px 2px rgba(15,27,51,.04),0 4px 14px rgba(15,27,51,.05);
  --fs-mod:18px;--fs-body:15px;--fs-aux:13px;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:24px;--s6:32px;--s7:48px;--r-card:14px;--r-btn:10px;color-scheme:light}
@media (prefers-color-scheme: dark){:root{--bg:#0B1220;--surface:#121B2C;--surface-2:#172238;--ink:#E7ECF4;--ink-2:#BAC4D6;--muted:#8D99AE;--line:#223049;--navy:#08101F;
  --teal:#2DD4BF;--teal-ink:#5EEAD4;--teal-soft:#0F3632;--amber:#F5A524;--amber-soft:#382912;--ok:#4ADE80;--ok-soft:#12301E;--err:#F87171;--err-soft:#3A181B;--gray-soft:#1C2740;--stale:#6B7689;--shadow:none;color-scheme:dark}}
*{box-sizing:border-box}[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--ink);font:var(--fs-body)/1.6 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:720px;margin:0 auto;padding:var(--s5) max(var(--s4),env(safe-area-inset-right)) var(--s7) max(var(--s4),env(safe-area-inset-left));min-width:0}
.page{display:grid;gap:var(--s5);min-width:0}
.mod{min-width:0}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:var(--shadow);overflow:hidden}
.btn{font:inherit;font-size:14px;font-weight:700;border-radius:10px;padding:9px 12px;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--ink);text-align:center;text-decoration:none}
.btn.primary{background:var(--teal);border-color:var(--teal);color:#0F1B33}
.btn[aria-disabled="true"],.btn:disabled{opacity:.5;pointer-events:none}
.btn:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
#v-work{gap:var(--s6)}
#v-work .mh{display:flex;align-items:center;gap:var(--s2) var(--s3);flex-wrap:wrap;padding:var(--s5) var(--s5) 0;margin:0;font-size:inherit}
#v-work .mh h2{font-size:var(--fs-mod);line-height:1.35;margin:0;display:flex;align-items:center;gap:var(--s2)}
#v-work .mh .sp{flex:1}#v-work .mh .aux{font-size:var(--fs-aux);color:var(--muted)}
#v-work .lead{margin:var(--s2) var(--s5) 0;font-size:var(--fs-body);font-weight:600;color:var(--ink);line-height:1.6;overflow-wrap:anywhere}
#v-work .lead .soft{font-weight:400;color:var(--muted);margin-left:6px}
#v-work .dot{display:inline-block;width:8px;height:8px;border-radius:50%;vertical-align:middle;margin:-2px 8px 0 0;background:var(--stale)}
#v-work .dot.ok{background:var(--ok)}#v-work .dot.gray{background:var(--stale)}
#v-work .mbody{padding:var(--s4) var(--s5) var(--s5)}
#v-work details.more{border-top:1px solid var(--line);background:var(--surface-2)}
#v-work details.more>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:var(--s2);padding:var(--s3) var(--s5);font-size:var(--fs-aux);color:var(--muted)}
#v-work details.more>summary::-webkit-details-marker{display:none}
#v-work details.more>summary::before{content:"";width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(-45deg);transition:transform .15s;flex:0 0 auto}
#v-work details.more[open]>summary::before{transform:rotate(45deg)}
#v-work details.more>.in{padding:0 var(--s5) var(--s4);font-size:var(--fs-aux);color:var(--ink-2);line-height:1.75}
#v-work details.more>.in p{margin:0 0 var(--s2)}
#v-work .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 16px;font-size:14px;line-height:1.3;border-radius:var(--r-btn);white-space:nowrap}
#v-work .btn[aria-busy="true"]{opacity:.65;pointer-events:none}
#v-work .btn.primary:hover{filter:brightness(1.05)}#v-work .btn:not(.primary):hover{border-color:var(--muted)}
@media (max-width:640px){:root{--fs-mod:17px}
  main{padding:var(--s4) max(var(--s3),env(safe-area-inset-right)) var(--s7) max(var(--s3),env(safe-area-inset-left))}
  #v-work .mh{padding:var(--s4) var(--s4) 0}#v-work .lead{margin:var(--s2) var(--s4) 0}#v-work .mbody{padding:var(--s3) var(--s4) var(--s4)}
  #v-work details.more>summary,#v-work details.more>.in{padding-left:var(--s4);padding-right:var(--s4)}}
`;

/** 开页就读一次记录；离开这一页（返回、切走、关标签页）把摄像头和朗读都停掉 */
const SHELL_JS = `
try{window.pronOpen&&window.pronOpen();}catch(e){}
try{addEventListener('pagehide',function(){if(window.pronStop)window.pronStop();});}catch(e){}
`;

/** `GET /pron` 的整张页面（服务端拼好，和 Marketing 的做法一样） */
export const PRON_PAGE = `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow"><title>发音训练</title>
<style>${SHELL_CSS}${PRON_CSS}${NAV_CSS}</style></head><body>
${navHtml('/pron')}
<main><div class="page" id="v-work">
${PRON_MOD}
</div></main>
<script>window.__pronBase='/api/pron/';</script>
<script>${PRON_JS}</script>
<script>${SHELL_JS}</script>
</body></html>`;

export const pronShell = (): Response =>
  new Response(PRON_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
