<!--
  Money: hiện một số tiền kết quả theo đơn vị người dùng chọn (ADR-009).
  Việc chính: hiện số tiền đủ gọn để đọc mà không bao giờ biến số khác 0 thành 0.
  Số quá nhỏ cho đơn vị đang chọn thì tự xuống đơn vị nhỏ hơn (U4).
  Số chính xác tới đồng nằm trong title và trong văn bản cho trình đọc màn hình.
-->
<script lang="ts">
	import { formatResult, UNIT_LABEL, type Unit } from '#lib/ui/amount.ts';

	interface Props {
		/** Số đồng. */
		value: number;
		unit?: Unit;
		/** Hiện giá trị tuyệt đối (khi nhãn đã nói "được hoàn" hay "nộp thêm"). */
		absolute?: boolean;
	}

	let { value, unit = 'trieu', absolute = false }: Props = $props();

	const shown = $derived.by(() => {
		const v = absolute ? Math.abs(value) : value;
		const order: Unit[] = unit === 'trieu' ? ['trieu', 'nghin', 'dong'] : unit === 'nghin' ? ['nghin', 'dong'] : ['dong'];
		for (const u of order) {
			const r = formatResult(v, u);
			if (!r.tooSmall) return { text: r.text, unit: u, exact: r.exact };
		}
		const r = formatResult(v, 'dong');
		return { text: r.text, unit: 'dong' as Unit, exact: r.exact };
	});
</script>

<data class="money" value={absolute ? Math.abs(value) : value} title={shown.exact}
	>{shown.text}&nbsp;{UNIT_LABEL[shown.unit]}</data
>

<style>
	.money {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
