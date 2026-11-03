// Practical 1.0 的纯逻辑：出题、记分、首屏和复盘的数字、CSV、素材清单怎么用。
// 这里不碰 DOM、不碰网络，所以单元测试能直接跑（test/core.test.ts）。界面在 app.js。
// 每条规则后面标的 S 编号对应 agents《使用场景清单-自用版.md》。

/** 四张图的槽位，顺序固定：下标 0 是正确答案，1～3 分别管一类混淆 */
export const SLOTS = ['correct', 'd1-phoneme', 'd2-action', 'd3-function'];
/** 下标 → 错误类型（和 SLOTS 一一对应） */
export const ETYPE = ['正确', '音素', '动作', '虚词数字'];
/** 四类错误在复盘页和首屏的排法（"其他"＝跳过或素材缺失） */
export const BAR_NAMES = ['音素', '动作', '虚词数字', '其他'];

export const ROUNDS_PER_DAY = 3;      // S6、B-5：一天 3 轮算做完
export const QUESTIONS_PER_ROUND = 10; // S2
export const SLOW_RATE = 0.7;          // S4 第 1 次选错：慢速重播 0.7 倍（不出文字）
export const MAX_AUDIO_FAILS = 3;      // S10：连失败 3 次就跳过这一题
export const TIMING = {
  idleReplay: 15000,     // S12：15 秒没动作自动重播一次
  skipAfter: 30000,      // S12：30 秒还没动出现「跳过」
  nextAfterRight: 1400,  // S3：选对后再播一次，然后自动下一题
  nextAfterReveal: 1800, // S4 第 3 次：揭晓并播一次，然后下一题
  reviewLock: 1000,      // B-6：复盘页强制看一眼（1 秒后可以走）
};
const DAY_MS = 86400000;

/** @typedef {{id:string,name:string,en:string,zh:string}} Scene */
/** @typedef {'right'|'right_after'|'wrong'|'skip'|'audiofail'} Res */
/** @typedef {{t:string,d:string,id:string,en:string,res:'right'|'wrong'|'skip',first:boolean,tries:number,etype:string,rt:number|null,extra:0|1}} LogRow */
/** @typedef {{rounds:number,extra:number,zh:number}} DayRec */
/** @typedef {{seen:number[],rightStreak:number,lastSeen?:number,lastRight?:number,lastWrong?:number}} QRec */
/** @typedef {{theme:string,vol:number,zhOpen:boolean,heard:boolean}} Cfg */
/** @typedef {{log:LogRow[],days:Record<string,DayRec>,q:Record<string,QRec>,cfg:Cfg}} DB */
/** @typedef {{id:string,ready:boolean,files:Record<string,string>,missing:string[]}} SceneEntry */
/** @typedef {{ready:number,total:number,scenes:SceneEntry[],note?:string}} Manifest */

/* ===================== 本地记录（S16、S17：只存这台设备） ===================== */

/** @returns {DB} */
export function emptyDB() {
  return { log: [], days: {}, q: {}, cfg: { theme: 'dark', vol: 0.5, zhOpen: false, heard: false } };
}

/**
 * localStorage 里的东西可能是旧版本、也可能被改坏了；一律补齐成完整的形状，绝不让首屏白屏。
 * @param {unknown} raw
 * @returns {DB}
 */
export function normalizeDB(raw) {
  const base = emptyDB();
  if (!raw || typeof raw !== 'object') return base;
  const r = /** @type {Partial<DB>} */ (raw);
  return {
    log: Array.isArray(r.log) ? r.log : [],
    days: r.days && typeof r.days === 'object' ? r.days : {},
    q: r.q && typeof r.q === 'object' ? r.q : {},
    cfg: Object.assign(base.cfg, r.cfg && typeof r.cfg === 'object' ? r.cfg : {}),
  };
}

/**
 * 本地日期的 YYYY-MM-DD（用本地时区，晚上做题不会被算到第二天）。
 * @param {Date} [date]
 * @returns {string}
 */
export function todayKey(date = new Date()) {
  /** @param {number} n */
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/**
 * @param {DB} db
 * @param {string} key
 * @returns {DayRec}
 */
export function dayOf(db, key) {
  if (!db.days[key]) db.days[key] = { rounds: 0, extra: 0, zh: 0 };
  return db.days[key];
}

/**
 * S6：连续第几天。只算"正式的轮"（额外一轮不算，否则口径会被污染，S8）。
 * @param {DB} db
 * @param {string} [fromKey]
 * @returns {number}
 */
export function streak(db, fromKey = todayKey()) {
  let n = 0;
  let t = Date.parse(fromKey + 'T00:00:00Z');
  for (;;) {
    const k = new Date(t).toISOString().slice(0, 10);
    const d = db.days[k];
    if (d && d.rounds > 0) { n++; t -= DAY_MS; } else break;
  }
  return n;
}

/* ===================== 出题（第三节 + S13） ===================== */

/**
 * 排这一轮的题：一轮内不重复；最近答错的优先、其次最久没出现的；
 * 同一题 24 小时内最多出现 2 次；连对 2 次的题 48 小时内不再出（S13）。
 * 可选的题不够时逐步放宽，宁可重复也不少题——少题会让"一天 30 题"的口径失效。
 * @param {Scene[]} scenes 候选场景（调用方只传素材齐了的那些）
 * @param {Record<string,Partial<QRec>>} qstate
 * @param {number} [n]
 * @param {number} [now]
 * @returns {Scene[]}
 */
export function pickRound(scenes, qstate, n = QUESTIONS_PER_ROUND, now = Date.now()) {
  /** @param {Scene} s @returns {[number,number]} */
  const score = (s) => {
    const q = qstate[s.id] || {};
    return [-(q.lastWrong || 0), q.lastSeen || 0];
  };
  /** @type {Scene[]} */
  const out = [];
  /** @type {Set<string>} */
  const used = new Set();
  for (let relax = 0; relax < 3 && out.length < n; relax++) {
    const pool = scenes.filter((s) => {
      if (used.has(s.id)) return false;
      const q = qstate[s.id] || { seen: [] };
      const seen = q.seen || [];
      if (relax < 1 && seen.filter((t) => now - t < DAY_MS).length >= 2) return false;
      if (relax < 2 && (q.rightStreak || 0) >= 2 && now - (q.lastRight || 0) < 2 * DAY_MS) return false;
      return true;
    });
    pool.sort((a, b) => { const A = score(a), B = score(b); return A[0] - B[0] || A[1] - B[1]; });
    for (const s of pool) { if (out.length >= n) break; out.push(s); used.add(s.id); }
  }
  return out.slice(0, n);
}

/* ===================== 记分 ===================== */

/**
 * 这一题记成哪一类错误。跳过（S12）和素材缺失（S10）都记"其他"，不记成答错。
 * @param {Res} res
 * @param {number|null|undefined} firstWrong 第一次点错的是哪一张（SLOTS 的下标）
 * @returns {string}
 */
export function classify(res, firstWrong) {
  if (res === 'right') return ETYPE[0];
  if (res === 'skip' || res === 'audiofail') return '其他';
  return firstWrong !== null && firstWrong !== undefined ? ETYPE[firstWrong] || '其他' : '其他';
}

/**
 * S16：一题一条记录，写进本地记录并更新这道题的出题状态。
 * @param {DB} db
 * @param {{scene:Scene,res:Res,firstWrong?:number|null,tries?:number,rt?:number|null,extra?:boolean,now?:number}} arg
 * @returns {LogRow}
 */
export function pushLog(db, { scene, res, firstWrong = null, tries = 0, rt = null, extra = false, now = Date.now() }) {
  const result = res === 'wrong' ? 'wrong' : (res === 'skip' || res === 'audiofail') ? 'skip' : 'right';
  const q = db.q[scene.id] || (db.q[scene.id] = { seen: [], rightStreak: 0 });
  q.seen = (q.seen || []).filter((t) => now - t < DAY_MS);
  q.seen.push(now);
  q.lastSeen = now;
  if (result === 'right') { q.rightStreak = (q.rightStreak || 0) + 1; q.lastRight = now; }
  else if (result === 'wrong') { q.rightStreak = 0; q.lastWrong = now; }
  /** @type {LogRow} */
  const row = {
    t: new Date(now).toISOString(), d: todayKey(new Date(now)), id: scene.id, en: scene.en,
    res: result, first: res === 'right', tries, etype: classify(res, firstWrong), rt,
    extra: extra ? 1 : 0,
  };
  db.log.push(row);
  return row;
}

const CSV_HEAD = '时间,日期,题号,英文,结果,一次就对,尝试次数,错误类型,反应时间ms,不计入今天';

/**
 * S16：导出 CSV（带 BOM，Excel 打开不乱码）。记录不限期保留，全部导出。
 * @param {LogRow[]} log
 * @returns {string}
 */
export function toCSV(log) {
  const body = log.map((r) => [
    r.t, r.d, r.id, '"' + String(r.en).replace(/"/g, '""') + '"', r.res,
    r.first ? 1 : 0, r.tries, r.etype, r.rt == null ? '' : r.rt, r.extra,
  ].join(',')).join('\n');
  return '﻿' + CSV_HEAD + '\n' + body + (body ? '\n' : '');
}

/**
 * 把一串错误类型数成四根柱子。
 * @param {string[]} types
 * @returns {{name:string,n:number}[]}
 */
function countBars(types) {
  return BAR_NAMES.map((name) => ({ name, n: types.filter((t) => t === name).length }));
}

/**
 * S5：这一轮的复盘数字。
 * @param {{scene:Scene,res:Res,firstWrong:number|null,rt:number|null}[]} items
 */
export function roundSummary(items) {
  const types = items.map((x) => classify(x.res, x.firstWrong)).filter((t) => t !== ETYPE[0]);
  const rts = /** @type {number[]} */ (items.map((x) => x.rt).filter((x) => x != null));
  return {
    total: items.length,
    right: items.filter((x) => x.res === 'right' || x.res === 'right_after').length,
    first: items.filter((x) => x.res === 'right').length,
    avgRt: rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null,
    bars: countBars(types),
  };
}

/**
 * S6 / S7：首屏要显示的一切。
 * @param {DB} db
 * @param {string} [key]
 */
export function homeState(db, key = todayKey()) {
  const d = db.days[key] || { rounds: 0, extra: 0, zh: 0 };
  const done = d.rounds;
  const left = Math.max(0, ROUNDS_PER_DAY - done);
  const todayLog = db.log.filter((x) => x.d === key);
  const rts = /** @type {number[]} */ (todayLog.map((x) => x.rt).filter((x) => x != null));
  const st = streak(db, key);
  return {
    done, left, extra: d.extra, streak: st,
    progress: Math.min(1, done / ROUNDS_PER_DAY),
    title: left > 0 ? (done === 0 ? '今天还没开始' : `今天做了 ${done} 轮，还差 ${left} 轮`)
      : `今天做完了 ✅ 连续第 ${st} 天`,
    sub: left > 0 ? '一天 3 轮，一轮 10 题，大约 8～10 分钟'
      : '明天这个时候再来。再做也可以，但不算今天的任务。',
    startLabel: `开始今天第 ${done + 1} 轮`,
    showStart: left > 0,
    showExtra: left === 0,
    todayCount: todayLog.length,
    total: db.log.length,
    accuracy: todayLog.length
      ? Math.round(todayLog.filter((x) => x.res === 'right').length / todayLog.length * 100) + '%' : '—',
    avgRt: rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null,
    zhOpens: d.zh,
    bars: countBars(todayLog.map((x) => x.etype).filter((t) => t !== ETYPE[0])),
  };
}

/* ===================== 素材清单（1.0 的降级依据） ===================== */

/**
 * 素材齐了的场景编号。
 * @param {Manifest|null|undefined} manifest
 * @returns {string[]}
 */
export function readyIds(manifest) {
  if (!manifest || !Array.isArray(manifest.scenes)) return [];
  return manifest.scenes.filter((s) => s.ready).map((s) => s.id);
}

/**
 * 素材齐了几个、能不能开始、首屏要挂的那句话。
 * 清单拿不到（断网、Worker 没起来）时当成"一个都没齐"，不崩。
 * @param {Manifest|null|undefined} manifest
 * @returns {{ready:number,total:number,canStart:boolean,text:string}}
 */
export function manifestSummary(manifest) {
  const total = manifest && manifest.total ? manifest.total : 30;
  const ready = manifest ? readyIds(manifest).length : 0;
  if (ready === 0) {
    return {
      ready, total, canStart: false,
      text: `素材还没生成（${ready} / ${total}）。按《上线操作手册》第四步把 30 个场景的图和音频传进 R2，这里就能开始了。`,
    };
  }
  if (ready < total) {
    return {
      ready, total, canStart: true,
      text: `素材齐了 ${ready} / ${total}：这一轮只出齐了的那几题，缺的那些先跳过。`,
    };
  }
  return { ready, total, canStart: true, text: '' };
}

/**
 * 素材在网站上的地址。
 * @param {string} key
 * @returns {string}
 */
export function mediaUrl(key) {
  return '/media/' + key;
}
