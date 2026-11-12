/**
 * S2 句子训练的测试。
 *
 * 要守的只有一件事，和 S1 一样：**屏幕上每一句话都指得回课件，指不回去的一句都不许冒出来**（底线 3）。
 *
 * 这里最要紧的一条背景：**《S2基础语法课件》137 页里 182 道练习，一道答案都没给**
 * （老师在课上口头讲）。所以答案是 `src/s2-derive.ts` 按课件自己的规则推出来的。
 * 推错了就是当面给 Amos 一个假答案 —— 比少出一道题严重得多。
 *
 * 所以这个文件分四组：
 *   1. **标准答案**：课件自己印着完整答案的 12 个示范句，引擎必须**逐字复现**。
 *      这不是我写的期望值，是课件上印的字。
 *   2. **规则断言**：课件没给示范句、但白纸黑字写了规则的地方（P122 助动词表、P133 总表）。
 *   3. **必须拒绝**：引擎不许猜的地方。曾经有一条没守住，推出了 "He didn't flew to Paris."。
 *   4. **阶梯和页面**：每一步的出处标对没有、题的答案是不是真从引擎来的、脚本能不能解析。
 *
 * 这个文件只读 src/，不改它们。
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { 练习, 示范, 规则, 规则页序 } from '../src/s2-content';
import { 推导, 加ing, 还原三单, 还原过去式, type 句标, type 变换名 } from '../src/s2-derive';
import { 标注 } from '../src/s2-annotate';
import { 生成 } from '../src/s2-lesson';
import { S2_JS, S2_MOD } from '../src/s2-page';
import { S2_PAGE } from '../src/s2-shell';

const 撇 = (s: string) => s.replace(/[‘’]/g, "'");
const 源 = (f: string) => readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');

/* ══════════ 1. 标准答案：课件印着的 12 个示范句，逐字复现 ══════════ */
const 标准答案: [句标, 变换名, string][] = [
  // P124 肯定句变否定句
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'I', 谓语: 'watch', 其余: 'videos after dinner' }, '否定', 'I don’t watch videos after dinner.'],
  [{ 句型: 'Do', 时态: '一般过去时', 主语: 'I', 谓语: 'watched', 其余: 'videos yesterday' }, '否定', 'I didn’t watch videos yesterday.'],
  [{ 句型: 'Do', 时态: '现在进行时', 主语: 'I', be: 'am', 谓语: 'watching', 其余: 'videos now' }, '否定', 'I am not watching videos now.'],
  [{ 句型: 'Do', 时态: '一般将来时', 将来式: 'be going to', 主语: 'I', be: 'am', 谓语: 'watch', 其余: 'videos tomorrow' }, '否定', 'I am not going to watch videos tomorrow.'],
  // P125 肯定句变一般疑问句
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'Mr. Wang', 谓语: 'likes', 其余: 'to skateboard' }, '一般疑问', 'Does Mr. Wang like to skateboard?'],
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'He', 谓语: 'skateboards', 其余: 'every day' }, '一般疑问', 'Does he skateboard every day?'],
  [{ 句型: 'Do', 时态: '一般过去时', 主语: 'He', 谓语: 'skateboarded', 其余: 'yesterday' }, '一般疑问', 'Did he skateboard yesterday?'],
  [{ 句型: 'Do', 时态: '现在进行时', 主语: 'He', be: 'is', 谓语: 'skateboarding', 其余: 'now' }, '一般疑问', 'Is he skateboarding now?'],
  [{ 句型: 'Do', 时态: '一般将来时', 将来式: 'be going to', 主语: 'He', be: 'is', 谓语: 'skateboard', 其余: 'tomorrow' }, '一般疑问', 'Is he going to skateboard tomorrow?'],
  // P24 Be 句型
  [{ 句型: 'Be', 主语: 'That', be: 'is', 其余: 'a book' }, '否定', 'That is not a book.'],
  [{ 句型: 'Be', 主语: 'That', be: 'is', 其余: 'a book' }, '一般疑问', 'Is that a book?'],
];
// 注：P88「be going to 里的 go 合并」那三句，课件给的是陈述句的合并
// （They are going to go to the beach. → They are going to the beach.），
// **不是**疑问句。所以合并这件事放到下面「规则断言」里验，不冒充课件的标准答案。

/* ══════════ 2. 规则断言：课件写了规则但没给示范句的地方 ══════════ */
const 规则断言: [句标, 变换名, RegExp, string][] = [
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'He', 谓语: 'watches', 其余: 'videos' }, '否定', /\bdoesn['’]t\b/, '三单的助动词是 does（P122）→ doesn’t（P133）'],
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'They', 谓语: 'watch', 其余: 'videos' }, '否定', /\bdon['’]t\b/, '非三单是 do → don’t'],
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'He', 谓语: 'watches', 其余: 'videos' }, '一般疑问', /^Does\b/, '助动词提到主语前面（P133）'],
  [{ 句型: 'Do', 时态: '一般过去时', 主语: 'He', 谓语: 'watched', 其余: 'videos' }, '否定', /\bdidn['’]t\b/, '一般过去时的助动词是 did（P122）'],
  [{ 句型: 'Do', 时态: '一般将来时', 将来式: 'will', 主语: 'He', 谓语: 'go' }, '否定', /\bwon['’]t\b/, 'P133 原文就列着 won’t'],
  // 拼写层面（不是课件答案）：提到句首以后大小写不许弄错
  [{ 句型: 'Be', 主语: 'Lucy', be: 'is', 其余: 'a doctor' }, '一般疑问', /^Is Lucy\b/, '专有名词保持大写，不许写成 Is lucy'],
  [{ 句型: 'Be', 主语: 'This', be: 'is', 其余: 'a coat' }, '一般疑问', /^Is this\b/, '代词挪到 be 后面要小写'],
  // P88：be going to 里的 go 和动作里的 go 合并成一个 —— 不许写成 going to go
  [{ 句型: 'Do', 时态: '一般将来时', 将来式: 'be going to', 主语: 'They', be: 'are', 谓语: 'go', 其余: 'to the beach' }, '一般疑问', /^Are they going to the beach\?$/, 'P88 的 go 合并'],
  [{ 句型: 'Do', 时态: '一般将来时', 将来式: 'be going to', 主语: 'They', be: 'are', 谓语: 'go', 其余: 'to the beach' }, '一般疑问', /^(?!.*going to go).*$/, 'P88：不许出现 going to go'],
];

/* ══════════ 3. 必须拒绝：引擎不许猜的地方 ══════════ */
const 必须拒绝: [句标, 变换名, string][] = [
  [{ 句型: 'Do', 时态: '一般过去时', 主语: 'He', 谓语: 'flew', 其余: 'to Paris' }, '否定', 'P99 没收录 flew —— 猜了就会推出 He didn’t flew to Paris.'],
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'The glass', 谓语: 'breaks' }, '一般疑问', '主语是单数还是复数拿不准'],
  [{ 句型: 'Be', 主语: 'He', 其余: 'a doctor' }, '否定', '没给 be，不许自己填一个'],
  [{ 句型: 'Do', 时态: '一般将来时', 主语: 'He', 谓语: 'go' }, '否定', '没说是 will 还是 be going to'],
  [{ 句型: 'Be', 主语: 'He', be: 'is', 其余: 'a doctor' }, '特殊疑问', '特殊疑问要疑问词，这里没给'],
  [{ 句型: 'Do', 时态: '现在进行时', 主语: 'He', 谓语: 'watching' }, '否定', '现在进行时没给 be'],
  [{ 句型: 'Do', 时态: '现在进行时', 主语: 'He', be: 'does', 谓语: 'watching' }, '否定', 'does 不是 be 动词'],
  [{ 句型: 'Do', 时态: '一般现在时', 主语: 'He' }, '否定', '没有谓语 —— 推了会把 undefined 印到屏幕上'],
];

describe('1. 推导引擎：课件印着的示范句必须逐字复现', () => {
  it.each(标准答案)('%o 变 %s', (标, 变, 应该) => {
    expect(撇(推导(标, 变)?.答 ?? '(拒绝了)')).toBe(撇(应该));
  });

  it('12 个示范句**全部**来自 s2-content 的 示范 表，不是我另写的期望值', () => {
    const 课件给的 = 示范.map((e) => 撇(e.变));
    const 没对上 = 标准答案
      .map(([, , 应该]) => 撇(应该))
      .filter((want) => !课件给的.some((got) => got === want || got.includes(want)));
    expect(没对上).toEqual([]);
  });
});

describe('2. 规则断言：课件写了规则、没给示范句的地方', () => {
  it.each(规则断言)('%o 变 %s → %s（%s）', (标, 变, 应含, _why) => {
    const 答 = 推导(标, 变)?.答 ?? '';
    expect([答, 应含.test(答)]).toEqual([答, true]);
  });
});

describe('3. 必须拒绝：拿不准就不许出这道题', () => {
  it.each(必须拒绝)('%o 变 %s 必须回 null（%s）', (标, 变, _why) => {
    expect(推导(标, 变)).toBeNull();
  });
});

describe('4. 词形规则（P63 / P75 / P99）', () => {
  it('P99 不规则动词只认课件收录的那 16 个，表外的回 null', () => {
    expect(还原过去式('went')).toBe('go');
    expect(还原过去式('bought')).toBe('buy');
    expect(还原过去式('watched')).toBe('watch');
    expect(还原过去式('studied')).toBe('study');
    expect(还原过去式('stopped')).toBe('stop');
    expect(还原过去式('flew')).toBeNull();     // 课件没收录
    expect(还原过去式('swam')).toBeNull();
  });
  it('P63 三单还原：四条规则覆盖得到的才还原', () => {
    expect(还原三单('works')).toBe('work');
    expect(还原三单('teaches')).toBe('teach');
    expect(还原三单('studies')).toBe('study');
    expect(还原三单('goes')).toBe('go');
    expect(还原三单('has')).toBe('have');
  });
  it('P75 +ing 四条规则', () => {
    expect(加ing('read')).toBe('reading');
    expect(加ing('write')).toBe('writing');
    expect(加ing('sit')).toBe('sitting');
    expect(加ing('lie')).toBe('lying');
  });
});

describe('5. 内容文件：只读、页码指得回去', () => {
  it('规则页按 规则页序 取齐，一页不多一页不少', () => {
    const 要的 = Object.values(规则页序).flat().sort((a, b) => a - b);
    expect(规则.map((r) => r.页).sort((a, b) => a - b)).toEqual(要的);
  });
  it('每条练习都带课号和页码（屏幕上的「依据」靠它）', () => {
    expect(练习.filter((t) => !t.页 || !t.课)).toEqual([]);
  });
  it('示范句都带页码，而且「原」「变」都不是空的', () => {
    expect(示范.filter((e) => !e.页 || !e.原.trim() || !e.变.trim())).toEqual([]);
  });
  it('内容文件写明了它是第三方课程材料（将来要卖必须换掉）', () => {
    expect(源('s2-content.ts')).toContain('第三方课程材料');
  });
});

describe('6. 阶梯：每一步都指得回出处', () => {
  const 课表 = 生成();
  const 全步 = 课表.flatMap((c) => c.步);

  it('13 课都在，课号不重不漏', () => {
    expect(课表.map((c) => c.课)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it('每一步的「类」只有两种：课件原文 / 按课件规则推出 —— 没有第三种', () => {
    const 别的 = [...new Set(全步.map((s) => s.类))].filter((k) => k !== '课件原文' && k !== '按课件规则推出');
    expect(别的).toEqual([]);
  });

  // 2026-11-12 反例扫出来的洞：把推出来的答案标成「课件原文」，原来一条测试都不会红。
  // 那是**最不能错的一条** —— 标错了，Amos 会以为课件真的这么说（底线 3）。
  it('规则步只能标「课件原文」，题步只能标「按课件规则推出」—— 不许互相冒充', () => {
    const 标错 = 全步.filter((s) =>
      (s.类型 === '规则' && s.类 !== '课件原文') ||
      (s.类型 === '题' && s.类 !== '按课件规则推出'));
    expect(标错.map((s) => `P${s.页} ${s.类型} 标成了 ${s.类}`)).toEqual([]);
  });

  it('课件 182 道练习一道答案都没给 —— 所以阶梯里不许有任何一道题标成「课件原文」', () => {
    expect(全步.filter((s) => s.类型 === '题' && s.类 === '课件原文')).toEqual([]);
  });

  it('每一步的依据都带得出页码，而且那一页真的在课件抄录的范围里', () => {
    const 有的页 = new Set([...规则.map((r) => r.页), ...练习.map((t) => t.页)]);
    expect(全步.filter((s) => !有的页.has(s.页))).toEqual([]);
    expect(全步.filter((s) => !s.依据 || !s.依据.trim())).toEqual([]);
  });

  it('规则步的字**原样**出自 s2-content，一个字都不许是我写的', () => {
    const 课件字 = JSON.stringify(规则);
    const 跑题 = 全步
      .filter((s) => s.类型 === '规则')
      .filter((s) => !课件字.includes(s.大) || (s.条 ?? []).some((t) => !课件字.includes(t)));
    expect(跑题.map((s) => 'P' + s.页 + ' ' + s.大)).toEqual([]);
  });

  it('**每道题的答案都能被引擎当场重新推一遍**（不是写死在数据里的）', () => {
    const 对不上: string[] = [];
    for (const s of 全步.filter((x) => x.类型 === '题')) {
      const 原题 = 练习.find((t) => t.页 === s.页 && t.题 === s.大);
      expect([s.大, !!原题]).toEqual([s.大, true]);
      const r = 标注(原题!.题);
      expect([s.大, !!r]).toEqual([s.大, true]);
      const 变: 变换名 = s.说.includes('否定') ? '否定' : '一般疑问';
      const d = 推导(r!.标, 变);
      if (!d || d.答 !== s.答) 对不上.push(`P${s.页} ${s.大} [${变}] 数据里=${s.答} 重推=${d?.答 ?? '拒绝'}`);
    }
    expect(对不上).toEqual([]);
  });

  it('每道题的正确答案都在选项里，而且干扰项不许和答案重复', () => {
    for (const s of 全步.filter((x) => x.类型 === '题')) {
      expect([s.大, s.选!.includes(s.答!)]).toEqual([s.大, true]);
      expect([s.大, new Set(s.选).size]).toEqual([s.大, s.选!.length]);
      expect([s.大, s.选!.length]).toEqual([s.大, 3]);
    }
  });

  it('推不出答案的题一道都不许出现（课件没给答案，不替它编）', () => {
    for (const s of 全步.filter((x) => x.类型 === '题')) {
      expect([s.大, s.答 && s.答.length > 0]).toEqual([s.大, true]);
      expect([s.大, /undefined|null|NaN/.test(s.答!)]).toEqual([s.大, false]);
    }
  });
});

describe('7. 页面：脚本能解析、不花钱、不写一句语法讲解', () => {
  it('S2_JS 能解析（模板字符串里混进 TS 语法会整页崩，Marketing 栽过两次）', () => {
    expect((() => { try { new Function(S2_JS); return ''; } catch (e) { return (e as Error).message; } })()).toBe('');
  });
  it('模板字符串里没有 TS 语法、没有裸反引号', () => {
    expect(S2_JS).not.toMatch(/\bas any\b|\bas unknown\b|\binterface\b|\btype \w+ =/);
    expect(S2_JS).not.toMatch(/`/);
  });
  it('整页不发任何请求、不调 AI、不读数据库 —— 一分钱都不花（C117）', () => {
    const js = S2_JS;
    expect(js).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|env\.AI|\bDB\b/);
  });
  it('一个 <input> 都没有（和「跟我做」一样，点就行，不打字）', () => {
    expect(S2_MOD).not.toMatch(/<input/i);
    expect(S2_PAGE).not.toMatch(/<input/i);
  });
  it('整页里凡是讲语法的句子，都能在 s2-content 或推导结果里找到', () => {
    const 允许 = JSON.stringify(规则) + JSON.stringify(练习) + JSON.stringify(生成());
    // 页面源码里出现的中文长句（≥12 字）必须要么是界面用语白名单，要么出自内容
    const 界面用语 = ['看这一条，记住它。', '把它变成否定句。', '把它变成一般疑问句。',
      '这一课课件里没有能出成题的内容。', '课件这一课全是空格练习，一道答案都没给 —— 不替它编。换一课。',
      '这个不对。按课件那条规则再看一遍：', '再看一遍规则，重选', '记住了，下一步',
      '13 课 · 一屏一步 · 每一句都标出处'];
    // 注释不会出现在屏幕上，先去掉，否则会把 /* 课的卡片：13 门，点一下换课… */ 当成页面文案
    const 去注释 = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const 句 = 去注释(S2_MOD + S2_JS.slice(S2_JS.indexOf('var s2 ='))).match(/[一-龥][一-龥，。、：—·\s]{11,}/g) ?? [];
    const 跑题 = [...new Set(句.map((x) => x.trim()))]
      .filter((x) => !界面用语.some((u) => u.includes(x) || x.includes(u)))
      .filter((x) => !允许.includes(x));
    expect(跑题).toEqual([]);
  });
});
