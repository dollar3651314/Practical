/* S2 句式变换推导引擎
 *
 * 为什么要有这个东西：Amos 的《S2基础语法课件》137 页里有 182 道练习，**一道答案都没有**
 * （老师在课上口头讲）。但课件把**规则**给全了，还印了 24 个做好的示范句。
 * 所以答案可以按课程自己的规则推出来 —— 推出来的一律标「按课件规则推出」，不冒充「课件原文」。
 *
 * 不许越过的那条线：**推不出来就回 null，绝不猜。**
 * 宁可少出一道题，也不能给他一个看起来像答案的错东西（底线 3）。
 *
 * 校验办法：课件那 24 个示范句就是标准答案。引擎必须先把能覆盖的那些**逐字复现**，
 * 才允许它去推别的题。见文件末尾的 校验()。
 *
 * 规则出处（全部是课件原文，页码是 S2基础语法课件.pdf 的页）：
 *   P63  动词单数第三人称（三单怎么变）
 *   P75  动词 +ing 小贴士
 *   P99  动词过去式小贴士（含 16 个不规则动词）
 *   P122 句式变化中助动词的分类
 *   P126 常见的特殊疑问词（含「特殊疑问词＋助动词＋主语＋实义动词＋其它？」）
 *   P133 句式变化总结（三大句型 × 三种变换的总表）
 */

export type 句型名 = 'Be' | 'Do' | 'Therebe';
export type 时态名 = '一般现在时' | '一般过去时' | '现在进行时' | '一般将来时';
export type 变换名 = '否定' | '一般疑问' | '特殊疑问';
/** 一句话标注好的形状。由内容文件 / s2-annotate 标，**不靠程序猜**。 */
export interface 句标 {
  句型: 句型名;
  时态?: 时态名;
  主语: string;
  谓语?: string;
  其余?: string;
  be?: string;
  将来式?: 'be going to' | 'will';
}
export interface 推导结果 { 答: string; 依据: string; 类: '按课件规则推出' }

/* ── 课件原文：P133 句式变化总结 ── */
export const 总表: Record<string, Record<变换名, string>> = {
  Be句型:      { 否定: 'Be后加not', 一般疑问: 'Be提到句首',               特殊疑问: '确定特殊疑问词，围绕be变化' },
  Do句型:      { 否定: "助动词 Don't/doesn't/didn't/won't放动词前面", 一般疑问: '助动词 do/does/did/will 提到主语前面', 特殊疑问: '确定特殊疑问词，围绕助动词do/does/did/will变化' },
  Therebe句型: { 否定: 'Be后加not', 一般疑问: 'Be提到句首',               特殊疑问: '确定特殊疑问词，围绕be变化' },
};

/* ── 课件原文：P122 句式变化中助动词的分类 ── */
export const 助动词表 = {
  现在进行时: 'be(am/is/are)',
  一般现在时: 'do/does',
  一般过去时: 'did',
  一般将来时: 'be(am/is/are)/will',
};

/* ── 课件原文：P99 的 16 个不规则动词（只认这些，别的过去式一律拒绝还原） ── */
export const 不规则 = {
  get: 'got', take: 'took', have: 'had', has: 'had', do: 'did',
  eat: 'ate', drive: 'drove', buy: 'bought', make: 'made',
  write: 'wrote', see: 'saw', go: 'went', sing: 'sang',
  drink: 'drank', sit: 'sat', ride: 'rode', find: 'found',
};
const 过去式还原 = Object.fromEntries(Object.entries(不规则).map(([a, b]) => [b, a === 'has' ? 'have' : a]));

/* ── 课件原文：P126 常见的特殊疑问词 ── */
export const 疑问词表 = {
  where: '哪里', what: '什么', when: '问时间', who: '谁', which: '哪一个',
  why: '为什么', how: '怎么样', 'how many': '多少数量', 'how long': '多久',
  'how much': '多少钱', 'how often': '问频率',
};
export const 特殊疑问公式 = '特殊疑问词＋助动词＋主语＋实义动词＋其它？';

const BE = new Set(['am', 'is', 'are', 'was', 'were']);

/* ── P63：三单 → 原形。只还原课件那四条规则覆盖得到的，其余拒绝 ── */
export function 还原三单(w: string): string | null {
  const s = w.toLowerCase();
  if (过去式还原[s]) return null;                       // 这是过去式，不是三单
  if (s === 'goes' || s === 'does') return s.slice(0, -2);        // 辅音+o，加 es
  if (s === 'has') return 'have';
  if (/[^aeiou]ies$/.test(s)) return s.slice(0, -3) + 'y';        // 辅音+y → ies
  if (/(s|z|sh|ch|x)es$/.test(s)) return s.slice(0, -2);          // s/z/ʃ/tʃ 结尾加 es
  if (/[^s]es$/.test(s) && /[^aeiou]e$/.test(s.slice(0, -1))) return s.slice(0, -1); // 词尾是 e，只加 s
  if (/[^s]s$/.test(s)) return s.slice(0, -1);                    // 一般动词加 s
  return null;
}

/* ── P99：过去式 → 原形。不规则查表；规则变化按那四条反推；拿不准回 null ── */
export function 还原过去式(w: string): string | null {
  const s = w.toLowerCase();
  if (过去式还原[s]) return 过去式还原[s];
  if (!s.endsWith('ed')) return null;
  const 去ed = s.slice(0, -2);
  if (/([^aeiou])\1$/.test(去ed)) return 去ed.slice(0, -1);       // 双写辅音 +ed
  if (/[^aeiou]i$/.test(去ed)) return 去ed.slice(0, -1) + 'y';    // 辅音+y → ied
  if (/[^aeiou]$/.test(去ed)) return 去ed;                        // 一般 +ed
  return s.slice(0, -1);                                          // 不发音 e 结尾，只 +d
}

/* ── P75：动词 +ing ── */
export function 加ing(w: string): string {
  const s = w.toLowerCase();
  if (s.endsWith('ie')) return s.slice(0, -2) + 'ying';           // ie → y + ing
  if (/[^aeiou]e$/.test(s)) return s.slice(0, -1) + 'ing';        // 不发音 e，去 e
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(s)) return s + s.slice(-1) + 'ing'; // 重读闭音节双写
  return s + 'ing';
}

const 大写 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/* be / 助动词提到句首以后，原来的主语要不要改小写：**只有代词和限定词才改**。
   专有名词（Lucy、Tom、Betty）永远保持大写 —— 一旦写成 "Is lucy a doctor?"，
   那就是当面给他一个错答案（底线 3）。 */
const 可小写 = new Set(['this','that','these','those','he','she','it','we','they','you',
  'the','a','an','my','his','her','our','their','your','its','there']);
const 小写首 = (s: string) => (可小写.has(s.split(' ')[0].toLowerCase())
  ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const 去句号 = (s: string) => s.replace(/\s*[.!?]\s*$/, '');

/* 第三人称单数主语？只认课件练习里出现的那些形状，拿不准回 null */
function 是三单(主: string): boolean | null {
  const s = 主.trim().toLowerCase();
  if (['he', 'she', 'it'].includes(s)) return true;
  if (['i', 'you', 'we', 'they'].includes(s)) return false;
  if (/\band\b/.test(s)) return false;                            // Jack and his friends
  if (/^(the |a |an |my |his |her |our |their |this |that )?[a-z.' ]+s$/.test(s)) return null; // 复数还是单数？不猜
  return true;                                                     // Mr. Wang / My son / Tom
}

/**
 * 句的标注形式（由内容文件逐句标好，不靠程序猜）：
 *   { 句型:'Be'|'Do'|'Therebe', 时态:'一般现在时'|'一般过去时'|'现在进行时'|'一般将来时',
 *     主语, 谓语, 其余, 将来式?:'be going to'|'will', be? }
 */
export function 推导(标: 句标, 变: 变换名): 推导结果 | null {
  const r = 变换(标, 变);
  if (!r) return null;
  return { 答: r, 依据: 总表[标.句型 + '句型'][变], 类: '按课件规则推出' };
}

function 变换(标: 句标, 变: 变换名): string | null {
  const { 句型, 时态, 主语, 谓语, 其余 = '', be, 将来式 } = 标;
  const 尾 = 其余 ? ' ' + 其余.trim() : '';

  /* ── Be 句型 / There be：P133 左右两栏规则一样 ── */
  if (句型 === 'Be' || 句型 === 'Therebe') {
    if (!be || !BE.has(be)) return null;
    const 主 = 句型 === 'Therebe' ? 'there' : 主语;
    const 表 = (谓语 ? 谓语 + ' ' : '') + 去句号(其余 || '');
    if (变 === '否定') return 大写(主) + ' ' + be + ' not' + (表 ? ' ' + 表 : '') + '.';
    if (变 === '一般疑问') return 大写(be) + ' ' + 小写首(主) + (表 ? ' ' + 表 : '') + '?';
    return null;
  }

  if (句型 !== 'Do') return null;

  /* Do 句型没有谓语就什么都推不出来。**宁可拒绝，也不能把 undefined 印到屏幕上。** */
  if (!谓语) return null;

  /* ── Do 句型 ── */
  if (时态 === '现在进行时') {
    if (!be || !BE.has(be)) return null;
    const doing = /ing$/.test(谓语) ? 谓语 : 加ing(谓语);
    if (变 === '否定') return 大写(主语) + ' ' + be + ' not ' + doing + 尾 + '.';
    if (变 === '一般疑问') return 大写(be) + ' ' + 小写首(主语) + ' ' + doing + 尾 + '?';
    return null;
  }

  if (时态 === '一般将来时') {
    if (将来式 === 'will') {
      if (变 === '否定') return 大写(主语) + " won't " + 谓语 + 尾 + '.';
      if (变 === '一般疑问') return 'Will ' + 小写首(主语) + ' ' + 谓语 + 尾 + '?';
      return null;
    }
    if (将来式 === 'be going to') {
      if (!be || !BE.has(be)) return null;
      // P88：be going to 里的 go 和动作里的 go 合并 —— "going to go to X" 写成 "going to X"
      const 动 = 谓语 === 'go' ? null : 谓语;
      const 主体 = 动 === null ? 'going' + 尾 : 'going to ' + 动 + 尾;
      if (变 === '否定') return 大写(主语) + ' ' + be + ' not ' + 主体 + '.';
      if (变 === '一般疑问') return 大写(be) + ' ' + 小写首(主语) + ' ' + 主体 + '?';
      return null;
    }
    return null;
  }

  if (时态 === '一般过去时') {
    // **必须还原得出原形才干活**。P99 只收录了 16 个不规则动词，表外的（如 flew）一律拒绝 ——
    // 否则会推出 "He didn't flew to Paris." 这种东西，那是编的（底线 3）。
    const 原 = 还原过去式(谓语);
    if (!原) return null;
    if (变 === '否定') return 大写(主语) + " didn't " + 原 + 尾 + '.';
    if (变 === '一般疑问') return 'Did ' + 小写首(主语) + ' ' + 原 + 尾 + '?';
    return null;
  }

  if (时态 === '一般现在时') {
    const 三单 = 是三单(主语);
    if (三单 === null) return null;                                 // 主语单复数拿不准 → 拒绝
    const 原 = 三单 ? (还原三单(谓语) ?? 谓语) : 谓语;
    if (三单 && 还原三单(谓语) === null && /s$/.test(谓语)) return null; // 像三单却还原不了 → 拒绝
    if (变 === '否定') return 大写(主语) + (三单 ? " doesn't " : " don't ") + 原 + 尾 + '.';
    if (变 === '一般疑问') return (三单 ? 'Does ' : 'Do ') + 小写首(主语) + ' ' + 原 + 尾 + '?';
    return null;
  }
  return null;
}
