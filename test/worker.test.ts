// 验收测试（中转服务层）：Worker 只做三件事——发网页、报素材清单、发素材。
// 1.0 不用 R2：素材和网页一起放进 Cloudflare 的静态资源（构建时由 scripts/build-assets.mjs 拼出 dist/），
// 清单是构建时扫出来的 /_media-manifest.json —— 因为静态资源**不能在运行时列目录**。
// 对外两个形状一个字没变：/media/<文件名> 和 /api/manifest 的返回结构和 R2 版完全一样。
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';
import { SCENES } from '../web/scenes.js';

type Obj = { body: string; type?: string };
/** 假的静态资源：/_media-manifest.json 给清单，/media/<名> 给文件，别的给首页。够测路由就行。 */
function makeEnv(objects: Record<string, Obj> = {}, opts: { manifest?: string[] | null } = {}) {
  const asked: string[] = [];
  const env = {
    ENVIRONMENT: 'test',
    ASSETS: {
      async fetch(req: Request) {
        const p = new URL(req.url).pathname;
        asked.push(p);
        if (p === '/_media-manifest.json') {
          // opts.manifest === null：这次部署没带上清单文件（静态资源回 404）
          if (opts.manifest === null) return new Response('Not Found', { status: 404 });
          const files = opts.manifest ?? Object.keys(objects).sort();
          return new Response(JSON.stringify({ files }), { headers: { 'content-type': 'application/json' } });
        }
        if (p.startsWith('/media/')) {
          const o = objects[decodeURIComponent(p.slice('/media/'.length))];
          if (!o) return new Response('Not Found', { status: 404 });
          return new Response(o.body, {
            headers: { 'content-type': o.type || 'application/octet-stream', etag: '"' + p + '"' },
          });
        }
        return new Response('<!doctype html>首页', { headers: { 'content-type': 'text/html' } });
      },
    },
  };
  return { env: env as unknown as Parameters<typeof worker.fetch>[1], asked };
}
const call = (path: string, env = makeEnv().env, init?: RequestInit) =>
  worker.fetch(new Request('https://practical.workers.dev' + path, init), env, {} as ExecutionContext);

describe('GET /health', () => {
  it('不含任何密钥，说清素材齐了几个', async () => {
    const { env } = makeEnv({ 'scene-01-correct.png': { body: 'x' } });
    const r = await call('/health', env);
    expect(r.status).toBe(200);
    const j = await r.json() as Record<string, unknown>;
    expect(j.ok).toBe(true);
    expect(j.media_ready).toBe(0);
    expect(j.media_total).toBe(30);
    expect(JSON.stringify(j).toLowerCase()).not.toContain('token');
  });
});

describe('GET /api/manifest', () => {
  const full = (id: string, ext = 'png') => ({
    [`scene-${id}-correct.${ext}`]: { body: 'i' }, [`scene-${id}-d1-phoneme.${ext}`]: { body: 'i' },
    [`scene-${id}-d2-action.${ext}`]: { body: 'i' }, [`scene-${id}-d3-function.${ext}`]: { body: 'i' },
    [`scene-${id}-audio.mp3`]: { body: 'a' },
  });
  it('一个素材都没有的时候也要正常回话（0 / 30），不是 500', async () => {
    const r = await call('/api/manifest');
    expect(r.status).toBe(200);
    const j = await r.json() as { ready: number; total: number; scenes: unknown[] };
    expect(j.ready).toBe(0);
    expect(j.total).toBe(30);
    expect(j.scenes).toHaveLength(30);
  });
  it('清单里写了多少个文件就算多少个，一个都不许漏（原 R2 版"列桶要翻到底"换到这条路径上）', async () => {
    // 真素材现在是 109 个文件、21 个场景齐；这里照同样的规模造，防止哪天图省事只读清单的前 N 条
    const ids = Array.from({ length: 21 }, (_, i) => String(i + 1).padStart(2, '0'));
    const objects = Object.assign({}, ...ids.map((id) => full(id, 'jpg')));
    const { env } = makeEnv(objects);
    const r = await call('/api/manifest', env);
    const j = await r.json() as { ready: number; scenes: { id: string; ready: boolean }[] };
    expect(Object.keys(objects)).toHaveLength(105);
    expect(j.ready).toBe(21);
    expect(j.scenes.filter((s) => s.ready).map((s) => s.id)).toEqual(ids);
  });
  it('同一个槽位换个后缀也要认出来（.jpg / .png / .webp 混着放也算齐）', async () => {
    const { env } = makeEnv({
      'scene-01-correct.jpg': { body: 'i' }, 'scene-01-d1-phoneme.png': { body: 'i' },
      'scene-01-d2-action.webp': { body: 'i' }, 'scene-01-d3-function.jpeg': { body: 'i' },
      'scene-01-audio.m4a': { body: 'a' },
    });
    const r = await call('/api/manifest', env);
    const j = await r.json() as { ready: number; scenes: { id: string; files: Record<string, string> }[] };
    expect(j.ready).toBe(1);
    expect(j.scenes[0].files).toEqual({
      correct: 'scene-01-correct.jpg', 'd1-phoneme': 'scene-01-d1-phoneme.png',
      'd2-action': 'scene-01-d2-action.webp', 'd3-function': 'scene-01-d3-function.jpeg',
      audio: 'scene-01-audio.m4a',
    });
  });
  it('缺一个文件的场景就是没齐，并说清缺的是哪一个（真素材里场景 20 就是这样）', async () => {
    const objects = full('20', 'jpg');
    delete (objects as Record<string, unknown>)['scene-20-d3-function.jpg'];
    const { env } = makeEnv(objects);
    const j = await (await call('/api/manifest', env)).json() as { ready: number; scenes: { id: string; ready: boolean; missing: string[] }[] };
    expect(j.ready).toBe(0);
    expect(j.scenes.find((s) => s.id === '20')).toMatchObject({ ready: false, missing: ['d3-function'] });
  });
  it('清单不缓存（Amos 传了素材马上就能看到）', async () => {
    const r = await call('/api/manifest');
    expect(r.headers.get('cache-control')).toContain('no-store');
  });
  it('清单文件没跟着部署上去时回 0 / 30 并说明原因，不白屏（原 R2 版"桶没绑好"换到这条路径上）', async () => {
    const { env } = makeEnv({ 'scene-01-correct.jpg': { body: 'i' } }, { manifest: null });
    const r = await call('/api/manifest', env);
    expect(r.status).toBe(200);
    const j = await r.json() as { ready: number; note?: string };
    expect(j.ready).toBe(0);
    expect(j.note).toContain('_media-manifest.json');
  });
  it('清单是构建时生成的，不许在运行时去列目录（只读那一个清单文件）', async () => {
    const { env, asked } = makeEnv({ 'scene-01-correct.jpg': { body: 'i' } });
    await call('/api/manifest', env);
    expect(asked).toEqual(['/_media-manifest.json']);
  });
});

describe('GET /media/<文件名>', () => {
  it('有就发，带上类型和长缓存', async () => {
    const { env } = makeEnv({ 'scene-01-audio.mp3': { body: 'MP3DATA', type: 'audio/mpeg' } });
    const r = await call('/media/scene-01-audio.mp3', env);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('audio/mpeg');
    expect(String(r.headers.get('cache-control'))).toContain('max-age=86400');
    expect(await r.text()).toBe('MP3DATA');
  });
  it('静态资源没给类型的，按后缀补上（.jpg 也要补对，真素材就是 .jpg）', async () => {
    const { env } = makeEnv({ 'scene-01-correct.jpg': { body: 'JPGDATA' }, 'scene-02-correct.png': { body: 'PNGDATA' } });
    expect((await call('/media/scene-01-correct.jpg', env)).headers.get('content-type')).toBe('image/jpeg');
    expect((await call('/media/scene-02-correct.png', env)).headers.get('content-type')).toBe('image/png');
  });
  it('没有就 404，而且身上带一句人话（S10 的降级依据）', async () => {
    const r = await call('/media/scene-09-audio.mp3');
    expect(r.status).toBe(404);
    expect(await r.text()).toContain('还没生成');
  });
  it('不许用 .. 跳出 media 文件夹', async () => {
    const r = await call('/media/..%2F..%2Fsecret');
    expect(r.status).toBe(400);
  });
  it('只认 scene-NN-槽位.后缀 这种名字（清单文件本身也发不出去）', async () => {
    expect((await call('/media/wrangler.toml')).status).toBe(400);
    expect((await call('/media/_media-manifest.json')).status).toBe(400);
  });
  it('只收 GET 和 HEAD', async () => {
    expect((await call('/media/scene-01-audio.mp3', makeEnv().env, { method: 'POST' })).status).toBe(405);
  });
});

describe('网页本体', () => {
  it('/ 交给静态资源，不经过这段代码改写', async () => {
    const r = await call('/');
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('首页');
  });
  it('题目区用到的 30 个场景在前端代码里，不从服务器要', () => {
    expect(SCENES).toHaveLength(30);
  });
});
