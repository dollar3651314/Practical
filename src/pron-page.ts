/**
 * 「发音训练」那一块的页面（模块 `#w-pron`；服务端 src/pron.ts、发音 src/pron-audio.ts、
 * 内容 src/pron-content.ts、教学阶梯 src/pron-lesson.ts）。
 * 拆成样式 / 结构 / 脚本三段导出，由宿主页面插这三段。
 * 写法上的约定：这是模板字符串，里面**不能出现没转义的反引号或 ${**。
 *
 * **2026-11-12 从 Marketing 仓库搬过来**（Amos：「把后续的所有内容包括发音训练整体挪到 practical 项目中吧，
 * 以后就在 practical 项目中更新」）。他的判断是「只是页面的结构的修改调整」——**这个文件的三段导出一个字都没改**，
 * 改的只有宿主：Marketing 把它拼进后台大页面 `src/admin-page.ts`（二级菜单第 7 项），
 * Practical 让它自成一页 `/pron`（src/pron-shell.ts）。
 *
 * ## 2026-11-12：第 1 步从「一张参考卡」改成「跟我做」
 *
 * 原来的第 1 步是**一张参考卡**：口型示意图、音标、外号、三条口型定位、一段说明、一堆按钮，一屏全摊开。
 * Amos 的原话是「**完全不知道该怎么开口**」「不要让我思考 不要让我自己组装 你要带着我做 把用户当成小白」，
 * 以及「**口型图撤掉，念给我听要，开始做**」。所以：
 *  - **口型示意图整套撤掉**（src/pron-mouth.ts、页面上画 SVG 的那一套、接口的 `口型图` 字段、
 *    来回切换动画，连同它们的测试和 e2e 检查）—— 这是**他明确要求的功能下线**，不是"为了变绿删测试"。
 *  - 第 1 步改成**一次只说一句话**：一屏上只有一步，他做完点「做好了，下一步」才给下一句。
 *  - 阶梯顺序**不是页面编的**：四级（单音 → 音素拼合 → 单词拼读 → 句子和绕口令）照课程 S1 的练法原文，
 *    由 `src/pron-lesson.ts` 生成，页面只负责照着画。**页面上每一句关于"这个音怎么发"的话都来自那个文件**，
 *    这里一句都不自己写（底线 3）。
 *  - **镜子留着**：它原来的"目标口型图"没了，改成只显示**当前这一步的那句指令**；
 *    隐私那一整套（不上传、不保存、不录、关掉 track.stop()、离开 window.pronStop()、
 *    visibilitychange 兜底、请求序号防竞态）**一条都没动**。
 *
 * **阶梯数据怎么到页面上**：`src/pron-lesson.ts` 的 `LESSON` 在**打包时**序列化成 JSON 拼进这段脚本
 * （下面的 `PRON_JS = 头 + JSON + 尾`）。不走接口是因为 `pron-lesson.ts` 要从 `src/pron.ts` 取 `wordId`，
 * 反过来让 `pron.ts` 去 import 它会成环，模块初始化时 `wordId` 还在 TDZ 里，整个 Worker 起不来。
 * 这段 JSON 是**静态课件内容**（和 PRON_MOD 一样是死的），不是任何人的数据。
 *
 * **四步循环**（第 2～4 步一个字没改）：
 *   1. **跟我做**（不考）：一次一句，走完给一屏收尾。
 *   2. **对照听**（不考）：这一组的最小对立对，两个词各一个大按钮，**想点几次点几次**；
 *      旁边就是**纠说**（他念、机器听）。**他自己点「我听出来了，开始考」才进第 3 步**。
 *   3. **考**：同一组连考 10 题，**不换别的音**；答错当场把第 2 步的对照听塞回来，点「继续」才出下一题。
 *      保留「两个听着一样」那个按钮和它的全部语义。
 *   4. **过关**：10 题对 8 题（80%）才算过，过了给课件那句绕口令 + 三最法；没过说清楚错在哪几对。
 *
 * **第 7 组（/ʒ/ vs /dʒ/）一对最小对立对都没有** —— 页面上**照实说「这一组只能跟读和纠说」**，
 * 「开始考」那个按钮直接不给，**不硬凑题**；第 4 组只有 1 对，也照实说题会重复（底线 3）。
 *
 * **纠说的措辞永远是「机器听成了什么」**，不许写成「你念对了 / 念错了」（底线 3、9）：
 * 语音识别天生要对口音稳健，它可能把念歪的 /e/ 也认成 bad —— 它听成什么是线索，不是判决。
 * 没有麦克风权限 / 浏览器不支持 / 识别失败：**当面说清楚**，而且**整块的其余部分照常能用**
 * （纠说是加分项，不是前置条件）；**不自动重试**。
 *
 * **念给我听**用浏览器自带的 `speechSynthesis`（`lang='zh-CN'`，语速稍慢）：**不调任何 AI、不花一分钱、
 * 不加环境变量**。这台设备不支持或者没有中文语音时，**按钮上当面说清楚**，其余功能照常能用，不整屏挂掉。
 *
 * 把用户当小白（agents #92）：**一个输入框都没有**（录音按钮不是 input），页面上不出现命令行；
 * 按钮都 ≥52px（这里全是 56px），手机 390 宽单手够得着、不横滚；发音生成不出来**当面说**，不假装有。
 * 字号只用全站那几级（30 / 26 / 24 / 22 / 18 / 15 / 13 / 12，控件可以 14；e2e-platform 的 fontOutliers 守着）。
 */
import { LESSON, 级 } from './pron-lesson';

export const PRON_CSS = `
/* 选一组：七个按钮（第 7 组没有听辨题，按钮上照实标出来） */
.pn .pn-pick{display:flex;flex-wrap:wrap;gap:var(--s2);margin:0 0 var(--s4)}
#w-pron .pn-pick .btn{display:block;min-height:56px;font-size:14px;font-weight:700;flex:1 1 calc(50% - var(--s2));min-width:0;white-space:normal;overflow-wrap:anywhere;line-height:1.3;padding:8px 10px;text-align:center}
.pn .pn-pick .btn .p-s{display:block;font-size:12px;font-weight:500;color:var(--muted)}
.pn .pn-pick .btn.primary .p-s{color:#fff}
/* 四步条 */
.pn .pn-steps{display:flex;gap:var(--s2);margin:0 0 var(--s4);flex-wrap:wrap}
.pn .pn-step{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--muted);background:var(--gray-soft);border-radius:99px;padding:3px 10px}
.pn .pn-step.on{background:var(--teal-soft);color:var(--teal-ink)}
.pn .pn-step.ok{background:var(--ok-soft);color:var(--ok)}
/* 第 1 步「跟我做」：课程四级练法的轨（单音 → 音素拼合 → 单词拼读 → 句子和绕口令）。
   **换行，不横滑**：390 宽一行放不下四颗，横滑会把第 4 级藏到屏幕外面 —— 他看不见就等于没有。 */
.pn .pn-rail{display:flex;flex-wrap:wrap;gap:var(--s2);margin:0 0 var(--s3)}
.pn .pn-lv{flex:0 0 auto;font-size:12px;font-weight:700;color:var(--muted);background:var(--gray-soft);border-radius:99px;padding:4px 11px;white-space:nowrap}
.pn .pn-lv.on{background:var(--teal-soft);color:var(--teal-ink)}
.pn .pn-lv.ok{background:var(--ok-soft);color:var(--ok)}
/* 一次只说一句：第几级（小字）→ 这一句（大字）→ 大字内容 → 提示（小字）→ 依据（更小的字） */
.pn .pn-coach{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:var(--s5) var(--s4);margin:0 0 var(--s3)}
.pn .pn-coach .c-lv{font-size:12px;font-weight:700;color:var(--teal-ink);letter-spacing:.06em;margin:0 0 var(--s2)}
.pn .pn-coach .c-say{font-size:26px;font-weight:700;line-height:1.42;color:var(--ink);margin:0;overflow-wrap:anywhere}
.pn .pn-coach .c-big{font-size:30px;font-weight:700;line-height:1.3;color:var(--teal-ink);margin:var(--s3) 0 0;overflow-wrap:anywhere}
.pn .pn-coach .c-hint{font-size:var(--fs-body);color:var(--ink-2);line-height:1.6;margin:var(--s3) 0 0;overflow-wrap:anywhere}
.pn .pn-coach .c-src{font-size:12px;color:var(--muted);line-height:1.6;margin:var(--s3) 0 0;border-left:3px solid var(--line);padding-left:10px;overflow-wrap:anywhere}
.pn .pn-coach .c-src .c-tag{display:inline-block;font-weight:700;color:var(--ink-2);margin-right:6px}
/* 这一步的按钮：主按钮占满一行，别的两个一行；字长的（「🔈 念给我听」「这台设备读不了中文…」）允许换行 */
.pn .pn-cbtns{display:flex;flex-wrap:wrap;gap:var(--s3);margin:var(--s4) 0 0}
#w-pron .pn-cbtns .btn{min-height:56px;font-size:17px;font-weight:700;flex:1 1 calc(50% - var(--s3));min-width:0;white-space:normal;overflow-wrap:anywhere;line-height:1.3;padding:8px 12px}
#w-pron .pn-cbtns .btn.go{flex:1 1 100%}
/* 第 n / 共 m 步 */
.pn .pn-meter{display:flex;align-items:center;gap:var(--s3);margin:0 0 var(--s4)}
.pn .pn-meter .c-num{flex:0 0 auto;font-size:12px;color:var(--muted)}
/* 照镜子：左边这一步要做的那句话、右边他自己的嘴。**画面不上传、不保存、不录**（只有 srcObject，关掉时 track.stop()） */
.pn .pn-mirror{border:1px solid var(--teal);border-radius:12px;background:var(--surface-2);padding:var(--s3);margin:var(--s3) 0 0}
.pn .pn-mirrow{display:grid;grid-template-columns:1fr 1fr;gap:var(--s2);margin:0 0 var(--s3)}
.pn .pn-mircell{min-width:0}
.pn .pn-mircell .m-cap{font-size:12px;color:var(--muted);margin:0 0 var(--s1);overflow-wrap:anywhere}
.pn .pn-mircell .m-do{font-size:var(--fs-body);font-weight:700;color:var(--ink);margin:0;line-height:1.5;overflow-wrap:anywhere}
.pn .pn-mircell video{display:block;width:100%;height:200px;object-fit:cover;background:#000;border-radius:10px;transform:scaleX(-1)}
.pn .pn-privacy{font-size:var(--fs-aux);font-weight:700;color:var(--teal-ink);margin:0 0 var(--s3);overflow-wrap:anywhere}
/* 慢速对照 + 他自己的录音回放（**录过才出现**，没录过不画占位、不画灰按钮） */
.pn .pn-my{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:var(--s3);margin:var(--s3) 0 0}
.pn .pn-my .y-t{font-size:var(--fs-body);font-weight:700;color:var(--ink);margin:0 0 var(--s2)}
#w-pron .pn-my .btn[aria-pressed="true"]{background:var(--teal-soft);border-color:var(--teal);font-weight:700}
/* 这几个按钮的字比别处长（「🐢 慢速开着（0.7 倍）」）：允许换行、min-width:0，否则格子被撑开、整块横着溢出 */
#w-pron .pn-my .btn{font-size:15px;white-space:normal;overflow-wrap:anywhere;min-width:0;line-height:1.3;padding:8px 10px}
/* 一句话说明（这一组有几对最小对立对、够不够 10 题）：照实说，不硬凑 */
.pn .pn-note{border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:10px;background:var(--surface-2);padding:var(--s3);margin:0 0 var(--s4);font-size:var(--fs-body);color:var(--ink);overflow-wrap:anywhere}
.pn .pn-h{font-size:var(--fs-body);font-weight:700;color:var(--ink);margin:0 0 var(--s3)}
.pn .pn-hint{font-size:var(--fs-aux);color:var(--muted);margin:0 0 var(--s3);overflow-wrap:anywhere}
/* 第 2 步 对照听：一对一行，两个词各一个大按钮 */
.pn .pn-pair{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:var(--s3);margin:0 0 var(--s3)}
.pn .pn-pair .q-t{font-size:var(--fs-aux);color:var(--muted);margin:0 0 var(--s2)}
/* 第 3 步 考：进度 + 卡片 */
.pn .pn-top{border:1px solid var(--line);border-radius:12px;background:var(--surface-2);padding:var(--s3) var(--s4);margin:0 0 var(--s4)}
.pn .pn-where{font-size:var(--fs-body);font-weight:700;color:var(--ink);margin:0}
.pn .pn-bar{flex:1 1 auto;height:8px;border-radius:4px;background:var(--gray-soft);overflow:hidden;margin:var(--s2) 0 var(--s1);min-width:0}
.pn .pn-bar i{display:block;height:100%;background:var(--teal)}
.pn .pn-meter .pn-bar{margin:0}
.pn .pn-left{font-size:var(--fs-aux);color:var(--muted);margin:0}
.pn .pn-card{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:var(--s5) var(--s4);margin:0 0 var(--s3);text-align:center}
.pn .pn-ask{font-size:var(--fs-aux);color:var(--muted);margin:0 0 var(--s3)}
.pn .pn-hear{font-size:22px;font-weight:700;color:var(--ink);margin:0 0 var(--s3)}
.pn .pn-samewrap{margin:var(--s3) 0 0}
.pn .pn-ver{font-size:22px;font-weight:700;line-height:1.4;margin:0;overflow-wrap:anywhere}
.pn .pn-ver.ok{color:var(--ok)}
.pn .pn-ver.no{color:var(--err)}
.pn .pn-ver.same{color:var(--teal-ink)}
/* 答错：把第 2 步的对照听塞回来（这就是"会教"的那一步） */
.pn .pn-back{border:1px solid var(--amber);background:var(--amber-soft);color:var(--amber);border-radius:10px;padding:var(--s3);margin:var(--s4) 0 0;font-size:var(--fs-body);text-align:left;overflow-wrap:anywhere}
.pn .pn-cmp-t{font-size:var(--fs-aux);color:var(--muted);margin:var(--s4) 0 var(--s2)}
.pn .pn-ipa{font-size:18px;color:var(--ink-2);margin:var(--s3) 0 0;overflow-wrap:anywhere}
/* 第 4 步 过关 + 绕口令；「跟我做」走完那一屏收尾也用这一套 */
.pn .pn-sum{border:1px solid var(--line);border-radius:12px;padding:var(--s4);margin:0 0 var(--s3);background:var(--surface-2)}
.pn .pn-sum.pass{border-color:var(--ok);background:var(--ok-soft)}
.pn .pn-sum.fail{border-color:var(--amber);background:var(--amber-soft)}
.pn .pn-sum .s-t{font-size:var(--fs-mod);font-weight:700;color:var(--ink);margin:0 0 var(--s2)}
.pn .pn-sum .s-l{font-size:var(--fs-body);color:var(--ink);margin:0;overflow-wrap:anywhere}
.pn .pn-sum .s-h{font-size:var(--fs-body);font-weight:700;color:var(--ink);margin:var(--s4) 0 var(--s2)}
.pn .pn-sum .s-tw{font-size:18px;font-weight:700;line-height:1.5;color:var(--ink);margin:0;overflow-wrap:anywhere}
.pn .pn-sum .s-how{font-size:var(--fs-body);color:var(--ink-2);margin:var(--s2) 0 0;overflow-wrap:anywhere}
.pn .pn-sum ul{margin:0;padding-left:20px;display:grid;gap:var(--s1)}
.pn .pn-sum li{font-size:var(--fs-body);color:var(--ink);overflow-wrap:anywhere}
/* 纠说：他念、机器听 */
.pn .pn-say{border:1px solid var(--line);border-radius:12px;background:var(--surface-2);padding:var(--s4);margin:var(--s5) 0 0}
.pn .pn-say .y-t{font-size:var(--fs-mod);font-weight:700;color:var(--ink);margin:0 0 var(--s2)}
.pn .pn-sayver{font-size:18px;font-weight:700;line-height:1.5;margin:var(--s3) 0 0;overflow-wrap:anywhere;text-align:left}
.pn .pn-sayver.ok{color:var(--ok)}
.pn .pn-sayver.no{color:var(--err)}
.pn .pn-sayver.other{color:var(--amber)}
.pn .pn-saynote{font-size:var(--fs-aux);color:var(--muted);margin:var(--s2) 0 0;overflow-wrap:anywhere}
/* 大按钮：一律 ≥52px 高（这里全是 56px），手机单手够得着。
   **选择器必须压过 admin-page.ts 那条 :is(#v-work,…) .btn{min-height:38px}**（它带一个 id，算 1-1-0）：
   所以这里写成 #w-pron + 两个类（1-2-0），只写 .pn .pn-one button（0-2-1）会被它盖掉，按钮就只有 38px 高。 */
#w-pron .pn-one .btn{width:100%;min-height:56px;font-size:17px;font-weight:700}
.pn .pn-one{margin:0 0 var(--s3)}
.pn .pn-two{display:grid;grid-template-columns:1fr 1fr;gap:var(--s3)}
#w-pron .pn-two .btn{min-height:56px;font-size:17px;font-weight:700;white-space:normal;overflow-wrap:anywhere;min-width:0;line-height:1.3;padding:8px 10px}
.pn .pn-au{margin:var(--s4) 0 0}
.pn .pn-aumsg{border:1px solid var(--err);background:var(--err-soft);color:var(--err);border-radius:8px;padding:var(--s3);margin:var(--s3) 0 0;font-size:var(--fs-aux);white-space:pre-wrap;text-align:left}
.pn .pn-err{border:1px solid var(--err);background:var(--err-soft);color:var(--err);border-radius:8px;padding:var(--s3);margin:var(--s3) 0 0;font-size:var(--fs-aux);white-space:pre-wrap}
@media (max-width:420px){.pn .pn-ver{font-size:18px}.pn .pn-coach .c-say{font-size:22px}.pn .pn-coach .c-big{font-size:26px}
  /* 390 宽：**镜子仍然并排**（并排才对得上自己的嘴），这一步的那句话就在左边 */
  .pn .pn-mirrow{grid-template-columns:1fr 1fr}}
`;

/** 发音训练那一块的结构（Practical 里就是 /pron 这一页的全部内容，src/pron-shell.ts 拼外壳） */
export const PRON_MOD = `<section class="card mod pn" id="w-pron"><header class="mh"><h2>发音训练</h2><span class="sp"></span><span class="aux" id="pn-aux">七组易错音</span></header>
<p class="lead" id="pn-lead"><span class="dot gray" id="pn-dot"></span><span id="pn-lead-t">读取中…</span><span class="soft" id="pn-soft">跟我做（一次一句）→ 对照听 → 同一组连考 10 题 → 对 8 题过关，给绕口令。</span></p>
<div class="mbody">
  <!-- 旧的那两块去哪了（Amos 2026-11-11：「都没用了」）：照实说，并说明历史数据还在 -->
  <details class="more" id="pn-old"><summary>「英语练习」和「带练」去哪了</summary><div class="in"><p id="pn-old-t">读取中…</p>
    <p>新的这一块和它们最大的不同：第 1 步<b>一次只说一句话</b>，你做完点一下才给下一句；<b>同一组音连考 10 题</b>，不是每题换一个音；
    <b>答错当场回到对照听</b>，不是只给对错；过关才给绕口令。口型、对比词、绕口令都来自你学过的那套课程（S1 第 10、11 课）。</p></div></details>

  <!-- 选一组（默认 g1 = /e/ vs /æ/，你实测最弱的那一组） -->
  <p class="pn-h">练哪一组</p>
  <div class="pn-pick" id="pn-pick"></div>

  <div class="pn-steps" id="pn-steps" aria-label="四步"><span class="pn-step" data-st="1">1 跟我做</span><span class="pn-step" data-st="2">2 对照听</span><span class="pn-step" data-st="3">3 考 10 题</span><span class="pn-step" data-st="4">4 过关</span></div>

  <!-- 第 1 步：跟我做（不考）。一屏上只有一步；每一句话都来自 src/pron-lesson.ts，页面一句都不自己写 -->
  <div id="pn-s1">
    <!-- 课程 S1 自己的四级练法顺序（单音 → 音素拼合 → 单词拼读 → 句子和绕口令） -->
    <div class="pn-rail" id="pn-rail" aria-label="课程的四级练法"></div>
    <div class="pn-coach" id="pn-coach">
      <p class="c-lv" id="pn-clv"></p>
      <p class="c-say" id="pn-csay"></p>
      <p class="c-big" id="pn-cbig" hidden></p>
      <p class="c-hint" id="pn-chint" hidden></p>
      <p class="c-src" id="pn-csrc"></p>
      <div class="pn-cbtns" id="pn-cbtns"></div>
      <!-- 这一步的 🎤 念一遍：措辞永远是「机器听成了什么」，不是对错判决 -->
      <p class="pn-sayver" id="pn-csayver" hidden></p>
      <p class="pn-saynote" id="pn-csaynote" hidden></p>
      <div class="pn-aumsg" id="pn-csaymsg" hidden></div>
    </div>
    <div class="pn-meter"><span class="c-num" id="pn-cnum">—</span><span class="pn-bar"><i id="pn-cbar" style="width:0%"></i></span></div>
    <div class="pn-two" id="pn-tools">
      <button class="btn" type="button" id="pn-auto" aria-pressed="true">🔈 自动念：开着</button>
      <button class="btn" type="button" id="pn-mir" aria-pressed="false">🪞 照镜子</button>
    </div>
    <!-- 照镜子：左边这一步要做的那句话、右边前置摄像头。**画面只在这台手机上，不上传、不保存、不录** -->
    <div class="pn-mirror" id="pn-mirwrap" hidden>
      <div class="pn-mirrow">
        <div class="pn-mircell"><p class="m-cap" id="pn-mircap">这一步要做的</p><p class="m-do" id="pn-mirtarget"></p></div>
        <div class="pn-mircell"><p class="m-cap">你自己的嘴（像照镜子一样左右反过来）</p><video id="pn-cam" autoplay playsinline muted></video></div>
      </div>
      <p class="pn-privacy">这个画面不会离开你的手机 —— 不上传、不保存、不录像。关掉镜子，摄像头指示灯就灭。</p>
      <div class="pn-one"><button class="btn" type="button" id="pn-miroff">关掉镜子</button></div>
    </div>
    <div class="pn-aumsg" id="pn-mirmsg" hidden></div>

    <!-- 走完最后一步：收尾（照实说课程的作业标准，以及课程没给自查方法这件事） -->
    <div id="pn-fin" hidden>
      <div class="pn-sum">
        <p class="s-t" id="pn-fin-t">这一组的每一步都走完了</p>
        <p class="s-l">课程的作业标准是「直到没有任何发音错误」。</p>
        <p class="s-how">课程<b>没有给自查的办法</b> —— 这正是上面每一步的 🎤 要补的那一处：它告诉你<b>机器听成了哪个词</b>。
        语音识别天生要对口音稳健，<b>它听成什么是线索，不是判决</b>。</p>
      </div>
      <div class="pn-two">
        <button class="btn" type="button" id="pn-redo">从头再走一遍</button>
        <button class="btn primary" type="button" id="pn-go2">去对照听</button>
      </div>
    </div>
  </div>

  <!-- 第 2 步：对照听（不考）+ 纠说 -->
  <div id="pn-s2" hidden>
    <p class="pn-h">对照听：同一对的两个词来回点，想点几次点几次</p>
    <div id="pn-cmp"></div>
    <p class="pn-note" id="pn-note2"></p>
    <div class="pn-one" id="pn-go3wrap"><button class="btn primary" type="button" id="pn-go3">我听出来了，开始考</button></div>

    <div class="pn-say" id="pn-say">
      <p class="y-t">纠说：你念，机器听</p>
      <p class="pn-hint">按一下开始录，念出那个词，再按一次停止。机器会告诉你<b>它听成了哪个词</b> ——
      语音识别天生要对口音稳健，它可能把你念歪的音也认成那个词，<b>它听成什么是线索，不是判决</b>。</p>
      <div id="pn-saywords"></div>
      <p class="pn-sayver" id="pn-sayver" hidden></p>
      <p class="pn-saynote" id="pn-saynote" hidden></p>
      <div class="pn-aumsg" id="pn-saymsg" hidden></div>

      <!-- 慢速对照 + 他自己的录音回放：**录过才出现**（没录过这一块整个不画，不留灰按钮） -->
      <div class="pn-my" id="pn-my" hidden>
        <p class="y-t" id="pn-my-t">挨着听：标准音和你刚才念的</p>
        <div class="pn-two">
          <button class="btn" type="button" id="pn-std">🔊 标准音</button>
          <button class="btn" type="button" id="pn-mine">🎧 我刚才念的</button>
        </div>
        <div class="pn-two" style="margin-top:12px">
          <button class="btn" type="button" id="pn-slow" aria-pressed="false">🐢 慢速 0.7 倍</button>
          <button class="btn" type="button" id="pn-chain">▶ 连着放</button>
        </div>
        <p class="pn-saynote">「连着放」= 标准音 → 停 0.3 秒 → 你的录音，对比最清楚。这段录音<b>留在这个页面里，不另外上传</b>（纠说那一次本来就要把录音送去给机器听，那是原来就有的），<b>刷新页面就没了</b>。</p>
      </div>
    </div>
  </div>

  <!-- 第 3 步：考（同一组连考，不换别的音） -->
  <div id="pn-s3" hidden>
    <div class="pn-top">
      <p class="pn-where" id="pn-where">—</p>
      <div class="pn-bar"><i id="pn-qbar" style="width:0%"></i></div>
      <p class="pn-left" id="pn-qleft"></p>
    </div>
    <div id="pn-q">
      <div class="pn-card">
        <p class="pn-ask">听这个词，选你听到的是哪个</p>
        <p class="pn-hear">🔊</p>
        <div class="pn-one"><button class="btn primary" type="button" id="pn-again1">🔊 再听一次</button></div>
        <div class="pn-two" id="pn-pick2">
          <button class="btn" type="button" id="pn-l">—</button>
          <button class="btn" type="button" id="pn-r">—</button>
        </div>
        <div class="pn-one pn-samewrap"><button class="btn" type="button" id="pn-same">两个听着一样</button></div>
      </div>
    </div>
    <div id="pn-res" hidden>
      <div class="pn-card">
        <p class="pn-ver" id="pn-ver"></p>
        <!-- 答错当场把第 2 步的对照听塞回来：两个词都能点，听完点「继续」才出下一题 -->
        <p class="pn-back" id="pn-back" hidden></p>
        <p class="pn-cmp-t">两个都点来听，对比一下：</p>
        <div class="pn-two pn-au">
          <button class="btn" type="button" id="pn-wa">—</button>
          <button class="btn" type="button" id="pn-wb">—</button>
        </div>
        <p class="pn-ipa" id="pn-ipa"></p>
      </div>
      <div class="pn-one"><button class="btn primary" type="button" id="pn-next">继续</button></div>
    </div>
  </div>

  <!-- 第 4 步：过关 + 绕口令 -->
  <div id="pn-s4" hidden>
    <div class="pn-sum" id="pn-sum">
      <p class="s-t" id="pn-score"></p>
      <p class="s-l" id="pn-line"></p>
      <div id="pn-twwrap" hidden>
        <p class="s-h">绕口令挑战（课件原文）</p>
        <p class="s-tw" id="pn-tw"></p>
        <p class="s-how" id="pn-how"></p>
      </div>
      <div id="pn-wrongwrap" hidden>
        <p class="s-h">错在这几对</p>
        <ul id="pn-wrong"></ul>
      </div>
    </div>
    <div class="pn-two">
      <button class="btn primary" type="button" id="pn-again2">再考一轮</button>
      <button class="btn" type="button" id="pn-toS1">回第 1 步跟我做</button>
    </div>
  </div>

  <div class="pn-aumsg" id="pn-msg" hidden></div>
  <div class="pn-err" id="pn-err" hidden></div>
</div>
<details class="more"><summary>这一块到底在做什么 · 内容和发音各从哪来</summary><div class="in">
  <p>七组是你学过的那套课程 S1 <b>第 10 课（易错元音）和第 11 课（易错辅音）</b>的对立音，口型定位、对比词、绕口令都是<b>课件原文</b>，逐张抽出来录进内容文件的。</p>
  <p>一组四步：<b>跟我做</b>（一次只说一句话，你做完点一下才给下一句）→ <b>对照听</b>（两个词来回点，点多少次都行）→ <b>连考 10 题</b>（同一组，不换别的音；答错当场回到对照听）→ <b>10 题对 8 题过关</b>，给那一组的绕口令。</p>
  <p><b>「跟我做」的四级顺序不是我编的</b>：<b>单音 → 音素拼合 → 单词拼读 → 句子和绕口令</b>，是那套课程自己写的练法顺序；作业统一写「用某某方法朗读，直到没有任何发音错误」。每一步底下的小字写明了这句话出自<b>课件原文</b>、<b>课程练法</b>，还是<b>机械拆分</b>（把课件给的音标按符号切开）。课件没写的口型，就生不出那一步 —— 不会给你编一句。</p>
  <p><b>第 7 组（/ʒ/ 和 /dʒ/）一对最小对立对都没有</b>，所以它只能跟读和纠说，没有听辨题 —— 不会给你硬凑的题。第 4 组只有 1 对，10 题会一直考那一对，页面上也写明了。</p>
  <p><b>纠说</b>用的是 Workers AI 的语音识别：你念一个词，它告诉你<b>它听成了哪个词</b>。有几个词（ketch、reen、roose、rove）不是现代常用词，识别基本不会输出它们，拿它们判对错是冤枉人，所以这几个词<b>不给纠说</b>。</p>
  <p><b>发音</b>用 Workers AI 的 aura-2-en 念，一个词念一次就<b>存在服务器上永久复用</b>（56 个词全生成一遍约 820 neurons，免费额度每天 10,000），<b>不新增任何费用</b>。念不出来的时候会当面说，不会假装有声音，也不会自动重试。</p>
  <p><b>念给我听</b>用的是浏览器自己带的朗读（和 Siri 读网页是同一套），<b>不调任何 AI、不花一分钱</b>：它只念屏幕上这一句中文指令，好让你对着镜子做、不用盯着屏幕。这台设备没有中文朗读的时候，按钮上会当面说，其余照常能用。</p>
  <p><b>口型示意图撤掉了</b>（2026-11-12，你的原话「口型图撤掉，念给我听要，开始做」）：原来那一屏把图、音标、外号、口型定位一次全摊开，你说「完全不知道该怎么开口」。现在改成一次一句、做完点一下。</p>
  <p><b>照镜子</b>用的是手机的前置摄像头：画面<b>只在这台手机上显示，不上传、不保存、不录像</b>，关掉镜子摄像头就停（指示灯灭）；左边显示的就是你现在这一步要做的那句话。<b>「我刚才念的」</b>是纠说那一次录的那段，留在浏览器里<b>不另外上传</b>，<b>刷新就没了</b>；慢速 0.7 倍对标准音和你的录音都管用，「连着放」是标准音 → 停 0.3 秒 → 你的录音。</p>
  <p>每一轮的成绩（考了几题、对几题、点过几次"两个听着一样"、过没过）<b>存在服务器上</b>，换一台设备接着练就行。</p></div></details></section>`;

/**
 * 发音训练那一块的脚本（整段 try/catch，出错只影响这一块）。宿主页面先设 window.__pronBase，例如 '/api/pron/'。
 * `PRON_JS` = 头 + 教学阶梯的 JSON + 尾：阶梯是 `src/pron-lesson.ts` 生成的**静态课件内容**，
 * 打包时拼进来（不走接口的原因见文件头：`pron.ts` 去 import `pron-lesson.ts` 会成环）。
 */
const PRON_JS_HEAD = `
/* 整段包在一个函数里：和后台那几段脚本共用一个全局作用域，名字不能重复声明；只往外露一个 window.pronOpen */
(function(){
try{
/* 教学阶梯（src/pron-lesson.ts 的 LESSON 和四级名字）。页面上每一句关于"这个音怎么发"的话都出自这里 */
var PNL=`;

const PRON_JS_TAIL = `;
var PN={base:(window.__pronBase||'/api/pron/'),zu:[],cur:null,ji:null,step:1,loaded:false,busy:false,
  q:[],i:0,ok:0,same:0,bad:[],au:{},auBusy:{},player:null,rec:null,recId:'',recT0:0,recBtn:null,
  /* 「跟我做」：bu = 这一组的那串步骤、si = 走到第几步、fin = 走完了没 */
  bu:[],si:0,fin:false,
  /* 念给我听：speak = 自动念开着没（存 localStorage）、noSpeak = 这台设备读不了中文 */
  speak:true,noSpeak:false,
  /* 镜子拿到的摄像头流：**只赋给 video.srcObject**，关掉时 getTracks().stop()。不录、不传、不存。
     camSeq 是请求序号：getUserMedia 要等他点权限弹窗，这中间他可能已经关掉镜子、
     走到收尾屏、或者又点了一下。流回来时序号对不上就**当场 stop 掉**，绝不留一个没人管的流亮着。 */
  cam:null,camSeq:0,camWant:0,
  /* 播放：rate 这一次的倍速（放完回 1）、onEnd 这一次放完做什么（「连着放」用）、slow 慢速按钮按下没。
     chainT 是「连着放」中间那 0.3 秒的定时器——**必须存起来**，换组、换步、开考时要掐掉它。 */
  rate:1,onEnd:null,slow:false,chainT:null,
  /* 他刚才那段录音：只在这个页面里（URL.createObjectURL），刷新就没了 */
  myUrl:'',myWord:'',mySay:''};
var pq=function(i){return document.getElementById(i)};
function pText(id,s){var e=pq(id);if(e)e.textContent=s}
function pShow(id,on){var e=pq(id);if(e)e.hidden=!on}
function pClear(e){while(e&&e.firstChild)e.removeChild(e.firstChild)}
/* 出错一律把服务器那两句话原样摆出来，不吞掉 */
function pErr(j){var e=pq('pn-err');if(!e)return;
  var s=(j&&(j['出错']||j.error))||'出错了';
  if(j&&j['怎么办'])s+='\\n怎么办：'+j['怎么办'];
  e.textContent=s;e.hidden=false;}
function pJson(path,init){return fetch(PN.base+path,init||{}).then(function(r){
  return r.json().catch(function(){return {}}).then(function(j){
    if(!r.ok){var e=new Error(j['出错']||j.error||('出错了（'+r.status+'）'));e.j=j;throw e;}
    return j;
  });
});}
function pPost(path,body){return pJson(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});}

/* ---- 发音：同一段只取一次，之后复用；**失败就当面说，不自动重试** ---- */
function pAuErr(j,msgId){
  var m=pq(msgId||'pn-msg');if(!m)return;
  var s='这个词的发音没生成出来，这一次先跳过发音（上面的字和音标照常看）。';
  if(j&&j['出错'])s+='\\n'+j['出错'];
  if(j&&j['怎么办'])s+='\\n怎么办：'+j['怎么办'];
  m.textContent=s;m.hidden=false;
}
function pPlay(url,msgId){
  try{
    if(!PN.player)PN.player=new Audio();
    var a=PN.player;a.pause();a.src=url;
    /* 慢速 0.7 倍和「连着放」都**用同一个播放器**（不另写一个）：倍速和"放完做什么"都只管这一次，用完就还原 */
    a.playbackRate=PN.rate||1;PN.rate=1;
    var on=PN.onEnd;PN.onEnd=null;
    a.onended=null;
    if(on)a.onended=function(){a.onended=null;on();};
    var pr=a.play();
    // **AbortError 不是错**（2026-11-11 修）：第 2 步就是让他来回点两个词对比，
    // 后一次 play() 必然打断前一次，前一次的 promise 就以 AbortError 被拒
    // （"The play() request was interrupted by a new load request"）。
    // 原来这里不分青红皂白全报「浏览器把这次播放挡住了」——**他照我们设计的动作做，反而蹦出一个假错误**。
    // 只有真被拦住（NotAllowedError）或别的毛病才报。
    if(pr&&pr.catch)pr.catch(function(e){
      if(e&&e.name==='AbortError')return;
      pAuErr({'出错':'浏览器把这次播放挡住了。','怎么办':'再点一下这个按钮就会响。'},msgId);
    });
  }catch(e){pAuErr({'出错':'这台设备放不了这段声音。'},msgId);}
}
function pAudio(id,msgId){
  if(!id)return;
  var m=pq(msgId||'pn-msg');if(m)m.hidden=true;
  if(PN.au[id]){pPlay(PN.au[id],msgId);return;}
  /* 第一次要现生成，aura 要一两秒。这期间他若再点一下，不拦住就会**再发一个请求、再调一次模型、再记一次账** */
  if(PN.auBusy[id])return;
  PN.auBusy[id]=1;
  if(m){m.textContent='第一次要先生成这个词的发音，一两秒……';m.hidden=false;}
  var done=function(){delete PN.auBusy[id];};
  fetch(PN.base+'audio/'+encodeURIComponent(id)).then(function(r){
    var ct=r.headers.get('content-type')||'';
    if(!r.ok||ct.indexOf('audio')<0){return r.json().catch(function(){return {}}).then(function(j){done();pAuErr(j,msgId)});}
    return r.blob().then(function(b){done();if(m)m.hidden=true;var u=URL.createObjectURL(b);PN.au[id]=u;pPlay(u,msgId);});
  },function(e){done();pAuErr({'出错':'没连上服务器（'+e.message+'）。','怎么办':'等一下再点一次。'},msgId);});
}

/* ---- 选一组 ---- */
function pPick(){
  var box=pq('pn-pick');if(!box)return;
  pClear(box);
  PN.zu.forEach(function(z){
    var b=document.createElement('button');
    b.type='button';
    b.className='btn'+(PN.cur&&PN.cur['组']===z['组']?' primary':'');
    b.setAttribute('aria-pressed',PN.cur&&PN.cur['组']===z['组']?'true':'false');
    b.appendChild(document.createTextNode(z['名字']));
    var s=document.createElement('span');s.className='p-s';
    s.textContent=z['能听辨']?(z['元音还是辅音']+' · 第 '+z['第几课']+' 课'):(z['元音还是辅音']+' · 只能跟读纠说');
    b.appendChild(s);
    b.addEventListener('click',function(){pUse(z['组']);});
    box.appendChild(b);
  });
}
function pUse(id){
  var z=null;
  PN.zu.forEach(function(x){if(x['组']===id)z=x;});
  if(!z)return;
  PN.cur=z;PN.q=[];PN.i=0;PN.ok=0;PN.same=0;PN.bad=[];
  /* 换一组：上一组录的那段是**另一个词**，留着会误导 —— 当场丢掉（底线 3） */
  pPlayReset();pMyDrop();
  /* 这一组的教学阶梯（取不到就空着：页面宁可什么都不说，也不自己补一句课件没有的话） */
  PN.bu=[];
  (PNL['组']||[]).forEach(function(k){if(k['组']===id)PN.bu=k['步']||[];});
  PN.si=0;PN.fin=false;
  pPick();pCmp();pSayWords();pLead();pStep(1);pCoach();
}
/* 丢掉上一段录音（换组、刷新都会丢；它本来就只活在这个页面里） */
function pMyDrop(){
  if(PN.myUrl)try{URL.revokeObjectURL(PN.myUrl);}catch(e){}
  PN.myUrl='';PN.myWord='';PN.mySay='';PN.slow=false;
  var b=pq('pn-slow');if(b){b.setAttribute('aria-pressed','false');b.textContent='🐢 慢速 0.7 倍';}
  pShow('pn-my',false);
}

/* ====================================================================
   第 1 步：跟我做（2026-11-12）
   **一屏上只有一步**：第几级 → 这一句指令 → 大字内容 → 提示 → 依据。
   每一个字都来自 PNL（src/pron-lesson.ts），这里**一句关于"这个音怎么发"的话都不自己写**（底线 3）。
   ==================================================================== */
/* 课件原文里用两个星号标重点（例如"但**不要碰到任何地方**"）：原样摆上去会看见那几个星号，
   所以这里只把星号换成加粗 —— **一个字都没改、没加、没删**，只是把标记变成样子。 */
function pBold(el,s){
  pClear(el);
  String(s==null?'':s).split('**').forEach(function(part,i){
    if(!part)return;
    if(i%2){var b=document.createElement('b');b.textContent=part;el.appendChild(b);}
    else el.appendChild(document.createTextNode(part));
  });
}
/* 这一步在第几级、这一组一共几步 */
function pStepNow(){return PN.bu[PN.si]||null;}
/* 课程四级练法的轨：当前级高亮，走过的标成完成 */
function pRail(){
  var box=pq('pn-rail');if(!box)return;
  pClear(box);
  var s=pStepNow();
  var now=PN.fin?(PNL['级']||[]).length:(s?s['lv']:0);
  (PNL['级']||[]).forEach(function(name,k){
    var e=document.createElement('span');
    e.className='pn-lv'+(k===now?' on':(k<now?' ok':''));
    e.setAttribute('data-lv',String(k));
    e.textContent=(k+1)+'. '+name;
    box.appendChild(e);
  });
}
/* 这一步要的那个词（🔊 / 🎤 用）：编号 → 这一组里那个词，取不到就没有这个按钮 */
function pWordOf(id){
  var got=null;
  if(!id||!PN.cur)return null;
  (PN.cur['对']||[]).forEach(function(p){['a','b'].forEach(function(k){if(p[k]['编号']===id)got=p[k];});});
  return got;
}
function pCBtn(label,cls,fn){
  var b=document.createElement('button');
  b.type='button';b.className='btn'+(cls?' '+cls:'');
  b.textContent=label;
  b.addEventListener('click',fn);
  return b;
}
/* 念出来的是哪些字：这一步那句话 + 提示（**自动念和手点那个按钮走同一个函数，不许有两套**） */
function pSayText(s){return s['说']+(s['提示']?('　'+s['提示']):'');}
/* 画这一步。move = 这次是不是"翻到了新的一句"（翻页才自动念，重画不念） */
function pCoach(move){
  var box=pq('pn-cbtns');
  if(!box)return;
  pShow('pn-csayver',false);pShow('pn-csaynote',false);pShow('pn-csaymsg',false);
  pRail();
  /* 走完了：收尾屏（课程的作业标准 + 课程没给自查方法这件事，都写在 PRON_MOD 里，不是生成的） */
  if(PN.fin||!PN.bu.length){
    pShow('pn-coach',false);pShow('pn-fin',PN.fin);
    pShow('pn-rail',true);
    pText('pn-cnum',PN.bu.length?('第 '+PN.bu.length+' / 共 '+PN.bu.length+' 步'):'这一组没有可走的步骤');
    var bar0=pq('pn-cbar');if(bar0)bar0.style.width=PN.bu.length?'100%':'0%';
    /* 收尾屏上没有口型要做了：镜子关掉（指示灯灭），那两个按钮也收起来（留着也没事可做） */
    pShow('pn-tools',false);
    if(PN.fin)pMirOff();
    return;
  }
  pShow('pn-coach',true);pShow('pn-fin',false);pShow('pn-tools',true);
  var s=pStepNow();
  pText('pn-clv','第 '+(s['lv']+1)+' 级 · '+((PNL['级']||[])[s['lv']]||''));
  pBold(pq('pn-csay'),s['说']);
  pShow('pn-cbig',!!s['大']);
  if(s['大'])pText('pn-cbig',s['大']);
  pShow('pn-chint',!!s['提示']);
  if(s['提示'])pBold(pq('pn-chint'),s['提示']);
  /* 依据：先标这句话是哪一类（课件原文 / 课程练法 / 机械拆分），再把「依据」原文照抄。
     依据本身就是那三个字开头的（"课件原文：咧嘴"），就不再把那三个字写第二遍。 */
  var src=pq('pn-csrc');
  pClear(src);
  if(s['依据'].indexOf(s['类'])!==0){
    var tag=document.createElement('span');tag.className='c-tag';tag.textContent=s['类'];src.appendChild(tag);
  }
  src.appendChild(document.createTextNode(s['依据']));
  /* 按钮：🔊 只在这一步有标准音时给、🎤 只在这一步能纠说时给；主按钮永远在 */
  pClear(box);
  var au=pWordOf(s['音']);
  if(au)box.appendChild(pCBtn('🔊 听标准音','',function(){pAudio(s['音'],'pn-csaymsg');}));
  var mi=pWordOf(s['麦']);
  if(mi){
    var mb=pCBtn('🎤 我念一遍','',function(){pRec(mb);});
    mb.dataset.word=s['麦'];mb.dataset.say=mi['词'];mb.dataset.ui='c';
    box.appendChild(mb);
  }
  box.appendChild(pCBtn(PN.si+1<PN.bu.length?'做好了，下一步':'做好了，这一组走完','go primary',pCNext));
  box.appendChild(pCBtn(PN.noSpeak?'这台设备读不了中文，照着屏幕做就行':'🔈 念给我听','',function(){
    pSpeak(pSayText(s));
  }));
  if(PN.si>0)box.appendChild(pCBtn('上一步','',pCPrev));
  pText('pn-cnum','第 '+(PN.si+1)+' / 共 '+PN.bu.length+' 步');
  var bar=pq('pn-cbar');if(bar)bar.style.width=Math.round((PN.si+1)*100/PN.bu.length)+'%';
  pMirTarget();
  /* 翻到新的一句就自动念（这样他可以对着镜子做，不用盯着屏幕）；开关关掉就不念。
     **念的内容和手点「🔈 念给我听」完全一样**（那一句 + 提示）：
     提示里才有"塞一根手指""捏住鼻子"这种能照着做的话，只念前半句等于还是要他低头看屏幕 */
  if(move&&PN.speak)pSpeak(pSayText(s));
}
function pCNext(){
  if(PN.si+1<PN.bu.length){PN.si++;pCoach(true);return;}
  PN.fin=true;pCoach();
}
function pCPrev(){
  if(PN.fin){PN.fin=false;pCoach(true);return;}
  if(PN.si>0){PN.si--;pCoach(true);}
}
function pRedo(){PN.fin=false;PN.si=0;pCoach(true);}

/* ---- 念给我听：浏览器自己带的朗读（**不调任何 AI、不花一分钱、不加环境变量**）---- */
/* 这台设备读不了中文：按钮上当面说清楚，自动念也关掉，**其余功能照常能用**（不整屏挂掉） */
function pNoSpeak(){
  PN.noSpeak=true;PN.speak=false;
  var a=pq('pn-auto');if(a){a.textContent='这台设备读不了中文，照着屏幕做就行';a.setAttribute('aria-pressed','false');}
  var box=pq('pn-cbtns');
  if(box)[].forEach.call(box.querySelectorAll('.btn'),function(b){
    if(b.textContent.indexOf('念给我听')>=0)b.textContent='这台设备读不了中文，照着屏幕做就行';
  });
}
function pCanSpeak(){
  try{
    if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=='function')return false;
    var vs=[];
    try{vs=window.speechSynthesis.getVoices()||[];}catch(e){vs=[];}
    /* 声音列表第一次可能还没加载好（是空的）——**空的时候不当作"没有中文"**，念一次就知道了 */
    if(vs.length&&!vs.some(function(v){return /^zh/i.test(String(v&&v.lang||''))}))return false;
    return true;
  }catch(e){return false;}
}
function pSpeak(t){
  if(!pCanSpeak()){pNoSpeak();return false;}
  try{
    window.speechSynthesis.cancel();
    var u=new window.SpeechSynthesisUtterance(String(t||''));
    u.lang='zh-CN';
    u.rate=0.85;   /* 语速稍慢：他要跟着做动作，不是听新闻 */
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){pNoSpeak();return false;}
}
/* 自动念的开关：存 localStorage（**包 try/catch**，取不到就当默认开着） */
function pAutoLabel(){
  var a=pq('pn-auto');if(!a)return;
  if(PN.noSpeak){a.textContent='这台设备读不了中文，照着屏幕做就行';a.setAttribute('aria-pressed','false');return;}
  a.textContent=PN.speak?'🔈 自动念：开着':'🔇 自动念：关着';
  a.setAttribute('aria-pressed',PN.speak?'true':'false');
}
function pAutoLoad(){
  try{var v=window.localStorage.getItem('pn-auto-speak');PN.speak=(v!=='off');}catch(e){PN.speak=true;}
  pAutoLabel();
}
function pAutoToggle(){
  if(PN.noSpeak)return;
  PN.speak=!PN.speak;
  try{window.localStorage.setItem('pn-auto-speak',PN.speak?'on':'off');}catch(e){}
  if(!PN.speak)try{window.speechSynthesis.cancel();}catch(e){}
  pAutoLabel();
}

/* ====================================================================
   照镜子：前置摄像头当镜子（Amos 2026-11-11 最想要的那一样）
   **画面绝对不上传、不保存、不录**：拿到的流只做两件事 —— 赋给 video.srcObject、关掉时 track.stop()。
   这一整段里**没有录像机、没有画布、没有任何一种截帧的做法**，一次网络请求都不发
   （那些 API 的名字连写都不许写进这个文件 —— test/pron.test.ts 第 12 组逐个名字守着）。
   2026-11-12：左边那张"目标口型图"随口型图一起撤掉了，改成显示**这一步要做的那句话**。
   ==================================================================== */
function pMirMsg(s){var m=pq('pn-mirmsg');if(!m)return;m.textContent=s;m.hidden=false;}
/* 镜子左边：当前这一步的那句指令（课件原文的话，不是这里编的） */
function pMirTarget(){
  var box=pq('pn-mirtarget');if(!box)return;
  var s=pStepNow();
  pBold(box,s?s['说']:'');
  pText('pn-mircap',s?('这一步要做的（第 '+(PN.si+1)+' / 共 '+PN.bu.length+' 步）'):'这一步要做的');
}
function pMirOff(){
  try{
    /* 关掉时**必须 stop()**，不然摄像头指示灯一直亮着 */
    if(PN.cam&&PN.cam.getTracks)PN.cam.getTracks().forEach(function(t){t.stop();});
  }catch(e){}
  PN.cam=null;
  /* **撤销还在路上的那次请求**（审查 🔴2）：序号一往前走，流回来时就对不上，会被当场 stop 掉 */
  PN.camWant=0;PN.camSeq++;
  var v=pq('pn-cam');if(v)try{v.srcObject=null;}catch(e){}
  pShow('pn-mirwrap',false);
  var b=pq('pn-mir');if(b){b.textContent='🪞 照镜子';b.setAttribute('aria-pressed','false');}
}
/* 按钮字样还原（「正在开摄像头……」这个中间态要收得回来） */
function pMirReset(){var b=pq('pn-mir');if(b){b.textContent='🪞 照镜子';b.setAttribute('aria-pressed','false');}}
/* 一个流到了，但已经没人要它了：**立刻掐掉**，绝不留着亮指示灯 */
function pCamDrop(stream){try{stream.getTracks().forEach(function(t){t.stop();});}catch(e){}}
function pMirOn(){
  if(PN.cam){pMirOff();return;}
  /* 已经在等权限弹窗了，再点一下不许再发一个请求（审查 🔴2 复现 C：
     手机上第一次要等弹窗，连点两下就会开出**两个流**，而 PN.cam 只记得住后一个，
     前一个永远没人 stop ——「关掉镜子」按下去指示灯也不灭） */
  if(PN.camWant)return;
  var md=navigator.mediaDevices;
  if(!md||!md.getUserMedia){
    pMirMsg('这个浏览器用不了摄像头，镜子打不开。\\n怎么办：换 Chrome / Safari 的新版本再试；上面的那句指令、对照听和考题照常能用。');
    return;
  }
  var m=pq('pn-mirmsg');if(m)m.hidden=true;
  var seq=++PN.camSeq;PN.camWant=seq;
  var b0=pq('pn-mir');if(b0)b0.textContent='🪞 正在开摄像头……';
  md.getUserMedia({video:{facingMode:'user'},audio:false}).then(function(stream){
    /* 等权限的这段时间里他可能已经关掉镜子、走到收尾屏、或者整个切走了。
       **这三种情况一律把流掐掉**，不显示、不保留（审查 🔴2 复现 A / B）。 */
    if(seq!==PN.camSeq||PN.camWant!==seq||PN.step!==1||PN.fin){PN.camWant=0;pCamDrop(stream);pMirReset();return;}
    PN.camWant=0;
    PN.cam=stream;
    var v=pq('pn-cam');
    if(v)try{v.srcObject=stream;}catch(e){}
    pShow('pn-mirwrap',true);
    pMirTarget();
    var b=pq('pn-mir');if(b){b.textContent='🪞 镜子开着';b.setAttribute('aria-pressed','true');}
  },function(e){
    PN.camWant=0;pMirReset();
    /* 没给权限 / 没有摄像头：当面说清楚，**整屏其余部分照常能用** */
    pMirMsg('没拿到摄像头权限（'+(e&&e.name||e)+'），镜子用不了。\\n怎么办：在浏览器地址栏左边的图标里允许摄像头，再按一次「🪞 照镜子」。不给也没关系 —— 上面那句指令、对照听和考题照常能用。');
  });
}

/* ---- 第 2 步：慢速对照 + 他自己的录音回放（录过才出现）---- */
/* 这一次用什么倍速：慢速按钮按下去就是 0.7 倍（标准音和他的录音都慢） */
function pRate(){return PN.slow?0.7:1;}
function pSetNext(rate,onEnd){PN.rate=rate||1;PN.onEnd=onEnd||null;}
/* **把"这一次播放"的意图清空**（2026-11-11 审查 🔴3）。
   pSetNext() 把倍速和"放完做什么"写进 PN，由下一次 pPlay() 取走。可是 pAudio() 有两条路**根本走不到 pPlay**：
   这个词正在生成（auBusy 早退）、或者取发音失败。那 0.7 倍和那个回调就**留在枪膛里**，
   被后面某一次毫不相干的播放打出去——**考题会被 0.7 倍慢放，他自己录的那个词会在考题上面再响一遍**，
   然后揭晓时页面说"刚才放的是 leather"。那是当面给他一个和事实不符的交代（底线 3）。
   所以换组、换步、开考之前一律清空，连「连着放」那 0.3 秒的定时器也掐掉。 */
function pPlayReset(){
  PN.rate=1;PN.onEnd=null;
  if(PN.chainT){clearTimeout(PN.chainT);PN.chainT=null;}
  if(PN.player)PN.player.onended=null;
}
function pMyShow(){
  pShow('pn-my',!!PN.myUrl);
  if(PN.myUrl)pText('pn-my-t','挨着听：标准音和你刚才念的「'+PN.mySay+'」');
}
function pMyStd(){if(!PN.myWord)return;pSetNext(pRate(),null);pAudio(PN.myWord,'pn-msg');}
function pMyMine(){if(!PN.myUrl)return;pSetNext(pRate(),null);pPlay(PN.myUrl,'pn-msg');}
function pMySlow(){
  PN.slow=!PN.slow;
  var b=pq('pn-slow');if(b){b.setAttribute('aria-pressed',PN.slow?'true':'false');b.textContent=PN.slow?'🐢 慢速开着（0.7 倍）':'🐢 慢速 0.7 倍';}
}
/* 连着放：标准音 → 停 0.3 秒 → 他的录音。对比效果最好的那一个形式 */
function pMyChain(){
  if(!PN.myWord||!PN.myUrl)return;
  pPlayReset();
  pSetNext(pRate(),function(){
    PN.chainT=setTimeout(function(){
      PN.chainT=null;
      /* 这 0.3 秒里他可能已经换组了（pMyDrop() 会 revoke 掉这个 url）。
         不再确认一次就 pPlay('')，play() 会以 NotSupportedError 被拒，
         于是当面蹦出一个「浏览器把这次播放挡住了」的**假错误**——
         和 11/11 刚修掉的 AbortError 是同一类毛病（审查 🟡8）。 */
      if(!PN.myUrl)return;
      pSetNext(pRate(),null);pPlay(PN.myUrl,'pn-msg');
    },300);
  });
  pAudio(PN.myWord,'pn-msg');
}

/* ---- 第 2 步：对照听（最小对立对，两个词各一个大按钮）---- */
function pCmp(){
  var box=pq('pn-cmp');if(!box||!PN.cur)return;
  pClear(box);
  var minimal=(PN.cur['对']||[]).filter(function(p){return p['最小对立对']});
  var rows=minimal.length?minimal:(PN.cur['对']||[]);
  rows.forEach(function(p){
    var d=document.createElement('div');d.className='pn-pair';
    var t=document.createElement('p');t.className='q-t';
    t.textContent=minimal.length?('第 '+p['第几对']+' 对：'+p.a['词']+' '+p.a['音标']+'　·　'+p.b['词']+' '+p.b['音标'])
      :('跟读：'+p.a['词']+' '+p.a['音标']+'　·　'+p.b['词']+' '+p.b['音标']);
    d.appendChild(t);
    var two=document.createElement('div');two.className='pn-two';
    ['a','b'].forEach(function(k){
      var b=document.createElement('button');b.type='button';b.className='btn';
      b.textContent='🔊 '+p[k]['词'];
      b.addEventListener('click',function(){pAudio(p[k]['编号'],'pn-msg');});
      two.appendChild(b);
    });
    d.appendChild(two);box.appendChild(d);
  });
  pText('pn-note2',PN.cur['听辨说明']||'');
  /* 这一组没有最小对立对：**不给「开始考」这个按钮**，照实说只能跟读和纠说（不硬凑题） */
  pShow('pn-go3wrap',!!PN.cur['能听辨']);
}

/* ---- 纠说：他念，机器听（第 1 步每一句的 🎤、第 2 步的词表，用的是同一条链路）---- */
function pSayWords(){
  var box=pq('pn-saywords');if(!box||!PN.cur)return;
  pClear(box);
  pShow('pn-sayver',false);pShow('pn-saynote',false);
  var m=pq('pn-saymsg');if(m)m.hidden=true;
  var any=false;
  (PN.cur['对']||[]).forEach(function(p){
    var ks=['a','b'].filter(function(k){return p[k]['能纠说']});
    if(!ks.length)return;
    any=true;
    var two=document.createElement('div');two.className=ks.length>1?'pn-two':'pn-one';
    two.style.marginBottom='12px';
    ks.forEach(function(k){
      var b=document.createElement('button');b.type='button';b.className='btn';
      b.textContent='🎤 念 '+p[k]['词'];
      b.dataset.word=p[k]['编号'];
      b.dataset.say=p[k]['词'];
      b.addEventListener('click',function(){pRec(b);});
      two.appendChild(b);
    });
    box.appendChild(two);
  });
  if(!any){
    var e=document.createElement('p');e.className='pn-hint';
    e.textContent='这一组里没有适合纠说的词（课件给的几个不是现代常用词，语音识别基本不会输出它们，拿它们判对错是冤枉人）。';
    box.appendChild(e);
  }
}
function pSayMsg(s){var m=pq('pn-saymsg');if(!m)return;m.textContent=s;m.hidden=false;}
/* 第 1 步那一句旁边的 🎤：出错的话要说在**他正看着的那一屏**上，不是藏在第 2 步里 */
function pCSayMsg(s){var m=pq('pn-csaymsg');if(!m)return;m.textContent=s;m.hidden=false;}
function pSayWhere(b){return (b&&b.dataset&&b.dataset.ui==='c')?pCSayMsg:pSayMsg;}
function pSayId(b,n){return ((b&&b.dataset&&b.dataset.ui==='c')?'pn-c':'pn-')+n;}
function pRecStop(){
  try{if(PN.rec&&PN.rec.state!=='inactive')PN.rec.stop();}catch(e){}
}
/* 一个按钮两态：没在录 = 「🎤 念 bad」/「🎤 我念一遍」，正在录 = 「⏹ 停止（录音中）」。手机上单手就能用 */
function pRecLabel(b,on){if(b)b.textContent=(on?'⏹ 停止（录音中）':(b.dataset.ui==='c'?'🎤 我念一遍':'🎤 念 '+b.dataset.say));}
function pRec(b){
  var say=pSayWhere(b);
  if(PN.rec&&PN.recBtn===b){pRecStop();return;}
  if(PN.rec){pRecStop();return;}
  var md=navigator.mediaDevices;
  if(!md||!md.getUserMedia||typeof MediaRecorder==='undefined'){
    say('这个浏览器不支持录音，纠说用不了。\\n怎么办：换 Chrome / Safari 的新版本再试；上面的「跟我做」、对照听和考题照常能用。');
    return;
  }
  var m=pq(pSayId(b,'saymsg'));if(m)m.hidden=true;
  pShow(pSayId(b,'sayver'),false);pShow(pSayId(b,'saynote'),false);
  md.getUserMedia({audio:true}).then(function(stream){
    var r;
    try{r=new MediaRecorder(stream);}catch(e){
      stream.getTracks().forEach(function(t){t.stop()});
      say('这个浏览器录不了音（'+(e&&e.message||e)+'），纠说用不了。\\n怎么办：换 Chrome / Safari 的新版本再试；其余部分照常能用。');
      return;
    }
    var chunks=[];
    PN.rec=r;PN.recBtn=b;PN.recId=b.dataset.word;PN.recT0=Date.now();
    pRecLabel(b,true);
    r.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data);};
    r.onstop=function(){
      var secs=(Date.now()-PN.recT0)/1000;
      stream.getTracks().forEach(function(t){t.stop()});
      PN.rec=null;pRecLabel(b,false);PN.recBtn=null;
      var blob=new Blob(chunks,{type:(r.mimeType||'audio/webm')});
      if(!blob.size){say('没录到声音（0 字节）。\\n怎么办：确认麦克风没被静音，再按一次「🎤 念」。');return;}
      /* **把这段录音留在浏览器里**给他回放用（不另外上传；纠说那一次本来就要传，照旧）。刷新就没了，页面上写着 */
      pMyDrop();
      try{PN.myUrl=URL.createObjectURL(blob);PN.myWord=b.dataset.word;PN.mySay=b.dataset.say;pMyShow();}catch(e){}
      var fr=new FileReader();
      fr.onerror=function(){say('这段录音读不出来。\\n怎么办：再按一次「🎤 念」重录一次（不会自动重试）。');};
      fr.onload=function(){
        var s=String(fr.result||'');
        var i=s.indexOf(',');
        pSayGo(b,s.slice(i+1),secs);
      };
      fr.readAsDataURL(blob);
    };
    r.start();
  },function(e){
    /* 没给麦克风权限：当面说清楚，**其余部分照常能用** */
    say('没拿到麦克风权限（'+(e&&e.name||e)+'），纠说用不了。\\n怎么办：在浏览器地址栏左边的图标里允许麦克风，再按一次「🎤 念」。不给也没关系 —— 上面的「跟我做」、对照听和考题照常能用。');
  });
}
function pSayGo(b,audio,secs){
  if(PN.busy)return;
  PN.busy=true;
  pRecLabel(b,false);
  b.textContent='机器正在听……';
  pPost('say',{'组':PN.cur['组'],'词':b.dataset.word,audio:audio,seconds:secs}).then(function(j){
    PN.busy=false;pRecLabel(b,false);
    var v=pq(pSayId(b,'sayver'));
    if(v)v.className='pn-sayver '+(j['判定']===1?'ok':(j['判定']===0?'no':'other'));
    pText(pSayId(b,'sayver'),j['一句话']||'');
    pShow(pSayId(b,'sayver'),true);
    pText(pSayId(b,'saynote'),(j['这是线索不是判决']||'')+'（今天已经纠了 '+j['今天已经纠了几次']+' 次，一天最多 '+j['一天最多']+' 次）');
    pShow(pSayId(b,'saynote'),true);
  },function(e){
    PN.busy=false;pRecLabel(b,false);
    var j=e.j||{'出错':e.message};
    pSayWhere(b)((j['出错']||'没听成')+(j['怎么办']?'\\n怎么办：'+j['怎么办']:''));
  });
}

/* ---- 第 3 步：考（同一组连考，不换别的音）---- */
function pMix(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pCoin(){return Math.random()<0.5?'a':'b';}
function pOther(x){return x==='a'?'b':'a';}
function pRound(){
  if(!PN.cur||!PN.cur['能听辨'])return;
  /* 开考：把第 2 步留下的倍速和「连着放」的尾巴掐干净，**考题只能原速、只能放考题那个词**（审查 🔴3） */
  pPlayReset();
  var minimal=(PN.cur['对']||[]).filter(function(p){return p['最小对立对']});
  if(!minimal.length)return;
  /* 不够 10 对就重复抽（页面上已经照实说过"同一对会考到好几次"）；放哪个词、左右位置都随机 */
  var list=[];
  var pool=[];
  while(list.length<10){
    if(!pool.length)pool=pMix(minimal.slice());
    var p=pool.pop();
    list.push({p:p,say:pCoin(),left:pCoin()});
  }
  PN.q=list;PN.i=0;PN.ok=0;PN.same=0;PN.bad=[];
  pStep(3);pQ();
}
function pQ(){
  var x=PN.q[PN.i];if(!x)return;
  pText('pn-l',x.p[x.left]['词']);
  pText('pn-r',x.p[pOther(x.left)]['词']);
  pText('pn-where','第 '+(PN.i+1)+' 题 / 共 '+PN.q.length+'（'+PN.cur['名字']+'）');
  var b=pq('pn-qbar');if(b)b.style.width=Math.round(PN.i*100/(PN.q.length||1))+'%';
  pText('pn-qleft','这一轮只考这一组的两个音，不换别的；分不出来就点「两个听着一样」。');
  pShow('pn-q',true);pShow('pn-res',false);pShow('pn-err',false);
  var m=pq('pn-msg');if(m)m.hidden=true;
  /* 进这一题自动放一次（按钮上**只有「🔊 再听一次」**，绝不出现那个词） */
  pAudio(x.p[x.say]['编号'],'pn-msg');
}
/* 选完：**对错由服务端算**（页面不自己判） */
function pAnswer(k){
  if(PN.busy)return;
  var x=PN.q[PN.i];if(!x)return;
  var 选的=k==='same'?'same':(k==='left'?x.left:pOther(x.left));
  PN.busy=true;pShow('pn-err',false);
  pPost('answer',{'组':PN.cur['组'],'第几对':x.p['第几对'],'放的':x.say,'选的':选的}).then(function(j){
    PN.busy=false;pRes(x,j);
  },function(e){PN.busy=false;pErr(e.j||{'出错':e.message});});
}
function pRes(x,j){
  var was=(j['放的是']||{})['词']||'';
  var v=pq('pn-ver');
  if(j['两个听着一样']){
    PN.same++;
    if(v)v.className='pn-ver same';
    pText('pn-ver','你说两个听着一样 —— 刚才放的是 '+was);
  }else if(j['对']){
    PN.ok++;
    if(v)v.className='pn-ver ok';
    pText('pn-ver','✅ 对了 —— 刚才放的就是 '+was);
  }else{
    if(v)v.className='pn-ver no';
    pText('pn-ver','❌ 不对 —— 刚才放的是 '+was+'，你点的是 '+(j['你选的']||''));
  }
  if(!j['对'])PN.bad.push(x.p);
  /* 答错（含「两个听着一样」）当场把第 2 步的对照听塞回来 */
  var back=!j['对'];
  pText('pn-back',j['两个听着一样']
    ?'分不出来 —— 先回到对照听：两个词各点几次，听不出区别就是机器没念出来，说一声我们换模型。听完再点「继续」。'
    :'答错了 —— 先回到对照听：两个词都点一遍，听出差别再点「继续」。这一步才是学的地方。');
  pShow('pn-back',back);
  pText('pn-wa','🔊 '+x.p.a['词']);
  pText('pn-wb','🔊 '+x.p.b['词']);
  pText('pn-ipa',x.p.a['词']+' '+x.p.a['音标']+'　·　'+x.p.b['词']+' '+x.p.b['音标']);
  pText('pn-next',PN.i+1<PN.q.length?'继续':'看这一轮过没过');
  pShow('pn-q',false);pShow('pn-res',true);
  var m=pq('pn-msg');if(m)m.hidden=true;
}
function pNext(){
  PN.i++;
  if(PN.i<PN.q.length){pQ();return;}
  pDone();
}
/* ---- 第 4 步：过关 + 绕口令 ---- */
function pDone(){
  if(PN.busy)return;
  PN.busy=true;pShow('pn-err',false);
  pPost('round',{'组':PN.cur['组'],'考了':PN.q.length,'对':PN.ok,'两个听着一样':PN.same}).then(function(j){
    PN.busy=false;PN.ji=j['记录']?{'记录':j['记录']}:PN.ji;
    var box=pq('pn-sum');
    if(box)box.className='pn-sum '+(j['过关']?'pass':'fail');
    pText('pn-score',(j['过关']?'✅ 过关了：':'还没过：')+'10 题对 '+j['对']+' 题'+(j['两个听着一样']?('，点过 '+j['两个听着一样']+' 次「两个听着一样」'):''));
    pText('pn-line',j['一句话']||'');
    pShow('pn-twwrap',!!j['绕口令']);
    pText('pn-tw',j['绕口令']||'');
    pText('pn-how',j['怎么读']||'');
    var ul=pq('pn-wrong');
    if(ul){
      pClear(ul);
      var seen={};
      PN.bad.forEach(function(p){
        var key=p.a['词']+'/'+p.b['词'];
        if(seen[key])return;seen[key]=1;
        var li=document.createElement('li');
        li.textContent=p.a['词']+' '+p.a['音标']+' / '+p.b['词']+' '+p.b['音标'];
        ul.appendChild(li);
      });
      pShow('pn-wrongwrap',PN.bad.length>0);
    }
    pStep(4);pLead();
  },function(e){PN.busy=false;pErr(e.j||{'出错':e.message});});
}

/* ---- 四步之间切换 ---- */
function pStep(n){
  PN.step=n;
  /* 换一步就把上一步没打出去的播放意图清掉（审查 🔴3） */
  pPlayReset();
  /* 离开第 1 步：**镜子一定关掉**（track.stop()，指示灯灭），也把没念完的那句停掉，不在后台出声 */
  if(n!==1){pMirOff();pShutUp();}
  pShow('pn-s1',n===1);pShow('pn-s2',n===2);pShow('pn-s3',n===3);pShow('pn-s4',n===4);
  [].forEach.call(document.querySelectorAll('#pn-steps .pn-step'),function(e){
    var k=Number(e.dataset.st);
    e.className='pn-step'+(k<n?' ok':(k===n?' on':''));
  });
  if(n===2){pSayWords();}
}
/* 把朗读停掉（切走、切标签页都要停，不然他已经看不见这一屏了，手机还在念） */
function pShutUp(){try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(e){}}
function pLead(){
  var rec=null;
  ((PN.ji&&PN.ji['记录'])||[]).forEach(function(r){if(PN.cur&&r['组']===PN.cur['组'])rec=r;});
  var 过=0,考=0;
  ((PN.ji&&PN.ji['记录'])||[]).forEach(function(r){考+=r['考过几轮'];if(r['过关几轮']>0)过++;});
  pText('pn-lead-t','七组里过关过 '+过+' 组；一共考过 '+考+' 轮。现在练 '+((PN.cur&&PN.cur['名字'])||'')+'。');
  var dot=pq('pn-dot');if(dot)dot.className='dot '+(过>=7?'ok':(过>0?'amber':'gray'));
  pText('pn-aux',(PN.cur&&PN.cur['名字'])||'七组易错音');
  if(rec&&rec['最近一轮'])pText('pn-soft','这一组最近一轮：10 题对 '+rec['最近一轮']['对']+' 题，'+(rec['最近一轮']['过关']?'过了':'没过')+'。');
}

function pLoad(){
  return pJson('state').then(function(j){
    PN.zu=j['组']||[];PN.ji=j;
    pText('pn-old-t',j['旧的去哪了']||'');
    if(!PN.zu.length){pErr({'出错':'发音训练这一轮没有内容。','怎么办':'刷新一下页面再试。'});return;}
    pUse(PN.zu[0]['组']);
    pShow('pn-err',false);
  },function(e){
    pText('pn-lead-t','暂时读不到发音训练的记录');pErr(e.j||{'出错':e.message});
  });
}

var au=pq('pn-auto');if(au)au.addEventListener('click',pAutoToggle);
var rd=pq('pn-redo');if(rd)rd.addEventListener('click',pRedo);
var g2=pq('pn-go2');if(g2)g2.addEventListener('click',function(){pStep(2)});
var g3=pq('pn-go3');if(g3)g3.addEventListener('click',pRound);
var a1=pq('pn-again1');if(a1)a1.addEventListener('click',function(){var x=PN.q[PN.i];if(x)pAudio(x.p[x.say]['编号'],'pn-msg')});
var bl=pq('pn-l');if(bl)bl.addEventListener('click',function(){pAnswer('left')});
var br=pq('pn-r');if(br)br.addEventListener('click',function(){pAnswer('right')});
var bs=pq('pn-same');if(bs)bs.addEventListener('click',function(){pAnswer('same')});
var wa=pq('pn-wa');if(wa)wa.addEventListener('click',function(){var x=PN.q[PN.i];if(x)pAudio(x.p.a['编号'],'pn-msg')});
var wb=pq('pn-wb');if(wb)wb.addEventListener('click',function(){var x=PN.q[PN.i];if(x)pAudio(x.p.b['编号'],'pn-msg')});
var nx=pq('pn-next');if(nx)nx.addEventListener('click',pNext);
var ag=pq('pn-again2');if(ag)ag.addEventListener('click',pRound);
var b1=pq('pn-toS1');if(b1)b1.addEventListener('click',function(){pStep(1)});
var mi=pq('pn-mir');if(mi)mi.addEventListener('click',pMirOn);
var mf=pq('pn-miroff');if(mf)mf.addEventListener('click',pMirOff);
var ys=pq('pn-std');if(ys)ys.addEventListener('click',pMyStd);
var ym=pq('pn-mine');if(ym)ym.addEventListener('click',pMyMine);
var yw=pq('pn-slow');if(yw)yw.addEventListener('click',pMySlow);
var yc=pq('pn-chain');if(yc)yc.addEventListener('click',pMyChain);
pAutoLoad();
window.pronOpen=function(){if(PN.loaded)return;PN.loaded=true;pLoad();};
/* **离开这一块时必须叫一次**（2026-11-11 审查 🔴1）。
   宿主把这一块藏起来 / 这一页被离开的时候，**不会自己通知这一块**——
   于是他点完「照镜子」随手走开，手机上的摄像头指示灯一直亮着，页面上却什么都看不见；
   朗读也会在后台一直念下去。页面上那句「关掉镜子，摄像头指示灯就灭」必须是真的，所以走开 = 关掉。
   Practical（2026-11-12 搬家后）由 src/pron-shell.ts 在 pagehide 时调它；Marketing 是 route() 切菜单时调。 */
window.pronStop=function(){
  if(!PN.loaded)return;
  pMirOff();pShutUp();
  pPlayReset();
  try{if(PN.player)PN.player.pause();}catch(e){}
};
/* 切到别的标签页 / 锁屏 / 最小化：同样关掉（兜底，route() 管不到这些） */
try{document.addEventListener('visibilitychange',function(){
  if(document.hidden&&window.pronStop)window.pronStop();
});}catch(e){}
}catch(e){}
})();
`;

/** 阶梯是静态课件内容，打包时拼进脚本（不走接口的原因见文件头：pron.ts 去 import pron-lesson.ts 会成环） */
export const PRON_JS = PRON_JS_HEAD + JSON.stringify({ 级: [...级], 组: LESSON }) + PRON_JS_TAIL;
