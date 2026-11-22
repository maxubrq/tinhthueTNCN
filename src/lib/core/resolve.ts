/**
 * Tra tham số theo hai trục (ADR-002, I4) và chọn Rulebook theo kỳ (I3).
 *
 * Hai hàm tách biệt; kiểu của tham số (`PeriodParam` / `DateParam`) quyết định hàm nào
 * dùng được, nên không thể tra nhầm trục. Không có fallback: ngày không thuộc đoạn nào,
 * hay kỳ không có Rulebook, đều ném lỗi.
 */
import type { DateParam, IsoDate, PeriodParam, Rulebook } from '../rules/schema';
import { UncoveredDateError, UnsupportedPeriodError } from './errors';
import type { ParamUse } from './trace';

export interface Resolved<V> {
	readonly value: V;
	readonly use: ParamUse;
}

export function resolveByPeriod<V>(key: string, param: PeriodParam<V, string, string>): Resolved<V> {
	return {
		value: param.value,
		use: {
			key,
			axis: 'TAX_PERIOD',
			status: param.status,
			sourceRefs: param.sourceRefs,
			openIssues: param.openIssues ?? [],
			rationale: param.rationale
		}
	};
}

export function resolveByDate<V>(
	key: string,
	param: DateParam<V, string, string>,
	date: IsoDate
): Resolved<V> {
	// So sánh chuỗi YYYY-MM-DD đúng thứ tự thời gian.
	const seg = param.segments.find((s) => s.from <= date && date <= s.to);
	if (!seg) throw new UncoveredDateError(key, date);
	return {
		value: seg.value,
		use: {
			key,
			axis: 'EVENT_DATE',
			segment: { from: seg.from, to: seg.to },
			status: seg.status,
			sourceRefs: seg.sourceRefs,
			openIssues: seg.openIssues ?? [],
			rationale: seg.rationale
		}
	};
}

/** Chọn đúng Rulebook của kỳ. Không có thì ném lỗi, không dùng luật mới nhất. */
export function selectRulebook<R extends Rulebook>(rulebooks: readonly R[], taxPeriod: number): R {
	const found = rulebooks.filter((r) => r.taxYear === taxPeriod);
	if (found.length === 1) return found[0];
	if (found.length > 1) throw new Error(`Có ${found.length} Rulebook cho kỳ ${taxPeriod}.`);
	throw new UnsupportedPeriodError(
		taxPeriod,
		rulebooks.map((r) => r.taxYear).sort((a, b) => a - b)
	);
}
