/**
 * Worker 能看到的绑定和变量（Practical 1.0 自用版）。
 *
 * 盲听卡那一套原来只要 `ENVIRONMENT` + `ASSETS`（静态资源）；2026-11-12 把工作台的「发音训练」
 * 整块搬过来（Amos 原话：「把后续的所有内容包括发音训练整体挪到 practical 项目中吧，以后就在
 * practical 项目中更新」「Practical 加 Workers AI」），于是多了两样，**都在 Cloudflare 免费额度内**：
 *   - `DB`：D1（发音训练的成绩、纠说记录、56 个词的发音缓存，见 migrations/0019_pron.sql）；
 *   - `AI`：Workers AI 绑定（aura-2-en 念词、whisper 听他念）。**它不是密钥**，走账号自带的绑定（底线 1）。
 *
 * **这里一个密钥都没有**（底线 1）：部署用的 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID 由 Amos
 * 填进 GitHub 仓库 Secrets（《上线操作手册》），既不进仓库也不进这个类型。
 */
export interface Env {
  ENVIRONMENT: string;
  /** 网页和素材（web/ + media/ 构建成 dist/） */
  ASSETS: Fetcher;
  /** D1：发音训练的三张表 + 账本（migrations/） */
  DB: D1Database;
  /** Workers AI 绑定（不用密钥）；本地 wrangler dev 没有这个绑定，发音和纠说会当面说"这个环境没有绑 Workers AI" */
  AI?: unknown;
  /** Workers AI 每天最多用多少 neurons（默认 8000，免费额度 10000，C117） */
  WORKERS_AI_DAILY_NEURONS?: string;
}
