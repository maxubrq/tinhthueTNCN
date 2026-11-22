/** Danh sách kỳ được hỗ trợ. Thêm năm mới: thêm file vn-YYYY.ts và đưa vào đây. */
import type { Rulebook } from './schema';
import { vn2025 } from './vn-2025';
import { vn2026 } from './vn-2026';

export const RULEBOOKS: readonly Rulebook[] = [vn2025, vn2026];

export { vn2025, vn2026 };
