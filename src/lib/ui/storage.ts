/**
 * Lưu hồ sơ trên máy (ADR-008): chỉ khi người dùng bấm "Lưu trên máy này". Không gửi đi
 * đâu, không đưa vào URL. Mọi truy cập localStorage bọc try/catch vì có thể bị chặn.
 * Hồ sơ lưu kèm `rulebookId` và `revision` để báo khi luật đã đổi (I16).
 */
import type { FormState } from './form';

const KEY = 'tinhthue-tncn:ho-so';

export interface Saved {
	readonly savedAt: string;
	readonly rulebookId: string;
	readonly rulebookRevision: number;
	readonly form: FormState;
}

export function save(form: FormState, rulebookId: string, rulebookRevision: number, now: Date): Saved | null {
	const data: Saved = { savedAt: now.toISOString(), rulebookId, rulebookRevision, form };
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
		return data;
	} catch {
		return null;
	}
}

export function load(): Saved | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as Saved;
		return data?.form?.version === 1 ? data : null;
	} catch {
		return null;
	}
}

export function clear(): void {
	try {
		localStorage.removeItem(KEY);
	} catch {
		/* không có gì để xóa */
	}
}
