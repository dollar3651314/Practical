// 30 个场景（agents 项目/Practical/素材方案-30个场景.json，分支 claude/pm-practical-prompts）。
// en = 这一题的英文语块（题目区不显示，只在复盘页出现）；zh = 中文意思（复盘页默认折叠）。
// 每个场景对应 R2 里的 5 个文件：scene-<id>-correct / -d1-phoneme / -d2-action / -d3-function（图）+ scene-<id>-audio（音频）。
// 四张图的顺序固定为 [正确, 音素干扰, 动作干扰, 虚词数字干扰]，显示时打乱；下标即错误类型（core.js 的 ETYPE）。

/** @typedef {{id:string,name:string,en:string,zh:string}} Scene */

/** @type {Scene[]} */
export const SCENES = [
 { id: "01", name: "递订书机", en: "Hand me the stapler", zh: "把订书机递给我" },
 { id: "02", name: "拿杯咖啡", en: "Grab a coffee", zh: "拿杯咖啡" },
 { id: "03", name: "关门", en: "Shut the door", zh: "关门" },
 { id: "04", name: "插上插头", en: "Plug it in", zh: "插上插头" },
 { id: "05", name: "打印出来", en: "Print it out", zh: "打印出来" },
 { id: "06", name: "开灯", en: "Turn on the light", zh: "开灯" },
 { id: "07", name: "请坐", en: "Have a seat", zh: "请坐" },
 { id: "08", name: "传过去", en: "Pass it over", zh: "传过去" },
 { id: "09", name: "投到屏幕上", en: "Put it on the screen", zh: "投到屏幕上" },
 { id: "10", name: "写在白板上", en: "Write it on the whiteboard", zh: "写在白板上" },
 { id: "11", name: "举手", en: "Raise your hand", zh: "举手" },
 { id: "12", name: "记下来", en: "Write it down", zh: "记下来" },
 { id: "13", name: "翻到第三页", en: "Turn to page three", zh: "翻到第三页" },
 { id: "14", name: "搬张椅子过来", en: "Pull up a chair", zh: "搬张椅子过来" },
 { id: "15", name: "你静音了", en: "You're on mute", zh: "你静音了" },
 { id: "16", name: "共享屏幕", en: "Share your screen", zh: "共享屏幕" },
 { id: "17", name: "打开摄像头", en: "Turn your camera on", zh: "打开摄像头" },
 { id: "18", name: "声音断断续续", en: "You're breaking up", zh: "声音断断续续" },
 { id: "19", name: "办登机", en: "Check in", zh: "办登机" },
 { id: "20", name: "托运行李", en: "Check your bag", zh: "托运行李" },
 { id: "21", name: "系安全带", en: "Buckle up", zh: "系安全带" },
 { id: "22", name: "靠窗的位子", en: "A window seat", zh: "靠窗的位子" },
 { id: "23", name: "取行李", en: "Pick up your luggage", zh: "取行李" },
 { id: "24", name: "叫辆车", en: "Catch a cab", zh: "叫辆车" },
 { id: "25", name: "带走", en: "To go", zh: "带走" },
 { id: "26", name: "买单", en: "The check, please", zh: "买单" },
 { id: "27", name: "续杯", en: "A refill", zh: "续杯" },
 { id: "28", name: "加冰", en: "With ice", zh: "加冰" },
 { id: "29", name: "分开付", en: "Split the bill", zh: "分开付" },
 { id: "30", name: "打包剩的", en: "Box it up", zh: "打包剩的" },
];
