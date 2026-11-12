/* 把课件练习里的英文句子标注成推导引擎吃得下的形状。
 * 规矩：**看不懂就回 null**。标注错了会推出假答案，比少一道题严重得多（底线 3）。
 * 这个脚本不产出答案，只产出标注；答案由 s2-derive.mjs 按课件规则推。
 */
import { 还原过去式, 还原三单, type 句标 } from './s2-derive';

const BE = ['am', 'is', 'are', 'was', 'were'];
/* 只认这些主语形状。认不出就整句放弃 —— 主语切错 = 后面全错 */
const 代词 = ['I', 'You', 'He', 'She', 'It', 'We', 'They', 'This', 'That', 'These', 'Those'];
const 限定 = ['the', 'a', 'an', 'my', 'his', 'her', 'our', 'their', 'your', 'its'];

function 切主语(toks: string[]): number | null {
  if (!toks.length) return null;
  if (代词.includes(toks[0])) return 1;
  // Mr. Wang / Mrs. Jones / Dr. Li
  if (/^(Mr|Mrs|Ms|Dr)\.?$/.test(toks[0]) && toks[1]) return 2;
  // My son / The boy / His grandpa —— 限定词 + 一个名词
  if (限定.includes(toks[0].toLowerCase()) && toks[1]) return 2;
  // 专有名词：首字母大写且不是句首常见动词（Tom, Mary, Lucy）
  if (/^[A-Z][a-z]+$/.test(toks[0])) return 1;
  return null;
}

/** 返回 {标, 原句} 或 null */
export function 标注(句原: unknown): { 标: 句标; 原句: string } | null {
  const 句 = String(句原 || '').trim().replace(/\s+/g, ' ');
  if (!句) return null;
  if (/_{2,}|…|（|）/.test(句)) return null;        // 填空题、省略号 → 不是变换题
  if (/[一-龥]/.test(句)) return null;           // 混了中文 → 放弃
  const 句子数 = (句.match(/[.!?]/g) || []).length;
  if (句子数 > 1) return null;                            // 整段 → 放弃（要逐句拆，拆法不唯一）
  if (/\b(and|but|or|because|when|if|that|who|which)\b/i.test(句)) return null; // 有从句/并列 → 放弃
  if (/[?]/.test(句)) return null;                        // 本身已经是疑问句 → 放弃

  const 尾 = 句.replace(/\s*\.\s*$/, '');
  let toks = 尾.split(' ').filter(Boolean);

  /* ── There be ── */
  if (/^There$/i.test(toks[0]) && BE.includes((toks[1] || '').toLowerCase())) {
    return { 标: { 句型: 'Therebe', 主语: 'There', be: toks[1].toLowerCase(), 其余: toks.slice(2).join(' ') }, 原句: 句 };
  }

  const n = 切主语(toks);
  if (!n) return null;
  const 主语 = toks.slice(0, n).join(' ');
  const rest = toks.slice(n);
  if (!rest.length) return null;
  const w0 = rest[0].toLowerCase();

  /* ── I'm / He's 之类缩写：不处理（课件原文里有 I'm，变换写法不唯一） ── */
  if (/'/.test(主语) || /^'/.test(rest[0])) return null;

  /* ── will ── */
  if (w0 === 'will') {
    if (!rest[1]) return null;
    return { 标: { 句型: 'Do', 时态: '一般将来时', 将来式: 'will', 主语, 谓语: rest[1], 其余: rest.slice(2).join(' ') }, 原句: 句 };
  }

  /* ── be 开头：Be 句型 / 现在进行时 / be going to ── */
  if (BE.includes(w0)) {
    const be = w0;
    const r = rest.slice(1);
    if (!r.length) return null;
    // be going to + 动词
    if (r[0].toLowerCase() === 'going' && r[1] && r[1].toLowerCase() === 'to' && r[2]) {
      return { 标: { 句型: 'Do', 时态: '一般将来时', 将来式: 'be going to', 主语, be, 谓语: r[2], 其余: r.slice(3).join(' ') }, 原句: 句 };
    }
    // be going + 地点（课件 P88 说 go 合并过了）→ 还原不回去，放弃
    if (r[0].toLowerCase() === 'going') return null;
    // be + V-ing → 现在进行时
    if (/ing$/.test(r[0]) && r[0].length > 4) {
      return { 标: { 句型: 'Do', 时态: '现在进行时', 主语, be, 谓语: r[0], 其余: r.slice(1).join(' ') }, 原句: 句 };
    }
    // 其余是 Be 句型（表语）
    return { 标: { 句型: 'Be', 主语, be, 其余: r.join(' ') }, 原句: 句 };
  }

  /* ── 实义动词：过去式还是一般现在时 ── */
  const 过去 = 还原过去式(rest[0]);
  const 三单 = 还原三单(rest[0]);
  if (过去 && !三单) {
    return { 标: { 句型: 'Do', 时态: '一般过去时', 主语, 谓语: rest[0], 其余: rest.slice(1).join(' ') }, 原句: 句 };
  }
  if (三单 && !过去) {
    return { 标: { 句型: 'Do', 时态: '一般现在时', 主语, 谓语: rest[0], 其余: rest.slice(1).join(' ') }, 原句: 句 };
  }
  if (过去 && 三单) return null;        // 两边都讲得通（read / put）→ 放弃，不猜
  // 原形（主语是 I/you/we/they 时的一般现在时）
  if (['I', 'You', 'We', 'They'].includes(主语) && /^[a-z]+$/.test(rest[0])) {
    return { 标: { 句型: 'Do', 时态: '一般现在时', 主语, 谓语: rest[0], 其余: rest.slice(1).join(' ') }, 原句: 句 };
  }
  return null;
}
