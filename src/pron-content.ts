/**
 * 「发音训练」的内容：Amos 那套课程 S1 阶段**第 10 课（易错元音）和第 11 课（易错辅音）**的七组对立。
 *
 * **来源**：他 2026-11-11 上传的 `S1 语音课 16 节课件`（Top Speaker 语音课 / 激进学人）。
 * 主会话从 pptx 里逐张抽出来录入，**口型定位、对比词、绕口令都是课件原文**，一个字没改写。
 * 课程原材料不进仓库（第三方课程材料），只录入这七组练习本身；摘要和出处见 agents
 * 《项目/Practical/方法-四阶段英语学习法.md》。
 *
 * ⚠️ **这是别人的课程材料**。Amos 自己学、自己用没问题；**如果以后要做成产品卖，这些对比词和绕口令
 * 必须换成自己的内容**（2026-11-11 已当面跟他说过）。
 *
 * **两个标记位，别混用**（底线 3：能做什么说什么）：
 *  - `minimal`：这一对是不是**真正的最小对立对**（只差一个音素）。**只有 true 的才能拿来做听辨**
 *    （放一段音让他二选一）。false 的两个词差不止一个音，听辨题会变成"认词"而不是"辨音"。
 *  - `asr`：这个词能不能拿来做**纠说**（他念、机器听）。课件里有几个词不是现代常用词
 *    （`ketch` 帆船、`reen` 方言、`roose` 古语、`rove` 不常用），**whisper 基本不会输出它们**，
 *    拿它们判"你念对了没有"等于冤枉人，所以标 false。
 *
 * **第 7 组（/ʒ/ vs /dʒ/）一对最小对立对都没有** —— 课件给的 vision/just、measure/judge 这些
 * 本来就只是各自的例词，不是成对的。英语里这个对立的常见最小对立对极少。
 * 所以**第 7 组只能做跟读和纠说，做不了听辨**，页面上要照实说，不许硬凑。
 */

/** 一个音：课件给的中文外号 + 唇齿舌口型定位（逐条原文） */
export interface PronSound { ipa: string; nick: string; mouth: string[] }
export interface PronWord { word: string; ipa: string; asr: boolean }
export interface PronPair { a: PronWord; b: PronWord; minimal: boolean }
export interface PronGroup {
  id: string;
  lesson: 10 | 11;
  kind: '元音' | '辅音';
  a: PronSound;
  b: PronSound;
  pairs: PronPair[];
  /** 课件的「绕口令挑战」：过关之后给他，自己用三最法读 */
  twister: string;
}

const w = (word: string, ipa: string, asr = true): PronWord => ({ word, ipa, asr });

export const GROUPS: PronGroup[] = [
  {
    id: 'g1', lesson: 10, kind: '元音',
    a: { ipa: '/e/', nick: '中咧嘴', mouth: ['咧嘴', '上下齿距离为 1cm 左右（可容纳一根食指）', '舌头平躺抵下齿'] },
    b: { ipa: '/æ/', nick: '大咧嘴', mouth: ['咧嘴', '上下齿距离为 2cm 左右（可容纳两根食指）', '舌头平躺抵下齿'] },
    pairs: [
      { a: w('bed', '[bed]'), b: w('bad', '[bæd]'), minimal: true },
      { a: w('pet', '[pet]'), b: w('pat', '[pæt]'), minimal: true },
      { a: w('ketch', '[ketʃ]', false), b: w('catch', '[kætʃ]'), minimal: true },
      { a: w('leather', "['leðə(r)]"), b: w('ladder', "['lædə(r)]"), minimal: true },
    ],
    twister: 'Ann sent Andy ten hens and Andy sent Ann ten pens.',
  },
  {
    id: 'g2', lesson: 10, kind: '元音',
    a: { ipa: '/eɪ/', nick: '嘴角咧到耳朵上音', mouth: ['扁平咧嘴', '上下齿由微张后慢慢闭合', '舌头平躺抵下齿'] },
    b: { ipa: '/iː/', nick: '长一音', mouth: ['扁平咧嘴', '上下齿距离几乎为 0', '舌头平躺抵下齿'] },
    pairs: [
      { a: w('bay', '[beɪ]'), b: w('bee', '[biː]'), minimal: true },
      { a: w('rain', '[reɪn]'), b: w('reen', '[riːn]', false), minimal: true },
      { a: w('change', '[tʃeɪn(d)ʒ]'), b: w('cheese', '[tʃiːz]'), minimal: false },
      { a: w('Jane', '[dʒeɪn]'), b: w('jean', '[dʒiːn]'), minimal: true },
    ],
    twister: 'You cannot see the rain and say reen.',
  },
  {
    id: 'g3', lesson: 10, kind: '元音',
    a: { ipa: '/aɪ/', nick: '大嘴阿姨音', mouth: ['先张嘴后咧嘴', '上下齿张开后慢慢闭合', '舌头平躺抵下齿'] },
    b: { ipa: '/æ/', nick: '大咧嘴', mouth: ['咧嘴', '上下齿距离为 2cm 左右（可容纳两根食指）', '舌头平躺抵下齿'] },
    pairs: [
      { a: w('bite', '[baɪt]'), b: w('bat', '[bæt]'), minimal: true },
      { a: w('like', '[laɪk]'), b: w('lack', '[læk]'), minimal: true },
      { a: w('side', '[saɪd]'), b: w('sad', '[sæd]'), minimal: true },
      { a: w('fight', '[faɪt]'), b: w('fat', '[fæt]'), minimal: true },
    ],
    twister: 'Dad says a rat is biting a fat bat.',
  },
  {
    id: 'g4', lesson: 11, kind: '辅音',
    a: { ipa: '/f/', nick: '清辅音', mouth: ['上齿轻咬下唇', '送气不发声'] },
    b: { ipa: '/v/', nick: '浊辅音', mouth: ['上齿轻咬下唇', '声带振动'] },
    pairs: [
      { a: w('ferry', "['feri]"), b: w('very', "['veri]"), minimal: true },
      { a: w('father', "['fɑːðə(r)]"), b: w('vase', '[vɑːz]'), minimal: false },
      { a: w('fat', '[fæt]'), b: w('valid', "['vælɪd]"), minimal: false },
      { a: w('fair', '[feə(r)]'), b: w('vary', "['veri]"), minimal: false },
    ],
    twister: 'My father has bought five kinds of vegetables for dinner.',
  },
  {
    id: 'g5', lesson: 11, kind: '辅音',
    a: { ipa: '/l/', nick: '舌边音', mouth: ['舌尖轻抵上齿龈', '振动声带'] },
    b: { ipa: '/r/', nick: '卷舌音', mouth: ['舌尖向上腾空卷起', '振动声带'] },
    pairs: [
      { a: w('light', '[laɪt]'), b: w('right', '[raɪt]'), minimal: true },
      { a: w('look', '[lʊk]'), b: w('rook', '[rʊk]', false), minimal: true },
      { a: w('love', '[lʌv]'), b: w('rove', '[rəʊv]', false), minimal: false },
      { a: w('loose', '[luːs]'), b: w('roose', '[ruːs]', false), minimal: true },
    ],
    twister: 'Larry took the ruler on the right and ran out.',
  },
  {
    id: 'g6', lesson: 11, kind: '辅音',
    a: { ipa: '/n/', nick: '鼻音', mouth: ['舌尖轻抵上齿龈', '气流从鼻腔流出', '振动声带'] },
    b: { ipa: '/l/', nick: '舌边音', mouth: ['舌尖轻抵上齿龈', '气流从舌侧流出', '声带振动'] },
    pairs: [
      { a: w('night', '[naɪt]'), b: w('light', '[laɪt]'), minimal: true },
      { a: w('no', '[nəʊ]'), b: w('low', '[ləʊ]'), minimal: true },
      { a: w('new', '[njuː]'), b: w('lure', '[l(j)ʊə]'), minimal: false },
      { a: w('knife', '[naɪf]'), b: w('life', '[laɪf]'), minimal: true },
    ],
    twister: 'No need to light a night light on a light night like tonight.',
  },
  {
    id: 'g7', lesson: 11, kind: '辅音',
    a: { ipa: '/ʒ/', nick: '浊辅音，发音似「日」', mouth: ['发音似「日」', '声带振动'] },
    b: { ipa: '/dʒ/', nick: '浊辅音，发音似「知」', mouth: ['发音似「知」', '声带振动'] },
    // ⚠️ 这一组课件给的本来就是各自的例词，不是成对的 —— 一对最小对立对都没有，所以**做不了听辨**。
    pairs: [
      { a: w('vision', "['vɪʒ(ə)n]"), b: w('just', '[dʒʌst]'), minimal: false },
      { a: w('measure', "['meʒə(r)]"), b: w('judge', '[dʒʌdʒ]'), minimal: false },
      { a: w('pleasure', "['pleʒə(r)]"), b: w('edge', '[edʒ]'), minimal: false },
      { a: w('leisure', "['leʒə(r)]"), b: w('huge', '[hjuːdʒ]'), minimal: false },
    ],
    twister: 'Eat at pleasure, drink with measure. Every Jack shall have his Jill.',
  },
];

/** 能做听辨的对（真最小对立对）。第 7 组一对都没有，`groupsForEar()` 会把它整组排除。 */
export const minimalPairsOf = (g: PronGroup): PronPair[] => g.pairs.filter((p) => p.minimal);
/** 能做纠说的词（真实常用词，whisper 认得出来） */
export const asrWordsOf = (g: PronGroup): PronWord[] =>
  g.pairs.flatMap((p) => [p.a, p.b]).filter((x) => x.asr);
/** 有听辨题的组 */
export const groupsForEar = (): PronGroup[] => GROUPS.filter((g) => minimalPairsOf(g).length > 0);
