/**
 * 把一段英文念出来（从 Marketing 仓库 `src/tts.ts` 搬过来的那一小段，2026-11-12 随「发音训练」整块搬家）。
 *
 * **只搬了发音训练用得到的那几样**：aura-2-en 的模型名和发音人、估算 neurons 的公式、
 * 以及"模型回什么格式都认"的 `toMp3`。Marketing 那边还有一整个「语音生成」公共工具
 * （选模型、算贵多少倍、下载 mp3 的页面和接口），**那是工作平台的东西，没搬**。
 *
 * **为什么是 aura、不是 melotts**（Amos 2026-11-10 实测）：melotts 把 /iː/ 和 /ɪ/ 念糊了，
 * seat / sit 听着一样——**错的是机器不是他的耳朵**。发音训练整块更吃这一点，所以用 aura。
 * 单价（Cloudflare 价格页，2026-11-02）：melotts **18.63 neurons / 音频分钟**；aura-2-en **2727.27 neurons / 1000 字符**。
 */

/** Marketing 的默认模型，留着只为 ttsNeurons 的公式照原样（发音训练用的是 aura） */
export const TTS_MELOTTS = '@cf/myshell-ai/melotts';
/** 发音训练念那 56 个词用的就是它 */
export const TTS_AURA = '@cf/deepgram/aura-2-en';
export const AURA_SPEAKER = 'luna';

const MELOTTS_PER_MIN = 18.63;
const AURA_PER_1K = 2727.27;
const SEC_PER_CHAR = 1 / 15;

/** 这段文字用某个模型大概要花多少 neurons（估算，不是账单） */
export const ttsNeurons = (model: string, text: string): number =>
  model === TTS_AURA ? (text.length / 1000) * AURA_PER_1K : (text.length * SEC_PER_CHAR * MELOTTS_PER_MIN) / 60;

const unb64 = (s: string): ArrayBuffer => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;

/** melotts 回 {audio:base64}，aura 回二进制流：两种都认（src/pron-audio.ts 用的就是这一份，别各写一套） */
export async function toMp3(r: unknown): Promise<ArrayBuffer> {
  if (r instanceof ReadableStream) return await new Response(r).arrayBuffer();
  if (r instanceof ArrayBuffer) return r;
  const o = (r ?? {}) as { audio?: unknown };
  if (typeof o.audio === 'string') return unb64(o.audio);
  throw new Error('语音模型返回的格式不认识');
}
