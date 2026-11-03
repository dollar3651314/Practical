#!/usr/bin/env node
/**
 * 素材检查：告诉你 30 个场景里哪些齐了、哪些缺、哪些名字写错了。
 * 规则和线上完全一样（共用 src/manifest.js），所以这里说齐了，传上去就能出题。
 *   node scripts/check-media.mjs                  # 查本地文件夹 素材/
 *   node scripts/check-media.mjs <文件夹>          # 查别的文件夹
 *   node scripts/check-media.mjs --url https://practical.<子域名>.workers.dev
 *                                                # 查已经部署的那一套（读它的 /api/manifest）
 *   node scripts/check-media.mjs --json           # 只输出 JSON，给别的脚本用
 * 子文件夹（scene-01/ 这种）会一起扫，文件名只看最后一段。
 * 退出码：全齐 0；有缺的 1；文件夹不存在 2。
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { buildManifest, SLOTS, SCENE_IDS, MEDIA_KEY } from '../src/manifest.js';

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? (argv[i + 1] || '') : null; };
const JSON_ONLY = argv.includes('--json');
const URL_ARG = flag('--url');
const DIR = argv.find((a) => !a.startsWith('--') && a !== URL_ARG) || '素材';
const 槽位名 = { correct: '正确图', 'd1-phoneme': '音素干扰图', 'd2-action': '动作干扰图', 'd3-function': '虚词数字干扰图', audio: '音频' };

/** 把一个文件夹（含子文件夹）里的文件名收集起来，只取最后一段 */
function scan(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...scan(p));
    else out.push(name);
  }
  return out;
}

let names = [];
let where = '';
let manifest;
if (URL_ARG) {
  where = URL_ARG.replace(/\/$/, '');
  const r = await fetch(where + '/api/manifest');
  if (!r.ok) { console.error(`读不到 ${where}/api/manifest（${r.status}）`); process.exit(2); }
  manifest = await r.json();
} else {
  where = path.resolve(DIR);
  if (!existsSync(where)) {
    console.error(`没有这个文件夹：${where}\n把 Amos 生成的素材放进去，或者用 --url 查已经部署的那一套。`);
    process.exit(2);
  }
  names = scan(where);
  manifest = buildManifest(names, SCENE_IDS);
}

if (JSON_ONLY) { console.log(JSON.stringify(manifest, null, 1)); process.exit(manifest.ready === manifest.total ? 0 : 1); }

console.log(`素材检查：${where}`);
console.log(`齐了 ${manifest.ready} / ${manifest.total} 个场景\n`);
const bad = manifest.scenes.filter((s) => !s.ready);
if (bad.length) {
  const 全缺 = bad.filter((s) => s.missing.length === SLOTS.length);
  const 差几个 = bad.filter((s) => s.missing.length < SLOTS.length);
  if (差几个.length) {
    console.log('只差几个文件的（最要紧，补上就能出题）：');
    for (const s of 差几个) console.log(`  scene-${s.id}：缺 ${s.missing.map((m) => 槽位名[m] || m).join('、')}`);
    console.log('');
  }
  if (全缺.length) {
    console.log(`一个文件都还没有的 ${全缺.length} 个场景：${全缺.map((s) => s.id).join('、')}\n`);
  }
}
if (!URL_ARG) {
  const 不认识 = names.filter((n) => !MEDIA_KEY.test(n) && n !== 'meta.txt');
  if (不认识.length) {
    console.log('名字不对、不会被当成素材的文件（改名就能用，规则见《素材方案-交给Amos的生产包》第五节）：');
    for (const n of 不认识.slice(0, 20)) console.log('  ' + n);
    if (不认识.length > 20) console.log(`  …还有 ${不认识.length - 20} 个`);
    console.log('');
  }
  console.log('一个场景要五个文件，名字一个字母都不能改：');
  console.log('  ' + SLOTS.map((s) => `scene-01-${s}.${s === 'audio' ? 'mp3' : 'png'}`).join('  '));
}
console.log(manifest.ready === manifest.total ? '✓ 30 个场景全齐了，可以上传 R2（《上线操作手册》第四步）' : '✗ 还没齐，齐了的那些已经能出题，缺的会自动跳过');
process.exit(manifest.ready === manifest.total ? 0 : 1);
