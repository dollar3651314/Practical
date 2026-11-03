// 验收测试（中转服务层）：Worker 只做三件事——发网页（交给 Cloudflare 的静态资源）、报素材清单、发 R2 里的素材。
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';
import { SCENES } from '../web/scenes.js';

type Obj = { body: string; type?: string };
/** 假的 R2 桶和静态资源，够测路由就行 */
function makeEnv(objects: Record<string, Obj> = {}) {
  return {
    ENVIRONMENT: 'test',
    ASSETS: { fetch: async () => new Response('<!doctype html>首页', { headers: { 'content-type': 'text/html' } }) },
    MEDIA: {
      async list({ cursor }: { cursor?: string } = {}) {
        const keys = Object.keys(objects).sort();
        const start = cursor ? Number(cursor) : 0;
        const page = keys.slice(start, start + 2); // 故意一页只给 2 个，强制走翻页
        const done = start + 2 >= keys.length;
        return { objects: page.map((key) => ({ key })), truncated: !done, cursor: done ? undefined : String(start + 2) };
      },
      async get(key: string) {
        const o = objects[key];
        if (!o) return null;
        return {
          body: o.body, httpEtag: '"' + key + '"', size: o.body.length,
          writeHttpMetadata(h: Headers) { if (o.type) h.set('content-type', o.type); },
        };
      },
    },
  } as unknown as Parameters<typeof worker.fetch>[1];
}
const call = (path: string, env = makeEnv(), init?: RequestInit) =>
  worker.fetch(new Request('https://practical.workers.dev' + path, init), env, {} as ExecutionContext);

describe('GET /health', () => {
  it('不含任何密钥，说清素材齐了几个', async () => {
    const env = makeEnv({ 'scene-01-correct.png': { body: 'x' } });
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
  const full = (id: string) => ({
    [`scene-${id}-correct.png`]: { body: 'i' }, [`scene-${id}-d1-phoneme.png`]: { body: 'i' },
    [`scene-${id}-d2-action.png`]: { body: 'i' }, [`scene-${id}-d3-function.png`]: { body: 'i' },
    [`scene-${id}-audio.mp3`]: { body: 'a' },
  });
  it('桶是空的时候也要正常回话（0 / 30），不是 500', async () => {
    const r = await call('/api/manifest');
    expect(r.status).toBe(200);
    const j = await r.json() as { ready: number; total: number; scenes: unknown[] };
    expect(j.ready).toBe(0);
    expect(j.total).toBe(30);
    expect(j.scenes).toHaveLength(30);
  });
  it('列桶要一直翻到底，不能只看第一页', async () => {
    const r = await call('/api/manifest', makeEnv({ ...full('01'), ...full('02') }));
    const j = await r.json() as { ready: number };
    expect(j.ready).toBe(2);
  });
  it('清单不缓存（Amos 传了素材马上就能看到）', async () => {
    const r = await call('/api/manifest');
    expect(r.headers.get('cache-control')).toContain('no-store');
  });
  it('R2 没绑好时回 0 / 30 并说明原因，不白屏', async () => {
    const env = makeEnv();
    (env as unknown as { MEDIA: unknown }).MEDIA = undefined;
    const r = await call('/api/manifest', env);
    expect(r.status).toBe(200);
    const j = await r.json() as { ready: number; note?: string };
    expect(j.ready).toBe(0);
    expect(j.note).toContain('R2');
  });
});

describe('GET /media/<文件名>', () => {
  it('有就发，带上类型和长缓存', async () => {
    const env = makeEnv({ 'scene-01-audio.mp3': { body: 'MP3DATA', type: 'audio/mpeg' } });
    const r = await call('/media/scene-01-audio.mp3', env);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('audio/mpeg');
    expect(r.headers.get('cache-control')).toContain('max-age');
  });
  it('上传时没带类型的，按后缀补上（控制台拖进去的文件常常没有）', async () => {
    const env = makeEnv({ 'scene-01-correct.png': { body: 'PNGDATA' } });
    const r = await call('/media/scene-01-correct.png', env);
    expect(r.headers.get('content-type')).toBe('image/png');
  });
  it('没有就 404，而且身上带一句人话（S10 的降级依据）', async () => {
    const r = await call('/media/scene-09-audio.mp3');
    expect(r.status).toBe(404);
    expect(await r.text()).toContain('还没生成');
  });
  it('不许用 .. 跳出桶', async () => {
    const r = await call('/media/..%2F..%2Fsecret');
    expect(r.status).toBe(400);
  });
  it('只认 scene-NN-槽位.后缀 这种名字', async () => {
    expect((await call('/media/wrangler.toml')).status).toBe(400);
  });
  it('只收 GET 和 HEAD', async () => {
    expect((await call('/media/scene-01-audio.mp3', makeEnv(), { method: 'POST' })).status).toBe(405);
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
