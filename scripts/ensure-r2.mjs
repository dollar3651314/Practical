#!/usr/bin/env node
/**
 * R2 桶一键准备（CI 部署前运行，可以重复运行）：按名字查这个账户的 R2 桶，没有就新建。
 *   node scripts/ensure-r2.mjs --env staging|production
 * 需要环境变量 CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID（GitHub Secrets，由 Amos 填，底线 1）；令牌要有 R2 Edit 权限。
 * 输出里没有密钥。建不出来时把原因打出来并退出 1——《上线操作手册》第二步有"自己在控制台建"的做法。
 * 参照：Marketing scripts/ensure-d1.mjs。
 */
import { execFileSync } from 'node:child_process';

export const BUCKETS = { production: 'practical-media', staging: 'practical-media-staging' };

/** wrangler r2 bucket list 的输出里把桶名抠出来（它可能是 JSON，也可能是人话表格） */
export function parseBuckets(out) {
  const i = out.indexOf('[');
  if (i >= 0) {
    try {
      const arr = JSON.parse(out.slice(i));
      if (Array.isArray(arr)) return arr.map((b) => (typeof b === 'string' ? b : b.name)).filter(Boolean);
    } catch { /* 不是 JSON 就按人话解析 */ }
  }
  return [...out.matchAll(/^\s*(?:name:\s*)?(practical-media[a-z-]*)\s*$/gim)].map((m) => m[1]);
}

function wrangler(args) {
  return execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'inherit'],
  });
}

function main() {
  const i = process.argv.indexOf('--env');
  const name = BUCKETS[i > 0 ? process.argv[i + 1] : ''];
  if (!name) { console.error('用法：node scripts/ensure-r2.mjs --env staging|production'); process.exit(2); }
  let have = [];
  try { have = parseBuckets(wrangler(['r2', 'bucket', 'list'])); }
  catch { console.error('✗ 列不出 R2 桶：令牌可能没有 R2 权限，或者这个账户还没开通 R2（控制台左边 R2 → Get started，要先绑一张卡，免费额度内不扣钱）'); process.exit(1); }
  if (have.includes(name)) { console.log(`✓ R2 桶 ${name} 已存在`); return; }
  try { wrangler(['r2', 'bucket', 'create', name]); }
  catch { console.error(`✗ 建不出 R2 桶 ${name}：按《上线操作手册》第二步在控制台手动建一个同名的桶，再重跑一次部署`); process.exit(1); }
  console.log(`✓ 新建 R2 桶 ${name}`);
}

if (process.argv[1] && process.argv[1].endsWith('ensure-r2.mjs')) main();
