// Practical 1.0 自用版的界面。交互一比一照 Amos 2026-11-03 已确认的原型
// （agents 项目/Practical/原型-Practical-盲听卡-v1.html），只把两样占位换成真的：
//   占位合成音 → media/ 里的 scene-NN-audio.mp3；代码画的简笔 SVG → media/ 里的四张真图。
// 纯逻辑在 core.js（单元测试直接测那边），这里只管 DOM、音频元素和网络。
import {
  SLOTS, SLOW_RATE, ROUNDS_PER_DAY, QUESTIONS_PER_ROUND, MAX_AUDIO_FAILS, TIMING,
  emptyDB, normalizeDB, todayKey, dayOf, streak, pickRound, pushLog, toCSV,
  homeState, roundSummary, readyIds, manifestSummary, mediaUrl,
} from './core.js';
import { SCENES } from './scenes.js';

/* ============ 0. 小工具 ============ */
/** @param {string} s @returns {HTMLElement} */
const $ = (s) => /** @type {HTMLElement} */ (document.querySelector(s));
/** @param {string} s @returns {HTMLElement[]} */
const $$ = (s) => /** @type {HTMLElement[]} */ ([...document.querySelectorAll(s)]);
/** @param {string} id */
const show = (id) => {
  ['s-test', 's-home', 's-quiz', 's-review'].forEach((x) => { $('#' + x).hidden = x !== id; });
  window.scrollTo(0, 0);
};
const DEBUG = new URLSearchParams(location.search).has('debug');

/* ============ 1. 本地记录（S16、S17） ============ */
const KEY = 'practical.v1';
let DB = emptyDB();
let cfg = DB.cfg;
function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { raw = null; }
  DB = normalizeDB(raw);
  cfg = DB.cfg;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch { /* 无痕模式等，存不了就算了 */ } }

/* ============ 2. 素材清单：哪些场景能出题 ============ */
/** @type {import('./core.js').Manifest|null} */
let MANIFEST = null;
let MEDIA = manifestSummary(null);
async function loadManifest() {
  try {
    const r = await fetch('/api/manifest', { cache: 'no-store' });
    MANIFEST = r.ok ? await r.json() : null;
  } catch { MANIFEST = null; }
  MEDIA = manifestSummary(MANIFEST);
}
/**
 * 这个场景的五个文件叫什么（后缀以实际传进 media/ 的为准，.jpg / .png / .webp 都收）。
 * @param {string} id @returns {Record<string,string>}
 */
function filesOf(id) {
  const e = MANIFEST && MANIFEST.scenes.find((s) => s.id === id);
  return e ? e.files : {};
}
function readyScenes() {
  const ids = readyIds(MANIFEST);
  return SCENES.filter((s) => ids.includes(s.id));
}

/* ============ 3. 声音 ============ */
/** 1 秒测试音（S1 / S15）：用 Web Audio 当场合成，不依赖任何素材——听不到声音的人先要能测 */
let AC = /** @type {AudioContext|null} */ (null);
function ctx() {
  if (!AC) { try { AC = new AudioContext(); } catch { AC = null; } }
  if (AC && AC.state === 'suspended') { try { void AC.resume(); } catch { /* 浏览器不让就算了 */ } }
  return AC;
}
function testTone() {
  const a = ctx(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 660; o.type = 'sine';
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(cfg.vol, a.currentTime + 0.03);
    g.gain.setValueAtTime(cfg.vol, a.currentTime + 0.9);
    g.gain.linearRampToValueAtTime(0, a.currentTime + 1);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 1.05);
  } catch { /* 没有声卡就算了，下面还有「听不到」的三步指引 */ }
}

/** 正在播的那一段；换题或退出时要停掉 */
let CUR = /** @type {HTMLAudioElement|null} */ (null);
/**
 * 播一段真素材。慢速是 0.7 倍实时变速、音高不变（《生产包》第三节：不单独做慢速文件）。
 * 播完 resolve；读不到、放不出来 reject —— S10 的三次重试挂在 reject 上。
 * @param {string} url @param {number} rate @returns {Promise<void>}
 */
function playMedia(url, rate) {
  return new Promise((resolve, reject) => {
    try { if (CUR) { CUR.pause(); } } catch { /* 已经停了 */ }
    const a = new Audio(url);
    CUR = a;
    const anyA = /** @type {Record<string,unknown>} */ (/** @type {unknown} */ (a));
    anyA.preservesPitch = true; anyA.mozPreservesPitch = true; anyA.webkitPreservesPitch = true;
    a.playbackRate = rate;
    a.volume = Math.max(0, Math.min(1, cfg.vol));
    let done = false;
    const stop = () => { clearTimeout(timer); a.removeEventListener('ended', ok); a.removeEventListener('error', bad); };
    const ok = () => { if (!done) { done = true; stop(); resolve(); } };
    const bad = () => { if (!done) { done = true; stop(); reject(new Error('素材读不到：' + url)); } };
    // 最长 10 秒，免得一次播放卡死整轮（真素材 1.0～2.5 秒，慢速也就 3.6 秒）
    const timer = setTimeout(ok, 10000);
    a.addEventListener('ended', ok);
    a.addEventListener('error', bad);
    a.play().catch(bad);
  });
}

/**
 * S11 的轻量版：进这一轮之前先把这 10 题的图和音频拉进浏览器缓存（不阻塞，拉不到也不报错）。
 * @param {Item[]} items
 */
function prefetch(items) {
  for (const it of items) {
    for (const url of it.imgUrls) { if (url) { const im = new Image(); im.src = url; } }
    if (it.audioUrl) fetch(it.audioUrl, { cache: 'force-cache' }).catch(() => { /* 真要播的时候再报 */ });
  }
}

/* ============ 4. 一轮的状态机 ============ */
/** @typedef {{scene:import('./core.js').Scene,order:number[],imgUrls:string[],audioUrl:string,tries:number,firstWrong:number|null,rt:number|null,res:string|null,resRaw:import('./core.js').Res|null,fails:number,reason:string}} Item */
/** @type {{items:Item[],i:number,extra:boolean,t0:number}|null} */
let RD = null;
const PLAY = $('#q-play'), GRID = $('#q-grid'), PIPS = $('#q-pips'), SKIP = $('#q-skip');
/**
 * 切播放键上的图标：播放 / 转圈 / 重试 / 哑喇叭。
 * 必须用 toggleAttribute：这四个是 <svg>，SVGElement 没有 hidden 这个属性，
 * 写 el.hidden = false 只是挂了个 JS 属性，HTML 上的 hidden 不会去掉（原型里就是这么写的，图标其实一直没换过）。
 * @param {string} which
 */
const icon = (which) => ['play', 'busy', 'retry', 'mute'].forEach((k) => $('#q-ico-' + k).toggleAttribute('hidden', k !== which));
/** @param {string} s */
function playState(s) {
  PLAY.classList.remove('busy', 'fail');
  if (s === 'busy') { PLAY.classList.add('busy'); icon('busy'); }
  else if (s === 'fail') { PLAY.classList.add('fail'); icon('retry'); }
  else if (s === 'dead') { PLAY.classList.add('busy'); icon('mute'); }
  else icon('play');
}
const timing = () => (DEBUG && /** @type {HTMLInputElement} */ ($('#c-fast')).checked
  ? { idleReplay: 1500, skipAfter: 3000 } : TIMING);

/** @param {boolean} extra */
function startRound(extra) {
  const pool = readyScenes();
  if (!pool.length) { renderHome(); return; }
  const items = pickRound(pool, DB.q, QUESTIONS_PER_ROUND, Date.now()).map((scene) => {
    const f = filesOf(scene.id);
    return {
      scene,
      order: [0, 1, 2, 3].sort(() => Math.random() - 0.5),
      imgUrls: SLOTS.map((slot) => (f[slot] ? mediaUrl(f[slot]) : '')),
      audioUrl: f.audio ? mediaUrl(f.audio) : '',
      tries: 0, firstWrong: /** @type {number|null} */ (null), rt: /** @type {number|null} */ (null),
      res: /** @type {string|null} */ (null), resRaw: /** @type {import('./core.js').Res|null} */ (null),
      fails: 0, reason: '',
    };
  });
  RD = { items, i: 0, extra, t0: 0 };
  prefetch(items);
  show('s-quiz');
  renderQ();
}

function renderQ() {
  clearTimers();
  const RDl = RD; if (!RDl) return;
  const it = RDl.items[RDl.i];
  PIPS.innerHTML = RDl.items.map((x, k) => `<i class="${k < RDl.i ? (x.res === 'right' ? 'c' : 'd') : ''}"></i>`).join('');
  SKIP.hidden = true;
  GRID.innerHTML = it.order.map((idx, pos) =>
    `<button class="cell loading" data-idx="${idx}" data-pos="${pos}" aria-label="第 ${pos + 1} 张图">` +
    `<img alt="" src="${it.imgUrls[idx]}"></button>`).join('');
  for (const c of $$('#q-grid .cell')) {
    const idx = Number(c.dataset.idx);
    const im = /** @type {HTMLImageElement} */ (c.querySelector('img'));
    im.addEventListener('load', () => c.classList.remove('loading'));
    // 图读不到：这一格留一个空框（题目区严禁文字，P-2）；缺的要是正确答案，这一题就做不了，跳过
    im.addEventListener('error', () => {
      c.classList.remove('loading'); c.classList.add('gone');
      if (idx === 0 && !it.res) mediaMissing(it);
    });
    c.addEventListener('click', () => choose(idx, c));
  }
  lockCells(true);
  // S12：这一题开始 30 秒还没动，就出「跳过」（只有图标，题目区不出文字）
  tSkip = window.setTimeout(() => { SKIP.hidden = false; }, timing().skipAfter);
  doPlay(1, true);
}

let tIdle = /** @type {number|undefined} */ (undefined);
let tSkip = /** @type {number|undefined} */ (undefined);
let tNext = /** @type {number|undefined} */ (undefined);
function clearTimers() { [tIdle, tSkip, tNext].forEach((t) => t && clearTimeout(t)); tIdle = tSkip = tNext = undefined; }
/** @param {boolean} v */
const lockCells = (v) => $$('#q-grid .cell').forEach((c) => c.classList.toggle('locked', v));

/**
 * S10：素材读不到，记一条"其他"并跳过这一题；题目区只给哑喇叭图标，解释留到复盘页。
 * @param {Item} it
 */
function mediaMissing(it) {
  playState('dead');
  it.reason = 'media';
  record(it, 'audiofail');
  tNext = window.setTimeout(next, 1100);
}

/** @param {number} rate @param {boolean} [auto] */
function doPlay(rate, auto) {
  const RDl = RD; if (!RDl) return;
  const it = RDl.items[RDl.i];
  const fakeFail = DEBUG && /** @type {HTMLInputElement} */ ($('#c-fail')).checked;
  playState('busy'); lockCells(true);
  PLAY.classList.add('ring1'); setTimeout(() => PLAY.classList.remove('ring1'), 1100);
  const p = (!it.audioUrl || fakeFail) ? Promise.reject(new Error('素材还没生成')) : playMedia(it.audioUrl, rate);
  p.then(() => {
    if (!RD || RD.items[RD.i] !== it || it.res) return;
    playState('ok'); lockCells(false);
    if (auto && it.tries === 0) RDl.t0 = performance.now(); // 反应时间只从「音频播完」开始算
    armIdle();
  }).catch(() => {
    if (!RD || RD.items[RD.i] !== it || it.res) return;
    it.fails++;
    if (it.fails >= MAX_AUDIO_FAILS) mediaMissing(it);
    else playState('fail'); // 变「重试」，等他点（C135：不假装成功）
  });
}

/**
 * S12：15 秒没动作自动重播一次。
 * 只重排"自动重播"这一个表——「跳过」那一个表挂在这一题开始的时刻（renderQ），
 * 否则每重播一次就把它往后推 30 秒，30 秒的「跳过」永远不会出现（原型里就是这样）。
 */
function armIdle() {
  clearTimeout(tIdle);
  tIdle = window.setTimeout(() => { if (RD && !RD.items[RD.i].res) doPlay(1, false); }, timing().idleReplay);
}

/** @param {number} idx @param {HTMLElement} cell */
function choose(idx, cell) {
  const RDl = RD; if (!RDl) return;
  const it = RDl.items[RDl.i];
  if (it.res) return;
  clearTimeout(tIdle); clearTimeout(tSkip);
  if (idx === 0) { // S3 选对
    if (it.rt === null && RDl.t0) it.rt = Math.round(performance.now() - RDl.t0);
    cell.classList.add('right'); lockCells(true);
    record(it, it.tries === 0 ? 'right' : 'right_after');
    doPlay(1, false);
    tNext = window.setTimeout(next, TIMING.nextAfterRight);
    return;
  }
  it.tries++;
  if (it.firstWrong === null) it.firstWrong = idx;
  cell.classList.add('wrong');
  if (it.tries === 1) { doPlay(SLOW_RATE, false); }            // 第 1 次：慢速重播，不出文字
  else if (it.tries === 2) {                                    // 第 2 次：留正确图 + 被点的图，另外两张淡出
    $$('#q-grid .cell').forEach((c) => {
      const i = Number(c.dataset.idx);
      if (i !== 0 && i !== idx) c.classList.add('gone');
    });
    cell.classList.remove('wrong'); cell.classList.add('dim');  // 留下的这张要还能再点
    doPlay(1, false);
  } else {                                                      // 第 3 次：揭晓正确图 + 播一次，仍不出文字
    lockCells(true);
    const ok = $$('#q-grid .cell').find((c) => Number(c.dataset.idx) === 0);
    if (ok) { ok.classList.remove('gone'); ok.classList.add('reveal'); }
    record(it, 'wrong');
    doPlay(1, false);
    tNext = window.setTimeout(next, TIMING.nextAfterReveal);
  }
}

/** @param {Item} it @param {import('./core.js').Res} res */
function record(it, res) {
  it.res = res === 'wrong' ? 'wrong' : (res === 'skip' || res === 'audiofail') ? 'skip' : 'right';
  it.resRaw = res;
  pushLog(DB, {
    scene: it.scene, res, firstWrong: it.firstWrong, tries: it.tries, rt: it.rt,
    extra: !!(RD && RD.extra), now: Date.now(),
  });
  save();
}

function next() {
  clearTimers();
  const RDl = RD; if (!RDl) return;
  RDl.i++;
  if (RDl.i >= RDl.items.length) finish(); else renderQ();
}

$('#q-skip').addEventListener('click', () => {
  const RDl = RD; if (!RDl) return;
  const it = RDl.items[RDl.i];
  if (it.res) return;
  record(it, 'skip');
  next();
});
$('#q-quit').addEventListener('click', () => {
  clearTimers();
  try { if (CUR) CUR.pause(); } catch { /* 已经停了 */ }
  RD = null; show('s-home'); renderHome();
});
PLAY.addEventListener('click', () => {
  const it = RD && RD.items[RD.i];
  if (!it || it.res) return;
  doPlay(1, false);
});

/* ============ 5. 复盘页（S5：这里才出文字） ============ */
function finish() {
  const RDl = RD; if (!RDl) return;
  const d = dayOf(DB, todayKey());
  if (RDl.extra) d.extra++; else d.rounds++;
  save();
  const its = RDl.items;
  const sum = roundSummary(its.map((x) => ({
    scene: x.scene, res: /** @type {import('./core.js').Res} */ (x.resRaw || 'skip'),
    firstWrong: x.firstWrong, rt: x.rt,
  })));
  $('#r-right').textContent = sum.right + '/' + sum.total;
  $('#r-first').textContent = sum.first + '/' + sum.total;
  $('#r-rt').textContent = sum.avgRt === null ? '—' : sum.avgRt + ' ms';
  $('#r-sub').textContent = (RDl.extra ? '这轮不算今天的任务。' : `今天第 ${d.rounds} 轮 / 共 ${ROUNDS_PER_DAY} 轮。`)
    + ' 反应时间只在题目区计时。';
  bars($('#r-bars'), sum.bars);
  $('#r-zh').textContent = String(d.zh);
  $('#r-list').innerHTML = its.map((x, k) => {
    const mk = x.res === 'right' ? '' : x.res === 'wrong' ? ' e' : ' s';
    const miss = x.reason === 'media' ? '<div class="tiny">这一题的素材还没生成，已经跳过（不算答错）。</div>' : '';
    return `<li class="it"><div class="l1"><span class="mk${mk}"></span>
   <button class="btn sm" data-rep="${k}" aria-label="重听">▶</button>
   <span class="en">${x.scene.en}</span>
   <button class="btn sm" data-zh="${k}">看中文</button></div>
   <div class="zh" data-zhbox="${k}" hidden>${x.scene.zh}</div>${miss}</li>`;
  }).join('');
  $$('#r-list [data-rep]').forEach((b) => b.addEventListener('click', () => {
    const it = its[Number(b.dataset.rep)];
    if (it.audioUrl) playMedia(it.audioUrl, 1).catch(() => { b.textContent = '✕'; });
    else b.textContent = '✕';
  }));
  $$('#r-list [data-zh]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.zh;
    const box = $(`[data-zhbox="${k}"]`);
    if (box.hidden) {
      box.hidden = false; b.textContent = '收起中文';
      dayOf(DB, todayKey()).zh++; save();
      $('#r-zh').textContent = String(dayOf(DB, todayKey()).zh);
    } else { box.hidden = true; b.textContent = '看中文'; }
  }));
  if (cfg.zhOpen) $$('#r-list [data-zh]').forEach((b) => b.click());
  const missing = its.filter((x) => x.reason === 'media').length;
  const hint = $('#r-mediahint');
  hint.hidden = missing === 0;
  hint.textContent = missing ? `这一轮有 ${missing} 题的素材还没生成，已经跳过，没算成答错。` : '';
  const back = $('#b-back');
  back.setAttribute('aria-disabled', 'true');
  setTimeout(() => { back.removeAttribute('aria-disabled'); $('#r-backhint').textContent = '看完点这里回首屏。'; }, TIMING.reviewLock);
  show('s-review');
}

/** @param {HTMLElement} el @param {{name:string,n:number}[]} list */
function bars(el, list) {
  const mx = Math.max(1, ...list.map((b) => b.n));
  el.innerHTML = list.map((b) =>
    `<div class="b"><span class="muted">${b.name}</span><span class="t"><i style="width:${b.n / mx * 100}%"></i></span><b>${b.n}</b></div>`).join('');
}

/* ============ 6. 首屏（S6 / S7） ============ */
function renderHome() {
  const h = homeState(DB, todayKey());
  $('#ring-arc').setAttribute('stroke-dashoffset', String(201 - 201 * h.progress));
  $('#h-title').textContent = h.title;
  $('#h-sub').textContent = h.sub;
  const start = /** @type {HTMLButtonElement} */ ($('#b-start'));
  start.hidden = !h.showStart;
  start.textContent = h.startLabel;
  $('#h-extra').hidden = !h.showExtra;
  // 素材没齐时的降级：首屏说清楚，按钮按不动，不让他点进去白屏（题目区仍然零文字）
  const banner = $('#h-media');
  banner.hidden = MEDIA.text === '';
  banner.innerHTML = MEDIA.text
    ? MEDIA.text + (MANIFEST && MANIFEST.note ? `<span class="mi">${MANIFEST.note}</span>` : '')
    : '';
  const blocked = !MEDIA.canStart;
  start.disabled = blocked;
  /** @type {HTMLButtonElement} */ ($('#b-extra')).disabled = blocked;
  $('#k-streak').textContent = String(h.streak);
  $('#k-today').textContent = String(h.todayCount);
  $('#k-total').textContent = String(h.total);
  $('#k-acc').textContent = h.accuracy;
  $('#k-rt').textContent = h.avgRt === null ? '—' : h.avgRt + ' ms';
  $('#k-zh').textContent = String(h.zhOpens);
  bars($('#h-bars'), h.bars);
}

$('#b-start').addEventListener('click', () => startRound(false));
$('#b-extra').addEventListener('click', () => startRound(true));
$('#b-back').addEventListener('click', () => { show('s-home'); renderHome(); });
$('#b-csv').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toCSV(DB.log)], { type: 'text/csv' }));
  a.download = 'practical-' + todayKey() + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});
let clearArm = false;
$('#b-clear').addEventListener('click', () => {
  if (!clearArm) { // S16：清空要二次确认
    clearArm = true;
    $('#b-clear').textContent = '真的清空？再点一次';
    $('#h-clearhint').textContent = '清空后这台设备上的记录全没了，先导出 CSV。';
    setTimeout(() => { clearArm = false; $('#b-clear').textContent = '清空记录'; $('#h-clearhint').textContent = ''; }, 6000);
    return;
  }
  const keep = DB.cfg;
  DB = emptyDB(); DB.cfg = keep; cfg = DB.cfg;
  save(); clearArm = false;
  $('#b-clear').textContent = '清空记录';
  $('#h-clearhint').textContent = '已清空。';
  renderHome();
});

/* ============ 7. 声音测试（S1 / S15） ============ */
$('#b-testtone').addEventListener('click', testTone);
$('#b-retest').addEventListener('click', testTone);
const heard = () => { cfg.heard = true; save(); show('s-home'); renderHome(); };
$('#b-heard').addEventListener('click', heard);
$('#b-heard2').addEventListener('click', heard);
$('#b-nothear').addEventListener('click', () => { $('#d-help').hidden = false; });
$$('#u-steps .tick').forEach((b) => b.addEventListener('click', () => {
  const li = /** @type {HTMLElement} */ (b.closest('li'));
  li.classList.toggle('done');
  const all = $$('#u-steps li');
  const i = all.indexOf(li);
  if (li.classList.contains('done') && all[i + 1]) all[i + 1].scrollIntoView({ block: 'nearest' });
}));

/* ============ 8. 设置（S17：只对这台设备生效） ============ */
function applyCfg() {
  document.documentElement.setAttribute('data-theme', cfg.theme);
  /** @type {HTMLSelectElement} */ ($('#c-theme')).value = cfg.theme;
  /** @type {HTMLInputElement} */ ($('#c-vol')).value = String(Math.round(cfg.vol * 100));
  /** @type {HTMLInputElement} */ ($('#c-zh')).checked = !!cfg.zhOpen;
}
$('#c-theme').addEventListener('change', (e) => {
  cfg.theme = /** @type {HTMLSelectElement} */ (e.target).value; applyCfg(); save();
});
$('#c-vol').addEventListener('input', (e) => {
  cfg.vol = Number(/** @type {HTMLInputElement} */ (e.target).value) / 100; save();
});
$('#c-zh').addEventListener('change', (e) => {
  cfg.zhOpen = /** @type {HTMLInputElement} */ (e.target).checked; save();
});

/* ============ 9. 起步 ============ */
load();
applyCfg();
if (DEBUG) { $('#h-debug').hidden = false; $('#h-set').setAttribute('open', ''); }
if (cfg.heard) { show('s-home'); renderHome(); } else { show('s-test'); }
loadManifest().then(() => { renderHome(); document.documentElement.setAttribute('data-ready', '1'); });

// 只给自动化测试用：不改任何界面行为
/** @type {Record<string,unknown>} */ (/** @type {unknown} */ (window)).__app = {
  startRound, renderHome, get RD() { return RD; }, DB: () => DB, streak: () => streak(DB, todayKey()),
};
