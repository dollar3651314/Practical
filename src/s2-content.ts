/* S2 课件内容 —— 从 Amos 的《S2基础语法课件》（137 页 PDF，13 课，讲师 Kelson）逐页抄出来的。
 *
 * **这是第三方课程材料。** Amos 2026-11-12：「只有我自己在用，所以没有问题」。
 * 一旦这套东西要对外卖，这个文件必须整个换掉。
 *
 * 一个字都不许改。要改就是改课件，那不是我们能做的事。
 * 页码（`页`）是屏幕上「依据」那一行的出处，删了就没法交代某句话是哪来的。
 *
 * 一个事实先摆在这儿：**课件里 182 道练习，一道答案都没有**（老师在课上口头讲）。
 * 所以答案由 s2-derive.ts 按课件自己的规则推，标「按课件规则推出」，不冒充「课件原文」。
 */

export interface 规则页 { 课: number; 页: number; 标题: string; 正文: string[]; 表格: { 表头: string[]; 行: string[][] } | null }
export interface 练习题 { 课: number; 页: number; 题: string; 要求: string }
/** 课件自己印着完整答案的示范句 —— 推导引擎的标准答案，少一条都不许删 */
export interface 示范句 { 页: number; 原: string; 变: string; 怎么变: string }

export const 规则: 规则页[] = [
 {
  "课": 1,
  "页": 3,
  "标题": "Shall We Start?",
  "正文": [
   "Shall We Start?",
   "静态",
   "动态",
   "Be 句型用来描述单个物体的静态性质或者物体与物体之间的静态关系",
   "Do 句型用来描述单个物体的动态性质或者物体与物体之间的动态关系"
  ],
  "表格": {
   "表头": [
    "静态",
    "动态"
   ],
   "行": [
    [
     "Be 句型用来描述单个物体的静态性质或者物体与物体之间的静态关系",
     "Do 句型用来描述单个物体的动态性质或者物体与物体之间的动态关系"
    ]
   ]
  }
 },
 {
  "课": 1,
  "页": 4,
  "标题": "Let's Move On",
  "正文": [
   "Let's Move On",
   "Be 句型（静态）的三种用法",
   "主语 + Be +",
   "1. 名词 — 表达“主语”是“ XXX ”",
   "2. 形容词 —— 表达“主语”是“怎么样的”",
   "3. 方位介词 + 地点名词 — 表达“主语”是“在哪里”"
  ],
  "表格": {
   "表头": [
    "主语 + Be +",
    "用法"
   ],
   "行": [
    [
     "",
     "1. 名词 — 表达“主语”是“ XXX ”"
    ],
    [
     "",
     "2. 形容词 —— 表达“主语”是“怎么样的”"
    ],
    [
     "",
     "3. 方位介词 + 地点名词 — 表达“主语”是“在哪里”"
    ]
   ]
  }
 },
 {
  "课": 1,
  "页": 5,
  "标题": "Learning Tip",
  "正文": [
   "Learning Tip",
   "Be动词口诀：我用am，你用are，is连着他她它，单数主语用is，复数主语全用are"
  ],
  "表格": null
 },
 {
  "课": 1,
  "页": 7,
  "标题": "思维挪移",
  "正文": [
   "思维挪移",
   "句型框架",
   "替换句子中的成分",
   "举一反三，有一句话造出千百句话"
  ],
  "表格": null
 },
 {
  "课": 2,
  "页": 14,
  "标题": "Let's Start —— 句式分类",
  "正文": [
   "Let's Start —— 句式分类",
   "陈述句",
   "陈述句是表达一种事实或者说话人的看法。它包括 肯定句 和 否定句 两种。陈述句在书写时句末用句号，在朗读时用降调",
   "一般疑问句",
   "一般疑问句是用 yes 或 no 来回答的问句，只有两种可能性",
   "特殊疑问句",
   "特殊疑问句是以 Wh 开头的疑问词（ what, where, why, who 等）引导的疑问句，回答有诸多可能性"
  ],
  "表格": {
   "表头": [
    "句式",
    "说明"
   ],
   "行": [
    [
     "陈述句",
     "陈述句是表达一种事实或者说话人的看法。它包括 肯定句 和 否定句 两种。陈述句在书写时句末用句号，在朗读时用降调"
    ],
    [
     "一般疑问句",
     "一般疑问句是用 yes 或 no 来回答的问句，只有两种可能性"
    ],
    [
     "特殊疑问句",
     "特殊疑问句是以 Wh 开头的疑问词（ what, where, why, who 等）引导的疑问句，回答有诸多可能性"
    ]
   ]
  }
 },
 {
  "课": 2,
  "页": 15,
  "标题": "Be 句型句式的变化",
  "正文": [
   "Be 句型句式的变化",
   "肯定句",
   "在 Be 后加 not",
   "否定句",
   "一般疑问句",
   "将 Be 提到主语前面",
   "确定好疑问词，如：Where, what, when, why, who, how, How many/much /often/long +Be+ 主语 + 其它",
   "特殊疑问句",
   "选择疑问句",
   "将 be 提到主语前面，并增加一个选项 用连词 or 连接"
  ],
  "表格": {
   "表头": [
    "变法",
    "句式",
    "原句",
    "句式",
    "变法"
   ],
   "行": [
    [
     "在 Be 后加 not",
     "否定句",
     "肯定句",
     "一般疑问句",
     "将 Be 提到主语前面"
    ],
    [
     "确定好疑问词，如：Where, what, when, why, who, how, How many/much /often/long +Be+ 主语 + 其它",
     "特殊疑问句",
     "肯定句",
     "选择疑问句",
     "将 be 提到主语前面，并增加一个选项 用连词 or 连接"
    ]
   ]
  }
 },
 {
  "课": 3,
  "页": 22,
  "标题": "Be 动词之歌",
  "正文": [
   "Be 动词之歌",
   "我用am,你用are，is连接他，她，它。",
   "单数名词用is，复数名词全用are。",
   "变疑问，往前提，句末问号莫丢弃。",
   "变否定，更容易，be后not莫忘记。",
   "疑问否定任你变，句首大写莫迟疑。"
  ],
  "表格": null
 },
 {
  "课": 4,
  "页": 29,
  "标题": "Shall We Start?",
  "正文": [
   "Shall We Start?",
   "There be 句型概念：",
   "表示的是“某地方有（存在）某人或某物",
   "There 在此结构中是引导词，已经没有副词“那里”的含义"
  ],
  "表格": null
 },
 {
  "课": 4,
  "页": 30,
  "标题": "Let's Move On",
  "正文": [
   "Let's Move On",
   "There Be 句型的结构",
   "there",
   "is",
   "单数名词",
   "are",
   "复数名词",
   "地点状语（方位介词 + 地点名词）",
   "注意： Be 动词的形式由主语决定"
  ],
  "表格": {
   "表头": [
    "there",
    "Be 动词",
    "名词",
    "地点状语"
   ],
   "行": [
    [
     "there",
     "is",
     "单数名词",
     "地点状语（方位介词 + 地点名词）"
    ],
    [
     "there",
     "are",
     "复数名词",
     "地点状语（方位介词 + 地点名词）"
    ]
   ]
  }
 },
 {
  "课": 4,
  "页": 31,
  "标题": "常见的方位介词",
  "正文": [
   "常见的方位介词",
   "over 在正上方",
   "above 高于 , 位置高于",
   "on 接触的表面上",
   "in front of 在前面",
   "behind 在后面",
   "into 进入",
   "out of 向外",
   "below 低于 , 位置低于",
   "under 在正下方"
  ],
  "表格": null
 },
 {
  "课": 4,
  "页": 34,
  "标题": "There 是个近视眼",
  "正文": [
   "There 是个近视眼",
   "Tips ： 就近原则",
   "当句子中有几个并列主语时，be 动词的形式由离其较近的主语决定",
   "如：",
   "There is a bed, two tables and three chairs in the room.",
   "There are two tables, three chairs and a bed in the room."
  ],
  "表格": null
 },
 {
  "课": 5,
  "页": 39,
  "标题": "Let's Review 句式分类",
  "正文": [
   "Let's Review",
   "句式分类",
   "First",
   "陈述句是表达一种事实或者说话人的看法。它包括肯定句和否定句两种。陈述句在书写时句末用句号，在朗读时用降调。",
   "Second",
   "一般疑问句是用 yes 或 no 来回答的问句，只有两种可能性。",
   "Third",
   "特殊疑问句是以 Wh- 开头的疑问词（如 what, where, why, who 等）引导的疑问句。回答有多种可能。"
  ],
  "表格": {
   "表头": [
    "顺序",
    "说明"
   ],
   "行": [
    [
     "First",
     "陈述句是表达一种事实或者说话人的看法。它包括肯定句和否定句两种。陈述句在书写时句末用句号，在朗读时用降调。"
    ],
    [
     "Second",
     "一般疑问句是用 yes 或 no 来回答的问句，只有两种可能性。"
    ],
    [
     "Third",
     "特殊疑问句是以 Wh- 开头的疑问词（如 what, where, why, who 等）引导的疑问句。回答有多种可能。"
    ]
   ]
  }
 },
 {
  "课": 5,
  "页": 40,
  "标题": "There Be 句型句式的变化",
  "正文": [
   "There Be 句型句式的变化",
   "在 Be 后加 not",
   "否定句",
   "肯定句",
   "一般疑问句",
   "将 Be 提到主语前面",
   "确定好疑问词，如：Where, what, when, why, who, how, How many/much /often/long +Be+there+ 其它",
   "特殊疑问句",
   "选择疑问句",
   "将 be 提到主语前面，并增加一个选项 用连词 or 连接"
  ],
  "表格": {
   "表头": [
    "变法",
    "句式",
    "原句",
    "句式",
    "变法"
   ],
   "行": [
    [
     "在 Be 后加 not",
     "否定句",
     "肯定句",
     "一般疑问句",
     "将 Be 提到主语前面"
    ],
    [
     "确定好疑问词，如：Where, what, when, why, who, how, How many/much /often/long +Be+there+ 其它",
     "特殊疑问句",
     "肯定句",
     "选择疑问句",
     "将 be 提到主语前面，并增加一个选项 用连词 or 连接"
    ]
   ]
  }
 },
 {
  "课": 5,
  "页": 41,
  "标题": "There be 特殊疑问句变化（就主语提问）",
  "正文": [
   "There be 特殊疑问句变化",
   "就 There be 后面的主语进行提问",
   "指物用“ What’s ( there ) … ”",
   "指人用“ Who’s ( there ) … ”",
   "其中的 there 在口语中经常省略。值得注意的是，无论原句的主语是单数还是复数，提问时动词 be 均用单数 。 如：",
   "There are some bikes in the room.",
   "What’s (there) in the room?",
   "There is a boy in the house.",
   "Who’s (there) in the house?"
  ],
  "表格": null
 },
 {
  "课": 5,
  "页": 42,
  "标题": "There be 特殊疑问句变化（就地点状语提问）",
  "正文": [
   "There be 特殊疑问句变化",
   "对 there be 后面的地点状语进行提问",
   "“ Where is / are + 主语”",
   "注意其答语变化，如：",
   "There is a car under the tree.",
   "Where is the car?",
   "It’s under the tree.",
   "There are three apples on the table.",
   "Where are the three apples?",
   "They’re on the table."
  ],
  "表格": null
 },
 {
  "课": 5,
  "页": 43,
  "标题": "There be 特殊疑问句变化（How many / How much）",
  "正文": [
   "There be 特殊疑问句变化",
   "如果主语是可数名词，无论是单数还是复数，均用“ How many + 复数名词 + are there + 地点介词短语”表示；",
   "There are three bikes in the house.",
   "How many bikes are there in the house?",
   "There is a boy in the room.",
   "How many boys are there in the room?",
   "如果主语是不可数名词，则用“ How much + 不可数名词 +is there+ 地点介词短语”表示。",
   "There is a little water in the bottle.",
   "How much water is there in the bottle?"
  ],
  "表格": null
 },
 {
  "课": 6,
  "页": 49,
  "标题": "There be 句型总结（口诀）",
  "正文": [
   "There be 句型总结",
   "There be 句型有特点，主语跟在be后边。",
   "单数主语用is，复数用are记心间，",
   "多个主语并列时，be随身边主语变。",
   "变否定，很简单，be后要把not添。",
   "变问句也不难，把be提到there前。",
   "肯定句中用some，否定疑问any换。"
  ],
  "表格": null
 },
 {
  "课": 6,
  "页": 50,
  "标题": "There be 句型总结（特殊疑问句）",
  "正文": [
   "There be 句型总结",
   "特殊疑问句",
   "对人提问用 who’s,",
   "对事物提问用 what’s ，",
   "be 动词一律用单数 is",
   "对地点提问用 where ；",
   "对数量提问可数名词用 how many+ 名词复数 +are there… ；",
   "不可数名词用 how much+ 不可数名词 + is there…"
  ],
  "表格": null
 },
 {
  "课": 7,
  "页": 61,
  "标题": "时态分类",
  "正文": [
   "时态分类",
   "一般现在时：表达经常发生的动作或者永恒不变的动作",
   "一般过去时：表达过去某个时间点发生的动作",
   "一般将来时：表达即将发生的动作",
   "现在进行时：表达正在发生的动作"
  ],
  "表格": null
 },
 {
  "课": 7,
  "页": 62,
  "标题": "Do 句型的一般现在时",
  "正文": [
   "Do 句型的一般现在时",
   "do 句型一般现在时结构",
   "主语　谓语动词　宾语",
   "I/you/we/they /复数名词",
   "动词原形",
   "He/she/it /单数名词",
   "动词单数形式(动词原形+s/es)",
   "名词（或不直接加名词）"
  ],
  "表格": {
   "表头": [
    "主语",
    "谓语动词",
    "宾语"
   ],
   "行": [
    [
     "I/you/we/they /复数名词",
     "动词原形",
     "名词（或不直接加名词）"
    ],
    [
     "He/she/it /单数名词",
     "动词单数形式(动词原形+s/es)",
     "名词（或不直接加名词）"
    ]
   ]
  }
 },
 {
  "课": 7,
  "页": 63,
  "标题": "动词单数第三人称",
  "正文": [
   "动词单数第三人称",
   "行为动词 do 一般现在时第三人称单数（ he, she, it) 的构成规则：",
   "一般动词，在词尾加s;如：work--works,live--lives,play--plays,sing--sings.",
   "以/s//z//ʃ//tʃ/等音素结尾的动词，词尾加-es，如词尾为e，只加-s.读作/ɪz/如：teach--teaches,wash--washes,dance--dances,fix--fixes",
   "以辅音字母加y结尾的词，把y变i在加es，读作[z] study--studies,fly--flies",
   "以辅音字母+o结尾的词，一般情况是在词尾加es读作[z] go--goesdo--does"
  ],
  "表格": {
   "表头": [
    "规则",
    "例词"
   ],
   "行": [
    [
     "一般动词，在词尾加s;如：",
     "work--works,live--lives,play--plays,sing--sings."
    ],
    [
     "以/s//z//ʃ//tʃ/等音素结尾的动词，词尾加-es，如词尾为e，只加-s.读作/ɪz/如：",
     "teach--teaches,wash--washes,dance--dances,fix--fixes"
    ],
    [
     "以辅音字母加y结尾的词，把y变i在加es，读作[z]",
     "study--studies,fly--flies"
    ],
    [
     "以辅音字母+o结尾的词，一般情况是在词尾加es读作[z]",
     "go--goesdo--does"
    ]
   ]
  }
 },
 {
  "课": 7,
  "页": 64,
  "标题": "Do 句型一般现在时句式变化",
  "正文": [
   "Do 句型一般现在时句式变化",
   "在原来的动词前加 don’t/doesn’t, 且动词还原",
   "否定句",
   "肯定句",
   "一般疑问句",
   "将 do/does 提到主语前面，且动词还原",
   "确定好疑问词，如：Where, what, when, why, who, how, How many/much /often/long 疑问词 +do/does+ 主语 + 动词原形 + 其它",
   "特殊疑问句",
   "选择疑问句",
   "将 do/does 提到主语前面，并增加一个选项 用连词 or 连接"
  ],
  "表格": {
   "表头": [
    "变法",
    "句式",
    "原句",
    "句式",
    "变法"
   ],
   "行": [
    [
     "在原来的动词前加 don’t/doesn’t, 且动词还原",
     "否定句",
     "肯定句",
     "一般疑问句",
     "将 do/does 提到主语前面，且动词还原"
    ],
    [
     "确定好疑问词，如：Where, what, when, why, who, how, How many/much /often/long 疑问词 +do/does+ 主语 + 动词原形 + 其它",
     "特殊疑问句",
     "肯定句",
     "选择疑问句",
     "将 do/does 提到主语前面，并增加一个选项 用连词 or 连接"
    ]
   ]
  }
 },
 {
  "课": 8,
  "页": 73,
  "标题": "时态分类",
  "正文": [
   "时态分类",
   "一般现在时：表达经常发生的动作或者永恒不变的动作",
   "一般过去时：表达过去某个时间点发生的动作",
   "一般将来时：表达即将发生的动作",
   "现在进行时：表达正在发生的动作"
  ],
  "表格": null
 },
 {
  "课": 8,
  "页": 74,
  "标题": "Do 句型的现在进行时",
  "正文": [
   "Do 句型的现在进行时",
   "do 句型现在进行时结构",
   "主语　be动词　谓语动词　宾语",
   "I",
   "am",
   "you/we/they /复数名词",
   "are",
   "He/she/it /单数名词",
   "is",
   "动词+ing",
   "名词（或不直接加名词）"
  ],
  "表格": {
   "表头": [
    "主语",
    "be动词",
    "谓语动词",
    "宾语"
   ],
   "行": [
    [
     "I",
     "am",
     "动词+ing",
     "名词（或不直接加名词）"
    ],
    [
     "you/we/they /复数名词",
     "are",
     "动词+ing",
     "名词（或不直接加名词）"
    ],
    [
     "He/she/it /单数名词",
     "is",
     "动词+ing",
     "名词（或不直接加名词）"
    ]
   ]
  }
 },
 {
  "课": 8,
  "页": 75,
  "标题": "动词 +ing 小贴士",
  "正文": [
   "动词 +ing 小贴士",
   "行为动词 do 后加 ing 即动词的现在分词",
   "一般动词，在词尾加 ing ； 如：",
   "read--reading， drink--drinking， eat--eating",
   "以不发音的 e 结尾的动词，去 e 加 ing 如：",
   "write--writing， make--making， dance--dancing",
   "重读闭音节的动词，双写结尾辅音字母加 ing ，如：",
   "sit--sitting， swim--swimming， put--putting",
   "以 ie 结尾的动词，将 ie 变为 y ，再加 ing, 如：",
   "lie--lying， die--dying"
  ],
  "表格": {
   "表头": [
    "规则",
    "例词"
   ],
   "行": [
    [
     "一般动词，在词尾加 ing ； 如：",
     "read--reading， drink--drinking， eat--eating"
    ],
    [
     "以不发音的 e 结尾的动词，去 e 加 ing 如：",
     "write--writing， make--making， dance--dancing"
    ],
    [
     "重读闭音节的动词，双写结尾辅音字母加 ing ，如：",
     "sit--sitting， swim--swimming， put--putting"
    ],
    [
     "以 ie 结尾的动词，将 ie 变为 y ，再加 ing, 如：",
     "lie--lying， die--dying"
    ]
   ]
  }
 },
 {
  "课": 8,
  "页": 77,
  "标题": "Do 句型现在进行时句式变化",
  "正文": [
   "Do 句型现在进行时句式变化",
   "在 am/is/are 后加 not",
   "否定句",
   "陈述句",
   "一般疑问句",
   "将 am/is/are 提到主语前面",
   "确定好疑问词，如：Where, what, when, why, who 等 ， +Be+ 主语 + 动词 ing+ 其它",
   "特殊疑问句",
   "选择疑问句",
   "将 am/is/are 提到主语前面，并增加一个选项 用连词 or 连接"
  ],
  "表格": {
   "表头": [
    "变法",
    "句式",
    "原句",
    "句式",
    "变法"
   ],
   "行": [
    [
     "在 am/is/are 后加 not",
     "否定句",
     "陈述句",
     "一般疑问句",
     "将 am/is/are 提到主语前面"
    ],
    [
     "确定好疑问词，如：Where, what, when, why, who 等 ， +Be+ 主语 + 动词 ing+ 其它",
     "特殊疑问句",
     "陈述句",
     "选择疑问句",
     "将 am/is/are 提到主语前面，并增加一个选项 用连词 or 连接"
    ]
   ]
  }
 },
 {
  "课": 9,
  "页": 86,
  "标题": "时态分类",
  "正文": [
   "时态分类",
   "一般现在时：表达经常发生的动作或者永恒不变的动作",
   "一般过去时：表达过去某个时间点发生的动作",
   "一般将来时：表达即将发生的动作",
   "现在进行时：表达正在发生的动作"
  ],
  "表格": null
 },
 {
  "课": 9,
  "页": 87,
  "标题": "Do 句型的一般将来时",
  "正文": [
   "Do 句型的一般将来时",
   "do 句型一般将来时结构",
   "主语　辅助成分　谓语动词　宾语",
   "I",
   "am going to",
   "you/we/they /复数名词",
   "are going to",
   "He/she/it /单数名词",
   "is going to",
   "或者will",
   "动词原形",
   "名词（或不直接加名词）"
  ],
  "表格": {
   "表头": [
    "主语",
    "辅助成分",
    "",
    "谓语动词",
    "宾语"
   ],
   "行": [
    [
     "I",
     "am going to",
     "或者will",
     "动词原形",
     "名词（或不直接加名词）"
    ],
    [
     "you/we/they /复数名词",
     "are going to",
     "或者will",
     "动词原形",
     "名词（或不直接加名词）"
    ],
    [
     "He/she/it /单数名词",
     "is going to",
     "或者will",
     "动词原形",
     "名词（或不直接加名词）"
    ]
   ]
  }
 },
 {
  "课": 9,
  "页": 88,
  "标题": "be going to 小贴士",
  "正文": [
   "be going to 小贴士",
   "当将要发生的动作是 go 或包含 go 的动词短语，可以把 be going to 中的 go 与动作中的 go 合并在一起，如：",
   "They are going to go to the beach.=They are going to the beach.",
   "We are going to go swimming. =We are going swimming.",
   "Are you going to go to work? =Are you going to work?"
  ],
  "表格": null
 },
 {
  "课": 9,
  "页": 89,
  "标题": "Do 句型一般将来时句式变化",
  "正文": [
   "Do 句型一般将来时句式变化",
   "在 am/is/are 或 will 后加 not",
   "否定句",
   "陈述句",
   "一般疑问句",
   "将 am/is/are 或 will 提到主语前面",
   "1）疑问词,如：Where, what, why 等 +be+ 主语 +going to + 动词原形 + 其它?  2）疑问词 +will+ 主语 + 动词原形 + 其它?",
   "特殊疑问句",
   "选择疑问句",
   "将 am/is/are 或 will 提到主语前面，并增加一个选项 用连词 or 连接"
  ],
  "表格": {
   "表头": [
    "变法",
    "句式",
    "原句",
    "句式",
    "变法"
   ],
   "行": [
    [
     "在 am/is/are 或 will 后加 not",
     "否定句",
     "陈述句",
     "一般疑问句",
     "将 am/is/are 或 will 提到主语前面"
    ],
    [
     "1）疑问词,如：Where, what, why 等 +be+ 主语 +going to + 动词原形 + 其它?  2）疑问词 +will+ 主语 + 动词原形 + 其它?",
     "特殊疑问句",
     "陈述句",
     "选择疑问句",
     "将 am/is/are 或 will 提到主语前面，并增加一个选项 用连词 or 连接"
    ]
   ]
  }
 },
 {
  "课": 10,
  "页": 97,
  "标题": "时态分类",
  "正文": [
   "时态分类",
   "一般现在时：表达经常发生的动作或者永恒不变的动作",
   "一般过去时：表达过去某个时间点发生的动作",
   "一般将来时：表达即将发生的动作",
   "现在进行时：表达正在发生的动作"
  ],
  "表格": null
 },
 {
  "课": 10,
  "页": 98,
  "标题": "Do 句型的一般过去时",
  "正文": [
   "Do 句型的一般过去时",
   "do 句型一般过去时结构",
   "主语　谓语动词　宾语",
   "任何名词，代词",
   "动词过去式",
   "名词（或不加名词）"
  ],
  "表格": {
   "表头": [
    "主语",
    "谓语动词",
    "宾语"
   ],
   "行": [
    [
     "任何名词，代词",
     "动词过去式",
     "名词（或不加名词）"
    ]
   ]
  }
 },
 {
  "课": 10,
  "页": 99,
  "标题": "动词过去式小贴士",
  "正文": [
   "动词过去式小贴士",
   "1. 规则变化：",
   "一般在动词原形末尾 +ed",
   "以不发音的字母 e 结尾，直接 +d",
   "末尾只有一个辅音字母的重读闭音节动词，双写结尾辅音字母 +ed",
   "以辅音字母加 y 结尾的动词，先变 y 为 i ，再 +ed",
   "2. 不规则变化：靠长期积累",
   "常见的不规则动词有：",
   "get----got,  take----took, have/has----had, do----did",
   "eat----ate, drive----drove, buy----bought, make----made",
   "write----wrote, see----saw, go----went, sing----sang",
   "drink----drank, sit----sat, ride----rode, find----found"
  ],
  "表格": null
 },
 {
  "课": 10,
  "页": 101,
  "标题": "Do 句型一般过去时句式变化",
  "正文": [
   "Do 句型一般过去时句式变化",
   "在原来的动词前加 didn’t, 且动词还原",
   "否定句",
   "陈述句",
   "一般疑问句",
   "借助助动词 did, 将 did 提到主语前面，且动词还原",
   "确定好疑问词，如：Where, what, why, who 等 疑问词 +did+ 主语 + 动词原形 + 其它?",
   "特殊疑问句",
   "选择疑问句",
   "借助助动词 did, 将 did 提到主语前面，并增加一个选项 用连词 or 连接"
  ],
  "表格": {
   "表头": [
    "变法",
    "句式",
    "原句",
    "句式",
    "变法"
   ],
   "行": [
    [
     "在原来的动词前加 didn’t, 且动词还原",
     "否定句",
     "陈述句",
     "一般疑问句",
     "借助助动词 did, 将 did 提到主语前面，且动词还原"
    ],
    [
     "确定好疑问词，如：Where, what, why, who 等 疑问词 +did+ 主语 + 动词原形 + 其它?",
     "特殊疑问句",
     "陈述句",
     "选择疑问句",
     "借助助动词 did, 将 did 提到主语前面，并增加一个选项 用连词 or 连接"
    ]
   ]
  }
 },
 {
  "课": 11,
  "页": 109,
  "标题": "时态分类",
  "正文": [
   "时态分类",
   "一般现在时：表达经常发生的动作或者永恒不变的动作",
   "一般过去时：表达过去某个时间点发生的动作",
   "一般将来时：表达即将发生的动作",
   "现在进行时：表达正在发生的动作"
  ],
  "表格": null
 },
 {
  "课": 12,
  "页": 121,
  "标题": "Let's Review 句式分类",
  "正文": [
   "Let's Review",
   "句式分类",
   "First",
   "陈述句是表达一种事实或者说话人的看法。它包括肯定句和否定句两种。陈述句在书写时句末用句号，在朗读时用降调",
   "Second",
   "一般疑问句是用yes或no来回答的问句，只有两种可能性。",
   "Third",
   "特殊疑问句是以Wh开头的疑问词（如what,where,why,who等）引导的疑问句。"
  ],
  "表格": {
   "表头": [
    "顺序",
    "说明"
   ],
   "行": [
    [
     "First",
     "陈述句是表达一种事实或者说话人的看法。它包括肯定句和否定句两种。陈述句在书写时句末用句号，在朗读时用降调"
    ],
    [
     "Second",
     "一般疑问句是用yes或no来回答的问句，只有两种可能性。"
    ],
    [
     "Third",
     "特殊疑问句是以Wh开头的疑问词（如what,where,why,who等）引导的疑问句。"
    ]
   ]
  }
 },
 {
  "课": 12,
  "页": 122,
  "标题": "句式变化中助动词的分类",
  "正文": [
   "句式变化中助动词的分类",
   "假设我们用 do 来表示一切动作，那么：",
   "现在进行时： be doing",
   "一般现在时： do/does",
   "一般将来时： will/be going to do",
   "一般过去时： did",
   "所以在变化句式时我们需要借助以下助动词",
   "时态",
   "现在进行时",
   "一般现在时",
   "一般过去时",
   "一般将来时",
   "助动词",
   "be(am/is/are)",
   "do/does",
   "did",
   "be(am/is/are)/will"
  ],
  "表格": {
   "表头": [
    "时态",
    "现在进行时",
    "一般现在时",
    "一般过去时",
    "一般将来时"
   ],
   "行": [
    [
     "助动词",
     "be(am/is/are)",
     "do/does",
     "did",
     "be(am/is/are)/will"
    ]
   ]
  }
 },
 {
  "课": 12,
  "页": 126,
  "标题": "常见的特殊疑问词",
  "正文": [
   "常见的特殊疑问词",
   "记法：特殊疑问词的开头一般是 wh 或 h 。",
   "并牢记，特殊疑问词一定要放在句首",
   "特殊疑问词＋助动词＋主语＋实义动词＋其它？",
   "wh",
   "where- 哪里  what- 什么  when- 问时间",
   "who- 谁  which- 哪一个  why- 为什么",
   "how- 怎么样 how many- 多少数量",
   "how long- 多久 how much- 多少钱  how often- 问频率",
   "h"
  ],
  "表格": {
   "表头": [
    "疑问词",
    "含义"
   ],
   "行": [
    [
     "where",
     "哪里"
    ],
    [
     "what",
     "什么"
    ],
    [
     "when",
     "问时间"
    ],
    [
     "who",
     "谁"
    ],
    [
     "which",
     "哪一个"
    ],
    [
     "why",
     "为什么"
    ],
    [
     "how",
     "怎么样"
    ],
    [
     "how many",
     "多少数量"
    ],
    [
     "how long",
     "多久"
    ],
    [
     "how much",
     "多少钱"
    ],
    [
     "how often",
     "问频率"
    ]
   ]
  }
 },
 {
  "课": 13,
  "页": 131,
  "标题": "三大类句型总结",
  "正文": [
   "三大类句型总结",
   "句型",
   "Be句型",
   "There be句型",
   "Do句型",
   "表达意思",
   "静态",
   "静态",
   "动态",
   "可接词性",
   "名词，地点，形容词，动词ing",
   "接名词+地点",
   "接名词，或不接名词",
   "例句",
   "My name is Daniel. I am at home. I am handsome.",
   "There is a cat in the house.",
   "I eat dinner at night. I swim on Sundays."
  ],
  "表格": {
   "表头": [
    "句型",
    "Be句型",
    "There be句型",
    "Do句型"
   ],
   "行": [
    [
     "表达意思",
     "静态",
     "静态",
     "动态"
    ],
    [
     "可接词性",
     "名词，地点，形容词，动词ing",
     "接名词+地点",
     "接名词，或不接名词"
    ],
    [
     "例句",
     "My name is Daniel. I am at home. I am handsome.",
     "There is a cat in the house.",
     "I eat dinner at night. I swim on Sundays."
    ]
   ]
  }
 },
 {
  "课": 13,
  "页": 132,
  "标题": "Do 句型时态总结",
  "正文": [
   "Do 句型时态总结",
   "时态",
   "一般现在时",
   "现在进行时",
   "一般将来时",
   "一般过去时",
   "表达意义",
   "常态的动作",
   "正在发生的动作",
   "将来的动作",
   "过去的动作",
   "动词形式",
   "Do/does",
   "Be doing",
   "Be going to/will do",
   "did",
   "例句",
   "I work every day.",
   "I am working now.",
   "I am going to work tomorrow.",
   "I worked yesterday."
  ],
  "表格": {
   "表头": [
    "时态",
    "一般现在时",
    "现在进行时",
    "一般将来时",
    "一般过去时"
   ],
   "行": [
    [
     "表达意义",
     "常态的动作",
     "正在发生的动作",
     "将来的动作",
     "过去的动作"
    ],
    [
     "动词形式",
     "Do/does",
     "Be doing",
     "Be going to/will do",
     "did"
    ],
    [
     "例句",
     "I work every day.",
     "I am working now.",
     "I am going to work tomorrow.",
     "I worked yesterday."
    ]
   ]
  }
 },
 {
  "课": 13,
  "页": 133,
  "标题": "句式变化总结",
  "正文": [
   "句式变化总结",
   "Be句型",
   "Do句型",
   "There be句型",
   "变否定句",
   "Be后加not",
   "助动词 Don’t/doesn’t/didn’t/won’t放动词前面",
   "变一般疑问句",
   "Be提到句首",
   "助动词 do/does/did/will 提到主语前面",
   "变特殊疑问句",
   "确定特殊疑问词，围绕be变化",
   "确定特殊疑问词，围绕助动词do/does/did/will变化"
  ],
  "表格": {
   "表头": [
    "",
    "Be句型",
    "Do句型",
    "There be句型"
   ],
   "行": [
    [
     "变否定句",
     "Be后加not",
     "助动词 Don’t/doesn’t/didn’t/won’t放动词前面",
     "Be后加not"
    ],
    [
     "变一般疑问句",
     "Be提到句首",
     "助动词 do/does/did/will 提到主语前面",
     "Be提到句首"
    ],
    [
     "变特殊疑问句",
     "确定特殊疑问词，围绕be变化",
     "确定特殊疑问词，围绕助动词do/does/did/will变化",
     "确定特殊疑问词，围绕be变化"
    ]
   ]
  }
 }
];

export const 练习: 练习题[] = [
 {
  "课": 1,
  "页": 8,
  "题": "主语 ______ + am/is/are + 表语 ______",
  "要求": "用表格框架替换成分造句（配图：猫、电话、女孩、卧室）"
 },
 {
  "课": 2,
  "页": 16,
  "题": "Lucy is a doctor",
  "要求": "变否定句 / 一般疑问句 / 特殊疑问句"
 },
 {
  "课": 2,
  "页": 16,
  "题": "We are at home",
  "要求": "变否定句 / 一般疑问句 / 特殊疑问句"
 },
 {
  "课": 2,
  "页": 16,
  "题": "I am handsome",
  "要求": "变否定句 / 一般疑问句 / 特殊疑问句"
 },
 {
  "课": 2,
  "页": 18,
  "题": "This is a photograph of my sister and me. My sister’s name is Amanda. My name is Lucy. We are in the park.",
  "要求": "将下面一篇段落变形成否定句，一般疑问句及特殊疑问句。"
 },
 {
  "课": 3,
  "页": 23,
  "题": "I ______ a girl. My name _______ Mary.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 3,
  "页": 23,
  "题": "I ______ in Class 2, Grade 7. I ______ 12 years old.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 3,
  "页": 23,
  "题": "Here______ my family photo.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 3,
  "页": 23,
  "题": "Look! These ______ my parents and those _______ my grandparents. This boy ______ my brother. He ________ 15 years old now.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 3,
  "页": 23,
  "题": "That ______ my cat, Mimi. It ______ very lovely.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 3,
  "页": 24,
  "题": "This is a coat",
  "要求": "变否定句 / 疑问句 / 回答"
 },
 {
  "课": 3,
  "页": 24,
  "题": "I'm in the office",
  "要求": "变否定句 / 疑问句 / 回答"
 },
 {
  "课": 3,
  "页": 24,
  "题": "She is so beautiful",
  "要求": "变否定句 / 疑问句 / 回答"
 },
 {
  "课": 3,
  "页": 24,
  "题": "These are apples",
  "要求": "变否定句 / 疑问句 / 回答"
 },
 {
  "课": 3,
  "页": 25,
  "题": "My birthday is tomorrow .",
  "要求": "对下划线成分（tomorrow）进行提问"
 },
 {
  "课": 3,
  "页": 25,
  "题": "I’m from Chongqing, China .",
  "要求": "对下划线成分（Chongqing, China）进行提问"
 },
 {
  "课": 3,
  "页": 25,
  "题": "He is my father.",
  "要求": "对下划线成分（my father）进行提问"
 },
 {
  "课": 3,
  "页": 25,
  "题": "My name is Tom.",
  "要求": "对下划线成分（Tom）进行提问"
 },
 {
  "课": 3,
  "页": 25,
  "题": "My parents are in the dining room.",
  "要求": "对下划线成分（the dining room）进行提问"
 },
 {
  "课": 4,
  "页": 35,
  "题": "运用思维挪移造出 10 句表达静态的句子（ there be 句型）",
  "要求": "Write your sentences here"
 },
 {
  "课": 5,
  "页": 44,
  "题": "There is an apple on the desk.",
  "要求": "变否定句 / 一般疑问句 / 特殊疑问句"
 },
 {
  "课": 5,
  "页": 44,
  "题": "There are four people in the room.",
  "要求": "变否定句 / 一般疑问句 / 特殊疑问句"
 },
 {
  "课": 5,
  "页": 45,
  "题": "There is a desk near the window. There are some books and a vase on the desk. Next to the desk there is a chair. There is a bed and a bookshelf near the wall. Under the bed there are my shoes and one soccer ball. In the corner there is a broom.",
  "要求": "将下面一篇段落变形成否定句，一般疑问句及特殊疑问句。"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There _________some water in the glass.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There __________ a bird in the tree.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ a bed and two chairs in Betty’s room.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There __________some children in the park.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ a teacher and many students in our classroom.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ many birds and a lion in the forest.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ many flowers over there.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ a beautiful garden in our school.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ some bread on the table.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There__________ twenty desks in our classroom.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There __________some milk in the bottle.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 51,
  "题": "There __________ some apple juice in the glass.",
  "要求": "使用正确的 be 动词形式"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There is a woman near the house.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are some buses near the hill.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are some apples on the tree.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are some oranges in the glass.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are many beautiful flowers in the garden.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There is a bookcase in my study( 书房 ).",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There is a soccer ball and a basketball on the floor.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are some big trees behind my house.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are some books on the desk.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There is a computer in the room.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There are some flowers and a desk in the room.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 52,
  "题": "There is a ruler in the bag.",
  "要求": "将下列肯定句变成否定句"
 },
 {
  "课": 6,
  "页": 53,
  "题": "There is a woman near the house.",
  "要求": "对下划线成分（a woman）进行提问"
 },
 {
  "课": 6,
  "页": 53,
  "题": "There are some buses near the hill.",
  "要求": "对下划线成分（some buses）进行提问"
 },
 {
  "课": 6,
  "页": 53,
  "题": "There are five apples on the tree.",
  "要求": "对下划线成分（five）进行提问"
 },
 {
  "课": 6,
  "页": 53,
  "题": "There are many beautiful flowers in the garden.",
  "要求": "对下划线成分（in the garden）进行提问"
 },
 {
  "课": 6,
  "页": 53,
  "题": "There is a bookcase in my study( 书房 ).",
  "要求": "对下划线成分（a bookcase）进行提问"
 },
 {
  "课": 6,
  "页": 53,
  "题": "There is some milk in the bottle.",
  "要求": "对下划线成分（some）进行提问"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There is a woman near the house.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are some buses near the hill.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are some apples on the tree.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are some oranges in the glass.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are many beautiful flowers in the garden.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There is a bookcase in my study( 书房 ).",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There is a soccer ball and a basketball on the floor.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are some big trees behind my house.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are some books on the desk.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There is a computer in the room.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There are some flowers and a desk in the room.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 54,
  "题": "There is a ruler in the bag.",
  "要求": "变成一般疑问句，并作出肯定回答"
 },
 {
  "课": 6,
  "页": 55,
  "题": "水壶里没水了。 / There _________ _________ water in the _________.",
  "要求": "根据中文提示完成下列句子"
 },
 {
  "课": 6,
  "页": 55,
  "题": "操场上现在有学生吗？不，没有。 / _________ there _________ _________ in the _________ now? / No, _________ _________.",
  "要求": "根据中文提示完成下列句子"
 },
 {
  "课": 6,
  "页": 55,
  "题": "餐厅里有一张餐桌四把椅子。 / There _________ a _________ and four _________in the _________.",
  "要求": "根据中文提示完成下列句子"
 },
 {
  "课": 6,
  "页": 55,
  "题": "这附近有一栋旧房子。 / _________ _________ an old house _________ here.",
  "要求": "根据中文提示完成下列句子"
 },
 {
  "课": 6,
  "页": 55,
  "题": "碗里有些米饭。 / _________ _________ some _________ _________the _________.",
  "要求": "根据中文提示完成下列句子"
 },
 {
  "课": 6,
  "页": 55,
  "题": "这里有许多树吗？是的。 / _________ there _________ trees _________? _________, there _________.",
  "要求": "根据中文提示完成下列句子"
 },
 {
  "课": 7,
  "页": 66,
  "题": "把主语（He / Lily / I / You / My mother / My sister and I / They / We / Jack and Lily / She）、动作、时间状语（every day / usually / every morning / sometimes / in spring / on weekends / at night / twice a week / always / from Monday to Friday）连接起来",
  "要求": "连接下面主语，动作（注意动词的形式）及时间，组成完整的 10 句话（动词可参考图片信息）"
 },
 {
  "课": 7,
  "页": 67,
  "题": "Kate works with Peter.",
  "要求": "变成否定句"
 },
 {
  "课": 7,
  "页": 67,
  "题": "I often go there.",
  "要求": "变成一般疑问句"
 },
 {
  "课": 7,
  "页": 67,
  "题": "You like music.",
  "要求": "对下划线部分内容提问（music）"
 },
 {
  "课": 7,
  "页": 67,
  "题": "He goes to work by bus.",
  "要求": "对下划线部分内容提问（by bus）"
 },
 {
  "课": 7,
  "页": 67,
  "题": "The sun rises in the east.",
  "要求": "变成一般疑问句"
 },
 {
  "课": 7,
  "页": 67,
  "题": "We watch TV during the week.",
  "要求": "变成否定句"
 },
 {
  "课": 7,
  "页": 67,
  "题": "My son plays football.",
  "要求": "对下划线部分内容提问（My son）"
 },
 {
  "课": 7,
  "页": 67,
  "题": "My sister and I like our neighbor ’s dog.",
  "要求": "对下划线部分内容提问（our neighbor ’s dog）"
 },
 {
  "课": 7,
  "页": 68,
  "题": "根据下图描述 Jeff 的一周，并把每个句子改成否定句。",
  "要求": "Write your sentences here"
 },
 {
  "课": 8,
  "页": 76,
  "题": "answer / borrow / buy / call / carry / change / hate / invite / collect / cry / enjoy / begin / chat / plan / talk / send / show / sleep",
  "要求": "给下列动词添加 ing"
 },
 {
  "课": 8,
  "页": 79,
  "题": "把主语（He / Lily / I / You / My mother / My sister and I / They / We / Jack and Lily / She）、动作、地点（in the bedroom / in the garden / in the swimming pool / in the study / in the kitchen / in the park）连接起来",
  "要求": "连接下面主语，动作（注意动词的形式）及地点，组成完整的 10 句话（动词可参照图片信息）"
 },
 {
  "课": 8,
  "页": 80,
  "题": "The boy is playing basketball.",
  "要求": "写出否定句、一般疑问句、肯定回答、否定回答"
 },
 {
  "课": 8,
  "页": 80,
  "题": "Mrs. Jones is listening to the music.",
  "要求": "写出否定句、一般疑问句、肯定回答、否定回答"
 },
 {
  "课": 8,
  "页": 80,
  "题": "Are you going to school?",
  "要求": "写出肯定回答、否定回答"
 },
 {
  "课": 8,
  "页": 80,
  "题": "I’m buying a storybook .",
  "要求": "对划线部分提问（a storybook）"
 },
 {
  "课": 8,
  "页": 80,
  "题": "Mary is talking with her grandpa.",
  "要求": "对划线部分提问（Mary）"
 },
 {
  "课": 8,
  "页": 80,
  "题": "Mike is planting flowers in the yard.",
  "要求": "对划线部分提问（yard）"
 },
 {
  "课": 8,
  "页": 80,
  "题": "We are drinking water because we are thirsty.",
  "要求": "对划线部分提问（we are thirsty）"
 },
 {
  "课": 8,
  "页": 81,
  "题": "用现在进行时描述 Jones 一家在公园的活动，并把每个句子改成否定句。",
  "要求": "Write your sentences here"
 },
 {
  "课": 9,
  "页": 90,
  "题": "把主语（He / Lily / I / You / My mother / My sister and I / They / We / Jack and Lily / She）、动作、时间（today / this morning / tonight / tomorrow / tomorrow afternoon / next week / next year / at once / this weekend / this spring）连接起来",
  "要求": "连接下面主语，动作（注意动词的形式）及时间，组成完整的 10 句话（动词可参考图片信息）"
 },
 {
  "课": 9,
  "页": 91,
  "题": "It will be Christmas soon.",
  "要求": "写出否定句；写出选择疑问句（ the Spring Festival ）"
 },
 {
  "课": 9,
  "页": 91,
  "题": "She will have an English lesson the day after tomorrow.",
  "要求": "写出一般疑问句；写出特殊疑问句（对下划线成分 the day after tomorrow 提问）"
 },
 {
  "课": 9,
  "页": 91,
  "题": "I am going shopping this afternoon.",
  "要求": "写出特殊疑问句；写出选择疑问句（go fishing ）"
 },
 {
  "课": 9,
  "页": 91,
  "题": "He is going to see his grandpa tomorrow.",
  "要求": "写出否定句、一般疑问句；写出特殊疑问句（对下划线成分 his grandpa tomorrow 提问）"
 },
 {
  "课": 9,
  "页": 91,
  "题": "They are going to meet at 6 o’clock.",
  "要求": "写出否定句、一般疑问句；写出特殊疑问句（对下划线成分 They 提问）"
 },
 {
  "课": 9,
  "页": 91,
  "题": "We are going to see a film in the bedroom .",
  "要求": "写出否定句、一般疑问句；写出特殊疑问句（对下划线成分 in the bedroom 提问）；写出选择疑问句（ watch TV ）"
 },
 {
  "课": 10,
  "页": 100,
  "题": "cook / fix / brush / shave / smile / cry / study / dance / stop / plan / carry / need / want / work / hope / stay / write / ride / buy / take / read / find / spend / jog",
  "要求": "尝试把下列动词变成过去式"
 },
 {
  "课": 10,
  "页": 102,
  "题": "把主语（He / Lily / I / You / My mother / My sister and I / They / We / Jack and Lily / She）、动作、时间（today / this morning / last Friday / yesterday / yesterday afternoon / last week / an hour ago / the day before yesterday / at 11:00 p.m. last night / in 2008）连接起来",
  "要求": "连接下面主语，动作（注意动词的形式）及时间，组成完整的 10 句话（动词可参考图片信息）"
 },
 {
  "课": 10,
  "页": 103,
  "题": "Lucy did her homework at home.",
  "要求": "写出否定句；写出选择疑问句（ do her exercise）"
 },
 {
  "课": 10,
  "页": 103,
  "题": "She found some meat in the fridge .",
  "要求": "写出一般疑问句；写出特殊疑问句（对下划线成分 in the fridge 提问）"
 },
 {
  "课": 10,
  "页": 103,
  "题": "Frank read an interesting book about history.",
  "要求": "写出特殊疑问句（对下划线成分 an interesting book about history 提问）；写出选择疑问句（about politics ）"
 },
 {
  "课": 10,
  "页": 103,
  "题": "Tom spent 10 dollars on this book.",
  "要求": "写出否定句、一般疑问句；写出特殊疑问句（对下划线成分 10 dollars on this 提问）"
 },
 {
  "课": 10,
  "页": 103,
  "题": "My family went to the beach last week .",
  "要求": "写出否定句、一般疑问句；写出特殊疑问句（对下划线成分 last week 提问）"
 },
 {
  "课": 11,
  "页": 110,
  "题": "yesterday, tomorrow morning, last night, next week, usually, always, right now, the day after tomorrow, every day, on weekends, the day before yesterday, in 1999, in the future, in a few minutes, often",
  "要求": "分类下列时间状语（填进现在进行时 / 一般现在时 / 一般过去时 / 一般将来时四格）"
 },
 {
  "课": 11,
  "页": 111,
  "题": "get / take / have / read / eat / drive / make / see / run",
  "要求": "写出下列动词的正确形式（三单形式、现在分词、过去式、将来式）"
 },
 {
  "课": 11,
  "页": 112,
  "题": "I watch videos after dinner.",
  "要求": "主语改成三单 / 改成现在进行时 / 改成一般过去时 / 改成一般将来时"
 },
 {
  "课": 11,
  "页": 112,
  "题": "I do morning exercises at 7:00 a.m.",
  "要求": "主语改成三单 / 改成现在进行时 / 改成一般过去时 / 改成一般将来时"
 },
 {
  "课": 11,
  "页": 113,
  "题": "Mr. Smith likes to skateboard. / He ………… every day.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "He ………… yesterday.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "He is ………… now.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "He ………… tomorrow.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "As you can see, Mr. Smith really likes to …………… .",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "John and his friend like to drink beer. / They ………… every day.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "They ………… yesterday.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "They are ………… now.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "They ………… tomorrow.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 113,
  "题": "As you can see, they really like to …………… .",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 115,
  "题": "I like to ……………..",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 115,
  "题": "I ………… every day.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 115,
  "题": "I ………….. yesterday.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 115,
  "题": "I am ………… now.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 115,
  "题": "I  …………. tomorrow.",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 115,
  "题": "As you can see, I really like  to …………..",
  "要求": "填写正确的动词形式"
 },
 {
  "课": 11,
  "页": 116,
  "题": "When _________ (do)he usually _________ (go) to work?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "_________ (be) Tom _________(go) to H.K. tomorrow?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "_________(do) Ben and Kate _________ (go)to school on foot?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "What ________(do) Mr. Li ________ (do)?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Zhang Peng _________(buy)a car two days ago.",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Sometimes Chen Jie________ (fly)to USA.",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Last night at the party, I ________ (sing and dance).",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "_________ (do) you go home everyday? No, I don’t.",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "_________(do) your sister ________(go) to Shanghai last month?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Listen, the car ________ (come).",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Next week, I ________ (visit)my grandparents.",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Miss Ma ________ (come) from England.",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "Where ________ (do)the rain ________ (come) from?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "It ________ ( come) from the clouds.",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 11,
  "页": 116,
  "题": "________(be)Tom ________ (read) a book now?",
  "要求": "填写正确的动词形式（括号内为提示词）"
 },
 {
  "课": 12,
  "页": 124,
  "题": "I do morning exercises at 7:00 a.m.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "I did morning exercises yesterday.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "I am doing morning exercises now.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "I am going to do morning exercises tomorrow.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "He watches a movie on weekends.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "He watched a movie last weekend.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "He is watching a movie right now.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 124,
  "题": "He is going to watch a movie this weekend.",
  "要求": "模仿例句，将下列肯定句变成否定句"
 },
 {
  "课": 12,
  "页": 125,
  "题": "Jack and his friends like to drink beer.",
  "要求": "模仿例句，将下列肯定句变成一般疑问句"
 },
 {
  "课": 12,
  "页": 125,
  "题": "They drink beer every day.",
  "要求": "模仿例句，将下列肯定句变成一般疑问句"
 },
 {
  "课": 12,
  "页": 125,
  "题": "They drank beer yesterday.",
  "要求": "模仿例句，将下列肯定句变成一般疑问句"
 },
 {
  "课": 12,
  "页": 125,
  "题": "They are drinking beer right now.",
  "要求": "模仿例句，将下列肯定句变成一般疑问句"
 },
 {
  "课": 12,
  "页": 125,
  "题": "They are going to drink beer tomorrow.",
  "要求": "模仿例句，将下列肯定句变成一般疑问句"
 },
 {
  "课": 12,
  "页": 127,
  "题": "He usually goes to work at 8:00 o'clock.",
  "要求": "对下划线成分（at 8:00 o'clock）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "Mr. Lee is a singer.",
  "要求": "对下划线成分（a singer）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "Sometimes Lucy flies to USA.",
  "要求": "对下划线成分（USA）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "Last night at the party, I sang and danced.",
  "要求": "对下划线成分（sang and danced）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "Look, your mother is coming.",
  "要求": "对下划线成分（your mother）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "Next week, I am going to visit my grandparents.",
  "要求": "对下划线成分（Next week）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "Miss Ma comes from England.",
  "要求": "对下划线成分（England）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "He uses his computer every day.",
  "要求": "对下划线成分（uses his computer）进行提问"
 },
 {
  "课": 12,
  "页": 127,
  "题": "It took me three hours to finish the homework.",
  "要求": "对下划线成分（three hours）进行提问"
 },
 {
  "课": 13,
  "页": 135,
  "题": "太阳每天从东方升起。（rise）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "孩子们正在唱歌。（sing）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "我今天晚上给你打电话。（call sb.）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "我昨天买了一台电脑。（buy）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "这部电影很有趣 。（interesting）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "悉尼是一座很漂亮的城市。（Sydney）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "她将失去她的工作。（lose one’s job）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "我上周收到了你的礼物。（receive）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "你什么时候将会给我电话呢？（when）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "你昨天去了什么地方？（where）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "你喜欢跳舞吗？（like）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "桌子上有多少本书呢 ?（how many）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 },
 {
  "课": 13,
  "页": 135,
  "题": "你为什么喜欢做运动呢？（do sports）",
  "要求": "将下列句子翻译成英文，注意句型，句式及时态"
 }
];

export const 示范: 示范句[] = [
 {
  "页": 24,
  "原": "That is a book.",
  "变": "That is not a book.",
  "怎么变": "否定句"
 },
 {
  "页": 24,
  "原": "That is a book.",
  "变": "Is that a book?",
  "怎么变": "疑问句"
 },
 {
  "页": 24,
  "原": "Is that a book?",
  "变": "Yes, that is. / No, that isn't.",
  "怎么变": "回答"
 },
 {
  "页": 41,
  "原": "There are some bikes in the room.",
  "变": "What’s (there) in the room?",
  "怎么变": "就 There be 后面的主语（物）提问，指物用 What’s ( there ) …"
 },
 {
  "页": 41,
  "原": "There is a boy in the house.",
  "变": "Who’s (there) in the house?",
  "怎么变": "就 There be 后面的主语（人）提问，指人用 Who’s ( there ) …"
 },
 {
  "页": 42,
  "原": "There is a car under the tree.",
  "变": "Where is the car? It’s under the tree.",
  "怎么变": "对 there be 后面的地点状语进行提问：Where is / are + 主语"
 },
 {
  "页": 42,
  "原": "There are three apples on the table.",
  "变": "Where are the three apples? They’re on the table.",
  "怎么变": "对 there be 后面的地点状语进行提问：Where is / are + 主语"
 },
 {
  "页": 43,
  "原": "There are three bikes in the house.",
  "变": "How many bikes are there in the house?",
  "怎么变": "主语是可数名词，用 How many + 复数名词 + are there + 地点介词短语"
 },
 {
  "页": 43,
  "原": "There is a boy in the room.",
  "变": "How many boys are there in the room?",
  "怎么变": "主语是可数名词，用 How many + 复数名词 + are there + 地点介词短语"
 },
 {
  "页": 43,
  "原": "There is a little water in the bottle.",
  "变": "How much water is there in the bottle?",
  "怎么变": "主语是不可数名词，用 How much + 不可数名词 + is there + 地点介词短语"
 },
 {
  "页": 88,
  "原": "They are going to go to the beach.",
  "变": "They are going to the beach.",
  "怎么变": "把 be going to 中的 go 与动作中的 go 合并在一起"
 },
 {
  "页": 88,
  "原": "We are going to go swimming.",
  "变": "We are going swimming.",
  "怎么变": "把 be going to 中的 go 与动作中的 go 合并在一起"
 },
 {
  "页": 88,
  "原": "Are you going to go to work?",
  "变": "Are you going to work?",
  "怎么变": "把 be going to 中的 go 与动作中的 go 合并在一起"
 },
 {
  "页": 124,
  "原": "I watch videos after dinner.",
  "变": "I don’t watch videos after dinner.",
  "怎么变": "肯定句变否定句"
 },
 {
  "页": 124,
  "原": "I watched videos yesterday.",
  "变": "I didn’t watch videos yesterday.",
  "怎么变": "肯定句变否定句"
 },
 {
  "页": 124,
  "原": "I am watching videos now.",
  "变": "I am not watching videos now.",
  "怎么变": "肯定句变否定句"
 },
 {
  "页": 124,
  "原": "I am going to watch videos tomorrow.",
  "变": "I am not going to watch videos tomorrow.",
  "怎么变": "肯定句变否定句"
 },
 {
  "页": 125,
  "原": "Mr. Wang likes to skateboard.",
  "变": "Does Mr. Wang like to skateboard?",
  "怎么变": "肯定句变一般疑问句"
 },
 {
  "页": 125,
  "原": "He skateboards every day.",
  "变": "Does he skateboard every day?",
  "怎么变": "肯定句变一般疑问句"
 },
 {
  "页": 125,
  "原": "He skateboarded yesterday.",
  "变": "Did he skateboard yesterday?",
  "怎么变": "肯定句变一般疑问句"
 },
 {
  "页": 125,
  "原": "He is skateboarding now.",
  "变": "Is he skateboarding now?",
  "怎么变": "肯定句变一般疑问句"
 },
 {
  "页": 125,
  "原": "He is going to skateboard tomorrow.",
  "变": "Is he going to skateboard tomorrow?",
  "怎么变": "肯定句变一般疑问句"
 }
];

/** 每课按这些页讲规则（我逐页看过，只收有明确规则的） */
export const 规则页序: Record<number, number[]> = {"1":[3,4,5,7],"2":[14,15],"3":[22],"4":[29,30,31,34],"5":[39,40,41,42,43],"6":[49,50],"7":[61,62,63,64],"8":[73,74,75,77],"9":[86,87,88,89],"10":[97,98,99,101],"11":[109],"12":[121,122,126],"13":[131,132,133]};
