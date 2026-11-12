/**
 * 工作台「发音训练」的**发音**（表 `pron_audio` / 迁移 0019；页面 src/pron-page.ts，逻辑和编号在 src/pron.ts，
 * 内容在 src/pron-content.ts）。
 *
 * **这一条链路是从「带练」原样搬过来的**（原 src/drill-audio.ts，2026-11-11 随带练下线一起改名过来）：
 * 同一个 TTS 模型 aura-2-en、同一个 `AUDIO_REV` 版本号键、同一道「第一次要先生成，这期间再点不重复调」的连点闸、
 * 同一道额度闸、同一套「失败就当面说、不自动重试」。**改的只有三处**：念的是哪些内容（56 个词，不是带练那 40 段）、
 * 存哪张表（`pron_audio`，不写退休模块的 `drill_audio`）、记账用什么名字（`pron` / `pron-tts`）。
 *
 * **谁来念**：Workers AI 的 aura-2-en（`env.AI` 绑定，**不需要任何密钥**，底线 1）。
 * 调用方式和记账方式照 src/tts.ts 那一套（同一个模型常量 `TTS_AURA`、同一个估算公式 `ttsNeurons()`、
 * 同一个 `chargeNeurons()`），这里不另发明一套。
 *
 * **为什么是 aura、不是 melotts**（Amos 2026-11-10 实测）：听辨小测连跑四轮，`seat / sit` 那一组他点了
 * 「两个听着一样」，去剑桥词条页听**真人录音却分得开** —— melotts 把 /iː/ 和 /ɪ/ 念糊了，
 * **错的是机器不是他的耳朵**。发音训练整块更吃这一点（七组全是只差一个音的词），所以照旧用 aura。
 *
 * **生成几次**：一共 56 段固定内容（7 组 × 4 对 × 2 个词，编号见 src/pron.ts 的 `PRON_WORD_IDS`），
 * **哪一段被点到才生成哪一段，生成完存进 D1 永久复用**。56 个词一共约 300 个字符
 * （aura 按字符算钱：2727.27 neurons / 1000 字符）→ 全部生成一遍约 **820** neurons，
 * 免费额度 10,000/天，**不新增任何付费服务**（底线 8 / C117）；额度照旧只看 Amos 自己在"用量和限额"里设的那个上限。
 * 用量按用途记成 `pron-tts`、按项目记成 `pron`。
 *
 * **失败就是失败**（底线 3、9）：额度不够、没绑 AI、模型出错，一律把"出错 / 怎么办"两句话原样回给页面，
 * 页面当面说，**不假装有**；**也不自动重试**（不做重试风暴），下次他再点再试一次。
 * 失败的调用按估算记一笔账（宁可多记不漏记，和 tts.ts 一样）。
 */
import type { Env } from './env';
import { audioTextOf, PRON_PROJECT, PRON_WORD_IDS } from './pron';
import { AURA_SPEAKER, TTS_AURA, toMp3, ttsNeurons } from './tts';
import { accountLimitedMessage, isAccountLimited, noteAccountLimit } from './usage';
import { chargeNeurons, dailyCap, usedToday, type AiLike } from './workers-ai';

/**
 * **发音版本号**：换 TTS 模型时把它加一，`pron_audio` 的键就跟着变，旧模型生成的那些段
 * **再也不会被读到**（旧行留着不删，想对比的时候还查得出来）。
 *
 * `a1` = melotts（带练时代）。`a2` = aura-2-en（**现在用的**，2026-11-10 换，理由见文件头）。
 */
export const AUDIO_REV = 'a2';
/** 存进 pron_audio 的键 = 版本号 + 词的编号 */
export const audioKey = (item: string): string => `${AUDIO_REV}:${item}`;

/** 用量按用途记一行（usage_by_purpose）：发音训练的发音单独一项 */
export const PRON_TTS_PURPOSE = 'pron-tts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
/** 出错一律两句话：出错了什么、怎么办（页面原样显示，**不许静默吞掉**） */
const bad = (出错: string, 怎么办: string, status = 400) => json({ 出错, 怎么办 }, status);

/** D1 的 BLOB 读回来可能是 ArrayBuffer、定型数组或数字数组，三种都认 */
export function toBytes(v: unknown): Uint8Array {
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength));
  if (Array.isArray(v)) return Uint8Array.from(v as number[]);
  return new Uint8Array(0);
}

const mp3Response = (bytes: Uint8Array, item: string) =>
  new Response(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, {
    headers: {
      'content-type': 'audio/mpeg',
      'content-length': String(bytes.byteLength),
      // 一段固定内容，存下来就不会变：浏览器也可以放心缓存（只给本人，走登录）
      'cache-control': 'private, max-age=86400',
      'x-robots-tag': 'noindex',
      'x-pron-item': item,
    },
  });

/** 库里已经有这一段吗 */
async function readAudio(env: Env, item: string): Promise<Uint8Array | null> {
  const r = await env.DB.prepare('SELECT mp3 FROM pron_audio WHERE item = ?1').bind(audioKey(item)).first<{ mp3: unknown }>();
  if (!r) return null;
  const b = toBytes(r.mp3);
  return b.byteLength ? b : null;
}

/**
 * `GET /api/pron/audio/<编号>` → `audio/mpeg`。鉴权在 queue.ts 的 adminApi 里已经过了（和 /api/pron/* 同一套后台登录）。
 * 不是 GET 回 null（由调用方给 404）。
 */
export async function pronAudioApi(env: Env, req: Request, now: number, item: string): Promise<Response | null> {
  if (req.method !== 'GET') return null;
  if (!PRON_WORD_IDS.includes(item)) return bad(`这个词不在发音训练里：${item.slice(0, 40) || '（空）'}`, '刷新一下页面，它会重新给你这一组的词。', 400);

  const had = await readAudio(env, item);
  if (had) return mp3Response(had, item);

  const text = audioTextOf(item);
  if (!text) return bad('这个词是空的，所以没法生成发音。', '内容文件（src/pron-content.ts）里这一条还是空的，等内容补上再点。', 404);

  if (!env.AI) return bad('这个环境没有绑 Workers AI，生成不了发音。', '正式版和测试版都绑了；本地跑的时候没有，先看音标和口型。', 503);

  // 额度：只看 Amos 自己在"用量和限额"里设的那个上限（C117），不另设一层
  const est = ttsNeurons(TTS_AURA, text);
  const [used, cap] = await Promise.all([usedToday(env, now), dailyCap(env)]);
  if (used + est > cap)
    return bad(
      `今天的 Workers AI 额度不够了：这一段发音大概要 ${Math.max(1, Math.round(est))} neurons，今天已经用了 ${Math.round(used)} / ${cap}。`,
      '明天再点一次就会生成（生成过的永久存着，不用再花），或者到"用量和限额"里把上限改大（上限只有你能改）。',
      429,
    );

  let mp3: ArrayBuffer;
  try {
    // aura 的入参和 melotts 不一样（照 src/tts.ts 那一份，别各写一套）
    mp3 = await toMp3(await (env.AI as AiLike).run(TTS_AURA, { text, speaker: AURA_SPEAKER, encoding: 'mp3' }));
  } catch (e) {
    // 失败的调用不一定不计费，保守按估算记一笔（和 tts.ts 一样）
    await chargeNeurons(env, now, est, PRON_PROJECT, 0, PRON_TTS_PURPOSE);
    // 只带模型名和错误文字，不含任何密钥（底线 1）
    const detail = String((e as Error)?.message ?? e).replace(/\s+/g, ' ').slice(0, 300);
    console.log(JSON.stringify({ event: 'pron.tts_error', item, detail }));
    if (isAccountLimited(detail)) {
      await noteAccountLimit(env, now, detail);
      return bad(accountLimitedMessage(detail, now), '今天先跟着「跟我做」一步步做，明天再点🔊。不会自动重试，不点就不花钱。', 429);
    }
    return bad(`发音没生成出来：${detail}`, '上面的口型和音标照常看；等一下再点一次🔊（不会自动重试）。', 502);
  }

  const bytes = new Uint8Array(mp3);
  if (!bytes.byteLength) {
    await chargeNeurons(env, now, est, PRON_PROJECT, 0, PRON_TTS_PURPOSE);
    return bad('发音生成出来是空的。', '等一下再点一次🔊（不会自动重试）；一直这样就先跟着「跟我做」走。', 502);
  }
  // 存一次，之后永久复用（同一段并发点两下时后到的那次覆盖，内容一样）
  await env.DB.prepare('INSERT INTO pron_audio (item, mp3, at) VALUES (?1, ?2, ?3) ON CONFLICT (item) DO UPDATE SET mp3 = ?2, at = ?3').bind(audioKey(item), mp3, now).run();
  await chargeNeurons(env, now, est, PRON_PROJECT, 200, PRON_TTS_PURPOSE);
  return mp3Response(bytes, item);
}
