/**
 * Dấu vết (I13) và cờ (I14).
 *
 * Mỗi con số trong kết quả là một `Line`: số tiền, input nào của hồ sơ, tham số nào của
 * Rulebook (kèm điều khoản), và các dòng nó dựa vào. Cờ của một dòng gồm cờ của chính
 * nó cộng cờ của mọi dòng nó dựa vào, nên UI chỉ cần đọc `line.flags` để hiện cờ ngay
 * cạnh con số.
 */
import type { IsoDate, ParamStatus, SourceRef } from '../rules/schema';
import type { Money } from './money';

/** Một lần dùng tham số Rulebook. */
export interface ParamUse {
	/** Đường dẫn trong Rulebook, ví dụ "deductions.taxpayerMonthly". */
	readonly key: string;
	readonly axis: 'TAX_PERIOD' | 'EVENT_DATE';
	/** Với tham số theo ngày: đoạn hiệu lực đã dùng. */
	readonly segment?: { readonly from: IsoDate; readonly to: IsoDate };
	readonly status: ParamStatus;
	readonly sourceRefs: readonly SourceRef<string>[];
	readonly openIssues: readonly string[];
	readonly rationale?: string;
}

export type Flag =
	| {
			readonly kind: 'PARAM';
			readonly status: 'INFERRED' | 'PENDING';
			readonly paramKey: string;
			readonly segment?: { readonly from: IsoDate; readonly to: IsoDate };
			readonly openIssues: readonly string[];
			readonly rationale: string;
	  }
	| {
			/** Số đã khấu trừ do app mô phỏng, không phải số người dùng nhập (I11). */
			readonly kind: 'SIMULATED';
			readonly sourceId: string;
			/** Giả định thực hành đã dùng, rỗng nếu mô phỏng theo đúng luật. */
			readonly practiceIds: readonly string[];
	  };

/** Cảnh báo cho người dùng: dữ kiện bị loại, giả định đang dùng, rủi ro. */
export interface Warning {
	readonly code: string;
	readonly message: string;
	readonly inputs?: readonly string[];
	readonly openIssues?: readonly string[];
}

export interface Line {
	readonly id: string;
	readonly label: string;
	readonly amount: Money;
	/** Đường dẫn tới input trong hồ sơ, ví dụ "incomeSources[0].payments[11].gross". */
	readonly inputs: readonly string[];
	readonly params: readonly ParamUse[];
	readonly dependsOn: readonly string[];
	readonly flags: readonly Flag[];
	readonly note?: string;
}

export interface LineSpec {
	readonly id: string;
	readonly label: string;
	readonly amount: Money;
	readonly inputs?: readonly string[];
	readonly params?: readonly ParamUse[];
	readonly dependsOn?: readonly string[];
	readonly extraFlags?: readonly Flag[];
	readonly note?: string;
}

function useKey(u: ParamUse): string {
	return `${u.key}@${u.segment?.from ?? ''}`;
}

function flagKey(f: Flag): string {
	return f.kind === 'PARAM'
		? `P:${f.paramKey}@${f.segment?.from ?? ''}`
		: `S:${f.sourceId}:${f.practiceIds.join(',')}`;
}

export function dedupeUses(uses: readonly ParamUse[]): ParamUse[] {
	const seen = new Map<string, ParamUse>();
	for (const u of uses) if (!seen.has(useKey(u))) seen.set(useKey(u), u);
	return [...seen.values()];
}

export function flagsOf(uses: readonly ParamUse[]): Flag[] {
	const out: Flag[] = [];
	for (const u of dedupeUses(uses)) {
		if (u.status === 'VERIFIED') continue;
		out.push({
			kind: 'PARAM',
			status: u.status,
			paramKey: u.key,
			segment: u.segment,
			openIssues: u.openIssues,
			rationale: u.rationale ?? ''
		});
	}
	return out;
}

export function mergeFlags(...groups: readonly (readonly Flag[])[]): Flag[] {
	const seen = new Map<string, Flag>();
	for (const g of groups) for (const f of g) if (!seen.has(flagKey(f))) seen.set(flagKey(f), f);
	return [...seen.values()];
}

/** Gom các dòng theo thứ tự tạo; cờ lan truyền theo `dependsOn`. */
export class Trace {
	readonly #lines = new Map<string, Line>();

	add(spec: LineSpec): Line {
		if (this.#lines.has(spec.id)) throw new Error(`Dòng "${spec.id}" đã tồn tại.`);
		const deps = (spec.dependsOn ?? []).map((id) => {
			const l = this.#lines.get(id);
			if (!l) throw new Error(`Dòng "${spec.id}" dựa vào dòng chưa có: "${id}".`);
			return l;
		});
		const params = dedupeUses(spec.params ?? []);
		const line: Line = {
			id: spec.id,
			label: spec.label,
			amount: spec.amount,
			inputs: spec.inputs ?? [],
			params,
			dependsOn: spec.dependsOn ?? [],
			flags: mergeFlags(flagsOf(params), spec.extraFlags ?? [], ...deps.map((d) => d.flags)),
			note: spec.note
		};
		this.#lines.set(line.id, line);
		return line;
	}

	get(id: string): Line {
		const l = this.#lines.get(id);
		if (!l) throw new Error(`Không có dòng "${id}".`);
		return l;
	}

	lines(): Line[] {
		return [...this.#lines.values()];
	}
}
