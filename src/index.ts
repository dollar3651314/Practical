// Practical 1.0 自用版的中转服务（Cloudflare Worker）。它只做三件事：
//   1. GET /health          —— 活着没有、素材齐了几个（不含任何密钥）
//   2. GET /api/manifest    —— R2 里 30 个场景各缺哪些文件；前端据此决定出哪些题、怎么降级
//   3. GET /media/<文件名>   —— 把 R2 里的真素材发出去
// 网页本体（web/ 目录）由 Cloudflare 的静态资源直接发，不经过这里。
// 没有数据库、没有账号、没有写接口：成绩只存浏览器 localStorage（《使用场景清单-自用版》第一节）。
import { buildManifest, MEDIA_KEY, SCENE_IDS } from './manifest.js';

type Manifest = ReturnType<typeof buildManifest>;

export interface Env {
  ENVIRONMENT: string;
  ASSETS: Fetcher;
  MEDIA?: R2Bucket;
}

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) },
  });
/** 上传时没带类型、或者只写了 application/octet-stream（控制台拖进去、命令行传的都可能这样）就按后缀补一个，否则浏览器不认 */
const TYPE_BY_EXT: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav',
};

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

/** 列完整个桶（R2 一次最多 1000 个，30 个场景共 150 个文件，正常一页就够，这里仍然翻到底） */
async function allKeys(bucket: R2Bucket): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const res: R2Objects = await bucket.list(cursor ? { cursor, limit: 1000 } : { limit: 1000 });
    for (const o of res.objects) keys.push(o.key);
    if (!res.truncated) break;
    cursor = res.cursor;
    if (!cursor) break;
  }
  return keys;
}

async function manifestOf(env: Env): Promise<Manifest> {
  if (!env.MEDIA) {
    const m = buildManifest([], SCENE_IDS);
    m.note = '还没绑定 R2 桶（MEDIA），所以一个素材都读不到。按《上线操作手册》第二步建桶。';
    return m;
  }
  try {
    return buildManifest(await allKeys(env.MEDIA), SCENE_IDS);
  } catch {
    const m = buildManifest([], SCENE_IDS);
    m.note = '读 R2 桶失败，暂时按"素材还没生成"处理。';
    return m;
  }
}

async function serveMedia(request: Request, env: Env, pathname: string): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return text('只收 GET 和 HEAD', 405);
  let key: string;
  try {
    key = decodeURIComponent(pathname.slice('/media/'.length));
  } catch {
    return text('文件名不对', 400);
  }
  // 只认《生产包》的命名，顺手挡住 ../ 之类（它们本来就过不了这条正则）
  if (!MEDIA_KEY.test(key)) return text('文件名不对：只收 scene-01-correct.png 这种名字', 400);
  if (!env.MEDIA) return text('这一题的素材还没生成（还没绑定 R2 桶）', 404);
  const obj = await env.MEDIA.get(key);
  if (!obj) return text('这一题的素材还没生成：' + key, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  const ct = headers.get('content-type');
  if (!ct || ct === 'application/octet-stream') {
    const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    if (TYPE_BY_EXT[ext]) headers.set('content-type', TYPE_BY_EXT[ext]);
  }
  headers.set('etag', obj.httpEtag);
  // 素材一旦上传就不改内容（要换就换文件），所以可以长缓存；清单本身是 no-store，换了素材立刻看得到
  headers.set('cache-control', 'public, max-age=86400');
  return new Response(request.method === 'HEAD' ? null : obj.body, { headers });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p === '/health') {
      const m = await manifestOf(env);
      return json({ ok: true, env: env.ENVIRONMENT, media_ready: m.ready, media_total: m.total, note: m.note });
    }
    if (p === '/api/manifest') return json(await manifestOf(env));
    if (p.startsWith('/media/')) return serveMedia(request, env, p);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
