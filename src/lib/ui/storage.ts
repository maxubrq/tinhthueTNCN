/**
 * Lưu hồ sơ trên máy (ADR-008): chỉ khi người dùng bấm "Lưu trên máy này". Không gửi đi
 * đâu, không đưa vào URL. Mọi truy cập localStorage bọc try/catch vì có thể bị chặn.
 * Hồ sơ lưu kèm `rulebookId` và `revision` để báo khi luật đã đổi (I16).
 */
import { migrateForm, type FormState, type FormStateV1 } from './form';

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
		// Hồ sơ bản 1 (trước 22/11/2026) vẫn mở được: chuyển sang bản 2 khi đọc.
		const data = JSON.parse(raw) as Omit<Saved, 'form'> & { form: FormStateV1 | FormState };
		const v = data?.form?.version;
		if (v !== 1 && v !== 2) return null;
		return { ...data, form: migrateForm(data.form) };
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
