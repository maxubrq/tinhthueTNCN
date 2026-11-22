<!--
  Trang duy nhất (ADR-008): hoàn cảnh → thu nhập → giảm trừ, kết luận cập nhật ngay khi gõ.
  Việc chính: cho bạn biết quyết toán thuế năm nay bạn phải làm gì.
  Nghĩa: người làm công ăn lương, tới từ tìm kiếm trong mùa quyết toán, đọc trên điện
  thoại, mở vài lần mỗi năm; trang sống nhiều năm vì luật là dữ liệu.

  Lưới: 4 cột điện thoại, 12 cột desktop. Desktop: Kết luận dính ở cột 1–4, nội dung cột
  5–12. Điện thoại: Kết luận nằm ngay sau phần nhập. Hai cỡ chữ, một màu tín hiệu.
  Riêng tư: không có số tiền nào trong URL; chỉ lưu khi bấm "Lưu trên máy này".
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import AmountField from '#lib/components/AmountField.svelte';
	import Choice from '#lib/components/Choice.svelte';
	import Money from '#lib/components/Money.svelte';
	import Section from '#lib/components/Section.svelte';
	import type { Assessment } from '#lib/core/settlement.ts';
	import type { Line } from '#lib/core/trace.ts';
	import { RISKY_TRICKS } from '#lib/core/levers.ts';
	import { RULEBOOKS } from '#lib/rules/index.ts';
	import type { Unit } from '#lib/ui/amount.ts';
	import { compute, SUPPORTED_YEARS } from '#lib/ui/compute.ts';
	import { citations, flagLabel, flagTexts, VERDICT_TITLE } from '#lib/ui/describe.ts';
	import { activeSources, defaultForm, newDependent, newSource, type FormState } from '#lib/ui/form.ts';
	import * as storage from '#lib/ui/storage.ts';

	const LATEST = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1];
	const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

	let form: FormState = $state(defaultForm(LATEST));
	let unit: Unit = $state('trieu');
	let view: 'SELF' | 'AUTHORIZED' | null = $state(null);
	let saved: storage.Saved | null = $state(null);
	let saveNote = $state('');

	const rb = $derived(RULEBOOKS.find((r) => r.taxYear === form.taxYear) ?? RULEBOOKS[RULEBOOKS.length - 1]);
	const result = $derived(compute(form));

	/** Kịch bản app đề xuất: ủy quyền nếu được và không thiệt; còn lại tự quyết toán. */
	const primary = $derived.by((): { kind: 'SELF' | 'AUTHORIZED'; a: Assessment } | null => {
		if (result.kind !== 'OK') return null;
		const { authorized, self, selfAdvantage } = result.comparison;
		if (authorized && result.obligation.canAuthorize && (selfAdvantage ?? 0) <= 0) return { kind: 'AUTHORIZED', a: authorized };
		return { kind: 'SELF', a: self };
	});

	const shown = $derived.by((): Assessment | null => {
		if (result.kind !== 'OK' || !primary) return null;
		const k = view ?? primary.kind;
		return k === 'AUTHORIZED' && result.comparison.authorized ? result.comparison.authorized : result.comparison.self;
	});

	const TOTALS = new Set(['taxableIncome', 'insurance', 'deductions', 'assessableIncome', 'annualTax', 'withheld', 'delta']);
	const visibleLines = $derived(
		(shown?.lines ?? []).filter((l) => TOTALS.has(l.id) || l.amount !== 0)
	);
	const flaggedCount = $derived((shown?.lines ?? []).filter((l) => l.flags.length > 0).length);

	const longSources = $derived(activeSources(form).filter((s) => s.contract === 'LONG'));
	const hasShort = $derived(activeSources(form).some((s) => s.contract === 'SHORT'));
	const estimating = $derived(activeSources(form).some((s) => s.withheld === null));
	const practice = $derived(rb.withholdingPractices[0]);
	const minUnemploymentCap = $derived(Math.min(...Object.values(rb.insurance.unemploymentMonthlyCap.segments[0].value)));
	/** So sánh hai kịch bản khi ủy quyền là lựa chọn thật: được ủy quyền, hoặc chỉ vướng các khoản tự khai (bước 4). */
	const showCompare = $derived(
		result.kind === 'OK' &&
			result.comparison.authorized !== null &&
			(result.obligation.canAuthorize || (result.obligation.step === 4 && result.obligation.notes.length > 0))
	);
	const FLAG_PHRASE: Record<string, string> = {
		'ước tính': 'số app ước tính',
		'suy luận': 'giả định suy luận',
		'chờ xác minh': 'số chưa được xác minh'
	};

	function deltaLabel(amount: number): string {
		return amount > 0 ? 'Phải nộp thêm' : amount < 0 ? 'Được hoàn' : 'Không chênh lệch';
	}

	function viDate(d: string): string {
		const [y, m, day] = d.split('-');
		return `${day}/${m}/${y}`;
	}

	function capText(v: number): string {
		return `${(v / 1_000_000).toLocaleString('vi-VN')} triệu`;
	}

	function sourceName(key: string): string {
		return form.sources.find((s) => s.key === key)?.name || 'nơi đang làm';
	}

	function addSource() {
		const key = `s${form.nextKey++}`;
		form.sources.push(newSource(key, `Nơi trả thu nhập ${form.sources.length + 1}`));
	}

	function removeSource(key: string) {
		form.sources = form.sources.filter((s) => s.key !== key);
		const first = form.sources[0]?.key ?? null;
		if (form.personalSourceKey === key) form.personalSourceKey = first;
		if (form.currentSourceKey === key) form.currentSourceKey = first;
	}

	function addDependent() {
		form.dependents.push(newDependent(`d${form.nextKey++}`, form.dependents.length + 1));
	}

	function removeDependent(key: string) {
		form.dependents = form.dependents.filter((d) => d.key !== key);
	}

	function doSave() {
		const s = storage.save($state.snapshot(form), rb.id, rb.revision, new Date());
		saved = s;
		saveNote = s ? 'Đã lưu trên máy này. Không có gì được gửi đi.' : 'Trình duyệt không cho lưu, nên hồ sơ chưa được lưu.';
	}

	function doClear() {
		storage.clear();
		saved = null;
		form = defaultForm(LATEST);
		view = null;
		saveNote = 'Đã xóa hồ sơ khỏi máy này.';
	}

	function doExport() {
		const data = JSON.stringify({ rulebookId: rb.id, rulebookRevision: rb.revision, form: $state.snapshot(form) }, null, 2);
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
		a.download = `ho-so-thue-${form.taxYear}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	onMount(() => {
		const s = storage.load();
		if (!s) return;
		saved = s;
		form = s.form;
		const now = RULEBOOKS.find((r) => r.id === s.rulebookId);
		saveNote =
			now && now.revision !== s.rulebookRevision
				? `Đã mở hồ sơ lưu ngày ${viDate(s.savedAt.slice(0, 10))}. Từ đó đến nay, dữ liệu luật năm ${now.taxYear} đã cập nhật, nên kết quả có thể khác lần trước.`
				: `Đã mở hồ sơ lưu ngày ${viDate(s.savedAt.slice(0, 10))}.`;
	});
</script>

<svelte:head>
	<title>Quyết toán thuế TNCN năm {form.taxYear}: tự quyết toán, hoàn thuế, giảm thuế</title>
	<meta
		name="description"
		content="Biết bạn có phải tự quyết toán thuế TNCN không, được hoàn hay phải nộp thêm bao nhiêu, và giảm thuế hợp pháp bằng cách nào. Tính trên máy bạn, kèm căn cứ."
	/>
</svelte:head>

{#snippet lineRow(l: Line, signed: boolean)}
	{@const tag = flagLabel(l.flags)}
	{@const cites = citations(rb, l)}
	{@const texts = flagTexts(rb, l.flags)}
	{#if tag || cites.length || l.note}
		<details class="line" class:total={TOTALS.has(l.id)}>
			<summary>
				<span class="l">{l.label}</span>
				<span class="a"><Money value={l.amount} {unit} absolute={!signed} /></span>
				{#if tag}<span class="tag">{tag}</span>{/if}
			</summary>
			<div class="more">
				{#if cites.length}<p><strong>Căn cứ.</strong> {cites.join('; ')}.</p>{/if}
				{#each texts as t, i (i)}
					<p><strong>{t.label}.</strong> {t.text}</p>
				{/each}
				{#if l.note}<p>{l.note}</p>{/if}
			</div>
		</details>
	{:else}
		<div class="line" class:total={TOTALS.has(l.id)}>
			<div class="summary">
				<span class="l">{l.label}</span>
				<span class="a"><Money value={l.amount} {unit} absolute={!signed} /></span>
			</div>
		</div>
	{/if}
{/snippet}

<div class="page">
	<header class="masthead">
		<p class="brand"><strong>Tính thuế TNCN</strong><span>Tính trên máy bạn. Không gửi số nào đi.</span></p>
		<h1>Quyết toán thuế thu nhập cá nhân năm {form.taxYear}</h1>
		<p class="lede">
			Trang này trả lời ba câu hỏi: bạn có phải tự quyết toán không; bạn được hoàn hay phải nộp thêm bao
			nhiêu; bạn giảm thuế hợp pháp được bao nhiêu. Kết luận cập nhật ngay khi bạn nhập, và con số nào cũng
			kèm căn cứ.
		</p>
	</header>

	<div class="inputs">
		<Section number="01" title="Hoàn cảnh" lede="Năm thuế quyết định app dùng dữ liệu luật của năm nào. Tình trạng cư trú quyết định cách tính.">
			<Choice
				legend="Năm thuế"
				options={SUPPORTED_YEARS.map((y) => ({ value: y, label: String(y) }))}
				bind:value={form.taxYear}
				hint={`Quyết toán năm ${form.taxYear} nộp trong năm ${form.taxYear + 1}.`}
			/>
			<Choice
				legend="Bạn là cá nhân cư trú?"
				options={[
					{ value: true, label: 'Có' },
					{ value: false, label: 'Không' }
				]}
				bind:value={form.resident}
				hint="Bạn là cá nhân cư trú nếu thỏa một trong ba điều kiện: có mặt ở Việt Nam từ 183 ngày trở lên trong năm; có nơi ở thường xuyên tại Việt Nam; thuê nhà ở Việt Nam từ 183 ngày trở lên."
			/>
			<details class="special">
				<summary>Trường hợp đặc biệt</summary>
				<div class="checks">
					<label><input type="checkbox" bind:checked={form.special.foreignerLeaving} /> Là người nước ngoài và đã thôi làm việc tại Việt Nam trong năm</label>
					{#if form.special.foreignerLeaving}
						<label class="date">Ngày hợp đồng kết thúc <input type="date" min="{form.taxYear}-01-01" max="{form.taxYear}-12-31" bind:value={form.special.foreignerContractEnd} /></label>
					{/if}
					<label><input type="checkbox" bind:checked={form.special.firstResidentYear} /> Đây là năm đầu tiên cư trú, tính theo 12 tháng liên tục chứ không theo năm dương lịch</label>
					<label><input type="checkbox" bind:checked={form.special.foreignIncome} /> Có thu nhập từ nước ngoài hoặc từ tổ chức quốc tế mà chưa bị khấu trừ thuế</label>
					<label><input type="checkbox" bind:checked={form.special.hardship} /> Muốn xin giảm thuế vì thiên tai hay bệnh hiểm nghèo</label>
					<label><input type="checkbox" bind:checked={form.special.insuranceOnly} /> Thu nhập duy nhất là khoản chi trả bảo hiểm đã bị khấu trừ 10%</label>
				</div>
			</details>
		</Section>

		<Section number="02" title="Thu nhập" lede="Khai từng nơi trả lương, tiền công cho bạn trong năm. Lấy số trên phiếu lương, trước khi trừ bảo hiểm và thuế.">
			{#each form.sources as s, i (s.key)}
				<fieldset class="source">
					<legend class="source-head">
						<span class="idx">{String(i + 1).padStart(2, '0')}</span>
						<span>{s.name || 'Nơi trả lương'}</span>
					</legend>
					<div class="fields">
						<label class="text">
							<span class="label">Tên nơi trả lương</span>
							<input type="text" bind:value={s.name} autocomplete="organization" />
						</label>
						<Choice
							legend="Hợp đồng"
							options={[
								{ value: 'LONG', label: 'Từ 3 tháng' },
								{ value: 'SHORT', label: 'Dưới 3 tháng hoặc không có' }
							]}
							bind:value={s.contract}
						/>
						<AmountField
							label="Thu nhập mỗi tháng"
							bind:value={s.monthly}
							hint="Lương và phụ cấp chịu thuế, trước khi trừ bảo hiểm và thuế."
						/>
						<div class="months">
							<span class="label" id="m-{s.key}">Các tháng nhận lương</span>
							<div class="row" role="group" aria-labelledby="m-{s.key}">
								<select aria-label="Từ tháng" bind:value={s.fromMonth}>
									{#each MONTHS as m (m)}<option value={m}>Tháng {m}</option>{/each}
								</select>
								<span aria-hidden="true">đến</span>
								<select aria-label="Đến tháng" bind:value={s.toMonth}>
									{#each MONTHS as m (m)}<option value={m}>Tháng {m}</option>{/each}
								</select>
							</div>
						</div>
						<Choice
							legend="Bảo hiểm bắt buộc tính trên"
							options={[
								{ value: 'GROSS', label: 'Thu nhập vừa nhập' },
								{ value: 'OTHER', label: 'Mức lương khác' },
								{ value: 'NONE', label: 'Không đóng' }
							]}
							bind:value={s.insurance}
						/>
						{#if s.insurance === 'OTHER'}
							<AmountField label="Lương đóng bảo hiểm mỗi tháng" bind:value={s.insuranceSalary} hint="Có trên hợp đồng lao động hoặc phiếu lương." />
						{/if}
						{#if s.insurance !== 'NONE'}
							<label class="text">
								<span class="label">Vùng lương tối thiểu</span>
								<select bind:value={s.region}>
									<option value="I">Vùng I (nội thành Hà Nội, TP.HCM và một số nơi khác)</option>
									<option value="II">Vùng II</option>
									<option value="III">Vùng III</option>
									<option value="IV">Vùng IV</option>
								</select>
								<span class="hint">Chỉ có tác dụng khi lương đóng bảo hiểm từ {capText(minUnemploymentCap)}/tháng trở lên, mức trần bảo hiểm thất nghiệp thấp nhất.</span>
							</label>
						{/if}
						<AmountField label="Thưởng, khoản trả một lần" bind:value={s.bonus} hint="Tổng thưởng Tết, thưởng hiệu quả và các khoản trả một lần trong năm." />
						{#if (s.bonus ?? 0) > 0}
							<label class="text">
								<span class="label">Tháng nhận thưởng</span>
								<span class="hint">Nhiều khoản thì chọn tháng nhận khoản lớn nhất.</span>
								<select bind:value={s.bonusMonth}>
									{#each MONTHS as m (m)}<option value={m}>Tháng {m}</option>{/each}
								</select>
							</label>
						{/if}
						<AmountField
							label="Thuế đã khấu trừ cả năm"
							bind:value={s.withheld}
							hint="Xem trên eTax Mobile hoặc chứng từ khấu trừ thuế. Để trống thì app tự ước tính và ghi rõ đó là số ước tính."
						/>
					</div>
					{#if form.sources.length > 1}
						<button type="button" class="quiet" onclick={() => removeSource(s.key)}>Bỏ {s.name || 'nơi này'}</button>
					{/if}
				</fieldset>
			{/each}
			<button type="button" class="add" onclick={addSource}>Thêm nơi trả lương</button>

			{#if activeSources(form).length > 0}
				<Choice
					legend="Bạn đăng ký giảm trừ gia cảnh ở"
					options={[...activeSources(form).map((s) => ({ value: s.key as string | null, label: s.name || 'Nơi trả lương' })), { value: null, label: 'Không nơi nào' }]}
					bind:value={form.personalSourceKey}
					hint={`Chỉ được đăng ký ở một nơi. Mỗi tháng, nơi đó trừ ${capText(rb.deductions.taxpayerMonthly.value)} cho bản thân bạn trước khi tính thuế.`}
				/>
				<Choice
					legend="Lúc quyết toán, bạn đang làm ở"
					options={[...longSources.map((s) => ({ value: s.key as string | null, label: s.name || 'Nơi trả lương' })), { value: null, label: 'Đã nghỉ, không còn làm' }]}
					bind:value={form.currentSourceKey}
					hint="Chỉ nơi bạn đang làm, có hợp đồng từ 3 tháng, mới nhận ủy quyền quyết toán."
				/>
			{/if}
			{#if estimating && practice}
				<Choice
					legend="Tháng 1 đến tháng 6/2026, công ty khấu trừ thuế theo"
					options={[
						{ value: 'DEFAULT', label: 'Biểu 7 bậc cũ' },
						{ value: 'NONE', label: 'Biểu 5 bậc mới' }
					]}
					bind:value={form.practice}
					hint="Chỉ dùng khi bạn để trống ô Thuế đã khấu trừ. Luật mới áp cho cả năm, nhưng nhiều công ty có lẽ chỉ đổi sang biểu mới từ 1/7/2026. Không chắc thì giữ biểu cũ, rồi tra số thật trên eTax."
				/>
			{/if}
			{#if hasShort}
				<Choice
					legend="Khi tự quyết toán, bạn có gộp thu nhập vãng lai không?"
					options={[
						{ value: true, label: 'Gộp' },
						{ value: false, label: 'Không gộp' }
					]}
					bind:value={form.includeCasual}
					hint="Thu nhập vãng lai là tiền công từ nơi không ký hợp đồng hoặc hợp đồng dưới 3 tháng, thường đã bị khấu trừ 10%. Không gộp thì bỏ cả khoản thu nhập lẫn 10% đã khấu trừ. Nếu bình quân mỗi tháng vượt ngưỡng, luật buộc bạn gộp."
				/>
			{/if}
		</Section>

		<Section number="03" title="Giảm trừ" lede="Người phụ thuộc, và những khoản bạn đã chi trong năm được trừ trước khi tính thuế.">
			{#each form.dependents as d (d.key)}
				<fieldset class="source">
					<legend class="source-head"><span>{d.name || 'Người phụ thuộc'}</span></legend>
					<div class="fields">
						<label class="text">
							<span class="label">Tên</span>
							<input type="text" bind:value={d.name} autocomplete="off" />
						</label>
						<div class="months">
							<span class="label" id="dm-{d.key}">Các tháng được tính</span>
							<div class="row" role="group" aria-labelledby="dm-{d.key}">
								<select aria-label="Từ tháng" bind:value={d.fromMonth}>
									{#each MONTHS as m (m)}<option value={m}>Tháng {m}</option>{/each}
								</select>
								<span aria-hidden="true">đến</span>
								<select aria-label="Đến tháng" bind:value={d.toMonth}>
									{#each MONTHS as m (m)}<option value={m}>Tháng {m}</option>{/each}
								</select>
							</div>
						</div>
						<label class="check">
							<input type="checkbox" bind:checked={d.registeredInTime} />
							Đã đăng ký, chậm nhất ngày {viDate(rb.deductions.dependentRegistrationDeadline.value)}
						</label>
					</div>
					<button type="button" class="quiet" onclick={() => removeDependent(d.key)}>Bỏ {d.name || 'người này'}</button>
				</fieldset>
			{/each}
			<button type="button" class="add" onclick={addDependent}>Thêm người phụ thuộc</button>

			<div class="fields">
				<AmountField
					label="Hưu trí tự nguyện"
					bind:value={form.claims.voluntaryPension}
					hint="Tổng cả năm, tính cả phần công ty đóng cho bạn. Trừ tối đa {capText(rb.deductions.voluntaryPension.value.monthlyCap * 12)}/năm{rb.deductions.voluntaryPension.value.covers.length > 1 ? ', chung với bảo hiểm nhân thọ' : ''}."
				/>
				<AmountField
					label="Bảo hiểm nhân thọ"
					bind:value={form.claims.lifeInsurance}
					disabled={!rb.deductions.voluntaryPension.value.covers.includes('LIFE_INSURANCE')}
					hint={rb.deductions.voluntaryPension.value.covers.includes('LIFE_INSURANCE') ? 'Phí bảo hiểm đã đóng trong năm.' : `Năm ${form.taxYear} chưa được trừ khoản này.`}
				/>
				<AmountField
					label="Chi phí y tế"
					bind:value={form.claims.medical}
					disabled={rb.deductions.medical.value === null}
					hint={rb.deductions.medical.value?.annualCap
						? `Phần bảo hiểm chưa trả, có hóa đơn đứng tên. Trừ tối đa ${capText(rb.deductions.medical.value.annualCap)}/năm, và chỉ khi tự quyết toán.`
						: `Năm ${form.taxYear} chưa có khoản giảm trừ này.`}
				/>
				<AmountField
					label="Chi phí giáo dục"
					bind:value={form.claims.education}
					disabled={rb.deductions.education.value === null}
					hint={rb.deductions.education.value?.annualCap
						? `Có hóa đơn đứng tên bạn hoặc người phụ thuộc. Trừ tối đa ${capText(rb.deductions.education.value.annualCap)}/năm, và chỉ khi tự quyết toán.`
						: `Năm ${form.taxYear} chưa có khoản giảm trừ này.`}
				/>
				<AmountField
					label="Từ thiện, nhân đạo, khuyến học"
					bind:value={form.claims.charity}
					disabled={rb.deductions.charity.value === null}
					hint="Qua tổ chức được phép nhận, có chứng từ. Chỉ trừ khi tự quyết toán."
				/>
			</div>
		</Section>
	</div>

	<aside class="verdict" id="ket-luan" aria-labelledby="kl">
		<div class="verdict-inner">
			<header class="verdict-head">
				<h2 id="kl">Kết luận · năm {form.taxYear}</h2>
			</header>

			<div aria-live="polite">
				{#if result.kind === 'EMPTY'}
					<p class="display">Nhập thu nhập ở mục 02.</p>
					<p class="mute">Kết luận hiện ra ngay khi bạn nhập con số đầu tiên.</p>
				{:else if result.kind === 'ERROR'}
					<p class="display">Chưa tính được.</p>
					<ul class="problems">
						{#each result.problems as p, i (i)}<li>{p}</li>{/each}
					</ul>
				{:else if primary}
					{@const ob = result.obligation}
					{@const cmp = result.comparison}
					{@const dLine = primary.a.lines.find((l) => l.id === 'delta')}
					<p class="display">{VERDICT_TITLE[ob.verdict]}.</p>

					<div class="figure">
						<p class="figure-label">
							{deltaLabel(primary.a.delta.amount)}{showCompare ? (primary.kind === 'AUTHORIZED' ? ' nếu ủy quyền' : ' nếu tự quyết toán') : ''}
						</p>
						<p class="display signal"><Money value={primary.a.delta.amount} {unit} absolute /></p>
						{#if dLine && flagLabel(dLine.flags)}
							<p class="mute">Con số này dựa một phần vào {FLAG_PHRASE[flagLabel(dLine.flags) ?? '']}. Xem mục 04.</p>
						{/if}
					</div>

					{#if cmp.authorized && showCompare}
						<dl class="compare">
							<div class:pick={primary.kind === 'AUTHORIZED'}>
								<dt>Ủy quyền cho {sourceName(cmp.authorized.scenario.filing === 'AUTHORIZED' ? cmp.authorized.scenario.sourceId : '')}</dt>
								<dd>{deltaLabel(cmp.authorized.delta.amount)} <Money value={cmp.authorized.delta.amount} {unit} absolute /></dd>
							</div>
							<div class:pick={primary.kind === 'SELF'}>
								<dt>Tự quyết toán</dt>
								<dd>{deltaLabel(cmp.self.delta.amount)} <Money value={cmp.self.delta.amount} {unit} absolute /></dd>
							</div>
						</dl>
						{#if (cmp.selfAdvantage ?? 0) > 0}
							<p>Tự quyết toán, bạn lợi thêm <strong><Money value={cmp.selfAdvantage ?? 0} {unit} /></strong>.</p>
						{/if}
					{/if}

					<p>{ob.summary}</p>
					{#if ob.deadline}
						<p>
							<strong>Hạn nộp hồ sơ:</strong>
							{#if ob.deadline.date}{viDate(ob.deadline.date)}.{:else}{ob.deadline.rule} <span class="mute">Cục Thuế chưa công bố ngày cụ thể.</span>{/if}
						</p>
					{/if}
					{#if ob.filingOffice}<p><strong>Nơi nộp:</strong> {ob.filingOffice}</p>{/if}
					{#each ob.notes as n, i (i)}<p class="mute">{n}</p>{/each}
				{/if}
			</div>

			<Choice
				legend="Đơn vị hiển thị"
				options={[
					{ value: 'trieu', label: 'Triệu' },
					{ value: 'nghin', label: 'Nghìn' },
					{ value: 'dong', label: 'Đồng' }
				]}
				bind:value={unit}
			/>

			<div class="store">
				<div class="buttons">
					<button type="button" onclick={doSave}>Lưu trên máy này</button>
					<button type="button" onclick={doExport}>Tải hồ sơ về máy</button>
					{#if saved}<button type="button" onclick={doClear}>Xóa hồ sơ</button>{/if}
				</div>
				<p class="mute" aria-live="polite">{saveNote || 'App không tự lưu gì. Đóng tab là mất hồ sơ.'}</p>
			</div>
		</div>
	</aside>

	<div class="details">
		<Section number="04" title="Cách tính" lede="Mỗi con số đều có căn cứ. Chạm vào dòng có dấu + để xem văn bản và giả định đằng sau nó.">
			{#if result.kind === 'OK' && shown}
				{#if showCompare}
					<Choice
						legend="Xem cách tính khi"
						options={[
							{ value: 'AUTHORIZED', label: 'Ủy quyền' },
							{ value: 'SELF', label: 'Tự quyết toán' }
						]}
						bind:value={() => view ?? primary?.kind ?? 'SELF', (v) => (view = v)}
					/>
				{/if}
				{#if shown.warnings.length}
					<ul class="warnings">
						{#each shown.warnings as w (w.code + w.message)}<li>{w.message}</li>{/each}
					</ul>
				{/if}
				<div class="lines">
					{#each visibleLines as l (l.id)}
						{@render lineRow(l, l.id !== 'delta')}
					{/each}
				</div>
				{#if flaggedCount > 0}
					<p class="mute">Có {flaggedCount} dòng dựa một phần vào số ước tính, suy luận hoặc số chưa xác minh.</p>
				{/if}
			{:else}
				<p class="mute">Nhập thu nhập ở mục 02 để xem cách tính.</p>
			{/if}
		</Section>

		<Section number="05" title="Giảm thuế" lede="Mỗi khoản giảm trừ còn được dùng thêm bao nhiêu, và nếu dùng hết thì bạn giảm được bao nhiêu thuế. App tính đúng theo biểu thuế, kể cả khi thu nhập rơi xuống bậc thấp hơn.">
			{#if result.kind === 'OK' && result.levers.length}
				<ol class="levers">
					{#each [...result.levers].sort((a, b) => b.saving - a.saving) as lv (lv.id)}
						<li>
							<div class="lever-head">
								<h3>{lv.label}</h3>
								<p class="saving">Giảm <Money value={lv.saving} {unit} />{lv.per ? ' cho mỗi ' : ''}{#if lv.per}<Money value={lv.per} {unit} />{/if}</p>
							</div>
							<p class="mute">
								{#if lv.room !== null}Còn được trừ thêm <Money value={lv.room} {unit} />.{:else}Luật chưa đặt mức tối đa.{/if}
								{#if lv.requiresSelfSettlement}<strong class="ink"> Chỉ khi tự quyết toán.</strong>{/if}
								{#if flagLabel(lv.flags)}<span> Dựa một phần vào {FLAG_PHRASE[flagLabel(lv.flags) ?? '']}.</span>{/if}
							</p>
							<ul class="conds">
								{#each lv.conditions as c, i (i)}<li>{c}</li>{/each}
								{#each lv.limits as lim, i (i)}<li>{lim.label}: không quá <Money value={lim.amount} {unit} />.</li>{/each}
							</ul>
						</li>
					{/each}
				</ol>
				<div class="risky">
					<h3>Đừng làm những việc này</h3>
					<ul>
						{#each RISKY_TRICKS as t (t.code)}<li>{t.message}</li>{/each}
					</ul>
				</div>
			{:else}
				<p class="mute">Nhập thu nhập ở mục 02 để xem bạn giảm thuế được bao nhiêu.</p>
			{/if}
		</Section>
	</div>

	{#if primary}
		<!-- Trạng thái: Δ hiện tại, cho điện thoại khi Kết luận nằm dưới phần nhập. Neo không mang số. -->
		<a class="jump" href="#ket-luan">
			<span>{deltaLabel(primary.a.delta.amount)} <strong><Money value={primary.a.delta.amount} {unit} absolute /></strong></span>
			<span>Xem kết luận ↓</span>
		</a>
	{/if}

	<footer class="foot">
		<p>
			Kết quả là ước tính có căn cứ, không thay cho tờ khai quyết toán. Dữ liệu luật năm {rb.taxYear}
			(bản {rb.revision}) theo các văn bản ban hành đến ngày {viDate(rb.knownAsOf)}. Mọi phép tính chạy trên
			máy bạn; không số tiền nào rời khỏi trình duyệt.
		</p>
	</footer>
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: repeat(var(--canon-cols, 4), minmax(0, 1fr));
		column-gap: var(--canon-gutter, 1.5rem);
		padding: 0 var(--canon-margin, 1.5rem);
		max-width: 100rem;
		margin: 0 auto;
	}
	.masthead,
	.inputs,
	.verdict,
	.details,
	.foot {
		grid-column: 1 / -1;
		min-width: 0;
	}

	/* Masthead */
	.masthead {
		padding: var(--canon-space-1, 1.5rem) 0 var(--canon-space-2, 3rem);
	}
	.brand {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 var(--canon-gutter, 1.5rem);
		border-top: var(--canon-rule-strong, 2px) solid var(--canon-ink, #111);
		padding-top: var(--canon-space-3, 0.5rem);
		padding-bottom: var(--canon-space-1, 1.5rem);
	}
	.brand span {
		color: var(--canon-mute, #595959);
	}
	h1,
	.display {
		font-size: var(--canon-display, 2.5rem);
		line-height: var(--canon-display-leading, 1.05);
		font-weight: 700;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}
	.lede {
		max-width: var(--canon-measure, 70ch);
		padding-top: var(--canon-space-1, 1.5rem);
	}

	/* Fields */
	.fields {
		display: grid;
		align-items: start;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--canon-space-1, 1.5rem) var(--canon-gutter, 1.5rem);
	}
	@media (min-width: 40rem) {
		.fields {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.label,
	.months .label {
		font-weight: 700;
		display: block;
		padding-bottom: var(--canon-space-3, 0.5rem);
	}
	.text {
		display: grid;
		align-content: start;
	}
	.hint,
	.mute {
		color: var(--canon-mute, #595959);
	}
	input[type='text'],
	input[type='date'],
	select {
		height: calc(var(--canon-line, 1.6rem) + 2 * var(--canon-space-3, 0.5rem));
		border: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		border-radius: 0;
		background: var(--canon-paper, #fff);
		padding: 0 var(--canon-space-3, 0.5rem);
		min-width: 0;
		width: 100%;
	}
	.months .row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: var(--canon-space-3, 0.5rem);
	}
	.check,
	.checks label {
		display: flex;
		gap: var(--canon-space-3, 0.5rem);
		align-items: baseline;
	}
	input[type='checkbox'] {
		accent-color: var(--canon-ink, #111);
		width: 1em;
		height: 1em;
		flex: none;
		transform: translateY(0.15em);
	}
	.checks {
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
		padding-top: var(--canon-space-1, 1.5rem);
	}
	.checks .date {
		display: grid;
		padding-left: calc(1em + var(--canon-space-3, 0.5rem));
		max-width: 24rem;
	}
	details.special > summary {
		font-weight: 700;
		cursor: pointer;
	}

	.source {
		border: 0;
		border-top: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		margin: 0;
		padding: var(--canon-space-3, 0.5rem) 0 0;
		min-width: 0;
		display: grid;
		gap: var(--canon-space-1, 1.5rem);
	}
	.source-head {
		display: flex;
		gap: var(--canon-space-3, 0.5rem);
		font-weight: 700;
		padding: 0;
		float: left;
		width: 100%;
	}
	.source-head + * {
		clear: both;
	}
	.idx {
		color: var(--canon-signal, #d71920);
	}

	button {
		justify-self: start;
		min-height: calc(var(--canon-line, 1.6rem) + 2 * var(--canon-space-3, 0.5rem));
		padding: 0 var(--canon-space-1, 1.5rem);
		border: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		border-radius: 0;
		background: var(--canon-paper, #fff);
		font-weight: 700;
		cursor: pointer;
	}
	button:hover {
		background: var(--canon-ink, #111);
		color: var(--canon-paper, #fff);
	}
	button.quiet {
		border-color: transparent;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		font-weight: 400;
	}
	button.quiet:hover {
		background: none;
		color: var(--canon-signal, #d71920);
	}
	button.add::before {
		content: '+ ';
	}

	/* Verdict */
	.verdict {
		margin-bottom: var(--canon-space-4, 6rem);
	}
	.verdict-inner {
		display: grid;
		gap: var(--canon-space-1, 1.5rem);
		border-top: var(--canon-rule-strong, 2px) solid var(--canon-ink, #111);
		padding-top: var(--canon-space-3, 0.5rem);
	}
	.verdict-head h2 {
		font-size: inherit;
		font-weight: 700;
	}
	.verdict [aria-live] {
		display: grid;
		gap: var(--canon-space-1, 1.5rem);
	}
	.figure {
		border-top: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		padding-top: var(--canon-space-3, 0.5rem);
	}
	.figure-label {
		font-weight: 700;
	}
	.signal {
		color: var(--canon-signal, #d71920);
	}
	.compare {
		margin: 0;
		border-top: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
	}
	.compare > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--canon-gutter, 1.5rem);
		padding: var(--canon-space-3, 0.5rem) 0;
		border-bottom: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
	}
	.compare dd {
		margin: 0;
		text-align: right;
	}
	.compare .pick {
		font-weight: 700;
	}
	.compare .pick dt::before {
		content: '→ ';
		color: var(--canon-signal, #d71920);
	}
	.problems {
		padding-left: 1.2em;
	}
	.store {
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
		border-top: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		padding-top: var(--canon-space-1, 1.5rem);
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--canon-space-3, 0.5rem);
	}

	/* Lines */
	.lines {
		border-top: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
	}
	.line {
		border-bottom: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
	}
	.line > summary,
	.line > .summary {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas: 'l a' 't t';
		gap: 0 var(--canon-gutter, 1.5rem);
		padding: var(--canon-space-3, 0.5rem) 0;
		list-style: none;
	}
	.line > summary {
		cursor: pointer;
	}
	.line > summary::-webkit-details-marker {
		display: none;
	}
	.line > summary .l::after {
		content: ' +';
		color: var(--canon-mute, #595959);
	}
	.line[open] > summary .l::after {
		content: ' −';
	}
	.l {
		grid-area: l;
	}
	.a {
		grid-area: a;
		text-align: right;
	}
	.tag {
		grid-area: t;
		color: var(--canon-mute, #595959);
	}
	.tag::before {
		content: '※ ';
		color: var(--canon-signal, #d71920);
	}
	.line.total {
		font-weight: 700;
	}
	.line .more {
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
		padding-bottom: var(--canon-space-1, 1.5rem);
		max-width: var(--canon-measure, 70ch);
		font-weight: 400;
	}
	.warnings {
		list-style: none;
		padding: 0;
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
	}
	.warnings li {
		border-left: var(--canon-rule-strong, 2px) solid var(--canon-signal, #d71920);
		padding-left: var(--canon-space-3, 0.5rem);
		max-width: var(--canon-measure, 70ch);
	}

	/* Levers */
	.levers {
		list-style: none;
		padding: 0;
		border-top: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
	}
	.levers > li {
		border-bottom: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		padding: var(--canon-space-3, 0.5rem) 0 var(--canon-space-1, 1.5rem);
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
	}
	.lever-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--canon-gutter, 1.5rem);
	}
	h3 {
		font-size: inherit;
		font-weight: 700;
	}
	.saving {
		font-weight: 700;
		text-align: right;
	}
	.ink {
		color: var(--canon-ink, #111);
	}
	.conds,
	.risky ul {
		padding-left: 1.2em;
		max-width: var(--canon-measure, 70ch);
	}
	.risky {
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
	}

	.foot {
		border-top: var(--canon-rule-strong, 2px) solid var(--canon-ink, #111);
		padding: var(--canon-space-3, 0.5rem) 0 var(--canon-space-2, 3rem);
	}
	.foot p {
		max-width: var(--canon-measure, 70ch);
		color: var(--canon-mute, #595959);
	}

	.jump {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		display: flex;
		justify-content: space-between;
		gap: var(--canon-gutter, 1.5rem);
		padding: var(--canon-space-3, 0.5rem) var(--canon-margin, 1.5rem);
		background: var(--canon-ink, #111);
		color: var(--canon-paper, #fff);
		text-decoration: none;
	}
	.foot {
		margin-bottom: var(--canon-space-2, 3rem);
	}

	@media (min-width: 64rem) {
		.jump {
			display: none;
		}
		.foot {
			margin-bottom: 0;
		}
		.masthead h1,
		.masthead .lede {
			max-width: none;
		}
		.masthead h1 {
			width: calc(8 / 12 * 100%);
		}
		.verdict {
			grid-column: 1 / span 4;
			grid-row: 2 / span 2;
			align-self: start;
			position: sticky;
			top: var(--canon-space-1, 1.5rem);
			max-height: calc(100vh - 2 * var(--canon-space-1, 1.5rem));
			overflow-y: auto;
		}
		.inputs {
			grid-column: 5 / -1;
			grid-row: 2;
		}
		.details {
			grid-column: 5 / -1;
			grid-row: 3;
		}
		.foot {
			grid-row: 4;
		}
		.masthead .lede {
			width: calc(8 / 12 * 100%);
		}
	}
</style>
