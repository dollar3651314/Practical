/** 测试工具：仓库根目录、固定的"现在"（agents C106）。 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** 固定的"现在"：2026-10-29 04:00:00 UTC = 台湾时间 12:00 */
export const T0 = Date.UTC(2026, 9, 29, 4, 0, 0);
