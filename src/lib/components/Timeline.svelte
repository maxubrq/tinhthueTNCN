<!--
  Timeline: dòng thời gian 12 tháng của các nơi trả lương.
  Việc chính: cho bạn nhìn một lần là thấy mình làm lần lượt hay cùng lúc.
  Hệ (ADR-013): không thêm màu. Khoảng lương phân biệt bằng sắc độ mực và xám xen kẽ; khoản
  trả một lần là ●, khoản trả sau khi nghỉ việc là ○. Màu tín hiệu duy nhất đánh dấu những
  tháng làm cùng lúc ở nhiều nơi, vì đó là chỗ app phải hỏi bạn.
  Bảng HTML thật: trình đọc màn hình đọc được từng ô; dấu chỉ là hình, nghĩa nằm trong chữ ẩn.
-->
<script lang="ts">
	import type { SourceForm } from '#lib/ui/form.ts';

	interface Props {
		sources: readonly SourceForm[];
		/** Các tháng làm cùng lúc ở từ hai nơi. */
		overlap: readonly number[];
	}

	let { sources, overlap }: Props = $props();
	const uid = $props.id();
	const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

	interface Cell {
		period: number | null; // chỉ số khoảng lương, để xen kẽ sắc độ
		extra: 'NONE' | 'NORMAL' | 'AFTER';
		text: string;
	}

	function cells(s: SourceForm): Cell[] {
		return MONTHS.map((m) => {
			const pi = s.periods.findIndex(
				(p) => (p.monthly ?? 0) > 0 && Math.min(p.fromMonth, p.toMonth) <= m && m <= Math.max(p.fromMonth, p.toMonth)
			);
			const ex = s.extras.filter((e) => (e.amount ?? 0) > 0 && e.month === m);
			const after = ex.some((e) => e.afterLeaving && s.contract === 'LONG');
			const extra = ex.length === 0 ? 'NONE' : after ? 'AFTER' : 'NORMAL';
			const parts = [pi >= 0 ? `có lương (khoảng ${pi + 1})` : 'không có lương'];
			if (extra === 'NORMAL') parts.push('có khoản trả một lần');
			if (extra === 'AFTER') parts.push('có khoản trả sau khi nghỉ việc');
			if (overlap.includes(m)) parts.push('làm cùng lúc ở nhiều nơi');
			return { period: pi >= 0 ? pi : null, extra, text: `Tháng ${m}: ${parts.join(', ')}.` };
		});
	}
</script>

<figure class="timeline" aria-labelledby="{uid}-cap">
	<table>
		<caption id="{uid}-cap">Dòng thời gian trong năm</caption>
		<thead>
			<tr>
				<th scope="col" class="name"><span class="sr">Nơi trả lương</span></th>
				{#each MONTHS as m (m)}
					<th scope="col" class:hot={overlap.includes(m)}>{m}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sources as s, i (s.key)}
				<tr>
					<th scope="row" class="name">
						<span class="idx">{String(i + 1).padStart(2, '0')}</span>
						<span class="full">{s.name || 'Nơi trả lương'}</span>
					</th>
					{#each cells(s) as c, j (j)}
						<td class:on={c.period !== null} class:alt={c.period !== null && c.period % 2 === 1} class:hot={overlap.includes(j + 1)}>
							<span aria-hidden="true" class="mark">{c.extra === 'NORMAL' ? '●' : c.extra === 'AFTER' ? '○' : ''}</span>
							<span class="sr">{c.text}</span>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<figcaption>
		<span><i class="key on" aria-hidden="true"></i>Có lương; khoảng lương kế tiếp đổi sắc độ</span>
		<span><i class="key" aria-hidden="true"></i>Không có lương</span>
		<span><b aria-hidden="true">●</b> Khoản trả một lần</span>
		<span><b aria-hidden="true">○</b> Khoản trả sau khi nghỉ việc</span>
		{#if overlap.length}<span><i class="key hot" aria-hidden="true"></i>Tháng làm cùng lúc ở nhiều nơi</span>{/if}
	</figcaption>
</figure>

<style>
	.timeline {
		margin: 0;
		display: grid;
		gap: var(--canon-space-3, 0.5rem);
		min-width: 0;
	}
	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 2px;
		table-layout: fixed;
		font-variant-numeric: tabular-nums;
	}
	caption {
		text-align: left;
		font-weight: 700;
		padding-bottom: var(--canon-space-3, 0.5rem);
	}
	th,
	td {
		padding: 0;
		text-align: center;
		font-weight: 400;
	}
	thead th {
		color: var(--canon-mute, #595959);
	}
	thead th.hot {
		color: var(--canon-signal, #d71920);
		font-weight: 700;
	}
	.name {
		width: 30%;
		text-align: left;
		padding-right: var(--canon-space-3, 0.5rem);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.idx {
		color: var(--canon-signal, #d71920);
		font-weight: 700;
		margin-right: var(--canon-space-3, 0.5rem);
	}
	td {
		height: var(--canon-line, 1.6rem);
		border-bottom: var(--canon-rule-thin, 1px) solid var(--canon-mute, #595959);
		line-height: 1;
	}
	td.on {
		background: var(--canon-ink, #111);
		color: var(--canon-paper, #fff);
		border-bottom-color: var(--canon-ink, #111);
	}
	td.on.alt {
		background: var(--canon-mute, #595959);
		border-bottom-color: var(--canon-mute, #595959);
	}
	td.hot {
		box-shadow: inset 0 2px 0 var(--canon-signal, #d71920);
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--canon-gutter, 1.5rem);
		color: var(--canon-mute, #595959);
	}
	.key {
		display: inline-block;
		width: 0.9em;
		height: 0.9em;
		margin-right: 0.4em;
		vertical-align: -0.1em;
		border-bottom: var(--canon-rule-thin, 1px) solid var(--canon-mute, #595959);
	}
	.key.on {
		background: var(--canon-ink, #111);
		border-color: var(--canon-ink, #111);
	}
	.key.hot {
		box-shadow: inset 0 2px 0 var(--canon-signal, #d71920);
	}
	b {
		font-weight: 400;
		color: var(--canon-ink, #111);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (max-width: 40rem) {
		.name {
			width: 3rem;
		}
		.full {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
	}
</style>
