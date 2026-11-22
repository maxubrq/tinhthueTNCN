/**
 * Ghép core cho trang: một lần tính cho cả ba câu hỏi. Hàm thuần, chạy được cả lúc
 * prerender (form mặc định trống cho ra trạng thái EMPTY).
 */
import { InvalidCaseError, UnsupportedPeriodError } from '../core/errors';
import { compareScenarios, findLevers, type Lever, type ScenarioComparison } from '../core/levers';
import { decideObligation, factsFromCase, type ObligationResult } from '../core/obligation';
import { selectRulebook } from '../core/resolve';
import { RULEBOOKS } from '../rules';
import type { Rulebook } from '../rules/schema';
import { activeSources, authorizedSourceKey, formProblems, toAnswers, toCase, type FormState } from './form';

export type Computed =
	| { readonly kind: 'EMPTY'; readonly rb: Rulebook }
	| { readonly kind: 'ERROR'; readonly rb: Rulebook | null; readonly problems: readonly string[] }
	| {
			readonly kind: 'OK';
			readonly rb: Rulebook;
			readonly obligation: ObligationResult;
			readonly comparison: ScenarioComparison;
			readonly levers: readonly Lever[];
	  };

export function compute(f: FormState): Computed {
	let rb: Rulebook;
	try {
		rb = selectRulebook(RULEBOOKS, f.taxYear);
	} catch (e) {
		if (e instanceof UnsupportedPeriodError) return { kind: 'ERROR', rb: null, problems: [e.message] };
		throw e;
	}
	if (activeSources(f).length === 0) return { kind: 'EMPTY', rb };
	const problems = formProblems(f);
	if (problems.length > 0) return { kind: 'ERROR', rb, problems };
	try {
		const c = toCase(f);
		const authorized = authorizedSourceKey(f);
		const comparison = compareScenarios(rb, c, authorized, { practice: f.practice, includeCasual: f.includeCasual });
		const obligation = decideObligation(rb, factsFromCase(rb, c, toAnswers(f)), comparison.self.delta);
		const levers = c.residency === 'RESIDENT' ? findLevers(rb, c, comparison.self) : [];
		return { kind: 'OK', rb, obligation, comparison, levers };
	} catch (e) {
		if (e instanceof InvalidCaseError) return { kind: 'ERROR', rb, problems: e.problems };
		throw e;
	}
}

export const SUPPORTED_YEARS = RULEBOOKS.map((r) => r.taxYear).sort((a, b) => a - b);
