// 验收测试（单元层）：一条《使用场景清单-自用版》的场景编号一条测试。
// 依据 agents 项目/Practical/使用场景清单-自用版.md（S1～S17）和 原型-Practical-盲听卡-v1.html（Amos 2026-11-03 已确认的交互）。
// 偏差说明：本次没有单独的测试会话（Amos 要求快），由研发先写测试再写实现，再由独立审查会话复核。
import { describe, it, expect } from 'vitest';
import {
  ETYPE, SLOTS, SLOW_RATE, ROUNDS_PER_DAY, QUESTIONS_PER_ROUND, MAX_AUDIO_FAILS, TIMING,
  emptyDB, normalizeDB, todayKey, dayOf, streak, pickRound, classify, pushLog, toCSV,
  homeState, roundSummary, readyIds, manifestSummary, mediaUrl,
} from '../web/core.js';
import { buildManifest } from '../src/manifest.js';
import { SCENES } from '../web/scenes.js';

/** 和 core.js 的 Res 一致：一题的结局 */
type Res = 'right' | 'right_after' | 'wrong' | 'skip' | 'audiofail';
type Item = { scene: (typeof SCENES)[number]; res: Res; firstWrong: number | null; rt: number | null };

const H = 3600_000;
const DAY = 24 * H;
const idsOf = (list: { id: string }[]) => list.map((s) => s.id);
/** 造一份"全 30 个场景素材都齐了"的清单 */
const fullKeys = () => SCENES.flatMap((s) => [
  `scene-${s.id}-correct.png`, `scene-${s.id}-d1-phoneme.png`,
  `scene-${s.id}-d2-action.png`, `scene-${s.id}-d3-function.png`, `scene-${s.id}-audio.mp3`,
]);

describe('场景数据本身', () => {
  it('30 个场景，编号 01～30 不重复', () => {
    expect(SCENES).toHaveLength(30);
    expect(new Set(idsOf(SCENES)).size).toBe(30);
    expect(idsOf(SCENES)[0]).toBe('01');
    expect(idsOf(SCENES)[29]).toBe('30');
  });
  it('四类错误和四张图的槽位一一对应（下标即错误类型）', () => {
    expect(ETYPE).toEqual(['正确', '音素', '动作', '虚词数字']);
    expect(SLOTS).toEqual(['correct', 'd1-phoneme', 'd2-action', 'd3-function']);
  });
});

describe('S2 一轮盲听：一天 3 轮 × 10 题', () => {
  it('写死 3 轮 10 题，慢速是 0.7 倍', () => {
    expect(ROUNDS_PER_DAY).toBe(3);
    expect(QUESTIONS_PER_ROUND).toBe(10);
    expect(SLOW_RATE).toBe(0.7);
  });
  it('一轮内不重复出题', () => {
    const out = pickRound(SCENES, {}, 10, Date.now());
    expect(out).toHaveLength(10);
    expect(new Set(idsOf(out)).size).toBe(10);
  });
  it('三轮正好把 30 个场景过完一遍（全新记录、互不重复）', () => {
    const db = emptyDB();
    const seen: string[] = [];
    for (let r = 0; r < 3; r++) {
      const round = pickRound(SCENES, db.q, 10, Date.now());
      for (const s of round) {
        seen.push(s.id);
        pushLog(db, { scene: s, res: 'right', firstWrong: null, tries: 0, rt: 500, extra: false, now: Date.now() });
      }
    }
    expect(new Set(seen).size).toBe(30);
  });
});

describe('S13 同一题不要刷：24 小时内最多 2 次、连对 2 次 48 小时不再出', () => {
  it('24 小时内已经出过 2 次的题，这一轮不再排', () => {
    const now = Date.now();
    const q: Record<string, { seen: number[] }> = {};
    for (const s of SCENES.slice(0, 25)) q[s.id] = { seen: [now - H, now - 2 * H] };
    const out = pickRound(SCENES, q, 5, now);
    expect(idsOf(out).sort()).toEqual(['26', '27', '28', '29', '30']);
  });
  it('连对 2 次且 48 小时内答对过的题，这一轮不再排', () => {
    const now = Date.now();
    const q: Record<string, { seen: number[]; rightStreak: number; lastRight: number }> = {};
    for (const s of SCENES.slice(0, 28)) q[s.id] = { seen: [], rightStreak: 2, lastRight: now - 3 * H };
    const out = pickRound(SCENES, q, 2, now);
    expect(idsOf(out).sort()).toEqual(['29', '30']);
  });
  it('题不够时放宽，不会出不满 10 题（宁可重复也不少题）', () => {
    const now = Date.now();
    const q: Record<string, { seen: number[] }> = {};
    for (const s of SCENES) q[s.id] = { seen: [now - H, now - 2 * H] };
    expect(pickRound(SCENES, q, 10, now)).toHaveLength(10);
  });
  it('最近答错的优先、其次最久没出现的', () => {
    const now = Date.now();
    const q: Record<string, { seen: number[]; lastWrong?: number; lastSeen?: number }> = {};
    for (const s of SCENES) q[s.id] = { seen: [], lastSeen: now - 10 * DAY };
    q['07'].lastWrong = now - H;              // 刚答错
    q['19'].lastWrong = now - 5 * H;          // 早一点答错
    q['22'].lastSeen = now - 30 * DAY;        // 最久没出现
    const out = idsOf(pickRound(SCENES, q, 3, now));
    expect(out[0]).toBe('07');
    expect(out[1]).toBe('19');
    expect(out[2]).toBe('22');
  });
});

describe('S3 / S4 选对与选错：四类错误怎么记', () => {
  it('一次就对记"正确"', () => expect(classify('right', null)).toBe('正确'));
  it('第一次点错哪一张，就记哪一类', () => {
    expect(classify('wrong', 1)).toBe('音素');
    expect(classify('wrong', 2)).toBe('动作');
    expect(classify('wrong', 3)).toBe('虚词数字');
  });
  it('错过以后又点对，按第一次错的那一类记', () => expect(classify('right_after', 2)).toBe('动作'));
  it('S12 跳过、S10 素材缺失都记"其他"，不记成答错', () => {
    expect(classify('skip', null)).toBe('其他');
    expect(classify('audiofail', null)).toBe('其他');
  });
  it('选错三级提示的节奏写死：慢速 → 去掉两张 → 揭晓', () => {
    expect(TIMING.nextAfterRight).toBe(1400);
    expect(TIMING.nextAfterReveal).toBe(1800);
    expect(TIMING.reviewLock).toBe(1000);
  });
});

describe('S12 一题卡住：15 秒自动重播、30 秒出跳过', () => {
  it('两个时间写死', () => {
    expect(TIMING.idleReplay).toBe(15000);
    expect(TIMING.skipAfter).toBe(30000);
  });
  it('跳过记"未作答"，不算错', () => {
    const db = emptyDB();
    pushLog(db, { scene: SCENES[0], res: 'skip', firstWrong: null, tries: 0, rt: null, extra: false, now: Date.now() });
    expect(db.log[0].res).toBe('skip');
    expect(db.log[0].etype).toBe('其他');
    expect(db.q['01'].rightStreak).toBe(0);
  });
});

describe('S10 音频加载不出来：连失败 3 次跳过这一题', () => {
  it('上限是 3 次', () => expect(MAX_AUDIO_FAILS).toBe(3));
  it('记一条"其他"，结果是未作答', () => {
    const db = emptyDB();
    pushLog(db, { scene: SCENES[4], res: 'audiofail', firstWrong: null, tries: 0, rt: null, extra: false, now: Date.now() });
    expect(db.log[0]).toMatchObject({ id: '05', res: 'skip', etype: '其他' });
  });
});

describe('S5 一轮结束的复盘页', () => {
  const items: Item[] = [
    { scene: SCENES[0], res: 'right', firstWrong: null, rt: 900 },
    { scene: SCENES[1], res: 'right_after', firstWrong: 1, rt: 1500 },
    { scene: SCENES[2], res: 'wrong', firstWrong: 2, rt: null },
    { scene: SCENES[3], res: 'skip', firstWrong: null, rt: null },
  ];
  it('答对数、一次就对数、平均反应时间（只统计有计时的题）', () => {
    const s = roundSummary(items);
    expect(s.right).toBe(2);
    expect(s.first).toBe(1);
    expect(s.total).toBe(4);
    expect(s.avgRt).toBe(1200);
  });
  it('四类错误各几个（正确的不计入）', () => {
    expect(roundSummary(items).bars).toEqual([
      { name: '音素', n: 1 }, { name: '动作', n: 1 }, { name: '虚词数字', n: 0 }, { name: '其他', n: 1 },
    ]);
  });
  it('一题都没计时的时候平均反应时间是 null，不是 0', () => {
    const one: Item[] = [{ scene: SCENES[0], res: 'skip', firstWrong: null, rt: null }];
    expect(roundSummary(one).avgRt).toBe(null);
  });
});

describe('S6 / S7 首屏：今天做完了没有、连续第几天', () => {
  it('一轮没做：大按钮是"开始今天第 1 轮"', () => {
    const h = homeState(emptyDB(), '2026-11-03');
    expect(h.done).toBe(0);
    expect(h.startLabel).toBe('开始今天第 1 轮');
    expect(h.showStart).toBe(true);
    expect(h.showExtra).toBe(false);
    expect(h.title).toBe('今天还没开始');
  });
  it('做了 1 轮：还差 2 轮', () => {
    const db = emptyDB();
    db.days['2026-11-03'] = { rounds: 1, extra: 0, zh: 0 };
    const h = homeState(db, '2026-11-03');
    expect(h.title).toBe('今天做了 1 轮，还差 2 轮');
    expect(h.startLabel).toBe('开始今天第 2 轮');
  });
  it('做满 3 轮：换成"今天做完了 ✅ 连续第 N 天"，并出现"再来一轮"', () => {
    const db = emptyDB();
    db.days['2026-11-01'] = { rounds: 3, extra: 0, zh: 0 };
    db.days['2026-11-02'] = { rounds: 3, extra: 0, zh: 0 };
    db.days['2026-11-03'] = { rounds: 3, extra: 0, zh: 0 };
    const h = homeState(db, '2026-11-03');
    expect(h.title).toBe('今天做完了 ✅ 连续第 3 天');
    expect(h.showStart).toBe(false);
    expect(h.showExtra).toBe(true);
  });
  it('连续天数断一天就从头算', () => {
    const db = emptyDB();
    db.days['2026-10-30'] = { rounds: 3, extra: 0, zh: 0 };
    db.days['2026-11-02'] = { rounds: 3, extra: 0, zh: 0 };
    db.days['2026-11-03'] = { rounds: 1, extra: 0, zh: 0 };
    expect(streak(db, '2026-11-03')).toBe(2);
  });
  it('S7 今天的题数、正确率、平均反应时间、点开中文次数', () => {
    const db = emptyDB();
    db.days['2026-11-03'] = { rounds: 1, extra: 0, zh: 4 };
    db.log = [
      { t: '', d: '2026-11-03', id: '01', en: 'a', res: 'right', first: true, tries: 0, etype: '正确', rt: 800, extra: 0 },
      { t: '', d: '2026-11-03', id: '02', en: 'b', res: 'wrong', first: false, tries: 3, etype: '音素', rt: null, extra: 0 },
      { t: '', d: '2026-11-02', id: '03', en: 'c', res: 'right', first: true, tries: 0, etype: '正确', rt: 600, extra: 0 },
    ];
    const h = homeState(db, '2026-11-03');
    expect(h.todayCount).toBe(2);
    expect(h.total).toBe(3);
    expect(h.accuracy).toBe('50%');
    expect(h.avgRt).toBe(800);
    expect(h.zhOpens).toBe(4);
  });
});

describe('S8 一天做第二轮：额外一轮不计入今天的任务', () => {
  it('额外一轮只加 extra，不加 rounds，也不影响连续天数', () => {
    const db = emptyDB();
    const d = dayOf(db, '2026-11-03');
    d.extra += 1;
    expect(homeState(db, '2026-11-03').done).toBe(0);
    expect(streak(db, '2026-11-03')).toBe(0);
  });
  it('额外一轮的每条记录都标 extra=1，导出时看得出来', () => {
    const db = emptyDB();
    pushLog(db, { scene: SCENES[0], res: 'right', firstWrong: null, tries: 0, rt: 700, extra: true, now: Date.now() });
    expect(db.log[0].extra).toBe(1);
  });
});

describe('S16 事后查账：每题一条记录、导出 CSV、清空要二次确认', () => {
  it('一题一条，字段到秒、题号、对错、错误类型、反应时间都在', () => {
    const db = emptyDB();
    pushLog(db, { scene: SCENES[2], res: 'wrong', firstWrong: 1, tries: 3, rt: null, extra: false, now: Date.parse('2026-11-03T04:05:06Z') });
    expect(db.log).toHaveLength(1);
    expect(db.log[0]).toMatchObject({ d: '2026-11-03', id: '03', en: 'Shut the door', res: 'wrong', first: false, tries: 3, etype: '音素', rt: null, extra: 0 });
    expect(db.log[0].t).toContain('2026-11-03T04:05:06');
  });
  it('CSV 带表头和 BOM，英文加引号', () => {
    const db = emptyDB();
    pushLog(db, { scene: SCENES[0], res: 'right', firstWrong: null, tries: 0, rt: 912, extra: false, now: Date.parse('2026-11-03T04:05:06Z') });
    const csv = toCSV(db.log);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split('\n')[0].replace('\ufeff', '')).toBe('时间,日期,题号,英文,结果,一次就对,尝试次数,错误类型,反应时间ms,不计入今天');
    expect(csv).toContain('"Hand me the stapler"');
    expect(csv.trim().split('\n')).toHaveLength(2);
  });
  it('记录不限期保留：旧的日期也在 CSV 里', () => {
    const db = emptyDB();
    pushLog(db, { scene: SCENES[0], res: 'right', firstWrong: null, tries: 0, rt: 1, extra: false, now: Date.parse('2020-01-01T00:00:00Z') });
    pushLog(db, { scene: SCENES[1], res: 'right', firstWrong: null, tries: 0, rt: 1, extra: false, now: Date.now() });
    expect(toCSV(db.log)).toContain('2020-01-01');
  });
});

describe('S17 设置只对这台设备生效：默认值', () => {
  it('默认深色、音量 0.5、中文折叠（B-2、B-4）', () => {
    const cfg = emptyDB().cfg;
    expect(cfg.theme).toBe('dark');
    expect(cfg.vol).toBe(0.5);
    expect(cfg.zhOpen).toBe(false);
    expect(cfg.heard).toBe(false);
  });
  it('旧记录缺字段时补默认值，不炸', () => {
    const db = normalizeDB({ log: [], days: {}, q: {}, cfg: { vol: 0.2 } });
    expect(db.cfg.vol).toBe(0.2);
    expect(db.cfg.theme).toBe('dark');
    expect(db.log).toEqual([]);
  });
  it('坏掉的 localStorage 内容当成空记录，不白屏', () => {
    expect(normalizeDB(null).log).toEqual([]);
    expect(normalizeDB('坏的' as unknown as object).days).toEqual({});
  });
});

describe('素材清单：media/ 里有哪些、缺哪些（本次 1.0 的降级依据）', () => {
  it('五个文件都齐了才算这一题可用', () => {
    const m = buildManifest(fullKeys(), SCENES.map((s) => s.id));
    expect(m.ready).toBe(30);
    expect(m.total).toBe(30);
    expect(m.scenes.every((s) => s.ready)).toBe(true);
  });
  it('图片 PNG / JPG / WebP 都认，音频 MP3 / M4A / WAV 都认', () => {
    const m = buildManifest([
      'scene-01-correct.jpg', 'scene-01-d1-phoneme.jpeg', 'scene-01-d2-action.webp',
      'scene-01-d3-function.png', 'scene-01-audio.m4a',
    ], ['01']);
    expect(m.scenes[0].ready).toBe(true);
    expect(m.scenes[0].files.audio).toBe('scene-01-audio.m4a');
  });
  it('少一个文件就不算齐，并说清少哪个', () => {
    const keys = fullKeys().filter((k) => k !== 'scene-07-audio.mp3');
    const m = buildManifest(keys, SCENES.map((s) => s.id));
    expect(m.ready).toBe(29);
    const s7 = m.scenes.find((s) => s.id === '07');
    expect(s7?.ready).toBe(false);
    expect(s7?.missing).toEqual(['audio']);
  });
  it('一个文件都没有时：30 个全缺，不报错', () => {
    const m = buildManifest([], SCENES.map((s) => s.id));
    expect(m.ready).toBe(0);
    expect(m.scenes[0].missing).toEqual(['correct', 'd1-phoneme', 'd2-action', 'd3-function', 'audio']);
  });
  it('名字不对的文件被忽略，不会冒充素材', () => {
    const m = buildManifest(['scene-1-correct.png', 'scene-01-correct.PNG.txt', '素材说明.md'], ['01']);
    expect(m.scenes[0].missing).toContain('correct');
  });
});

describe('素材没齐时的降级（Amos 今天打开就会遇到：0 / 30）', () => {
  const manifestOf = (readyCount: number) => buildManifest(
    SCENES.slice(0, readyCount).flatMap((s) => [
      `scene-${s.id}-correct.png`, `scene-${s.id}-d1-phoneme.png`,
      `scene-${s.id}-d2-action.png`, `scene-${s.id}-d3-function.png`, `scene-${s.id}-audio.mp3`,
    ]),
    SCENES.map((s) => s.id),
  );
  it('只有齐了的场景能被排进这一轮', () => {
    const ids = readyIds(manifestOf(4));
    expect(ids).toEqual(['01', '02', '03', '04']);
    const pool = SCENES.filter((s) => ids.includes(s.id));
    expect(idsOf(pickRound(pool, {}, 10, Date.now())).sort()).toEqual(['01', '02', '03', '04']);
  });
  it('齐的不足 10 个时，这一轮就做几题，不白屏也不报错', () => {
    const ids = readyIds(manifestOf(4));
    const pool = SCENES.filter((s) => ids.includes(s.id));
    expect(pickRound(pool, {}, 10, Date.now())).toHaveLength(4);
  });
  it('一个都没齐时：不能开始，首屏给一句说明', () => {
    const s = manifestSummary(manifestOf(0));
    expect(s.ready).toBe(0);
    expect(s.canStart).toBe(false);
    expect(s.text).toContain('素材还没生成');
    expect(s.text).toContain('0 / 30');
  });
  it('齐了一部分时：能开始，但说清还差几个', () => {
    const s = manifestSummary(manifestOf(12));
    expect(s.canStart).toBe(true);
    expect(s.text).toContain('12 / 30');
  });
  it('30 个全齐时不再唠叨', () => {
    const s = manifestSummary(manifestOf(30));
    expect(s.canStart).toBe(true);
    expect(s.text).toBe('');
  });
  it('清单拿不到（断网、Worker 没起来）时当成一个都没齐，而不是崩掉', () => {
    const s = manifestSummary(null);
    expect(s.canStart).toBe(false);
    expect(s.ready).toBe(0);
  });
  it('素材的网址就是 /media/ 加文件名', () => {
    expect(mediaUrl('scene-01-audio.mp3')).toBe('/media/scene-01-audio.mp3');
  });
});

describe('日期口径', () => {
  it('todayKey 是本地日期的 YYYY-MM-DD（跨时区不会提前翻天）', () => {
    expect(todayKey(new Date(2026, 10, 3, 23, 30))).toBe('2026-11-03');
    expect(todayKey(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
  });
});
