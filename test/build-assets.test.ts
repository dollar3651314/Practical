// 验收测试（构建层）：清单是构建时扫 media/ 扫出来的 —— 线上的 Worker 读不到静态资源的文件列表，
// 所以这一步错了，线上就会"素材明明传上去了却说没齐"，而且没有任何报错。这里用真的临时目录测，不打桩。
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { classifyNames, scanMedia, buildAssets, MANIFEST_ASSET } from '../scripts/build-assets.mjs';
import { buildManifest, SCENE_IDS } from '../src/manifest.js';

let TMP = '';
const write = (p: string, body = 'x') => { mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, body); };
beforeEach(() => { TMP = mkdtempSync(path.join(tmpdir(), 'practical-build-')); });
afterEach(() => { rmSync(TMP, { recursive: true, force: true }); });

/** 一个场景的五个文件 */
const five = (dir: string, id: string, ext = 'jpg') => {
  for (const s of ['correct', 'd1-phoneme', 'd2-action', 'd3-function']) write(path.join(dir, `scene-${id}-${s}.${ext}`));
  write(path.join(dir, `scene-${id}-audio.mp3`));
};

describe('扫出来的清单：哪些算素材', () => {
  it('合法文件名进清单，别的一概不进（README、生成记录、改错的名字）', () => {
    const r = classifyNames([
      'scene-01-correct.jpg', 'scene-01-audio.mp3', 'README.md', '生成记录.json',
      'scene-1-correct.jpg', 'scene-01-correct.gif', 'scene-01-d4-other.jpg', 'wrangler.toml',
    ]);
    expect(r.files).toEqual(['scene-01-audio.mp3', 'scene-01-correct.jpg']);
    expect(r.ignored).toContain('README.md');
    expect(r.ignored).toContain('scene-1-correct.jpg');   // 编号不是两位
    expect(r.ignored).toContain('scene-01-correct.gif');  // 后缀不收
  });
  it('同一个槽位换个后缀也认（.jpg / .png / .webp / .jpeg，音频 .mp3 / .m4a / .wav）', () => {
    const names = ['scene-01-correct.jpg', 'scene-01-d1-phoneme.png', 'scene-01-d2-action.webp',
      'scene-01-d3-function.jpeg', 'scene-01-audio.m4a'];
    expect(classifyNames(names).files).toEqual([...names].sort());
    // 扫出来的清单交给和线上同一个 buildManifest()，混着后缀也要算"齐了"
    expect(buildManifest(classifyNames(names).files, ['01']).ready).toBe(1);
  });
  it('清单是排好序、不重复的（同样的素材每次构建出来一模一样）', () => {
    const r = classifyNames(['scene-02-audio.mp3', 'scene-01-audio.mp3', 'scene-01-audio.mp3']);
    expect(r.files).toEqual(['scene-01-audio.mp3', 'scene-02-audio.mp3']);
  });
});

describe('扫文件夹', () => {
  it('109 个真素材这种规模全扫到，一个不漏（不是只扫前几个）', () => {
    const ids = Array.from({ length: 21 }, (_, i) => String(i + 1).padStart(2, '0'));
    for (const id of ids) five(TMP, id);
    write(path.join(TMP, 'README.md'));
    const r = scanMedia(TMP);
    expect(r.files).toHaveLength(105);
    expect(buildManifest(r.files, SCENE_IDS).ready).toBe(21);
  });
  it('子文件夹里的也扫得到（只看文件名最后一段）', () => {
    five(path.join(TMP, 'scene-01'), '01');
    expect(buildManifest(scanMedia(TMP).files, ['01']).ready).toBe(1);
  });
  it('两个地方放了同名文件就报错，不闷声选一个', () => {
    write(path.join(TMP, 'scene-01-audio.mp3'));
    write(path.join(TMP, '旧的', 'scene-01-audio.mp3'));
    expect(() => scanMedia(TMP)).toThrow(/重名/);
  });
  it('文件夹不存在、或者一个素材都没有，不报错，回空清单（网站会说"素材还没生成"）', () => {
    expect(scanMedia(path.join(TMP, '没有这个目录')).files).toEqual([]);
    expect(scanMedia(TMP).files).toEqual([]);
  });
});

describe('拼出要部署的目录', () => {
  it('网页原样带上，素材放进 media/，清单写成 JSON 跟着一起部署', () => {
    const web = path.join(TMP, 'web');
    const media = path.join(TMP, 'media');
    const out = path.join(TMP, 'dist');
    write(path.join(web, 'index.html'), '<!doctype html>首页');
    write(path.join(web, 'app.js'), '// 页面');
    five(media, '01');
    write(path.join(media, 'README.md'), '# 说明');

    const r = buildAssets({ web, media, out });
    expect(readFileSync(path.join(out, 'index.html'), 'utf8')).toContain('首页');
    expect(existsSync(path.join(out, 'app.js'))).toBe(true);
    // 素材按 /media/<文件名> 这个地址放好——这个地址一个字都不许变
    expect(readdirSync(path.join(out, 'media')).sort()).toEqual(r.files);
    expect(r.files).toContain('scene-01-correct.jpg');
    // 不是素材的文件不带上（README、生成记录里有提示词，也没必要发出去）
    expect(existsSync(path.join(out, 'media', 'README.md'))).toBe(false);
    expect(r.ignored).toContain('README.md');
    const manifest = JSON.parse(readFileSync(path.join(out, MANIFEST_ASSET), 'utf8')) as { files: string[] };
    expect(manifest.files).toEqual(r.files);
    expect(buildManifest(manifest.files, ['01']).ready).toBe(1);
  });
  it('清单和真带上去的文件永远一致：上一次构建留下的素材不会赖着不走', () => {
    const web = path.join(TMP, 'web');
    const media = path.join(TMP, 'media');
    const out = path.join(TMP, 'dist');
    write(path.join(web, 'index.html'), '首页');
    five(media, '01');
    buildAssets({ web, media, out });
    expect(existsSync(path.join(out, 'media', 'scene-01-correct.jpg'))).toBe(true);

    rmSync(path.join(media, 'scene-01-correct.jpg'));   // Amos 把这张图删了，重新部署
    const r2 = buildAssets({ web, media, out });
    expect(existsSync(path.join(out, 'media', 'scene-01-correct.jpg'))).toBe(false);
    expect(r2.files).not.toContain('scene-01-correct.jpg');
    const manifest = JSON.parse(readFileSync(path.join(out, MANIFEST_ASSET), 'utf8')) as { files: string[] };
    expect(buildManifest(manifest.files, ['01']).scenes[0]).toMatchObject({ ready: false, missing: ['correct'] });
  });
  it('一个素材都没有也能构建出来（网站照样打得开，只是不让开始）', () => {
    const web = path.join(TMP, 'web');
    const out = path.join(TMP, 'dist');
    write(path.join(web, 'index.html'), '首页');
    const r = buildAssets({ web, media: path.join(TMP, 'media'), out });
    expect(r.files).toEqual([]);
    expect(existsSync(path.join(out, 'index.html'))).toBe(true);
    expect(JSON.parse(readFileSync(path.join(out, MANIFEST_ASSET), 'utf8'))).toEqual({ files: [] });
  });
});
