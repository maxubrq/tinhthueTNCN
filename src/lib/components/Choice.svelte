<!--
  Choice: một câu hỏi, vài lựa chọn loại trừ nhau, hiện hết trên một hàng.
  Việc chính: trả lời một câu hỏi bằng một lần chạm.
  Radio thật bên dưới, nên bàn phím (mũi tên) và trình đọc màn hình chạy sẵn.
  Đang chọn = khối mực đảo màu (trạng thái), không dùng màu tín hiệu.
-->
<script lang="ts" generics="T extends string | number | boolean | null">
	interface Option {
		value: T;
		label: string;
	}

	interface Props {
		/** Câu hỏi, cỡ thân, đậm. */
		legend: string;
		options: readonly Option[];
		value: T;
		/** Một câu giải thích dưới câu hỏi. */
		hint?: string;
	}

	let { legend, options, value = $bindable(), hint = '' }: Props = $props();
	const id = $props.id();
</script>

<fieldset class="choice" aria-describedby={hint ? `${id}-hint` : undefined}>
	<legend>{legend}</legend>
	{#if hint}
		<p class="hint" id="{id}-hint">{hint}</p>
	{/if}
	<div class="options">
		{#each options as o, i (i)}
			<label class:on={o.value === value}>
				<input type="radio" name={id} checked={o.value === value} onchange={() => (value = o.value)} />
				<span>{o.label}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.choice {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}
	legend {
		font-weight: 700;
		padding: 0 0 var(--canon-space-3, 0.5rem);
	}
	.hint {
		color: var(--canon-mute, #595959);
		padding-bottom: var(--canon-space-3, 0.5rem);
	}
	.options {
		display: flex;
		flex-wrap: wrap;
	}
	label {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-height: calc(var(--canon-line, 1.6rem) + 2 * var(--canon-space-3, 0.5rem));
		padding: 0 var(--canon-space-3, 0.5rem);
		border: var(--canon-rule-thin, 1px) solid var(--canon-ink, #111);
		margin: 0 -1px -1px 0;
		cursor: pointer;
		transition:
			background-color var(--canon-t-3, 100ms) var(--canon-ease-state, ease),
			color var(--canon-t-3, 100ms) var(--canon-ease-state, ease);
	}
	label.on {
		background: var(--canon-ink, #111);
		color: var(--canon-paper, #fff);
		font-weight: 700;
	}
	input {
		position: absolute;
		opacity: 0;
		inset: 0;
		margin: 0;
		cursor: pointer;
	}
	label:has(input:focus-visible) {
		outline: 2px solid var(--canon-signal, #d71920);
		outline-offset: 2px;
		z-index: 1;
	}
</style>
