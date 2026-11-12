#!/usr/bin/env node
/**
 * D1 一键准备（CI 部署前运行，可以重复运行）：
 *   1. 按名字查这个账户的 D1（marketing / practical-staging），没有就新建（位置提示 apac）；
 *   2. 把编号写进本次部署用的配置 wrangler.deploy.toml（wrangler.toml 的副本，不进仓库）。
 * 2026-11-12 从 Marketing 搬过来（发音训练整块搬到 Practical，跟着要 D1）。库名：practical / practical-staging。
 * **这就是 wrangler.toml 里 database_id 写 local-only 也能部署的原因**：真 id 是部署时现查/现建、
 * 写进 wrangler.deploy.toml（不进仓库）的。Amos 不需要去控制台手填 id（底线 1 只管密钥）。
 * 需要环境变量 CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID（GitHub Secrets）；令牌要有 D1 Edit 权限。输出里没有密钥。
 * 用法：node scripts/ensure-d1.mjs --env staging|production
 * 参照：new-forecast staging ea4482a site/scripts/ensure-d1.mjs。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_NAMES = { production: 'practical', staging: 'practical-staging' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** 把 database_name = "<name>" 那一段的 database_id 换成 uuid；找不到或不止一处时报错（配置被改坏了，宁可停下） */
export function patchConfig(toml, name, uuid) {
  if (!UUID.test(uuid)) throw new Error(`D1 编号格式不对：${uuid}`);
  const re = new RegExp(`(database_name = "${name.replace(/[-]/g, '\\-')}"\\r?\\n)database_id = "[^"]*"`, 'g');
  const hits = toml.match(re);
  if (!hits || hits.length !== 1) throw new Error(`wrangler.toml 里 database_name = "${name}" 后面没有紧跟一行 database_id（找到 ${hits ? hits.length : 0} 处）`);
  return toml.replace(re, `$1database_id = "${uuid}"`);
}

/** wrangler d1 list --json 的输出里取 JSON 数组（前面可能有提示行） */
export function parseList(out) {
  const i = out.indexOf('[');
  if (i < 0) throw new Error('wrangler d1 list 没有返回 JSON');
  const arr = JSON.parse(out.slice(i));
  if (!Array.isArray(arr)) throw new Error('wrangler d1 list 返回的不是数组');
  return arr;
}

function wrangler(root, args) {
  return execFileSync('npx', ['wrangler', ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'inherit'] });
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const i = process.argv.indexOf('--env');
  const name = DB_NAMES[i > 0 ? process.argv[i + 1] : ''];
  if (!name) {
    console.error('用法：node scripts/ensure-d1.mjs --env staging|production');
    process.exit(2);
  }
  let db = parseList(wrangler(root, ['d1', 'list', '--json'])).find((d) => d.name === name);
  if (db) {
    console.log(`✓ D1 ${name} 已存在`);
  } else {
    wrangler(root, ['d1', 'create', name, '--location', 'apac']);
    db = parseList(wrangler(root, ['d1', 'list', '--json'])).find((d) => d.name === name);
    if (!db) throw new Error(`新建 D1 ${name} 以后还是查不到`);
    console.log(`✓ 新建 D1 ${name}（位置提示 apac）`);
  }
  const toml = readFileSync(path.join(root, 'wrangler.toml'), 'utf8');
  writeFileSync(path.join(root, 'wrangler.deploy.toml'), patchConfig(toml, name, db.uuid));
  console.log(`✓ 本次部署的配置 wrangler.deploy.toml 已写好（D1 编号 ${db.uuid.slice(0, 8)}…）`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
