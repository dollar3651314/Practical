/**
 * 「跟我做」那条教学阶梯（src/pron-lesson.ts）本身的测试。
 *
 * 这个文件是**页面的契约**：页面上每一句关于"这个音怎么发"的话都出自它，所以它要守的只有一件事 ——
 * **每一句都指得回课件原文，课件没写的一句都不许冒出来**（底线 3）。
 *
 * 守六件事：
 *   1. `动作表` 覆盖得全：`GROUPS` 里每一条 `mouth` 原文都有键（漏一条，那一步就凭空消失）；
 *      反过来表里不许有课件没出现过的键（那是编的）。
 *   2. 标了 `课件原文` 的依据，必须真的能在 src/pron-content.ts 里找到。
 *   3. `拆音标` 只切有把握的：带长音符 ː、重音号、括号的一律回 null（切错一个音比不切伤害大）。
 *   4. `逆读`：句末标点留在句末；两句话的绕口令（第 7 组）**不许串句**。
 *   5. 第 7 组课件一条口型都没给 → 那一步**不许说"保持这个口型"**。
 *   6. 四级顺序就是课程写的那四级，每一组都走完这四级。
 *
 * **这个测试不改 src/pron-lesson.ts，也不改 src/pron-content.ts，只读它们。**
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GROUPS } from '../src/pron-content';
import { 动作表, 剥壳, 拆音标, 逆读, 级, LESSON, stepsOf, type Step } from '../src/pron-lesson';
import { wordId } from '../src/pron';
import { ROOT } from './helpers';

/** 课件里出现过的全部口型定位原文（七组 × 两个音） */
const 课件口型 = [...new Set(GROUPS.flatMap((g) => [...g.a.mouth, ...g.b.mouth]))];
const 课件原文 = readFileSync(path.join(ROOT, 'src/pron-content.ts'), 'utf8');

describe('1. 动作表：课件写过的每一条口型都有归宿，课件没写的一条都不许有', () => {
  it('**每一条 `mouth` 原文都在动作表里有键**（漏一条，那一步就凭空消失）', () => {
    const 漏 = 课件口型.filter((m) => !(m in 动作表));
    expect(漏).toEqual([]);
  });

  it('**动作表里不许有课件没出现过的键**（那种键只能是编的）', () => {
    const 多 = Object.keys(动作表).filter((k) => !课件口型.includes(k));
    expect(多).toEqual([]);
  });

  it('每一条动作都是一句**能照着做**的祈使句，不是"用心体会"', () => {
    for (const [原文, a] of Object.entries(动作表)) {
      expect([原文, a.说.length > 0]).toEqual([原文, true]);
      expect([原文, /[。！]$/.test(a.说)]).toEqual([原文, true]);
      for (const 空 of ['用心', '体会', '感受一下', '大概']) expect([原文, 空, a.说.includes(空)]).toEqual([原文, 空, false]);
    }
  });

  it('嘴外面看不见的那几条（声带、气流、"像哪个中文字"）标了 `看不见`，别的没标', () => {
    const 看不见 = Object.keys(动作表).filter((k) => 动作表[k].看不见);
    expect(看不见.sort()).toEqual(['发音似「日」', '发音似「知」', '声带振动', '振动声带', '气流从舌侧流出', '气流从鼻腔流出', '送气不发声'].sort());
  });
});

describe('2. 每一步的依据：标了「课件原文」就必须真的是课件原文', () => {
  const 全部步 = GROUPS.flatMap((g) => stepsOf(g).map((s) => [g.id, s] as [string, Step]));

  it('每一步都有 `说`、`依据`、`类` 三样，一样都不许空', () => {
    for (const [id, s] of 全部步) {
      expect([id, s.说.length > 0]).toEqual([id, true]);
      expect([id, s.依据.length > 0]).toEqual([id, true]);
      expect([id, ['课件原文', '课程练法', '机械拆分'].includes(s.类)]).toEqual([id, true]);
    }
  });

  // 唯一一条**不是逐字引用**的依据：它说的是"这两个音的这几条口型定位写的一样"——
  // 那是对课件的一句陈述，不是课件里的一串字。下面单独核它说得对不对。
  const 一样的那句 = '课件原文：两个音的这几条口型定位写的一样';

  it('**标了「课件原文」的那几步，依据里引的那段在 src/pron-content.ts 里真的找得到**', () => {
    const 坏: unknown[] = [];
    for (const [id, s] of 全部步) {
      if (s.类 !== '课件原文' || s.依据 === 一样的那句) continue;
      // 依据写成「课件原文：<原文>」或「课件原文词与音标：<词> <音标>」；冒号后面那一段必须是课件里真有的
      const 引 = s.依据.slice(s.依据.indexOf('：') + 1).trim();
      // 「/e/ 中咧嘴」「bed [bed]」这种是两段拼的，拆开逐段核
      for (const x of 引.split(/\s+/).filter(Boolean)) if (!课件原文.includes(x)) 坏.push([id, s.依据, x]);
    }
    expect(坏).toEqual([]);
  });

  it('那句"这几样和刚才一样"**说的是真的**：它点名的每一条，课件里两个音真的都写了', () => {
    let 出现 = 0;
    for (const g of GROUPS) {
      for (const s of stepsOf(g)) {
        if (s.依据 !== 一样的那句) continue;
        出现++;
        // 说里点名的那几条，必须同时出现在 a 和 b 的 mouth 里
        const 点名 = s.说.replace(/^.*?：/, '').replace(/。$/, '').split('、');
        for (const m of 点名) {
          expect([g.id, m, g.a.mouth.includes(m)]).toEqual([g.id, m, true]);
          expect([g.id, m, g.b.mouth.includes(m)]).toEqual([g.id, m, true]);
        }
      }
      // 两个音一条共同口型都没有的组，根本不会生出这一步
      const 共同 = g.a.mouth.filter((m) => g.b.mouth.includes(m));
      expect([g.id, stepsOf(g).some((s) => s.依据 === 一样的那句)]).toEqual([g.id, 共同.length > 0]);
    }
    expect(出现).toBeGreaterThan(0);
  });

  it('「课程练法」那几步**自己说明是现搭的**，不冒充课件原例（底线 3）', () => {
    const 拼 = GROUPS.flatMap((g) => stepsOf(g)).filter((s) => s.lv === 1);
    expect(拼.length).toBeGreaterThan(0);
    for (const s of 拼) {
      expect(s.类).toBe('课程练法');
      expect(s.依据).toContain('音素拼合');
      expect(s.依据).toContain('不是课件原例');
    }
  });

  it('第 3 级每一步都挂着这一组自己的词编号（🔊 和 🎤 用的是同一套编号）；不能纠说的词不给 🎤', () => {
    for (const g of GROUPS) {
      const 读 = stepsOf(g).filter((s) => s.lv === 2);
      expect([g.id, 读.length]).toEqual([g.id, g.pairs.length * 2]);
      读.forEach((s, n) => {
        const i = Math.floor(n / 2);
        const k = n % 2 === 0 ? 'a' : 'b';
        expect([g.id, n, s.音]).toEqual([g.id, n, wordId(g, i, k as 'a' | 'b')]);
        // asr: false 的词（ketch、reen、roose、rove）**不给 🎤**，拿它们判对错是冤枉人
        expect([g.id, n, s.麦 ?? null]).toEqual([g.id, n, g.pairs[i][k as 'a' | 'b'].asr ? wordId(g, i, k as 'a' | 'b') : null]);
      });
    }
  });
});

describe('3. 拆音标：只切有把握的，拿不准一律不切', () => {
  it('纯单字符音素的短词切得开（课程原例 [t–ɪ–p] tip 那个形状）', () => {
    expect(拆音标('[bed]')).toEqual(['b', 'e', 'd']);
    expect(拆音标('[bæd]')).toEqual(['b', 'æ', 'd']);
    expect(拆音标('[pet]')).toEqual(['p', 'e', 't']);
  });

  it('**带长音符 ː、重音号、括号的一律回 null**（切错一个音比不切伤害大得多）', () => {
    for (const x of ['[biː]', '[luːs]', "['leðə(r)]", "['feri]", '[tʃeɪn(d)ʒ]', '[l(j)ʊə]', "['vɪʒ(ə)n]"])
      expect([x, 拆音标(x)]).toEqual([x, null]);
  });

  it('太短、太长、含双字符音素的也不切（宁可让他照着整串拼）', () => {
    expect(拆音标('[e]')).toBe(null);          // 一个音没什么好拆
    expect(拆音标('[ketʃ]')).toBe(null);       // ʃ 不在单字符音素表里
    expect(拆音标('[dʒʌst]')).toBe(null);      // dʒ 是一个音，切开就错了
    expect(剥壳('[bed]')).toBe('bed');
    expect(剥壳("['leðə(r)]")).toBe('leðə(r)');
  });

  it('切得开的那几步标「机械拆分」，切不开的照实说"照着音标拼"并标「课件原文」', () => {
    for (const g of GROUPS) {
      for (const s of stepsOf(g).filter((x) => x.lv === 2)) {
        if (s.类 === '机械拆分') {
          expect([g.id, s.说]).toEqual([g.id, '按音标一个音一个音拼出来，拼完再整个念一遍。']);
          expect([g.id, (s.大 ?? '').includes('–')]).toEqual([g.id, true]);
        } else {
          expect([g.id, s.类]).toEqual([g.id, '课件原文']);
          expect([g.id, s.提示 ?? '']).toEqual([g.id, expect.stringContaining('拆开反而会拆错')]);
        }
      }
    }
  });
});

describe('4. 反向逆读：句末标点留在句末，两句话的不许串句', () => {
  it('一句话：词序倒过来，**句号还在句末**（不许跟着最后一个词跑到最前面）', () => {
    expect(逆读('Ann sent Andy ten hens and Andy sent Ann ten pens.'))
      .toBe('pens ten Ann sent Andy and hens ten Andy sent Ann.');
    expect(逆读('No need to light a night light on a light night like tonight.'))
      .toBe('tonight like night light a on light night a light to need No.');
    // 句号跟着最后一个词跑到最前面是这条最容易出的错（"pens. ten Ann…"）——这里钉死不许发生
    for (const g of GROUPS) expect([g.id, /^[.!?]/.test(逆读(g.twister).replace(/^\S+/, ''))]).toEqual([g.id, false]);
  });

  it('**第 7 组是两句话：逐句倒，不许把两句串成一句**', () => {
    const t = GROUPS[6].twister;
    expect(t).toBe('Eat at pleasure, drink with measure. Every Jack shall have his Jill.');
    // 串句的话会变成「Jill his have shall Jack Every measure with …」——第二句的词跑到第一个句号前面去
    // （两句中间多出来的那个空格是无害的：HTML 会把连续空白收成一个）
    expect(逆读(t)).toBe('measure with drink pleasure, at Eat.  Jill his have shall Jack Every.');
    const 两句 = 逆读(t).split('.').map((x) => x.trim()).filter(Boolean);
    expect(两句.length).toBe(2);
    // 第一句倒出来的词，只能来自原文第一句；第二句同理（这就是"不串句"）
    expect(两句[0].split(/\s+/).sort()).toEqual('Eat at pleasure, drink with measure'.split(/\s+/).sort());
    expect(两句[1].split(/\s+/).sort()).toEqual('Every Jack shall have his Jill'.split(/\s+/).sort());
  });

  it('七组的绕口令倒读之后，**每一句的词一个不多一个不少**（只是顺序反了）', () => {
    for (const g of GROUPS) {
      const 词 = (s: string) => s.replace(/[.!?,]/g, ' ').split(/\s+/).filter(Boolean).sort();
      expect([g.id, 词(逆读(g.twister))]).toEqual([g.id, 词(g.twister)]);
    }
  });
});

describe('5. 课件没写的，一句都不许冒出来（底线 3）', () => {
  it('**第 7 组课件一条口型都没给 → 那一步不许说"保持这个口型"**，而且照实说没法对着镜子做', () => {
    const 步 = stepsOf(GROUPS[6]);
    const 发音步 = 步.filter((s) => s.lv === 0 && !!s.大);
    expect(发音步.length).toBe(2);
    for (const s of 发音步) {
      expect(s.说).toBe('现在发这个音。');
      expect(s.说).not.toContain('保持这个口型');
      expect(s.提示 ?? '').toContain('没有口型定位');
      expect(s.提示 ?? '').toContain('没法对着镜子做');
    }
  });

  it('课件给了看得见的口型的组（第 1 组）才说"保持这个口型"', () => {
    const s = stepsOf(GROUPS[0]).filter((x) => x.lv === 0 && !!x.大);
    expect(s.map((x) => x.说)).toEqual(['保持这个口型，发这个音。', '保持这个口型，发这个音。']);
  });

  it('每一组第 1 级的动作步数，正好等于课件给了动作的那几条口型（不多生一步、不少生一步）', () => {
    for (const g of GROUPS) {
      const 共同 = g.a.mouth.filter((m) => g.b.mouth.includes(m));
      // a 的全部动作 + b 里**不和 a 重复**的动作 + 两句"发这个音" +（有共同项时）一句"这几样不变"
      const 应有 = g.a.mouth.length + g.b.mouth.filter((m) => !共同.includes(m)).length + 2 + (共同.length ? 1 : 0);
      expect([g.id, stepsOf(g).filter((s) => s.lv === 0).length]).toEqual([g.id, 应有]);
    }
  });
});

describe('6. 四级就是课程写的那四级，七组都走完', () => {
  it('四级的名字和顺序照抄课程练法原文', () => {
    expect([...级]).toEqual(['单音', '音素拼合', '单词拼读', '句子和绕口令']);
  });

  it('每一组都走完四级，而且 lv 是不回头的（1 → 2 → 3 → 4，不来回跳）', () => {
    for (const g of GROUPS) {
      const lv = stepsOf(g).map((s) => s.lv);
      expect([g.id, [...new Set(lv)]]).toEqual([g.id, [0, 1, 2, 3]]);
      for (let i = 1; i < lv.length; i++) expect([g.id, i, lv[i] >= lv[i - 1]]).toEqual([g.id, i, true]);
    }
  });

  it('第 4 级就是课件那句绕口令 + 三最法、反向逆读法（都是课程写明的练法）', () => {
    for (const g of GROUPS) {
      const 末 = stepsOf(g).filter((s) => s.lv === 3);
      expect([g.id, 末.length]).toEqual([g.id, 2]);
      expect([g.id, 末[0].大]).toEqual([g.id, g.twister]);
      expect([g.id, 末[0].依据]).toEqual([g.id, expect.stringContaining('三最法')]);
      expect([g.id, 末[1].大]).toEqual([g.id, 逆读(g.twister)]);
      expect([g.id, 末[1].依据]).toEqual([g.id, expect.stringContaining('反向逆读法')]);
    }
  });

  it('LESSON 就是七组的阶梯，组号和 src/pron-content.ts 对得上（页面一次拿走）', () => {
    expect(LESSON.map((x) => x.组)).toEqual(GROUPS.map((g) => g.id));
    expect(LESSON.map((x) => x.课)).toEqual(GROUPS.map((g) => g.lesson));
    expect(LESSON.map((x) => x.名字)).toEqual(GROUPS.map((g) => g.a.ipa + ' vs ' + g.b.ipa));
    for (const x of LESSON) expect([x.组, x.步.length > 0]).toEqual([x.组, true]);
  });
});
