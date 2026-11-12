/**
 * Workers AI 的额度和记账（从 Marketing 仓库 `src/workers-ai.ts` 搬过来的那一部分，2026-11-12 随「发音训练」整块搬家）。
 *
 * **只搬了发音训练用得到的那三样**：今天用了多少（`usedToday`）、今天最多能用多少（`dailyCap`）、
 * 记一笔账（`chargeNeurons`）。Marketing 那边还有「备用 AI 替 Gemini 回答」那一整套（Qwen3、
 * JSON 修补、RESERVE 预留），**那是工作台的东西，没搬**。
 *
 * - **不用新密钥**（底线 1）：`wrangler.toml` 里的 `[ai]` 绑定直接用账号自带的 Workers AI。
 * - 免费额度每天 10,000 neurons（UTC 0 点重置 = 台湾早上 8 点）；上限默认 8,000、最多 9,500（usage.ts），
 *   **不会超出免费额度产生费用**（C117）。
 */
import type { Env } from './env';
import { getCap, recordUse, WAI_KEY } from './usage';

export interface AiLike {
  run(model: string, input: unknown): Promise<unknown>;
}

const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);

/** 每天上限：settings 里的 `cap:workers-ai`，没设时用 WORKERS_AI_DAILY_NEURONS，最多 9500（usage.ts） */
export const dailyCap = (env: Env): Promise<number> => getCap(env, WAI_KEY);

export async function usedToday(env: Env, now: number): Promise<number> {
  const r = await env.DB.prepare('SELECT neurons FROM ai_usage WHERE day = ?1').bind(utcDay(now)).first<{ neurons: number }>();
  return r?.neurons ?? 0;
}

async function addUsage(env: Env, now: number, neurons: number) {
  // 记录一直保留（D-4 选 B）
  await env.DB.prepare('INSERT INTO ai_usage (day, neurons) VALUES (?1, ?2) ON CONFLICT (day) DO UPDATE SET neurons = neurons + ?2').bind(utcDay(now), neurons).run();
}

/**
 * 记一次 Workers AI 的用量：写 ai_usage（当天 neurons，到上限就停，C117）
 * ＋ model_usage / usage_by_project（按项目看）＋ usage_by_purpose（按用途看，带 purpose 时才记）。
 * 调用方自己先用 usedToday + dailyCap 判断够不够，再调模型；失败的调用也要记（按估算），宁可多记不要漏记。
 */
export async function chargeNeurons(env: Env, now: number, neurons: number, project: string, status = 200, purpose?: string): Promise<void> {
  const n = Math.max(0, neurons);
  await addUsage(env, now, n);
  await recordUse(env, WAI_KEY, now, { status, project, neurons: n, purpose });
}
