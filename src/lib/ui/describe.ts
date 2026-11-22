/**
 * Diễn đạt bằng lời cho UI: cờ, căn cứ, kết luận. Không tính toán, không định dạng tiền.
 */
import type { Line, Flag } from '../core/trace';
import type { Verdict } from '../core/obligation';
import type { Rulebook } from '../rules/schema';

/** Nhãn ngắn đặt ngay cạnh con số (I14). */
export function flagLabel(flags: readonly Flag[]): string | null {
	if (flags.some((f) => f.kind === 'SIMULATED')) return 'ước tính';
	if (flags.some((f) => f.kind === 'PARAM' && f.status === 'PENDING')) return 'chờ xác minh';
	if (flags.some((f) => f.kind === 'PARAM' && f.status === 'INFERRED')) return 'suy luận';
	return null;
}

export interface FlagText {
	readonly label: string;
	readonly text: string;
	/** Câu hỏi luật chưa trả lời, viết cho người dùng đọc. */
	readonly issues: readonly string[];
}

export function flagTexts(rb: Rulebook, flags: readonly Flag[]): FlagText[] {
	return flags.map((f) => {
		if (f.kind === 'SIMULATED') {
			const p = f.practiceIds.map((id) => rb.withholdingPractices.find((x) => x.id === id)?.label ?? id);
			return {
				label: 'Ước tính',
				text:
					'Bạn chưa nhập số thuế đã khấu trừ, nên app tự ước tính' +
					(p.length ? `, giả định rằng ${p.join('; ')}.` : ' theo đúng cách luật quy định.') +
					' Số thật có trên eTax Mobile hoặc chứng từ khấu trừ thuế.',
				issues: []
			};
		}
		return {
			label: f.status === 'PENDING' ? 'Chờ xác minh' : 'Suy luận',
			text: f.rationale,
			issues: f.openIssues
				.map((id) => (rb.openIssues as Record<string, { question: string }>)[id]?.question)
				.filter((q): q is string => q !== undefined)
		};
	});
}

/** Văn bản làm căn cứ cho một dòng, bỏ ghi chú nghiên cứu nội bộ. */
export function citations(rb: Rulebook, line: Line): string[] {
	const out = new Set<string>();
	for (const p of line.params) {
		for (const r of p.sourceRefs) {
			const s = rb.sources[r.source];
			if (!s || s.kind === 'RESEARCH') continue;
			out.add(r.locator ? `${s.number}, ${r.locator}` : s.number);
		}
	}
	return [...out];
}

export const VERDICT_TITLE: Record<Verdict, string> = {
	NOT_IN_PROGRESSIVE_FLOW: 'Bạn không quyết toán theo biểu lũy tiến',
	MUST_SELF_SETTLE: 'Bạn phải tự quyết toán',
	MAY_AUTHORIZE: 'Bạn ủy quyền cho công ty được',
	EXEMPT_SMALL_DELTA: 'Bạn được miễn nộp phần chênh lệch',
	MAY_SELF_SETTLE_FOR_REFUND: 'Tự quyết toán nếu muốn được hoàn',
	NOT_REQUIRED: 'Bạn không phải quyết toán',
	NEEDS_DELTA: 'Cần thêm số liệu'
};
