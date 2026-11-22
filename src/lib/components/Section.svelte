<!--
  Section: một phần của trang, treo dưới rule đậm.
  Việc chính: cho người đọc biết họ đang ở bước nào của quyết toán.
  Rule 2 px, ⅓ dòng, số mục màu tín hiệu, tiêu đề cỡ trưng bày, nội dung cách 1 dòng.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Số mục, màu tín hiệu. */
		number: string;
		title: string;
		/** Một câu dưới tiêu đề: mục này trả lời gì. */
		lede?: string;
		/** id cho neo trang. */
		id?: string;
		children: Snippet;
	}

	let { number, title, lede = '', id, children }: Props = $props();
	const uid = $props.id();
</script>

<section class="section" {id} aria-labelledby="{uid}-t">
	<header>
		<p class="number" aria-hidden="true">{number}</p>
		<h2 id="{uid}-t"><span class="sr">{number}. </span>{title}</h2>
		{#if lede}<p class="lede">{lede}</p>{/if}
	</header>
	<div class="body">
		{@render children()}
	</div>
</section>

<style>
	.section {
		border-top: var(--canon-rule-strong, 2px) solid var(--canon-ink, #111);
		padding-top: var(--canon-space-3, 0.5rem);
		margin-bottom: var(--canon-space-4, 6rem);
	}
	.number {
		color: var(--canon-signal, #d71920);
		font-weight: 700;
	}
	h2 {
		font-size: var(--canon-display, 2.5rem);
		line-height: var(--canon-display-leading, 1.05);
		font-weight: 700;
		letter-spacing: -0.01em;
		text-wrap: balance;
	}
	.lede {
		max-width: var(--canon-measure, 70ch);
		color: var(--canon-mute, #595959);
		padding-top: var(--canon-space-3, 0.5rem);
	}
	.body {
		padding-top: var(--canon-space-2, 3rem);
		display: grid;
		gap: var(--canon-space-2, 3rem);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
