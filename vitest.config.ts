/**
 * 测试（vitest）：Node 里跑 Worker 的代码。
 * 盲听卡那几份（core / worker / build-assets）是纯函数和假的 Fetcher；
 * 发音训练那两份（pron / pron-lesson，2026-11-12 从 Marketing 搬过来）要一个真的 D1 ——
 * 用 wrangler 的 getPlatformProxy 起本地实现（Miniflare 的真实 SQLite，test/wrangler.test.toml），
 * 起这个要花十几秒，所以超时按 Marketing 那边的值放宽（照抄 Marketing vitest.config.ts）。
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // 结构化日志（{"event":…}）不打印到测试输出
    onConsoleLog: (log) => !log.startsWith('{"event"'),
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
