-- Workers AI 的账本（随「发音训练」从 Marketing 搬过来，2026-11-12）。
--
-- 为什么编号从 0019 开始：0019_pron.sql 是从 Marketing 仓库**原样复制**过来的（内容一个字节都没改），
-- 它的名字跟着一起搬，所以 Practical 的 migrations/ 就从 0019 起头；这一张紧跟在它后面。
--
-- 这几张表是 src/usage.ts、src/workers-ai.ts 用的，DDL 从 Marketing 的 0003 / 0004 / 0007 / 0010 / 0011
-- 里**只挑发音训练真正要写的那几张**照抄过来（Gemini、跟帖清单、素材生成器那些表一张都没搬）：
--   settings          —— 每天上限 cap:workers-ai，以及"今天纠说了几次"（src/pron.ts 的 pron_say:<UTC 日期>）
--   ai_usage          —— 今天一共用了多少 neurons（day 是 UTC 日期，和 Cloudflare 免费额度重置时间一致）
--   model_usage       —— 每个模型每天发了几次、多少 token
--   usage_by_project  —— 按项目记一本（发音训练记成 pron）
--   usage_by_purpose  —— 按用途记一本（念词 pron-tts、听他念 pron-asr）
--   account_limit     —— Cloudflare 自己说"账号额度用完了"的那句话（唯一可靠的信号，src/usage.ts 文件头）
-- **只 CREATE**：不 ALTER、不 DROP、不加索引、不回填。**不存任何密钥**（底线 1）。

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE ai_usage (
  day TEXT PRIMARY KEY,
  neurons REAL NOT NULL DEFAULT 0
);

-- day：Workers AI 按 UTC 日期（台湾早上 8 点重置）
CREATE TABLE model_usage (
  day TEXT NOT NULL,
  model TEXT NOT NULL,
  req INTEGER NOT NULL DEFAULT 0,
  tok_in INTEGER NOT NULL DEFAULT 0,
  tok_out INTEGER NOT NULL DEFAULT 0,
  last_status INTEGER,          -- 最近一次的 HTTP 状态（0 = 超时或连不上）
  last_at INTEGER,
  PRIMARY KEY (day, model)
);

CREATE TABLE usage_by_project (
  day TEXT NOT NULL,
  project TEXT NOT NULL,          -- 发音训练记成 pron
  model TEXT NOT NULL,
  req INTEGER NOT NULL DEFAULT 0,
  tok_in INTEGER NOT NULL DEFAULT 0,
  tok_out INTEGER NOT NULL DEFAULT 0,
  neurons REAL NOT NULL DEFAULT 0, -- 只有 Workers AI 有（和 ai_usage 同一种算法）
  PRIMARY KEY (day, project, model)
);

CREATE TABLE usage_by_purpose (
  day TEXT NOT NULL,
  purpose TEXT NOT NULL,          -- pron-tts（念词）/ pron-asr（听他念）
  model TEXT NOT NULL,
  req INTEGER NOT NULL DEFAULT 0,
  tok_in INTEGER NOT NULL DEFAULT 0,
  tok_out INTEGER NOT NULL DEFAULT 0,
  neurons REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (day, purpose, model)
);

-- day 是 **UTC 日期**（和 ai_usage、model_usage 同一个口径，src/usage.ts utcDay）：
-- 只查"今天这一行"，到了下一个 UTC 日（台湾早上 8 点）这条提示自动失效，不用定时任务去清（C120）。
-- last_error 存 Cloudflare 的英文原话（截断 300 字）方便对账；里面不会有密钥（底线 1）。
CREATE TABLE account_limit (
  day TEXT NOT NULL,                      -- UTC 日期 YYYY-MM-DD
  model TEXT NOT NULL,                    -- 'workers-ai'
  first_at INTEGER NOT NULL,              -- 这一天第一次被拒的毫秒时间戳
  at INTEGER NOT NULL,                    -- 最近一次被拒的毫秒时间戳
  hits INTEGER NOT NULL DEFAULT 0,        -- 这一天被拒了几次
  last_error TEXT NOT NULL DEFAULT '',    -- Cloudflare 的英文原话（截断）
  PRIMARY KEY (day, model)
);
