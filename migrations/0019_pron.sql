-- 工作台「发音训练」（服务端 src/pron.ts、发音 src/pron-audio.ts，内容 src/pron-content.ts，页面 src/pron-page.ts）。
--
-- 为什么有这三张（Amos 2026-11-11 原话）：「纠"说"也做出来，只不过我使用的慢一点儿罢了。
-- 工作台 英语练习和代练（带练）都没用了，用你新做的东西彻底替换掉它们吧」。
-- 旧的「听辨小测」只会量不会教：放音 → 选 → 对错 → 换一个完全不同的音；他连跑七轮 56 题，
-- 正确率 75% → 71%，最后说「越听越乱，到最后纯靠猜」。新模块按课程的四步走：
-- 看口型（能照着做动作）→ 对照听 → **同一组连考 10 题** → 80% 过关给绕口令，另加「他念、机器听」。
--
-- 三张表都**只 CREATE**：`drill_item` / `drill_review` / `drill_audio` / `ear_pair` / `en_*` 这些旧表
-- 一张都不 DROP、不 ALTER —— 他的历史数据不能删（底线 6 周边）。
-- **不存任何密钥**（底线 1）：这里只有组号、词、机器听成了什么和几个数字。
--
-- pron_round：一轮考完记一行（**不是每题一行**）。一轮就是「同一组连考 10 题」，
--   所以 grp + asked + ok + same + passed 合起来才说得清「他在这一组上到底怎么样」。
-- pron_say：纠说一次记一行。`heard` **原样存**机器听成的那串字（可能两个词都不是），
--   `hit` 三态：1 命中目标 / 0 命中另一个 / -1 两个都不是。
--   为什么不存成"对 / 错"：语音识别天生要对口音稳健，它可能把念歪的 /e/ 也认成 bad——
--   **它听成什么是线索，不是判决**（底线 3）。
-- pron_audio：那 56 个词的发音（aura-2-en 生成一次就永久复用）。
--   为什么另起一张、不往 `drill_audio` 里塞：带练整块已经下线，新模块不写退休模块的表；
--   旧表和旧行原样留着（想查还查得出来）。一个词一行，最多 56 行，不需要索引。

CREATE TABLE pron_round (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grp TEXT NOT NULL,          -- g1..g7
  at INTEGER NOT NULL,
  asked INTEGER NOT NULL,     -- 这一轮考了几题
  ok INTEGER NOT NULL,        -- 对几题
  same INTEGER NOT NULL,      -- 点过几次「两个听着一样」
  passed INTEGER NOT NULL     -- 0/1，有没有到 80%
);

CREATE TABLE pron_say (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grp TEXT NOT NULL,
  target TEXT NOT NULL,       -- 他要念的那个词
  heard TEXT NOT NULL,        -- 机器听成了什么（原样存，可能两个都不是）
  hit INTEGER NOT NULL,       -- 1 命中目标 / 0 命中另一个 / -1 两个都不是
  at INTEGER NOT NULL
);

CREATE TABLE pron_audio (
  item TEXT NOT NULL PRIMARY KEY,   -- 发音版本号 + 词编号，例如 a2:g1-1a（src/pron-audio.ts 的 audioKey）
  mp3 BLOB NOT NULL,
  at INTEGER NOT NULL
);
