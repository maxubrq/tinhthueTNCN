<!--
  AmountField: ô nhập số tiền VND (ADR-009).
  Việc chính: nhận một số tiền mà người nhập luôn thấy app đã hiểu thành bao nhiêu đồng.
  Đơn vị mỗi ô chọn riêng, mặc định nghìn. Đổi đơn vị chỉ đổi cách hiện (U2).
  Dòng "= … đ" luôn hiện dưới ô: đây là lưới an toàn cho nhầm lẫn 1.000 lần.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { parseAmount, toExactText, UNIT_LABEL, type Unit } from '#lib/ui/amount.ts';

	interface Props {
		/** Nhãn của ô, cỡ thân, đậm. */
		label: string;
		/** Số đồng; `null` khi để trống hoặc chưa đọc được. */
		value: number | null;
		/** Một câu giải thích lấy số ở đâu. */
		hint?: string;
		/** Khóa ô khi kỳ này luật không có khoản đó. */
		disabled?: boolean;
	}

	let { label, value = $bindable(null), hint = '', disabled = false }: Props = $props();

	const id = $props.id();
	let unit: Unit = $state('nghin');
	let text = $state(untrack(() => (value === null ? '' : toExactText(value, 'nghin'))));
	const parsed = $derived(parseAmount(text, unit));

	function current(): number | null {
		const p = parseAmount(text, unit);
		return p.ok ? p.dong : null;
	}

	// Trạng thái: giá trị đổi từ bên ngoài (mở hồ sơ đã lưu, xóa hồ sơ) thì viết lại chữ.
	$effect(() => {
		const v = value;
		untrack(() => {
			if (current() !== v) text = v === null ? '' : toExactText(v, unit);
		});
	});

	function oninput() {
		value = current();
	}

	function onunit() {
		if (value !== null) text = toExactText(value, unit);
	}

	const error = $derived(!parsed.ok && parsed.reason !== 'empty' ? parsed.message : '');
	const echo = $derived(parsed.ok ? `= ${toExactText(parsed.dong, 'dong')} đ` : '= … đ');
</script>

<div class="field" class:disabled>
	<label class="label" for="{id}-v">{label}</label>
	<div class="row">
		<input
			id="{id}-v"
			type="text"
			inputmode="decimal"
			autocomplete="off"
			spellcheck="false"
			{disabled}
			bind:value={text}
			{oninput}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby="{id}-echo{hint ? ` ${id}-hint` : ''}{error ? ` ${id}-err` : ''}"
		/>
		<select aria-label="Đơn vị của {label}" bind:value={unit} onchange={onunit} {disabled}>
			{#each ['dong', 'nghin', 'trieu'] as const as u (u)}
				<option value={u}>{UNIT_LABEL[u]}</option>
			{/each}
		</select>
	</div>
	<p class="echo" id="{id}-echo" aria-live="polite">{echo}</p>
	{#if error}
		<p class="error" id="{id}-err">{error}</p>
	{/if}
	{#if hint}
		<p class="hint" id="{id}-hint">{hint}</p>
	{/if}
</div>

<style>
	.field {
		display: grid;
		align-content: start;
		gap: 0;
		min-width: 0;
	}
	.label {
		font-weight: 700;
		padding-bottom: var(--canon-space-3, 0.5rem);
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
	}
	input,
	select {
		height: calc(var(--canon-line, 1.6rem) + 2 * var(--canon-space-3, 0.5rem));
		border: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		border-radius: 0;
		background: var(--canon-paper, #fff);
		padding: 0 var(--canon-space-3, 0.5rem);
		min-width: 0;
	}
	input {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	select {
		border-left: 0;
		appearance: none;
		padding-right: var(--canon-space-1, 1.5rem);
		background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
			linear-gradient(-45deg, transparent 50%, currentColor 50%);
		background-size: 5px 5px;
		background-position:
			calc(100% - 13px) 55%,
			calc(100% - 8px) 55%;
		background-repeat: no-repeat;
	}
	input[aria-invalid='true'] {
		border-color: var(--canon-signal, #d71920);
		border-width: var(--canon-rule-strong, 2px);
	}
	.echo,
	.hint {
		color: var(--canon-mute, #595959);
	}
	.echo {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.error {
		color: var(--canon-signal, #d71920);
		font-weight: 700;
	}
	.disabled .label,
	.disabled .echo {
		color: var(--canon-mute, #595959);
	}
	.disabled input,
	.disabled select {
		border-style: dashed;
		background: transparent;
	}
</style>
