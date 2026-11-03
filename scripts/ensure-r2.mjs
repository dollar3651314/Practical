#!/usr/bin/env node
/**
 * 部署前的素材检查（CI 的 deploy job 运行，可以重复运行）：
 *   node scripts/ensure-r2.mjs --env staging|production
 *
 * 这个文件原来是"R2 桶一键准备"：按名字查桶，没有就建。1.0 不走 R2 了，所以它不再碰 Cloudflare，
 * 只剩一件事——把"这次部署会带上多少素材"说清楚，免得 Amos 传完素材不知道有没有生效。
 *
 * 为什么不再需要 R2（Amos 2026-11-03 拍的板）：
 *   「现在还是我自己的功能与玩法验证阶段，我不想绑卡」。而 Cloudflare 开通 R2 **必须先绑付款方式**，
 *   所以 1.0 的素材改成跟代码一起走 Workers 静态资源（免费版每个版本 20,000 个文件、每个文件 25 MiB，
 *   官方文档没有写总量上限；我们是 109 个文件、最大 287 KB，差得很远）。
 *   文件名留着不改，是因为将来要收费、素材要保密时会切回 R2——那时把这里换回"建桶"，
 *   /media/<文件名> 和 /api/manifest 的形状不变，页面一行都不用动。
 *
 * 输出里没有密钥。退出码永远是 0：素材没齐不拦着部署（网站本来就会降级），只把话说清楚。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanMedia } from './build-assets.mjs';
import { buildManifest, SCENE_IDS } from '../src/manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function main(argv = process.argv.slice(2)) {
  const i = argv.indexOf('--env');
  const env = i >= 0 ? argv[i + 1] : '';
  if (!['staging', 'production'].includes(env)) {
    console.error('用法：node scripts/ensure-r2.mjs --env staging|production');
    process.exit(2);
  }
  const dir = path.join(ROOT, 'media');
  const scan = scanMedia(dir);
  const m = buildManifest(scan.files, SCENE_IDS);
  console.log(`· 这次部署（${env}）会带上 ${scan.files.length} 个素材文件，${m.ready} / ${m.total} 个场景齐了`);
  if (!scan.files.length) {
    console.log('  ✗ media/ 里一个素材都没有：网站打得开，但首屏会写「素材还没生成 0 / 30」，开始按钮按不动。');
    console.log('    按《上线操作手册》第四步，在 GitHub 网页上把素材拖进 media/ 文件夹。');
  } else if (m.ready < m.total) {
    const 差几个 = m.scenes.filter((s) => !s.ready && s.missing.length < 5);
    console.log(`  · 还差 ${m.total - m.ready} 个场景；齐了的那些已经能出题，缺的会自动跳过（不算答错）。`);
    for (const s of 差几个) console.log(`    scene-${s.id}：只差 ${s.missing.join('、')}`);
  }
  if (scan.ignored.length) {
    console.log(`  · media/ 里有 ${scan.ignored.length} 个名字不算素材的文件，不会带上：${scan.ignored.slice(0, 6).join('、')}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('ensure-r2.mjs')) main();
