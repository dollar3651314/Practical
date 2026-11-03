// 素材清单：R2 桶里（或本地文件夹里）有哪些文件 → 哪些场景能出题。
// 写成普通 JS 是为了三处共用同一份规则：Worker（src/index.ts）、本地检查脚本（scripts/check-media.mjs）、单元测试。
// 命名规则来自 agents《素材方案-交给Amos的生产包》第五节，一个字母都不能改：
//   scene-01-correct.png / scene-01-d1-phoneme.png / scene-01-d2-action.png / scene-01-d3-function.png / scene-01-audio.mp3
// 图片 PNG / JPG / WebP 都收（生产包第二节："PNG 或 JPG 原图直接给我们就行"），音频 MP3 / M4A / WAV 都收。

/** 一个场景要齐的四张图；顺序就是四类错误（正确 / 音素 / 动作 / 虚词数字） */
export const IMAGE_SLOTS = ['correct', 'd1-phoneme', 'd2-action', 'd3-function'];
/** 一个场景要齐的五个文件 */
export const SLOTS = [...IMAGE_SLOTS, 'audio'];
/** 30 个场景，编号 01～30（agents《素材方案-30个场景.json》） */
export const SCENE_IDS = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'));

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp'];
const AUDIO_EXT = ['mp3', 'm4a', 'wav'];
/** 合法的素材文件名；别的名字一律当成不是素材（既不出题，也不给下载） */
export const MEDIA_KEY = new RegExp(
  `^scene-\\d{2}-(?:(?:${IMAGE_SLOTS.join('|')})\\.(?:${IMAGE_EXT.join('|')})|audio\\.(?:${AUDIO_EXT.join('|')}))$`,
);

/** @typedef {{id:string,ready:boolean,files:Record<string,string>,missing:string[]}} SceneEntry */
/** @typedef {{ready:number,total:number,scenes:SceneEntry[],note?:string}} Manifest */

/**
 * 从文件名清单算出每个场景齐没齐。纯函数，没有副作用。
 * @param {string[]} keys
 * @param {string[]} [ids]
 * @returns {Manifest}
 */
export function buildManifest(keys, ids = SCENE_IDS) {
  const have = new Set(keys.filter((k) => MEDIA_KEY.test(k)));
  const scenes = ids.map((id) => {
    /** @type {Record<string,string>} */
    const files = {};
    /** @type {string[]} */
    const missing = [];
    for (const slot of SLOTS) {
      const exts = slot === 'audio' ? AUDIO_EXT : IMAGE_EXT;
      const hit = exts.map((e) => `scene-${id}-${slot}.${e}`).find((k) => have.has(k));
      if (hit) files[slot] = hit;
      else missing.push(slot);
    }
    return { id, ready: missing.length === 0, files, missing };
  });
  return { ready: scenes.filter((s) => s.ready).length, total: scenes.length, scenes };
}
