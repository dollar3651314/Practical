/**
 * Workers AI 的账本和上限（从 Marketing 仓库 `src/usage.ts` 搬过来的那一部分，2026-11-12 随「发音训练」整块搬家）。
 *
 * **只搬了发音训练真正用到的那几样**：每天上限（settings 的 `cap:workers-ai`）、按模型 / 按项目 / 按用途记一笔
 * （model_usage / usage_by_project / usage_by_purpose）、以及「Cloudflare 自己说账号额度用完了」这条判断和它那张
 * account_limit 表。Marketing 那边还有 Gemini、后台"用量和限额"页、剩余量估算那一大套，**那些是工作台的东西，没搬**。
 * 代码**一个字没改**地照抄过来，免得两边各写一套算法（底线 9：说清楚哪些是原样搬的）。
 *
 * 一天怎么算：Workers AI 按 **UTC 0 点**（台湾早上 8 点）重置，和 Cloudflare 免费额度的口径一致。
 * 上限默认 8000 neurons、最多 9500（免费额度 10000，C117）——**不新增任何付费服务**。
 */
import type { Env } from './env';

export const WAI_KEY = 'workers-ai';
export const GEMINI_DEFAULT_CAP = 200;
export const GEMINI_MAX_CAP = 10_000;
export const WAI_DEFAULT_CAP = 8_000;
export const WAI_MAX_CAP = 9_500;

/** 美国太平洋时间的年月日时分秒 → 当地时间当成 UTC 的毫秒数 */
function laLocal(now: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(now))
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
}
export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);
export const pacificDay = (now: number) => new Date(laLocal(now)).toISOString().slice(0, 10);
export const dayFor = (model: string, now: number) => (model === WAI_KEY ? utcDay(now) : pacificDay(now));

/** 下一次重置的时间（毫秒） */
export function nextReset(model: string, now: number): number {
  if (model === WAI_KEY) return Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1);
  const local = laLocal(now);
  const offset = local - Math.floor(now / 1000) * 1000; // 太平洋时间比 UTC 慢多少（负数）
  const d = new Date(local);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - offset;
}

export async function getCap(env: Env, model: string): Promise<number> {
  const r = await env.DB.prepare('SELECT value FROM settings WHERE key = ?1').bind('cap:' + model).first<{ value: string }>();
  const v = Number(r?.value);
  if (model === WAI_KEY) {
    const fallback = Number(env.WORKERS_AI_DAILY_NEURONS);
    const n = Number.isFinite(v) && v > 0 ? v : Number.isFinite(fallback) && fallback > 0 ? fallback : WAI_DEFAULT_CAP;
    return Math.min(n, WAI_MAX_CAP);
  }
  return Number.isFinite(v) && v > 0 ? Math.min(v, GEMINI_MAX_CAP) : GEMINI_DEFAULT_CAP;
}

// ======================================================================
// Cloudflare 自己说"账号额度用完了"（Marketing 2026-11-03 加的，原样搬过来）。
//
// 为什么非有不可：正式版和测试版是**两个不同的 D1**，各记各的账；而 Cloudflare 的免费额度
// **10,000 neurons/天是按整个账号算的**，所有环境共用。所以我们自己记的用量只是个下限，
// **唯一可靠的信号是 Cloudflare 自己报的那句话**：报了就记一行（表 account_limit）。
// 真实剩余要查只能走 Cloudflare 的 GraphQL 分析接口（要 Amos 的 API 令牌），**没做**，所以不假装算得出（底线 3）。
// ======================================================================

/** Workers AI 的免费额度：整个账号每天 10,000 neurons，00:00 UTC 清零（Cloudflare 价格页，2026-11-03 查：证实） */
export const CF_ACCOUNT_FREE_NEURONS = 10_000;

/** 台湾时间（UTC+8，没有夏令时）的 `YYYY-MM-DD HH:MM`；时间点都从 nextReset / 时间戳算，不写死字符串 */
export function twText(ms: number): string {
  const s = new Date(ms + 8 * 3600_000).toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`;
}

/**
 * 这一次出错是不是"**整个 Cloudflare 账号**今天的免费额度用完了"。
 * **按文案判，不只认错误码**：Amos 2026-11-03 看到的是 `4006: you have used up your daily free allocation of 10,000 neurons…`，
 * 而官方错误表里登记的账号级那条是 **3036 Account limited**——码对不上、文案是同一条。只认码会漏，所以：
 *   ① 先认文案（daily free allocation / account limited / 又说 neurons 又让 upgrade）；
 *   ② 码只当补充，认 3036 和 429（官方表里的码会变，文案不会）。
 * 我们自己设的上限（纠说和发音的 429）走的是另一条路，不经过这里。
 */
export function isAccountLimited(e: unknown): boolean {
  const s = String((e as Error)?.message ?? e ?? '').toLowerCase();
  if (!s) return false;
  if (s.includes('daily free allocation') || s.includes('account limited')) return true;
  if (s.includes('neuron') && s.includes('upgrade')) return true;
  return /(^|\D)(3036|429)(\D|$)/.test(s);
}

/**
 * 把 Cloudflare 那句英文翻成人话。说清三件事：
 *   ① 是**整个 Cloudflare 账号**今天的免费额度用完了，不是这个工具坏了；
 *   ② 台湾时间明早 8 点清零（从 nextReset 算，不写死），到点再点同一个按钮会接着跑；
 *   ③ 想现在就继续得升级 Cloudflare 的 Workers Paid 付费计划，**那要花钱，由 Amos 自己决定**（C117 / 底线 8）。
 * **不给升级链接、不建议他升级**；英文原话附在后面括号里，方便和 Cloudflare 的账单对账。
 */
export function accountLimitedMessage(raw: string, now: number): string {
  const one = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
  return (
    `整个 Cloudflare 账号今天的免费额度（每天 ${CF_ACCOUNT_FREE_NEURONS.toLocaleString('en-US')} neurons）用完了，不是这个工具坏了——` +
    `测试版、正式版和这个账号上别的东西，花的都是同一份额度。` +
    `台湾时间 ${twText(nextReset(WAI_KEY, now))} 清零，到点再点同一个按钮，没生成完的会接着跑。` +
    `想现在就继续，只能升级 Cloudflare 的 Workers Paid 付费计划——那要花钱，得 Amos 自己决定。` +
    (one ? `（Cloudflare 原话：${one}）` : '')
  );
}

/** Cloudflare 说额度用完了：按 UTC 日期记一行（到下一个 UTC 日自然失效）。写失败只打日志，不影响调用方。 */
export async function noteAccountLimit(env: Env, now: number, raw: string): Promise<void> {
  try {
    await env.DB.prepare(
      'INSERT INTO account_limit (day, model, first_at, at, hits, last_error) VALUES (?1, ?2, ?3, ?3, 1, ?4) ' +
        'ON CONFLICT (day, model) DO UPDATE SET at = ?3, hits = hits + 1, last_error = ?4',
    )
      .bind(utcDay(now), WAI_KEY, now, String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 300))
      .run();
  } catch (e) {
    console.log(JSON.stringify({ event: 'pron.account_limit_write_failed', detail: String((e as Error)?.message ?? e).slice(0, 200) }));
  }
}

// ======================================================================
// 按**用途**记一本（Marketing 2026-11-03 加的，原样搬过来）：
// 按项目看分不出"这 300 neurons 是念词还是听他念"，按用途就分得出。只记、不当限额。
// ======================================================================

/** 用途的全集。新增用途要同时在这里和 PURPOSE_LABEL 里加一项。 */
export const PURPOSES = ['assets-image', 'assets-audio', 'tts', 'pron-tts', 'pron-asr', 'drill-tts', 'voice', 'draft', 'score', 'platform', 'other'] as const;
export type Purpose = (typeof PURPOSES)[number];
export const PURPOSE_LABEL: Record<Purpose, string> = {
  'assets-image': '素材生成器 · 图片',
  'assets-audio': '素材生成器 · 音频',
  tts: '语音生成',
  'pron-tts': '发音训练 · 发音',
  'pron-asr': '发音训练 · 纠说（听你念）',
  // 「带练」2026-11-11 下线了，这一行**留着**：库里还有它当时记的账，去掉这一行那些行就只剩一个看不懂的代号（底线 3）
  'drill-tts': '带练 · 发音（已下线，历史数据）',
  voice: '语音对话实测',
  draft: '跟帖草稿',
  score: '跟帖评分',
  platform: '平台自己（"测试 AI"）',
  other: '其他',
};

/**
 * 记一次请求（不管成功与否都算一次）。
 * 带 project / purpose 时再各记一行；那一行写失败（例如表还没建）只打日志，不影响调用方。
 */
export async function recordUse(env: Env, model: string, now: number, u: { status: number; tokIn?: number; tokOut?: number; project?: string; neurons?: number; purpose?: string }) {
  await env.DB.prepare(
    'INSERT INTO model_usage (day, model, req, tok_in, tok_out, last_status, last_at) VALUES (?1, ?2, 1, ?3, ?4, ?5, ?6) ' +
      'ON CONFLICT (day, model) DO UPDATE SET req = req + 1, tok_in = tok_in + ?3, tok_out = tok_out + ?4, last_status = ?5, last_at = ?6',
  )
    .bind(dayFor(model, now), model, Math.max(0, Math.round(u.tokIn ?? 0)), Math.max(0, Math.round(u.tokOut ?? 0)), u.status, now)
    .run();
  if (u.project) await recordByProject(env, model, now, u.project, u);
  if (u.purpose) await recordByPurpose(env, model, now, u.purpose, u);
}

/** 按用途记一行（和 recordByProject 一样：写失败只打日志，不影响调用方） */
async function recordByPurpose(env: Env, model: string, now: number, purpose: string, u: { tokIn?: number; tokOut?: number; neurons?: number }) {
  try {
    await env.DB.prepare(
      'INSERT INTO usage_by_purpose (day, purpose, model, req, tok_in, tok_out, neurons) VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6) ' +
        'ON CONFLICT (day, purpose, model) DO UPDATE SET req = req + 1, tok_in = tok_in + ?4, tok_out = tok_out + ?5, neurons = neurons + ?6',
    )
      .bind(dayFor(model, now), purpose.slice(0, 32), model, Math.max(0, Math.round(u.tokIn ?? 0)), Math.max(0, Math.round(u.tokOut ?? 0)), Math.max(0, u.neurons ?? 0))
      .run();
  } catch (e) {
    console.log(JSON.stringify({ event: 'pron.usage_by_purpose_failed', detail: String((e as Error)?.message ?? e).slice(0, 200) }));
  }
}

async function recordByProject(env: Env, model: string, now: number, project: string, u: { tokIn?: number; tokOut?: number; neurons?: number }) {
  try {
    await env.DB.prepare(
      'INSERT INTO usage_by_project (day, project, model, req, tok_in, tok_out, neurons) VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6) ' +
        'ON CONFLICT (day, project, model) DO UPDATE SET req = req + 1, tok_in = tok_in + ?4, tok_out = tok_out + ?5, neurons = neurons + ?6',
    )
      .bind(dayFor(model, now), project.slice(0, 32), model, Math.max(0, Math.round(u.tokIn ?? 0)), Math.max(0, Math.round(u.tokOut ?? 0)), Math.max(0, u.neurons ?? 0))
      .run();
  } catch (e) {
    console.log(JSON.stringify({ event: 'pron.usage_by_project_failed', detail: String((e as Error)?.message ?? e).slice(0, 200) }));
  }
}
