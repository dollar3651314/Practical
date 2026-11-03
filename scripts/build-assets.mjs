#!/usr/bin/env node
/**
 * 构建静态资源：把网页（web/）和素材（media/）拼成一个目录（dist/），交给 Cloudflare Workers 的静态资源一起部署。
 *   node scripts/build-assets.mjs                                  # web/ + media/ → dist/
 *   node scripts/build-assets.mjs --media <目录> --out <目录>        # 测试用：换源、换去处
 *   node scripts/build-assets.mjs --json                           # 只输出 JSON，给别的脚本用
 *
 * 为什么要这一步（1.0 不用 R2 之后最要紧的一条）：
 *   R2 可以在运行时 list 桶，Workers 的静态资源**不能**——线上的 Worker 读不到自己带了哪些文件。
 *   所以清单必须在**构建时**算好：这里扫一遍 media/，把合法素材的文件名写进 dist/_media-manifest.json，
 *   跟着这次部署一起上去；线上的 /api/manifest 读这份清单，再用和本地一模一样的 buildManifest() 算"哪个场景齐了"。
 *   换句话说：清单永远等于这次部署真带上去的文件，不会和素材对不上。
 *
 * 命名规则只有一份（src/manifest.js 的 MEDIA_KEY），名字不合规的文件（README.md、生成记录.json、乱改的名字）
 * 既不进清单也不进 dist/，线上就当它不存在——和 R2 时代"名字写错 = 这一题一直缺"的表现完全一样。
 */
import { readdirSync, statSync, existsSync, mkdirSync, rmSync, cpSync, copyFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_KEY } from '../src/manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** 清单在静态资源里的路径；Worker 用 ASSETS.fetch 读它（src/index.ts 的 MANIFEST_ASSET 必须一致） */
export const MANIFEST_ASSET = '_media-manifest.json';

/**
 * 纯函数：一堆文件名里，哪些是素材、哪些不是。
 * 排序是为了每次构建出来的清单一模一样（同样的素材 → 同样的 JSON，方便比对）。
 * @param {string[]} names 文件名（只要最后一段，不带目录）
 * @returns {{files:string[],ignored:string[]}}
 */
export function classifyNames(names) {
  const files = [];
  const ignored = [];
  for (const n of names) (MEDIA_KEY.test(n) ? files : ignored).push(n);
  return { files: [...new Set(files)].sort(), ignored: [...new Set(ignored)].sort() };
}

/**
 * 扫素材文件夹。README 说"全部平着放"，这里仍然把子文件夹一起扫了（和 scripts/check-media.mjs 同一个脾气），
 * 只认文件名的最后一段；两个地方放了同名文件会直接报错，免得"部署上去的到底是哪一个"说不清。
 * @param {string} dir
 * @returns {{files:string[],ignored:string[],paths:Record<string,string>}}
 */
export function scanMedia(dir) {
  /** @type {Record<string,string>} */
  const paths = {};
  const names = [];
  const dup = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const name of readdirSync(d).sort()) {
      if (name.startsWith('.')) continue;
      const p = path.join(d, name);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      names.push(name);
      if (MEDIA_KEY.test(name)) {
        if (paths[name] && paths[name] !== p) dup.push(`${name}（${paths[name]} 和 ${p}）`);
        else paths[name] = p;
      }
    }
  };
  walk(dir);
  if (dup.length) throw new Error(`素材重名了，同一个文件名在两个地方：\n  ${dup.join('\n  ')}`);
  return { ...classifyNames(names), paths };
}

/**
 * 拼出要部署的目录：web/ 原样复制，素材放到 <out>/media/，清单写进 <out>/_media-manifest.json。
 * @param {{web?:string,media?:string,out?:string}} [opts]
 */
export function buildAssets({ web = path.join(ROOT, 'web'), media = path.join(ROOT, 'media'), out = path.join(ROOT, 'dist') } = {}) {
  if (!existsSync(web)) throw new Error(`没有网页目录：${web}`);
  const scan = scanMedia(media);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(web, out, { recursive: true });
  mkdirSync(path.join(out, 'media'), { recursive: true });
  for (const name of scan.files) copyFileSync(scan.paths[name], path.join(out, 'media', name));
  // 清单只写文件名：线上 /api/manifest 再用 buildManifest() 把它算成"哪个场景齐了"，规则和本地、测试共用一份
  writeFileSync(path.join(out, MANIFEST_ASSET), JSON.stringify({ files: scan.files }, null, 1) + '\n');
  return { out, files: scan.files, ignored: scan.ignored, mediaDir: media };
}

if (process.argv[1] && process.argv[1].endsWith('build-assets.mjs')) {
  const argv = process.argv.slice(2);
  const flag = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : dflt; };
  const r = buildAssets({ media: flag('--media', undefined), out: flag('--out', undefined) });
  if (argv.includes('--json')) { console.log(JSON.stringify(r, null, 1)); }
  else {
    console.log(`✓ 静态资源已拼好：${r.out}（网页 + ${r.files.length} 个素材文件）`);
    if (!r.files.length) console.log(`  · ${r.mediaDir} 里一个素材都没有：网站会显示「素材还没生成 0 / 30」，开始按钮按不动。`);
    if (r.ignored.length) console.log(`  · 名字不是素材、没有带上的 ${r.ignored.length} 个文件：${r.ignored.slice(0, 6).join('、')}${r.ignored.length > 6 ? ' …' : ''}`);
  }
}
