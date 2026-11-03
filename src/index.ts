// Practical 1.0 自用版的中转服务（Cloudflare Worker）。它只做三件事：
//   1. GET /health          —— 活着没有、素材齐了几个（不含任何密钥）
//   2. GET /api/manifest    —— 30 个场景各缺哪些文件；前端据此决定出哪些题、怎么降级
//   3. GET /media/<文件名>   —— 把素材发出去
// 网页本体和素材都在 Cloudflare 的静态资源里（构建时由 scripts/build-assets.mjs 把 web/ + media/ 拼成 dist/）。
// 1.0 不用 R2（Amos 2026-11-03：功能验证阶段不绑卡，开通 R2 要绑付款方式），素材跟着代码一起部署。
// 要紧的一条：静态资源**不能在运行时列目录**，所以"有哪些素材"是构建时扫出来的 /_media-manifest.json。
// 对外的两个形状一个字都没变：/media/<文件名> 和 /api/manifest 的返回结构和 R2 版完全一样，
// 将来要收费、素材要保密，只换这一层回 R2，web/ 下的页面代码不用动。
// 没有数据库、没有账号、没有写接口：成绩只存浏览器 localStorage（《使用场景清单-自用版》第一节）。
import { buildManifest, MEDIA_KEY, SCENE_IDS } from './manifest.js';

type Manifest = ReturnType<typeof buildManifest>;

export interface Env {
  ENVIRONMENT: string;
  ASSETS: Fetcher;
}

/** 构建时写进静态资源的素材清单（scripts/build-assets.mjs 的 MANIFEST_ASSET 必须一致） */
const MANIFEST_ASSET = '/_media-manifest.json';

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) },
  });
/** 静态资源没给类型、或者只给了 application/octet-stream 就按后缀补一个，否则浏览器不认 */
const TYPE_BY_EXT: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav',
};

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

/** 读构建时生成的素材清单（相当于 R2 版的 list 整个桶）。读不到就抛，交给 manifestOf 兜底。 */
async function allKeys(request: Request, env: Env): Promise<string[]> {
  const res = await env.ASSETS.fetch(new Request(new URL(MANIFEST_ASSET, request.url), { method: 'GET' }));
  if (!res.ok) throw new Error('没有 ' + MANIFEST_ASSET);
  const data = await res.json() as { files?: unknown };
  if (!Array.isArray(data.files)) throw new Error(MANIFEST_ASSET + ' 里没有 files');
  return data.files.filter((k): k is string => typeof k === 'string');
}

async function manifestOf(request: Request, env: Env): Promise<Manifest> {
  try {
    return buildManifest(await allKeys(request, env), SCENE_IDS);
  } catch {
    const m = buildManifest([], SCENE_IDS);
    m.note = '读不到素材清单（这次部署没带上 _media-manifest.json），暂时按"素材还没生成"处理。'
      + '按《上线操作手册》第四步把素材传进仓库的 media/ 文件夹，CI 会重新构建。';
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
  if (!MEDIA_KEY.test(key)) return text('文件名不对：只收 scene-01-correct.jpg 这种名字', 400);
  // 带上原请求的头（If-None-Match 之类），让静态资源自己判断 304；方法已经限定成 GET / HEAD
  const res = await env.ASSETS.fetch(new Request(new URL('/media/' + key, request.url), request));
  // 静态资源里没有这个文件 → 这一题的素材还没生成（S10 的降级依据）
  if (res.status === 404) return text('这一题的素材还没生成：' + key, 404);
  const headers = new Headers(res.headers);
  // 转发的是已经解好的 body，这两个头照抄会对不上（压缩、长度），去掉让运行时自己填
  headers.delete('content-encoding');
  headers.delete('content-length');
  const ct = headers.get('content-type');
  if (!ct || ct.startsWith('application/octet-stream')) {
    const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    if (TYPE_BY_EXT[ext]) headers.set('content-type', TYPE_BY_EXT[ext]);
  }
  // 素材一旦上传就不改内容（要换就换文件），所以可以长缓存；清单本身是 no-store，换了素材立刻看得到
  headers.set('cache-control', 'public, max-age=86400');
  const noBody = request.method === 'HEAD' || res.status === 304;
  return new Response(noBody ? null : res.body, { status: res.status, headers });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p === '/health') {
      const m = await manifestOf(request, env);
      return json({ ok: true, env: env.ENVIRONMENT, media_ready: m.ready, media_total: m.total, note: m.note });
    }
    if (p === '/api/manifest') return json(await manifestOf(request, env));
    if (p.startsWith('/media/')) return serveMedia(request, env, p);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
