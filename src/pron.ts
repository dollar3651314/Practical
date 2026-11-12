/**
 * 工作台「发音训练」（#/work/pron，模块 `#w-pron`；页面 src/pron-page.ts，内容 src/pron-content.ts，
 * 发音 src/pron-audio.ts，表 `pron_round` / `pron_say` / `pron_audio`，迁移 0019）。
 *
 * **它替掉了谁**（Amos 2026-11-11 原话）：「纠"说"也做出来，只不过我使用的慢一点儿罢了。
 * 工作台 英语练习和代练（带练）都没用了，**用你新做的东西彻底替换掉它们吧**」。
 * 「英语练习」（8 条 Gemini 提示词）、「它记得住你」（跨轮记忆）、「带练」（三段 18 项 + 复考 + 听辨小测）
 * 整套下线；**库里的旧表一张都没删**（drill_item / drill_review / drill_audio / ear_pair / en_*），他的历史数据还在。
 *
 * **为什么推倒重来**：旧的听辨小测**只会量、不会教** —— 放音 → 他选 → 给对错 → 下一题换一个完全不同的音。
 * 他连跑七轮 56 题，正确率 75% → 71%，一点没动，最后说「越听越乱，到最后纯靠猜」。
 * 课程（Top Speaker S1 语音课）给了缺的那一半：**先讲口型（可以用手指量）→ 对照听 → 同一组连考 → 过关给绕口令**。
 *
 * **四步循环**（这是全部价值所在，别改成别的）：
 *   1. **跟我做**（不考，2026-11-12 改）：**一次只说一句话**，他做完点一下才给下一句；
 *      四级阶梯（单音 → 音素拼合 → 单词拼读 → 句子和绕口令）照课程 S1 的练法顺序，由 `src/pron-lesson.ts` 生成，
 *      页面从那里取，服务端这里**不插手**（接口只给内容和成绩）。原来的"看口型"是一张参考卡，
 *      Amos 2026-11-12 原话「完全不知道该怎么开口」「口型图撤掉，念给我听要，开始做」，所以口型示意图整套撤掉。
 *   2. **对照听**（不考）：这一组的最小对立对，两个词各一个大按钮，想点几次点几次；
 *      **他自己点「我听出来了，开始考」才进第 3 步**。
 *   3. **考**（同一组连考 `ROUND_N` 题，**不换别的音**）：放一段音 → 两个词二选一 → 当场对错；
 *      **答错当场把第 2 步的对照听塞回来**，他点「继续」才出下一题。保留「两个听着一样」的全部语义。
 *   4. **过关**：`ROUND_N` 题对 `PASS_RATE` 才算过（80%，用的是这套课程 S2 的及格线，不是拍的）；
 *      过了给课件那句 `twister` + 三最法；没过说清楚错在哪几对，回第 1 步。
 *
 * **第 7 组（/ʒ/ vs /dʒ/）一对最小对立对都没有** —— `groupsForEar()` 已经把它排除，这里**照实说
 * 「这一组只能跟读和纠说」，不许硬凑题**；第 4 组只有 1 对，也照实说题会重复（底线 3）。
 *
 * **纠说**（他念、机器听）：`POST say`，Workers AI 的 `@cf/openai/whisper-large-v3-turbo`
 * （模型常量、价格、调用方式照 src/voice.ts 那一份，音频按 base64 传、带 `language: 'en'`）。
 * 判定只说**机器听成了什么**，不说"你念对了 / 念错了"（底线 3、9）：
 * 语音识别天生要对口音稳健，它可能把你念歪的 /e/ 也认成 bad —— **它听成什么是线索，不是判决**。
 * 只有 `asr: true` 的词能拿来纠说（`asrWordsOf`）：`ketch`、`reen`、`roose`、`rove` 不是现代常用词，
 * whisper 基本不会输出它们，拿它们判对错是冤枉人。
 *
 * **两道额度闸**（底线 8 / C117）：① Amos 自己在"用量和限额"里设的那个 cap（usedToday / dailyCap，不替他另设）；
 * ② 这一块自己的「一天最多 `MAX_SAY_PER_DAY` 次」（存 settings，照 src/voice.ts 的 MAX_RUNS_PER_DAY 那个做法）。
 * 一次纠说约 0.78 neurons（46.63 / 音频分钟 × 1 秒），很便宜，但闸照样要有。
 * **不碰密钥**（底线 1）：whisper 走 `env.AI` 绑定，不新增任何环境变量；这里存的只有组号、词、听成了什么和几个数。
 *
 * 入口 `/api/pron/*`（state / answer / round / say；发音 `audio/*` 由 queue.ts 直接分给 src/pron-audio.ts），
 * 走的是后台登录（queue.ts 的 sessionOk）。
 */
import type { Env } from './env';
import { asrWordsOf, GROUPS, minimalPairsOf, type PronGroup, type PronPair, type PronWord } from './pron-content';
import { accountLimitedMessage, isAccountLimited, noteAccountLimit, utcDay } from './usage';
import { chargeNeurons, dailyCap, usedToday, type AiLike } from './workers-ai';

/** 一轮考几题（同一组连考，不换别的音） */
export const ROUND_N = 10;
/** 及格线：10 题对 8 题。这是这套课程 S2 的及格线，**不是拍的** */
export const PASS_RATE = 0.8;
/** 这一轮过关了吗 */
export const passedRound = (asked: number, ok: number): boolean => asked > 0 && ok / asked >= PASS_RATE;

/** 纠说用的 ASR：和 src/voice.ts 的 `ASR.turbo` 同一个模型、同一个单价（Cloudflare 定价页 Audio model pricing） */
export const ASR_MODEL = '@cf/openai/whisper-large-v3-turbo';
/** 46.63 neurons / 音频分钟（定价页原文，src/voice.ts 的 ASR.turbo.每音频分钟） */
export const ASR_PER_MIN = 46.63;
/** 一段音频（秒）要多少 neurons：念一个词约 1 秒 ≈ 0.78 */
export const asrNeurons = (秒: number): number => (Math.max(0, 秒) / 60) * ASR_PER_MIN;
/** 纠说自己的闸：一天最多多少次（和 Amos 在"用量和限额"里设的那个 cap 是两回事，两道闸都要过） */
export const MAX_SAY_PER_DAY = 200;
/** 一次录音最多多少秒（念一个词，再长就是说错了用法） */
export const MAX_SAY_SEC = 15;
/** 一次上传的音频最多多少字节（base64 解出来以后） */
export const MAX_SAY_BYTES = 2_000_000;

/** 用量按项目记一行（后台"按项目看用量"） */
export const PRON_PROJECT = 'pron';
/** 用量按用途记一行：纠说（whisper）单独一项 */
export const PRON_ASR_PURPOSE = 'pron-asr';

/** 旧模块去哪了（页面顶上的折叠说明里原样显示，底线 9：说清楚，不装作没发生过） */
export const RETIRED_NOTE =
  '「英语练习」和「带练」（含它里面的听辨小测、复考）已经去掉 —— 你 2026-11-11 说「都没用了」。' +
  '旧的练法只会量不会教：放音、选、给对错、下一题换一个完全不同的音，七轮 56 题正确率从 75% 到 71%。' +
  '历史数据还在库里没删（drill_item、drill_review、drill_audio、ear_pair、en_* 这些表一张都没动），想翻还翻得到。';

// ======================================================================
// 一、编号：一个词一个编号，发音和纠说共用（纯函数，测试直接断言）
// ======================================================================

/** 词的编号：`<组号>-<第几对><a|b>`，例如 `g1-1a` = 第 1 组第 1 对的 a（bed） */
export const wordId = (g: PronGroup, i: number, k: 'a' | 'b'): string => `${g.id}-${i + 1}${k}`;
/** 全部 56 个词的编号（7 组 × 4 对 × 2），发音按这个生成、按这个存 */
export const PRON_WORD_IDS: string[] = GROUPS.flatMap((g) => g.pairs.flatMap((_, i) => [wordId(g, i, 'a'), wordId(g, i, 'b')]));

/** 编号 → 那个词（连同它在哪一组、哪一对、是 a 还是 b）；不认识回 null */
export function wordOf(id: string): { g: PronGroup; pair: PronPair; i: number; k: 'a' | 'b'; word: PronWord } | null {
  for (const g of GROUPS)
    for (let i = 0; i < g.pairs.length; i++)
      for (const k of ['a', 'b'] as const) if (wordId(g, i, k) === id) return { g, pair: g.pairs[i], i, k, word: g.pairs[i][k] };
  return null;
}
/** 发音要念的就是那个词本身，**一个修饰词都不加**；编号不认识回 null */
export const audioTextOf = (id: string): string | null => wordOf(id)?.word.word.trim() || null;

export const groupOf = (id: unknown): PronGroup | null => GROUPS.find((g) => g.id === id) ?? null;

/** 这一组能不能做听辨（第 7 组一对最小对立对都没有 → 做不了，页面照实说，不许硬凑） */
export const canEar = (g: PronGroup): boolean => minimalPairsOf(g).length > 0;

/** 这一组的听辨说明：**有几对说几对**，不够 10 题就说题会重复（底线 3） */
export function earNote(g: PronGroup): string {
  const n = minimalPairsOf(g).length;
  if (n === 0) return `这一组（${g.a.ipa} / ${g.b.ipa}）一对最小对立对都没有，所以没有听辨题 —— 只能走「跟我做」、跟读和纠说。`;
  if (n === 1) return `这一组只有 1 对最小对立对（${minimalPairsOf(g)[0].a.word} / ${minimalPairsOf(g)[0].b.word}），${ROUND_N} 题会一直考这一对。`;
  return `这一组有 ${n} 对最小对立对，${ROUND_N} 题从这 ${n} 对里随机抽，同一对会考到好几次。`;
}

/** 页面要的一组（两个词本来就并排摆在按钮上，藏不住也不用藏；**藏的是这一轮放了哪个**，那在页面脚本里） */
export function groupCard(g: PronGroup): Record<string, unknown> {
  const w = (i: number, k: 'a' | 'b') => ({ 编号: wordId(g, i, k), 词: g.pairs[i][k].word, 音标: g.pairs[i][k].ipa, 能纠说: g.pairs[i][k].asr });
  return {
    组: g.id,
    第几课: g.lesson,
    元音还是辅音: g.kind,
    名字: `${g.a.ipa} vs ${g.b.ipa}`,
    a: { 音标: g.a.ipa, 外号: g.a.nick, 口型: g.a.mouth },
    b: { 音标: g.b.ipa, 外号: g.b.nick, 口型: g.b.mouth },
    对: g.pairs.map((p, i) => ({ 第几对: i + 1, 最小对立对: p.minimal, a: w(i, 'a'), b: w(i, 'b') })),
    能听辨: canEar(g),
    听辨对数: minimalPairsOf(g).length,
    听辨说明: earNote(g),
    能纠说的词: asrWordsOf(g).map((x) => x.word),
    绕口令: g.twister,
  };
}

/** 库里一行（pron_round） */
export interface RoundRow { grp: string; at: number; asked: number; ok: number; same: number; passed: number }
/** 库里一行（pron_say） */
export interface SayRow { grp: string; target: string; heard: string; hit: number; at: number }

/** 每一组的成绩：考过几轮、过关几轮、最近一轮几分（**不合成一个"正确率"**，底线 3） */
export function groupStats(rows: RoundRow[]): Record<string, unknown>[] {
  return GROUPS.map((g) => {
    const mine = rows.filter((r) => r.grp === g.id).sort((a, b) => a.at - b.at);
    const last = mine[mine.length - 1];
    return {
      组: g.id,
      名字: `${g.a.ipa} vs ${g.b.ipa}`,
      考过几轮: mine.length,
      过关几轮: mine.filter((r) => r.passed === 1).length,
      最近一轮: last ? { 考了: last.asked, 对: last.ok, 两个听着一样: last.same, 过关: last.passed === 1, 什么时候: last.at } : null,
    };
  });
}

/** 纠说的累计：机器听成目标词 / 听成另一个 / 两个都不是，各几次（三个数分开摆，不合成一个分数） */
export function sayStats(rows: SayRow[]): Record<string, unknown> {
  const n = (h: number) => rows.filter((r) => r.hit === h).length;
  return { 一共: rows.length, 听成目标词: n(1), 听成另一个: n(0), 两个都不是: n(-1) };
}

// ======================================================================
// 二、纠说的判定：**只说机器听成了什么**（底线 3、9）
// ======================================================================

/** 比之前先去掉大小写、标点和首尾空白（"Bad." 和 "bad" 是同一个） */
export const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

export interface SayVerdict { hit: 1 | 0 | -1; 一句话: string }
/**
 * 机器听成了什么 → 一句话。**措辞永远是「机器听成了…」**，不许写成「你念对了 / 念错了」：
 * 语音识别天生要对口音稳健，它可能把你念歪的 /e/ 也认成 bad —— **它听成什么是线索，不是判决**。
 */
export function judgeSay(heard: string, target: string, other: string): SayVerdict {
  const h = normalize(heard);
  if (h && h === normalize(target)) return { hit: 1, 一句话: `✅ 机器听成了 ${target} —— 对了` };
  if (h && h === normalize(other)) return { hit: 0, 一句话: `❌ 机器听成了 ${other}` };
  return { hit: -1, 一句话: `🟡 机器听成了「${heard.trim() || '（一个字都没听出来）'}」，两个都不是` };
}

/** 从 whisper 的返回里取文字和真实音频秒数（turbo 会回 transcription_info.duration，和 src/voice.ts 同一套） */
export function readAsr(r: unknown): { text: string; 真实秒数: number | null } {
  const o = (r ?? {}) as { text?: unknown; transcription_info?: { duration?: unknown } };
  const d = o.transcription_info?.duration;
  return { text: typeof o.text === 'string' ? o.text.trim() : '', 真实秒数: typeof d === 'number' && Number.isFinite(d) && d > 0 ? d : null };
}

// ======================================================================
// 三、接口
// ======================================================================

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
/** 出错一律两句话：出错了什么、怎么办（页面原样显示，**不许静默吞掉**） */
const bad = (出错: string, 怎么办: string, status = 400) => json({ 出错, 怎么办 }, status);

const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function readRounds(env: Env): Promise<RoundRow[]> {
  const r = await env.DB.prepare('SELECT grp, at, asked, ok, same, passed FROM pron_round ORDER BY at').all<RoundRow>();
  return r.results ?? [];
}
async function readSays(env: Env): Promise<SayRow[]> {
  const r = await env.DB.prepare('SELECT grp, target, heard, hit, at FROM pron_say ORDER BY at').all<SayRow>();
  return r.results ?? [];
}

/** 今天纠说了几次（这一块自己的闸，存 settings，照 src/voice.ts 的做法） */
export async function saysToday(env: Env, now: number): Promise<number> {
  const r = await env.DB.prepare('SELECT value FROM settings WHERE key = ?1').bind('pron_say:' + utcDay(now)).first<{ value: string }>();
  const n = Number(r?.value ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
async function bumpSays(env: Env, now: number): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ' +
      'ON CONFLICT (key) DO UPDATE SET value = CAST(CAST(settings.value AS INTEGER) + 1 AS TEXT), updated_at = ?3',
  )
    .bind('pron_say:' + utcDay(now), '1', now)
    .run();
}

async function state(env: Env, now: number): Promise<Response> {
  const [rounds, says, 今天纠说, cap, used] = await Promise.all([readRounds(env), readSays(env), saysToday(env, now), dailyCap(env), usedToday(env, now)]);
  return json({
    一共几组: GROUPS.length,
    一轮几题: ROUND_N,
    及格线: `${ROUND_N} 题对 ${Math.ceil(ROUND_N * PASS_RATE)} 题（${Math.round(PASS_RATE * 100)}%）`,
    组: GROUPS.map(groupCard),
    记录: groupStats(rounds),
    纠说: { ...sayStats(says), 今天已经纠了几次: 今天纠说, 一天最多: MAX_SAY_PER_DAY, 今天已用neurons: Math.round(used), 今天上限neurons: cap },
    旧的去哪了: RETIRED_NOTE,
  });
}

/** 一题的对错：**由服务端算**（页面不自己判、也不自己记分）。这一步不写库，一轮考完才写一行 */
function answer(body: Record<string, unknown>): Response {
  const g = groupOf(typeof body.组 === 'string' ? body.组.trim() : '');
  if (!g) return bad(`这一组不在发音训练里：${String(body.组 ?? '').slice(0, 40) || '（空）'}`, '刷新一下页面，它会重新给你这七组。', 400);
  const 第几对 = Number(body.第几对);
  const pair = Number.isInteger(第几对) && 第几对 >= 1 && 第几对 <= g.pairs.length ? g.pairs[第几对 - 1] : null;
  if (!pair) return bad('没收到"考的是哪一对"。', '刷新一下页面重新开始这一轮。', 400);
  if (!pair.minimal) return bad(`${pair.a.word} / ${pair.b.word} 不是最小对立对，不能拿来做听辨题。`, '刷新一下页面，它只会从真正的最小对立对里出题。', 400);
  const 放的 = body.放的;
  const 选的 = body.选的;
  if (放的 !== 'a' && 放的 !== 'b') return bad('没收到"刚才放的是哪个词"。', '刷新一下页面重新开始这一轮。', 400);
  if (选的 !== 'a' && 选的 !== 'b' && 选的 !== 'same') return bad('没收到"你选了哪个"。', '点一下三个大按钮里的一个。', 400);

  const 两个一样 = 选的 === 'same';
  const 对 = !两个一样 && 选的 === 放的;
  const 放的词 = 放的 === 'a' ? pair.a : pair.b;
  return json({
    组: g.id,
    第几对,
    对,
    两个听着一样: 两个一样,
    放的是: { 编号: wordId(g, 第几对 - 1, 放的), 词: 放的词.word, 音标: 放的词.ipa },
    你选的: 两个一样 ? null : (选的 === 'a' ? pair.a.word : pair.b.word),
    这一对: { a: { 词: pair.a.word, 音标: pair.a.ipa, 编号: wordId(g, 第几对 - 1, 'a') }, b: { 词: pair.b.word, 音标: pair.b.ipa, 编号: wordId(g, 第几对 - 1, 'b') } },
    // 答错当场把第 2 步的对照听塞回来：两个词都能点，听完点「继续」才出下一题
    先对照听: !对,
  });
}

/** 一轮考完：记一行，并当场说过没过（过了给绕口令 + 三最法） */
async function round(env: Env, now: number, body: Record<string, unknown>): Promise<Response> {
  const g = groupOf(typeof body.组 === 'string' ? body.组.trim() : '');
  if (!g) return bad(`这一组不在发音训练里：${String(body.组 ?? '').slice(0, 40) || '（空）'}`, '刷新一下页面，它会重新给你这七组。', 400);
  if (!canEar(g)) return bad(`${g.a.ipa} / ${g.b.ipa} 这一组没有听辨题，不会有一轮成绩。`, '这一组只能走「跟我做」、跟读和纠说；换一组再考。', 409);
  const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);
  const asked = int(body.考了);
  const ok = int(body.对);
  const same = int(body.两个听着一样);
  if (asked === null || ok === null || same === null) return bad('这一轮的成绩不完整。', '刷新一下页面重新考一轮（这一轮不算）。', 400);
  if (asked !== ROUND_N) return bad(`一轮就是 ${ROUND_N} 题，这一轮报上来 ${asked} 题。`, '刷新一下页面重新考一轮（这一轮不算）。', 400);
  if (ok + same > asked) return bad(`对的题数加「两个听着一样」的次数（${ok} + ${same}）比题数 ${asked} 还多。`, '刷新一下页面重新考一轮（这一轮不算）。', 400);

  const 过 = passedRound(asked, ok);
  await env.DB.prepare('INSERT INTO pron_round (grp, at, asked, ok, same, passed) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(g.id, now, asked, ok, same, 过 ? 1 : 0)
    .run();

  return json({
    组: g.id,
    过关: 过,
    考了: asked,
    对: ok,
    两个听着一样: same,
    及格线: `${asked} 题要对 ${Math.ceil(asked * PASS_RATE)} 题`,
    一句话: 过
      ? `过关了：${asked} 题对 ${ok} 题。`
      : `这一轮没过：${asked} 题只对 ${ok} 题，差 ${Math.ceil(asked * PASS_RATE) - ok} 题。回第 1 步再跟着做一遍，这一组的两个音不是靠猜的。`,
    绕口令: 过 ? g.twister : null,
    怎么读: 过 ? '用三最法读 —— 最大声、最清晰、最慢速，直到没有任何发音错误。' : null,
    记录: groupStats(await readRounds(env)),
  });
}

/** 纠说：他念，机器听，告诉他**机器听成了哪个词** */
async function say(env: Env, now: number, body: Record<string, unknown>): Promise<Response> {
  const 编号 = typeof body.词 === 'string' ? body.词.trim() : '';
  const found = wordOf(编号);
  if (!found) return bad(`这个词不在发音训练里：${编号.slice(0, 40) || '（空）'}`, '刷新一下页面，它会重新给你这一组的词。', 400);
  const { g, pair, k, word } = found;
  if (!word.asr)
    return bad(
      `${word.word} 不能拿来纠说。`,
      '它不是现代常用词，语音识别基本不会输出它 —— 拿它判"你念对了没有"等于冤枉人。换这一组里标了「可纠说」的词。',
      400,
    );
  const other = k === 'a' ? pair.b.word : pair.a.word;

  if (!env.AI) return bad('这个环境没有绑 Workers AI，听不了你念的。', '正式版和测试版都绑了；本地跑的时候没有。纠说用不了，上面的「跟我做」、对照听和考题照常能用。', 503);

  const 今天 = await saysToday(env, now);
  if (今天 >= MAX_SAY_PER_DAY)
    return bad(`纠说今天已经用了 ${今天} 次，一天最多 ${MAX_SAY_PER_DAY} 次。`, '明天台湾时间早上 8 点以后再来；上面的「跟我做」、对照听和考题照常能用。', 429);

  const audioB64 = typeof body.audio === 'string' ? body.audio : '';
  if (!audioB64) return bad('没收到录音。', '按一下「开始录」，念出那个词，再按一次「停止」。', 400);
  let bytes: Uint8Array;
  try {
    bytes = unb64(audioB64);
  } catch {
    return bad('录音数据不是合法的 base64。', '重录一次；一直这样就换个浏览器试试。', 400);
  }
  if (!bytes.byteLength) return bad('录音是空的（一个字节都没有）。', '按下「开始录」之后念出那个词，再按「停止」。', 400);
  if (bytes.byteLength > MAX_SAY_BYTES) return bad(`录音太大了（${bytes.byteLength} 字节，最多 ${MAX_SAY_BYTES}）。`, '念一个词就好，别录一整句。', 413);
  const 秒数 = typeof body.seconds === 'number' && Number.isFinite(body.seconds) && body.seconds > 0 ? Math.min(body.seconds, MAX_SAY_SEC) : 1;

  // 额度：只看 Amos 自己在"用量和限额"里设的那个上限（C117），不另设一层
  const est = asrNeurons(秒数);
  const [used, cap] = await Promise.all([usedToday(env, now), dailyCap(env)]);
  if (used + est > cap)
    return bad(
      `今天的 Workers AI 额度不够了：听一次大概要 ${Math.max(1, Math.round(est))} neurons，今天已经用了 ${Math.round(used)} / ${cap}。`,
      '明天台湾时间早上 8 点清零，或者到"用量和限额"里把上限改大（上限只有你能改）。上面的「跟我做」、对照听和考题不花钱，照常能用。',
      429,
    );

  // 跑之前就把次数记上：中途失败也算一次（宁可多算，闸才守得住）
  await bumpSays(env, now);

  let got: { text: string; 真实秒数: number | null };
  try {
    // whisper-large-v3-turbo 收 base64 字符串，能带 language（照 src/voice.ts 那一份，别各写一套）
    got = readAsr(await (env.AI as AiLike).run(ASR_MODEL, { audio: audioB64, task: 'transcribe', language: 'en' }));
  } catch (e) {
    // 失败的调用不一定不计费，保守按估算记一笔（和 tts.ts、voice.ts 一样）
    await chargeNeurons(env, now, est, PRON_PROJECT, 0, PRON_ASR_PURPOSE);
    // 只带模型名和错误文字，不含任何密钥（底线 1）
    const detail = String((e as Error)?.message ?? e).replace(/\s+/g, ' ').slice(0, 300);
    console.log(JSON.stringify({ event: 'pron.asr_error', word: 编号, detail }));
    if (isAccountLimited(detail)) {
      await noteAccountLimit(env, now, detail);
      return bad(accountLimitedMessage(detail, now), '今天先练听的那三步，明天再纠说。不会自动重试，不点就不花钱。', 429);
    }
    return bad(`没听成：${detail}`, '等一下再按一次「开始录」（不会自动重试）；上面的「跟我做」、对照听和考题照常能用。', 502);
  }
  const 秒 = got.真实秒数 ?? 秒数;
  await chargeNeurons(env, now, asrNeurons(秒), PRON_PROJECT, 200, PRON_ASR_PURPOSE);

  const v = judgeSay(got.text, word.word, other);
  await env.DB.prepare('INSERT INTO pron_say (grp, target, heard, hit, at) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(g.id, word.word, got.text.slice(0, 200), v.hit, now)
    .run();

  return json({
    组: g.id,
    词: word.word,
    另一个词: other,
    机器听成了: got.text,
    判定: v.hit,
    一句话: v.一句话,
    // 底线 3、9：说清楚这句话是什么分量，别让他把 ASR 当裁判
    这是线索不是判决: '语音识别天生要对口音稳健 —— 它可能把你念歪的音也认成那个词。它听成什么是线索，不是判决。',
    秒数来源: got.真实秒数 != null ? '模型回的真实音频时长' : '浏览器报的录音时长（模型没回时长）',
    这一次neurons: Math.round(asrNeurons(秒) * 100) / 100,
    今天已经纠了几次: 今天 + 1,
    一天最多: MAX_SAY_PER_DAY,
    纠说累计: sayStats(await readSays(env)),
  });
}

/**
 * `/api/pron/state`（GET）、`/api/pron/answer`、`/api/pron/round`、`/api/pron/say`（POST）。
 * 发音 `/api/pron/audio/<编号>` 由 queue.ts 直接分给 src/pron-audio.ts。
 * 鉴权在 queue.ts 的 adminApi 里已经过了；不认识的 sub 返回 null，由调用方给 404。
 */
export async function pronApi(env: Env, req: Request, now: number, sub: string): Promise<Response | null> {
  if (sub === 'state' && req.method === 'GET') return state(env, now);
  if (req.method !== 'POST') return null;
  if (sub !== 'answer' && sub !== 'round' && sub !== 'say') return null;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (sub === 'answer') return answer(body);
  if (sub === 'round') return round(env, now, body);
  return say(env, now, body);
}
