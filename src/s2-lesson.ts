/* S2 阶梯：13 课，每课「先过规则，再做题」—— 这是课件自己的顺序
 * （每课的页序就是 Shall We Start? → Let's Move On → Learning Tip → 练习 → Homework）。
 *
 * 屏幕上出现的每一句话，只能是三种来源之一：
 *   课件原文        —— 逐字抄的规则、口诀、公式
 *   按课件规则推出  —— 用 P63/P75/P99/P122/P133 的规则推出来的答案
 *   界面用语        —— 「下一步」这种按钮字
 * 没有第四种。**不许我自己写一句语法讲解。**
 */
import { 推导, 疑问词表, 特殊疑问公式, 助动词表, type 句标, type 变换名 } from './s2-derive';
import { 标注 } from './s2-annotate';
import { 规则 as 规则源, 练习 as 练习源, 规则页序, type 规则页 } from './s2-content';

/** 屏幕上的一步。`类` 说明这句话是课件原文还是推出来的 —— 删了就没法向 Amos 交代。 */
export interface 步 {
  课: number;
  页: number;
  类型: '规则' | '题';
  说: string;
  大: string;
  条?: string[];
  表?: 规则页['表格'];
  选?: string[];
  答?: string;
  依据: string;
  类: '课件原文' | '按课件规则推出';
}
export interface 课 { 课: number; 名: string; 步: 步[] }

/** 课件里我们用到的那些页，拼成和抄录同形的结构（运行时不读文件：Worker 里没有 fs） */
const 课件 = [
  ...规则源.map((r) => ({ 课: r.课, 页: r.页, 标题: r.标题, 正文: r.正文, 表格: r.表格, 练习: [] as { 题: string; 要求: string }[] })),
  ...练习源.map((t) => ({ 课: t.课, 页: t.页, 标题: '', 正文: [] as string[], 表格: null, 练习: [{ 题: t.题, 要求: t.要求 }] })),
];
const 页 = (n: number) => 课件.find((x) => x.页 === n);

/* 每课挑出来当「规则」讲的页 —— 我逐页看过，只收有明确规则的那些，不是整课倒出来 */
const 规则页 = 规则页序;

/* 这一页上真正要他记住的那几行。过滤掉标题和装饰字，不改一个字。 */
function 要点(p: { 标题?: string; 正文?: string[] }): string[] {
  const 标题 = (p.标题 || '').trim();
  const 装饰 = /^(Shall We Start\?|Let's Move On|Learning Tip|Let's Review|Let's Transform ?!|Let's Start|Target|Homework|思维挪移)$/i;
  return (p.正文 || [])
    .map((s: string) => String(s).trim())
    .filter((s: string) => s && s !== 标题 && !装饰.test(s) && s.length >= 6 && !/^[A-Za-z ]{1,12}$/.test(s));
}

function 规则步(课: number): 步[] {
  const out: 步[] = [];
  for (const n of 规则页[课] || []) {
    const p = 页(n);
    if (!p) continue;
    let 行 = 要点(p);
    if (!行.length) continue;
    // "Shall We Start?" "Let's Move On" "Learning Tip" 是幻灯片的装饰字，不是标题。
    // 碰到这种就把第一条正文提上来当标题，省得屏幕上写着一句没有意义的话。
    const 装饰标题 = /^(Shall We Start\?|Let's Move On|Learning Tip|Let's Review|Let's Transform ?!|Let's Start|Target)$/i;
    let 大 = (p.标题 || '').trim();
    if (!大 || 装饰标题.test(大)) { 大 = 行[0]; 行 = 行.slice(1); }
    // 表格里的字和正文完全重复就不摆两遍
    const 表字 = JSON.stringify(p.表格 || '');
    const 重复 = !!p.表格 && 行.length > 0 && 行.every((l: string) => 表字.includes(l));
    out.push({
      课, 页: n, 类型: '规则',
      说: '看这一条，记住它。',
      大,
      条: 重复 ? [] : 行,
      表: p.表格 || null,
      依据: `课件原文（第 ${课} 课 · 第 ${n} 页）`,
      类: '课件原文',
    });
  }
  return out;
}

/* 干扰项：从课件规则里取**错在点子上**的那种，不是随便拼 */
function 干扰(答: string, 标: 句标, 变: 变换名, 原句: string): string[] {
  const 错 = new Set<string>();
  if (变 === '否定') {
    if (/ doesn[''’]t /.test(答)) 错.add(答.replace(/doesn[''’]t/, "don't"));
    if (/ don[''’]t /.test(答)) 错.add(答.replace(/don[''’]t/, "doesn't"));
    if (/ didn[''’]t /.test(答)) 错.add(答.replace(/didn[''’]t/, "don't"));
    // 最常见的错：助动词没放对位置，直接在动词后面加 not
    const 直加 = 标.谓语 ? 答.replace(/\s(doesn|don|didn|won)[''’]t\s(\w+)/, ' $2 not') : null;
    if (直加 && 直加 !== 答) 错.add(直加);
  } else if (变 === '一般疑问') {
    const m = 答.match(/^(Does|Do|Did|Will|Am|Is|Are)\s/);
    if (m) {
      const 换 = ({ Does: 'Do', Do: 'Does', Did: 'Do', Will: 'Do', Am: 'Is', Is: 'Are', Are: 'Is' } as Record<string, string>)[m[1]];
      错.add(换 + 答.slice(m[1].length));
    }
    // 最典型的错：助动词根本没提到前面，只在句尾加个问号。
    // **用原句整句**，别自己按字段拼 —— 拼会掉词（曾经拼出 "Mary is with her grandpa?"，丢了 talking）
    错.add(String(原句).replace(/\s*\.?\s*$/, '') + '?');
  }
  return [...错].map((s: string) => s.replace(/\s+/g, ' ').trim()).filter((s) => s && s !== 答).slice(0, 2);
}

function 题步(课: number): 步[] {
  const out: 步[] = [];
  for (const p of 课件.filter((x) => x.课 === 课)) {
    for (const t of p.练习 || []) {
      const r = 标注(t.题);
      if (!r) continue;                         // 标不出来就不出这道题
      for (const 变 of ['否定', '一般疑问'] as 变换名[]) {
        const d = 推导(r.标, 变);
        if (!d) continue;                       // 推不出来就不出这道题
        const 错 = 干扰(d.答, r.标, 变, r.原句);
        if (错.length < 2) continue;            // 凑不出两个像样的干扰项就不出
        out.push({
          课, 页: p.页, 类型: '题',
          说: 变 === '否定' ? '把它变成否定句。' : '把它变成一般疑问句。',
          大: r.原句,
          选: [d.答, ...错],
          答: d.答,
          依据: `${d.依据}（课件第 133 页「句式变化总结」）`,
          类: d.类,
        });
      }
    }
  }
  return out;
}

export function 生成(): 课[] {
  const 课表: 课[] = [];
  for (let 课 = 1; 课 <= 13; 课++) {
    const 步 = [...规则步(课), ...题步(课)];
    课表.push({ 课, 名: (页(规则页[课]?.[0] ?? 1)?.标题) || '', 步 });
  }
  return 课表;
}

export const 速查 = { 助动词表, 疑问词表, 特殊疑问公式 };

