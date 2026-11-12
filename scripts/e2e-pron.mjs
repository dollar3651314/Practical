#!/usr/bin/env node
/**
 * 发音训练的浏览器级验收（agents C141）。2026-11-12 从 Marketing 的 scripts/e2e-platform.mjs
 * 第 8.5 / 15 / 「照镜子和录音回放」那几段搬过来，按 Practical 的样子改：
 * 那边要先登录、再点二级菜单滚到 #w-pron，这边直接开 `/pron` 这一页。
 *
 *   node scripts/e2e-pron.mjs              # CI 跑这个
 *   node scripts/e2e-pron.mjs --shots 目录   # 另外留 390 宽的截图
 *
 * 本地起真的 Worker（wrangler dev + 本地 D1，每次从空库开始、跑全部迁移），在真 Chromium 里按 390 宽走一遍：
 *   ① /pron 打得开，「跟我做」第 1 级第一步那句话在，而且**就是 src/pron-lesson.ts 生成的那一句**
 *      （页面里嵌的那份阶梯 JSON 直接解出来比对，不靠我手抄）；
 *   ② 点「做好了，下一步」真的前进一步（第几步、进度条、屏上那句话都跟着走）；
 *   ③ **开镜子到关镜子，一个网络请求都没发**（画面不上传、不保存、不录），关掉时轨道真的 ended（指示灯灭）；
 *   ④ 390 宽不横滚（页面和这一块自己都量）。
 * 本地**没有绑 Workers AI**，所以 🔊 和 🎤 本来就会当面说"这个环境没有绑 Workers AI"——
 * 那是设计好的降级，不是失败；这里不拿它当检查项（底线 9：说清楚哪些没验证）。
 * 任何一条不符就以非 0 退出。
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildAssets } from './build-assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, '.wrangler/e2e-pron');
const shotsAt = process.argv.indexOf('--shots');
const SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1]) : '';
const WAIT = 15000;
const fails = [];
const check = (name, ok, got) => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : '：实际 ' + JSON.stringify(got)}`);
  if (!ok) fails.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 本地服务：wrangler dev + 本地 D1（空库 → 跑迁移） ----------
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
buildAssets({ media: path.join(ROOT, 'media'), out: path.join(WORK, 'dist') });
writeFileSync(path.join(WORK, 'wrangler.toml'), [
  'name = "practical-e2e-pron"', 'main = "../../src/index.ts"', 'compatibility_date = "2026-10-01"',
  '[assets]', 'directory = "dist"', 'binding = "ASSETS"', 'run_worker_first = ["/media/*"]', '',
  '[[d1_databases]]', 'binding = "DB"', 'database_name = "practical-e2e-pron"', 'database_id = "local-only"', 'migrations_dir = "../../migrations"', '',
  '[vars]', 'ENVIRONMENT = "e2e"', '',
].join('\n'));
const WRANGLER = path.join(ROOT, 'node_modules/wrangler/bin/wrangler.js');
const wenv = { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' };
const cfg = ['-c', path.join(WORK, 'wrangler.toml'), '--persist-to', path.join(WORK, 'state')];
execFileSync(process.execPath, [WRANGLER, 'd1', 'migrations', 'apply', 'DB', '--local', ...cfg], { cwd: ROOT, env: wenv, stdio: 'pipe' });

const port = await new Promise((ok) => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
const BASE = `http://127.0.0.1:${port}`;
const dev = spawn(process.execPath, [WRANGLER, 'dev', ...cfg, '--port', String(port), '--ip', '127.0.0.1'], { cwd: ROOT, env: wenv, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
let devLog = '';
dev.stdout.on('data', (d) => { devLog += d; });
dev.stderr.on('data', (d) => { devLog += d; });
const stopDev = () => { try { process.kill(-dev.pid, 'SIGTERM'); } catch { /* 已经停了 */ } };
process.on('exit', stopDev);
for (let i = 0; ; i++) {
  try { if ((await fetch(BASE + '/health')).ok) break; } catch { /* 还没起来 */ }
  if (i > 120) { console.error(devLog.slice(-3000)); throw new Error('本地服务 60 秒没起来'); }
  await sleep(500);
}

// ---------- 服务端：这一页本身 ----------
const res = await fetch(BASE + '/pron');
const html = await res.text();
check('GET /pron 回一张 HTML（200 + text/html）', res.status === 200 && (res.headers.get('content-type') || '').includes('text/html'),
  { s: res.status, ct: res.headers.get('content-type') });
check('这一页不给搜索引擎收录，而且手机上按屏幕宽度排版', html.includes('noindex') && html.includes('width=device-width'), null);
check('盲听卡那一套没被挤掉：/health 和 /api/manifest 照常', (await fetch(BASE + '/health')).ok && (await fetch(BASE + '/api/manifest')).ok, null);

/**
 * 页面里嵌着的那份教学阶梯（src/pron-lesson.ts 的 LESSON，打包时拼进脚本）。
 * 直接从 HTML 里解出来，第 1 级第一步那句话就不是我手抄的，而是**源头给的那一句**。
 */
const 阶梯 = (() => {
  const at = html.indexOf('var PNL=');
  const from = html.indexOf('{', at);
  const to = html.indexOf('\nvar PN=', at);
  return JSON.parse(html.slice(from, html.lastIndexOf(';', to)));
})();
const 去星 = (s) => String(s ?? '').split('**').join('');
const 第一组 = 阶梯['组'][0];
const 第一步 = 第一组['步'][0];
const 第二步 = 第一组['步'][1];
check(`阶梯解得出来：第 1 组 ${第一组['名字']} 一共 ${第一组['步'].length} 步，第 1 步是第 ${第一步['lv'] + 1} 级`,
  第一组['步'].length > 1 && 第一步['lv'] === 0 && !!第一步['说'], { 步数: 第一组['步'].length, lv: 第一步?.['lv'] });

// ---------- 浏览器（390 宽 + 假摄像头 / 假麦克风） ----------
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.grantPermissions(['camera', 'microphone'], { origin: BASE });
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(e.message));
const net净 = [];
p.on('request', (r) => net净.push(r.method() + ' ' + new URL(r.url()).pathname));
// 把摄像头拿到的轨道记下来：关掉镜子之后它们必须是 ended（= 手机上的指示灯灭）
await p.addInitScript(() => {
  window.__tracks = [];
  const md = navigator.mediaDevices;
  const o = md.getUserMedia.bind(md);
  md.getUserMedia = (c) => o(c).then((s) => { s.getTracks().forEach((t) => window.__tracks.push(t)); return s; });
});
await p.goto(BASE + '/pron');
await p.waitForSelector('#w-pron', { timeout: WAIT, state: 'visible' });
await p.waitForFunction(() => document.querySelectorAll('#pn-cbtns .btn').length > 0, null, { timeout: WAIT });

// ---- ① 第 1 级第一步那句话在 ----
const 屏1 = await p.evaluate(() => ({
  lv: document.getElementById('pn-clv').textContent,
  say: document.getElementById('pn-csay').textContent,
  num: document.getElementById('pn-cnum').textContent,
  bar: document.getElementById('pn-cbar').style.width,
  btns: [...document.querySelectorAll('#pn-cbtns .btn')].map((b) => b.textContent),
  s2: document.getElementById('pn-s2').hidden, s3: document.getElementById('pn-s3').hidden, s4: document.getElementById('pn-s4').hidden,
}));
check('① /pron 打得开，停在第 1 步「跟我做」，屏上那句就是阶梯的第 1 级第一步（一个字不多不少）',
  屏1.say === 去星(第一步['说']) && 屏1.lv.includes('第 1 级') && 屏1.num === `第 1 / 共 ${第一组['步'].length} 步` && 屏1.s2 && 屏1.s3 && 屏1.s4, 屏1);
check('① 一屏上只有这一步：主按钮是「做好了，下一步」，还没走到最后一步',
  屏1.btns.some((t) => t.includes('做好了，下一步')) && !屏1.btns.some((t) => t.includes('上一步')), 屏1.btns);
if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await p.locator('#w-pron').screenshot({ path: path.join(SHOTS, '发音训练-跟我做-第1级第一步-390.png') }); }

// ---- ② 点「做好了，下一步」真的前进一步 ----
await p.locator('#pn-cbtns .btn.go').click();
await p.waitForFunction((want) => document.getElementById('pn-cnum').textContent === want, `第 2 / 共 ${第一组['步'].length} 步`, { timeout: WAIT });
const 屏2 = await p.evaluate(() => ({
  say: document.getElementById('pn-csay').textContent, num: document.getElementById('pn-cnum').textContent,
  bar: document.getElementById('pn-cbar').style.width, 有上一步: [...document.querySelectorAll('#pn-cbtns .btn')].some((b) => b.textContent.includes('上一步')),
}));
check('② 点「做好了，下一步」真的前进一步：屏上那句换成阶梯的第 2 步，第几步和进度条跟着走，并且出现「上一步」',
  屏2.say === 去星(第二步['说']) && 屏2.num === `第 2 / 共 ${第一组['步'].length} 步` && 屏2.有上一步 && 屏2.bar !== 屏1.bar, { 屏2, 期望: 去星(第二步['说']) });

// ---- ③ 开镜子到关镜子：一个网络请求都没发 ----
const n0 = net净.length;
await p.click('#pn-mir');
await p.waitForFunction(() => !document.getElementById('pn-mirwrap').hidden, null, { timeout: WAIT });
await p.waitForFunction(() => { const v = document.getElementById('pn-cam'); return !!v && v.videoWidth > 0; }, null, { timeout: WAIT });
const 镜 = await p.evaluate(() => ({
  有流: !!document.getElementById('pn-cam').srcObject, w: document.getElementById('pn-cam').videoWidth,
  轨道: (window.__tracks || []).map((t) => t.readyState),
  这一句: document.getElementById('pn-mirtarget').textContent, 屏上那句: document.getElementById('pn-csay').textContent,
  隐私: document.querySelector('#pn-mirwrap .pn-privacy').textContent,
}));
check('③ 开镜子：画面真的出来了，左边就是这一步要做的那句话，轨道是 live',
  镜.有流 && 镜.w > 0 && 镜.这一句.length > 0 && 镜.这一句 === 镜.屏上那句 && 镜.轨道.length > 0 && 镜.轨道.every((x) => x === 'live'), 镜);
check('③ 界面上当面写明"这个画面不会离开你的手机"', 镜.隐私.includes('不会离开你的手机') && 镜.隐私.includes('不上传') && 镜.隐私.includes('不保存'), 镜.隐私);
if (SHOTS) await p.locator('#w-pron').screenshot({ path: path.join(SHOTS, '发音训练-镜子开着-390.png') });
await p.click('#pn-miroff');
const 关 = await p.evaluate(() => ({
  没流: document.getElementById('pn-cam').srcObject === null, hidden: document.getElementById('pn-mirwrap').hidden,
  轨道: (window.__tracks || []).map((t) => t.readyState),
}));
check('③ 「关掉镜子」真的把摄像头关了（轨道 ended，手机上的指示灯才会灭）',
  关.没流 && 关.hidden && 关.轨道.length > 0 && 关.轨道.every((x) => x === 'ended'), 关);
check('③ **开镜子到关镜子，一个网络请求都没发**（画面不上传、不保存、不录像）', net净.length === n0, net净.slice(n0));

// ---- ④ 390 宽不横滚 ----
const 横 = await p.evaluate(() => ({
  页: document.documentElement.scrollWidth - innerWidth,
  块: ['w-pron', 'pn-coach', 'pn-rail', 'pn-mirwrap', 'pn-pick'].map((id) => { const e = document.getElementById(id); return [id, e ? e.scrollWidth - e.clientWidth : 0]; }),
}));
check('④ 390 宽不横向滚动，这一块里也没有任何一行横着溢出', 横.页 <= 1 && 横.块.every(([, d]) => d <= 1), 横);
// 按钮 ≥52px（外框那条 min-height:38px 必须被压过），而且一个输入框都没有
const 按 = await p.evaluate(() => ({
  小: [...document.querySelectorAll('#w-pron button')].filter((b) => b.getClientRects().length && b.tagName !== 'SUMMARY' && !b.closest('summary'))
    .map((b) => [b.id || b.textContent.slice(0, 8), Math.round(b.getBoundingClientRect().height)]).filter(([, h]) => h < 52),
  输入框: document.querySelectorAll('#w-pron input, #w-pron textarea, #w-pron [contenteditable]').length,
}));
check('④ 按钮都 ≥52px 高（压得过外框那条 38px），整块里一个输入框都没有', 按.小.length === 0 && 按.输入框 === 0, 按);
if (SHOTS) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: path.join(SHOTS, '发音训练-整页-390.png'), fullPage: false }); }

check('全程没有脚本错误', errors.length === 0, errors.slice(0, 5));

await ctx.close();
await browser.close();
stopDev();
console.log(fails.length ? `\n✗ ${fails.length} 条不符：\n- ${fails.join('\n- ')}` : '\n✓ 发音训练：全部通过');
process.exit(fails.length ? 1 : 0);
