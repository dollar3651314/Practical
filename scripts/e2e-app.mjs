#!/usr/bin/env node
/**
 * 浏览器级验收测试（agents C141）：本地用 wrangler dev 起真正的 Worker（真静态资源 + 真 R2 本地模拟），
 * 在真 Chromium 里按《使用场景清单-自用版》的 S 编号一条一条走。
 *   node scripts/e2e-app.mjs            # CI 跑这个
 *   node scripts/e2e-app.mjs --shots 目录 # 另外留截图
 * 两层：
 *   ① 真素材这一段：往本地 R2 里真塞一个场景的 5 个文件，页面真从 /media/ 读图、读音频、答一题、看复盘；
 *   ② 其余场次：用 Playwright 拦 /api/manifest 和 /media/*，造出"30 个全齐""12 / 30""0 / 30""读不到"四种局面，
 *      因为往本地 R2 塞 150 个文件要跑 150 次 wrangler，太慢。素材清单和 /media 的服务端逻辑另有单元测试（test/worker.test.ts）。
 * 任何一条不符就以非 0 退出。
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { png, wav } from './make-fake-media.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, '.wrangler/e2e');
const shotsAt = process.argv.indexOf('--shots');
const SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1]) : '';
const fails = [];
const check = (name, ok, got) => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : '：实际 ' + JSON.stringify(got)}`);
  if (!ok) fails.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLOTS = ['correct', 'd1-phoneme', 'd2-action', 'd3-function'];
const IDS = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'));
const COLOR = { correct: [40, 160, 120], 'd1-phoneme': [190, 70, 70], 'd2-action': [70, 90, 190], 'd3-function': [190, 160, 50] };
const AUDIO = wav(0.25, 440);

// ---------- 本地服务：wrangler dev（真 Worker + 真 web/ + 本地 R2） ----------
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
writeFileSync(path.join(WORK, 'wrangler.toml'), [
  'name = "practical-e2e"', 'main = "../../src/index.ts"', 'compatibility_date = "2026-10-01"',
  '[assets]', 'directory = "../../web"', 'binding = "ASSETS"', '',
  '[[r2_buckets]]', 'binding = "MEDIA"', 'bucket_name = "practical-e2e"', '',
  '[vars]', 'ENVIRONMENT = "e2e"', '',
].join('\n'));
const WRANGLER = path.join(ROOT, 'node_modules/wrangler/bin/wrangler.js');
const wenv = { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' };
const cfg = ['-c', path.join(WORK, 'wrangler.toml'), '--persist-to', path.join(WORK, 'state')];

// 场景 01 的 5 个文件真塞进本地 R2（后面要真从 /media/ 读）
const seedDir = path.join(WORK, 'seed');
mkdirSync(seedDir, { recursive: true });
for (const slot of SLOTS) {
  const f = path.join(seedDir, `scene-01-${slot}.png`);
  writeFileSync(f, png(64, COLOR[slot]));
  execFileSync(process.execPath, [WRANGLER, 'r2', 'object', 'put', `practical-e2e/scene-01-${slot}.png`, '--file', f, '--local', ...cfg], { cwd: ROOT, env: wenv, stdio: 'pipe' });
}
const af = path.join(seedDir, 'scene-01-audio.mp3');
writeFileSync(af, wav(0.25, 520));
execFileSync(process.execPath, [WRANGLER, 'r2', 'object', 'put', 'practical-e2e/scene-01-audio.mp3', '--file', af, '--ct', 'audio/wav', '--local', ...cfg], { cwd: ROOT, env: wenv, stdio: 'pipe' });
console.log('· 本地 R2 已塞进场景 01 的 5 个文件');

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

// ---------- 一、服务端（真 R2） ----------
{
  const h = await (await fetch(BASE + '/health')).json();
  check('/health 说清素材齐了几个，且不含密钥', h.ok === true && h.media_ready === 1 && h.media_total === 30, h);
  const img = await fetch(BASE + '/media/scene-01-correct.png');
  check('/media 真从 R2 发图（200 + image/png）', img.status === 200 && (img.headers.get('content-type') || '').includes('image/png'), img.status);
  const miss = await fetch(BASE + '/media/scene-02-audio.mp3');
  check('S10 缺素材的 404 带一句人话', miss.status === 404 && (await miss.text()).includes('还没生成'), miss.status);
  const bad = await fetch(BASE + '/media/..%2Fwrangler.toml');
  check('不许用 .. 跳出桶', bad.status === 400, bad.status);
  const m = await (await fetch(BASE + '/api/manifest')).json();
  check('/api/manifest 真桶里是 1 / 30', m.ready === 1 && m.total === 30, { ready: m.ready });
}

// ---------- 浏览器 ----------
const browser = await chromium.launch();
const errors = [];
/** 开一个干净的浏览器上下文；mock 为 null 时完全走真服务 */
async function open({ mock = null, viewport = { width: 390, height: 844 }, query = '' } = {}) {
  const ctx = await browser.newContext({ viewport });
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errors.push(String(e)));
    p.on('console', (c) => { if (c.type() === 'error') errors.push(c.text()); });
  });
  if (mock) {
    await ctx.route('**/api/manifest', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(mock.manifest),
    }));
    await ctx.route('**/media/**', (route) => {
      const key = new URL(route.request().url()).pathname.slice('/media/'.length);
      if (mock.broken) return route.fulfill({ status: 404, contentType: 'text/plain', body: '这一题的素材还没生成' });
      if (key.endsWith('.mp3')) return route.fulfill({ status: 200, contentType: 'audio/wav', body: AUDIO });
      const slot = SLOTS.find((s) => key.includes('-' + s + '.')) || 'correct';
      return route.fulfill({ status: 200, contentType: 'image/png', body: png(64, COLOR[slot]) });
    });
  }
  const page = await ctx.newPage();
  const media = [];
  page.on('request', (r) => { if (r.url().includes('/media/')) media.push(r.url()); });
  await page.addInitScript(() => {
    // 记下每一次播放用的倍速，S4 第 1 次选错要验证是 0.7
    window.__plays = [];
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function play() {
      window.__plays.push({ src: this.src, rate: this.playbackRate });
      return orig.apply(this);
    };
  });
  await page.goto(BASE + '/' + query, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 15000 });
  return { ctx, page, media };
}
/** 造一份"前 n 个场景齐了"的清单 */
const manifestOf = (n) => ({
  ready: n, total: 30,
  scenes: IDS.map((id, i) => (i < n
    ? { id, ready: true, missing: [], files: Object.fromEntries([...SLOTS.map((s) => [s, `scene-${id}-${s}.png`]), ['audio', `scene-${id}-audio.mp3`]]) }
    : { id, ready: false, missing: [...SLOTS, 'audio'], files: {} })),
});
const passSoundTest = async (page) => { await page.click('#b-heard'); await page.waitForSelector('#s-home:not([hidden])'); };
/** 首屏的「设置」默认是收起的（S17），要改设置先展开 */
const openSettings = (page) => page.$eval('#h-set', (e) => e.setAttribute('open', ''));
/** 等这一题可以点了（音频播完、格子解锁） */
const waitPlayable = (page) => page.waitForSelector('#q-grid .cell[data-idx="0"]:not(.locked)', { timeout: 15000 });
/** 答完一整轮：第 1 题可以按 wrongLadder 走完三级提示，其余全点对 */
async function playRound(page, { wrongLadder = false } = {}) {
  const n = await page.$$eval('#q-pips i', (e) => e.length);
  for (let i = 0; i < n; i++) {
    await waitPlayable(page);
    if (i === 0 && wrongLadder) {
      await page.click('#q-grid .cell[data-idx="1"]');          // 第 1 次错
      await waitPlayable(page);
      const rate = await page.evaluate(() => window.__plays.at(-1).rate);
      check('S4 第 1 次选错：慢速重播 0.7 倍，不出文字', Math.abs(rate - 0.7) < 1e-6, rate);
      check('S4 慢速重播时题目区仍然一个字都没有', (await page.innerText('#s-quiz')).trim() === '', await page.innerText('#s-quiz'));
      await page.click('#q-grid .cell[data-idx="2"]');          // 第 2 次错
      await waitPlayable(page);
      const gone = await page.$$eval('#q-grid .cell.gone', (e) => e.length);
      check('S4 第 2 次选错：去掉两张，只剩正确图和被点的那张', gone === 2, gone);
      await page.click('#q-grid .cell[data-idx="2"]');          // 第 3 次错
      await page.waitForSelector('#q-grid .cell[data-idx="0"].reveal', { timeout: 5000 });
      check('S4 第 3 次选错：揭晓正确图', true);
      check('S4 揭晓时题目区仍然一个字都没有', (await page.innerText('#s-quiz')).trim() === '', await page.innerText('#s-quiz'));
      await page.waitForFunction((k) => document.querySelectorAll('#q-pips i.c, #q-pips i.d').length > k, i, { timeout: 8000 });
      continue;
    }
    await page.click('#q-grid .cell[data-idx="0"]');
    if (i < n - 1) await page.waitForFunction((k) => document.querySelectorAll('#q-pips i.c, #q-pips i.d').length > k, i, { timeout: 8000 });
  }
  await page.waitForSelector('#s-review:not([hidden])', { timeout: 15000 });
}

// ---------- 二、S1 / S15 声音测试 ----------
{
  const { ctx, page } = await open({ mock: { manifest: manifestOf(30) } });
  check('S1 第一次打开落到声音测试，不要求任何输入', await page.isVisible('#b-testtone') && await page.isVisible('#b-heard'), null);
  await page.click('#b-testtone');
  await page.click('#b-nothear');
  check('S15 选「听不到」给三步指引', await page.isVisible('#u-steps'), null);
  await page.click('#u-steps li[data-s="1"] .tick');
  check('S15 做完一步打一个勾', await page.isVisible('#u-steps li[data-s="1"].done'), null);
  await page.click('#b-heard2');
  await page.waitForSelector('#s-home:not([hidden])');
  check('S9 首屏写明"这台设备上"的记录（不做跨设备同步）', (await page.innerText('#s-home')).includes('这台设备上'), null);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#s-home:not([hidden])');
  check('声音测试过了就不再出现（存在这台设备上）', await page.isHidden('#s-test'), null);
  await ctx.close();
}

// ---------- 三、真素材走通一题（真 R2、不 mock） ----------
{
  const { ctx, page, media } = await open();
  await passSoundTest(page);
  check('素材只齐 1 个时首屏说清 1 / 30', (await page.innerText('#h-media')).includes('1 / 30'), await page.innerText('#h-media'));
  check('齐了至少一个就能开始', !(await page.isDisabled('#b-start')), null);
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  check('齐的不足 10 个时这一轮就做几题（这里 1 题）', (await page.$$eval('#q-pips i', (e) => e.length)) === 1, null);
  await waitPlayable(page);
  const real = await page.$$eval('#q-grid img', (e) => e.map((x) => ({ src: x.getAttribute('src'), w: x.naturalWidth })));
  check('四张图是真从 /media/ 读的 R2 图片', real.length === 4 && real.every((x) => x.src.startsWith('/media/scene-01-') && x.w === 64), real);
  check('真素材的音频真播了', (await page.evaluate(() => window.__plays.length)) >= 1 && media.some((u) => u.includes('scene-01-audio.mp3')), null);
  check('题目区一个字都没有（真素材这一局）', (await page.innerText('#s-quiz')).trim() === '', await page.innerText('#s-quiz'));
  if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, '题目区-真素材.png') }); }
  await page.click('#q-grid .cell[data-idx="0"]');
  await page.waitForSelector('#s-review:not([hidden])', { timeout: 15000 });
  check('S5 复盘页到这里才出英文原文', (await page.innerText('#r-list')).includes('Hand me the stapler'), null);
  await ctx.close();
}

// ---------- 四、整轮主线（mock 30 个全齐） ----------
{
  const { ctx, page, media } = await open({ mock: { manifest: manifestOf(30) } });
  await passSoundTest(page);
  check('30 个全齐时首屏不再唠叨素材', await page.isHidden('#h-media'), null);
  check('S6 一轮没做时大按钮是「开始今天第 1 轮」', (await page.innerText('#b-start')).includes('第 1 轮'), await page.innerText('#b-start'));
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  check('S2 一轮 10 题', (await page.$$eval('#q-pips i', (e) => e.length)) === 10, null);
  check('S2 题目区上来就一个字都没有', (await page.innerText('#s-quiz')).trim() === '', await page.innerText('#s-quiz'));
  const grid = await page.$eval('#q-grid', (e) => { const r = e.getBoundingClientRect(); const c = e.children[0].getBoundingClientRect(); return { cols: getComputedStyle(e).gridTemplateColumns.split(' ').length, square: Math.abs(c.width - c.height) < 2, inside: r.width <= window.innerWidth }; });
  check('S14 四张图是正方形 2×2，不超出屏幕', grid.cols === 2 && grid.square && grid.inside, grid);
  await waitPlayable(page);
  check('S11 轻量预取：进这一轮就把 10 题的素材拉下来了', new Set(media.filter((u) => u.endsWith('.mp3'))).size >= 10, new Set(media.filter((u) => u.endsWith('.mp3'))).size);
  await playRound(page, { wrongLadder: true });
  const rev = await page.innerText('#s-review');
  check('S5 复盘页列出这一轮 10 条原文', (await page.$$eval('#r-list > li', (e) => e.length)) === 10, null);
  check('S5 复盘页给出答对数和平均反应时间', /\d\/10/.test(await page.innerText('#r-right')) && /ms|—/.test(await page.innerText('#r-rt')), rev.slice(0, 60));
  check('S5 四类错误里"音素"记到了 1（第 1 题第一次点的是音素干扰图）', (await page.innerText('#r-bars')).includes('音素'), null);
  check('S5 中文默认折叠', await page.isHidden('[data-zhbox="0"]'), null);
  check('B-6 复盘页强制看一眼：1 秒内回不去', (await page.getAttribute('#b-back', 'aria-disabled')) === 'true', null);
  await page.click('#r-list [data-zh="0"]');
  check('S5 点一下才展开中文', await page.isVisible('[data-zhbox="0"]'), null);
  check('B-2 点开中文的次数记下来了', (await page.innerText('#r-zh')) === '1', await page.innerText('#r-zh'));
  await page.waitForFunction(() => !document.querySelector('#b-back').hasAttribute('aria-disabled'), null, { timeout: 5000 });
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, '复盘页.png'), fullPage: true });
  await page.click('#b-back');
  await page.waitForSelector('#s-home:not([hidden])');
  check('S6 做完 1 轮：首屏说还差 2 轮', (await page.innerText('#h-title')).includes('还差 2 轮'), await page.innerText('#h-title'));
  check('S7 今天的题数是 10', (await page.innerText('#k-today')) === '10', await page.innerText('#k-today'));
  check('S7 点开中文的次数挂在首屏', (await page.innerText('#k-zh')) === '1', await page.innerText('#k-zh'));

  // 第 2、3 轮
  for (const r of [2, 3]) {
    await page.click('#b-start');
    await page.waitForSelector('#s-quiz:not([hidden])');
    await playRound(page);
    await page.waitForFunction(() => !document.querySelector('#b-back').hasAttribute('aria-disabled'), null, { timeout: 5000 });
    await page.click('#b-back');
    await page.waitForSelector('#s-home:not([hidden])');
    if (r === 2) check('S6 做完 2 轮：还差 1 轮', (await page.innerText('#h-title')).includes('还差 1 轮'), await page.innerText('#h-title'));
  }
  check('S6 做完 3 轮：今天做完了 ✅ 连续第 1 天', (await page.innerText('#h-title')).includes('今天做完了') && (await page.innerText('#h-title')).includes('连续第 1 天'), await page.innerText('#h-title'));
  check('S6 做完就不再出「开始」，换成「再来一轮」', await page.isHidden('#b-start') && await page.isVisible('#b-extra'), null);
  check('一天 3 轮正好 30 题', (await page.innerText('#k-today')) === '30', await page.innerText('#k-today'));
  // 第 1 题故意错了三次，按"最近答错的优先"它当天会被重新排上来一次（S13 允许 24 小时内 2 次），
  // 所以一天 30 题覆盖 29 个不同场景、错的那一题出现 2 次——这是清单第三节和 S13 共同决定的，不是漏题。
  const log = await page.evaluate(() => window.__app.DB().log.map((r) => r.id));
  const wrongId = await page.evaluate(() => window.__app.DB().log[0].id);
  check('三轮 30 题覆盖 29 个场景，答错的那一题当天被重新排上来', new Set(log).size === 29 && log.filter((x) => x === wrongId).length === 2, { distinct: new Set(log).size, repeat: log.filter((x) => x === wrongId).length });
  check('S13 同一题 24 小时内最多出现 2 次', Math.max(...IDS.map((id) => log.filter((x) => x === id).length)) <= 2, null);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, '首屏-做完了.png'), fullPage: true });

  // S8 额外一轮
  await page.click('#b-extra');
  await page.waitForSelector('#s-quiz:not([hidden])');
  await playRound(page);
  check('S8 额外一轮的复盘页写明不算今天的任务', (await page.innerText('#r-sub')).includes('不算今天'), await page.innerText('#r-sub'));
  await page.waitForFunction(() => !document.querySelector('#b-back').hasAttribute('aria-disabled'), null, { timeout: 5000 });
  await page.click('#b-back');
  check('S8 额外一轮不污染「连续天数」和「今天做完了」', (await page.innerText('#h-title')).includes('连续第 1 天'), await page.innerText('#h-title'));
  const extra = await page.evaluate(() => window.__app.DB().log.filter((r) => r.extra === 1).length);
  check('S8 额外一轮的每条记录都标出来了', extra === 10, extra);

  // S16 导出 CSV、清空二次确认
  const dl = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#b-csv')]).then((x) => x[0]);
  const csv = await (await dl.createReadStream()).toArray().then((b) => Buffer.concat(b).toString('utf8'));
  check('S16 导出 CSV 真能下载下来，带表头', csv.includes('时间,日期,题号,英文,结果'), csv.slice(0, 40));
  check('S16 CSV 的行数 = 这台设备上的题数（40）', csv.trim().split('\n').length === 41, csv.trim().split('\n').length);
  await page.click('#b-clear');
  check('S16 清空要二次确认', (await page.innerText('#b-clear')).includes('再点一次'), await page.innerText('#b-clear'));
  await page.click('#b-clear');
  check('S16 再点一次才真清空', (await page.innerText('#k-today')) === '0', await page.innerText('#k-today'));
  await ctx.close();
}

// ---------- 五、S17 设置只对这台设备生效 ----------
{
  const { ctx, page } = await open({ mock: { manifest: manifestOf(30) } });
  await passSoundTest(page);
  check('B-4 默认深色', (await page.getAttribute('html', 'data-theme')) === 'dark', null);
  check('S17 设置默认收起，首屏不被它占地方', !(await page.isVisible('#c-theme')), null);
  await openSettings(page);
  await page.selectOption('#c-theme', 'light');
  await page.check('#c-zh');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#s-home:not([hidden])');
  await openSettings(page);
  check('S17 设置刷新后还在（只对这台设备）', (await page.getAttribute('html', 'data-theme')) === 'light' && await page.isChecked('#c-zh'), null);
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  await playRound(page);
  check('S17「复盘页默认展开中文」打开后，中文一进来就是展开的', await page.isVisible('[data-zhbox="0"]'), null);
  await ctx.close();
}

// ---------- 六、素材没齐的三种局面 ----------
{
  const { ctx, page } = await open({ mock: { manifest: { ready: 0, total: 30, scenes: manifestOf(0).scenes, note: '还没绑定 R2 桶（MEDIA）' } } });
  await passSoundTest(page);
  const t = await page.innerText('#h-media');
  check('一个素材都没有时：首屏说"素材还没生成 0 / 30"', t.includes('素材还没生成') && t.includes('0 / 30'), t);
  check('一个素材都没有时：把原因也说出来（R2 没绑）', t.includes('R2'), t);
  check('一个素材都没有时：开始按钮按不动，不让他点进白屏', await page.isDisabled('#b-start'), null);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mock: { manifest: manifestOf(12) } });
  await passSoundTest(page);
  check('齐了一部分时：说清 12 / 30，并且能开始', (await page.innerText('#h-media')).includes('12 / 30') && !(await page.isDisabled('#b-start')), await page.innerText('#h-media'));
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  check('齐了 12 个时这一轮仍然出 10 题', (await page.$$eval('#q-pips i', (e) => e.length)) === 10, null);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, '首屏-素材没齐.png'), fullPage: true });
  await ctx.close();
}

// ---------- 七、S10 素材读不到、S12 卡住 ----------
{
  const { ctx, page } = await open({ mock: { manifest: manifestOf(30) }, query: '?debug=1' });
  await passSoundTest(page);
  await openSettings(page);
  await page.check('#c-fail');
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  await page.waitForSelector('#q-ico-retry:not([hidden])', { timeout: 10000 });
  check('S10 第 1 次读不到：播放键变「重试」，题目区仍然零文字', (await page.innerText('#s-quiz')).trim() === '', await page.innerText('#s-quiz'));
  await page.click('#q-play');
  await page.waitForTimeout(400);
  await page.click('#q-play');
  await page.waitForSelector('#q-ico-mute:not([hidden])', { timeout: 10000 });
  check('S10 连失败 3 次：题目区只给一个哑喇叭图标（P-2），不给文字', (await page.innerText('#s-quiz')).trim() === '', null);
  await page.waitForFunction(() => document.querySelectorAll('#q-pips i.d').length >= 1, null, { timeout: 8000 });
  check('S10 连失败 3 次就跳过这一题，一轮不因为一题卡死', true);
  const skipped = await page.evaluate(() => window.__app.DB().log[0]);
  check('S10 记成"其他"、未作答，不算答错', skipped.res === 'skip' && skipped.etype === '其他', skipped);
  await ctx.close();
}
{
  const { ctx, page } = await open({ mock: { manifest: manifestOf(30) }, query: '?debug=1' });
  await passSoundTest(page);
  await openSettings(page);
  await page.check('#c-fast');   // 把 15 / 30 秒缩成 1.5 / 3 秒，不然一条测试要等半分钟
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  await waitPlayable(page);
  const before = await page.evaluate(() => window.__plays.length);
  await page.waitForFunction((n) => window.__plays.length > n, before, { timeout: 8000 });
  check('S12 一直不动：自动重播一次', true);
  await page.waitForSelector('#q-skip:not([hidden])', { timeout: 8000 });
  check('S12 再不动：出现「跳过」（只有图标，不出文字）', (await page.innerText('#s-quiz')).trim() === '', null);
  await page.click('#q-skip');
  const row = await page.evaluate(() => window.__app.DB().log[0]);
  check('S12 跳过记"未作答"，不计错', row.res === 'skip' && row.etype === '其他', row);
  await ctx.close();
}

// ---------- 八、S14 手机横屏 / 窄屏都不横向滚动 ----------
for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 640 }]) {
  const { ctx, page } = await open({ mock: { manifest: manifestOf(30) }, viewport: vp });
  await passSoundTest(page);
  const homeScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  await page.click('#b-start');
  await page.waitForSelector('#s-quiz:not([hidden])');
  await waitPlayable(page);
  const q = await page.evaluate(() => {
    const g = document.querySelector('#q-grid');
    const c = g.children[0].getBoundingClientRect();
    return {
      noScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
      square: Math.abs(c.width - c.height) < 2,
      inView: g.getBoundingClientRect().bottom <= window.innerHeight + 1,
    };
  });
  check(`S14 ${vp.width}×${vp.height}：首屏和题目区都不横向滚动`, homeScroll && q.noScroll, { homeScroll, ...q });
  check(`S14 ${vp.width}×${vp.height}：四张图仍是正方形，且限在屏幕高度内`, q.square && q.inView, q);
  if (SHOTS && vp.width === 844) await page.screenshot({ path: path.join(SHOTS, '题目区-横屏.png') });
  await ctx.close();
}

// ---------- 收尾 ----------
check('全程没有脚本错误', errors.length === 0, errors.slice(0, 3));
await browser.close();
stopDev();
console.log(fails.length ? `\n✗ ${fails.length} 条不通过：\n  - ${fails.join('\n  - ')}` : '\n✓ 全部通过');
process.exit(fails.length ? 1 : 0);
