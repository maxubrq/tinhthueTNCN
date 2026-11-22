import { describe, expect, it } from 'vitest';
import { formatResult, parseAmount, toExactText, type Unit } from './amount';

const dong = (text: string, unit: Unit) => {
  const r = parseAmount(text, unit);
  if (!r.ok) throw new Error(`${text} (${unit}): ${r.reason}`);
  return r.dong;
};

describe('parseAmount', () => {
  it('quy đổi đúng cả ba đơn vị', () => {
    expect(dong('30.000.000', 'dong')).toBe(30_000_000);
    expect(dong('30.000', 'nghin')).toBe(30_000_000);
    expect(dong('30', 'trieu')).toBe(30_000_000);
  });

  it('không có sai số số thực (U1)', () => {
    // 1.005 * 1000 = 1004.9999999999999 trong JS
    expect(dong('1,005', 'nghin')).toBe(1_005);
    expect(dong('0,29', 'trieu')).toBe(290_000);
    expect(dong('4,35', 'trieu')).toBe(4_350_000);
    expect(dong('1,234567', 'trieu')).toBe(1_234_567);
  });

  it('hiểu quy ước số kiểu Việt Nam', () => {
    expect(dong('46,8', 'trieu')).toBe(46_800_000);
    expect(dong('1.500,5', 'nghin')).toBe(1_500_500);
    expect(dong('12.5', 'trieu')).toBe(12_500_000); // một dấu chấm không đúng nhóm 3 thì là thập phân
    expect(dong('1.500', 'nghin')).toBe(1_500_000); // đúng nhóm 3 thì là phân cách nghìn
    expect(dong(',5', 'trieu')).toBe(500_000);
  });

  it('chấp nhận chuỗi dán từ phiếu lương', () => {
    expect(dong('30.000.000 đ', 'dong')).toBe(30_000_000);
    expect(dong('30.000.000 VND', 'dong')).toBe(30_000_000);
    expect(dong(' 15 500 ', 'nghin')).toBe(15_500_000);
  });

  it('từ chối đầu vào sai, kèm lý do', () => {
    expect(parseAmount('', 'nghin')).toMatchObject({ ok: false, reason: 'empty' });
    expect(parseAmount('-5', 'nghin')).toMatchObject({ ok: false, reason: 'negative' });
    expect(parseAmount('1,2,3', 'nghin')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseAmount('1.50,5', 'nghin')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseAmount('abc', 'nghin')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseAmount('1,5', 'dong')).toMatchObject({ ok: false, reason: 'too_precise' });
    expect(parseAmount('1,0005', 'nghin')).toMatchObject({ ok: false, reason: 'too_precise' });
    expect(parseAmount('99999999999999', 'trieu')).toMatchObject({ ok: false, reason: 'too_large' });
  });

  it('bỏ số 0 thừa ở cuối trước khi kiểm độ chính xác', () => {
    expect(parseAmount('1,50', 'dong')).toMatchObject({ ok: false, reason: 'too_precise' });
    expect(parseAmount('1,0', 'dong')).toEqual({ ok: true, dong: 1 });
  });
});

describe('toExactText: đổi đơn vị không đọc lại số (U2)', () => {
  it('khứ hồi chính xác', () => {
    for (const d of [0, 1, 999, 1_005, 30_000_000, 1_234_567, 46_800_000]) {
      for (const u of ['dong', 'nghin', 'trieu'] as Unit[]) {
        expect(dong(toExactText(d, u), u)).toBe(d);
      }
    }
  });
  it('định dạng', () => {
    expect(toExactText(30_000_000, 'nghin')).toBe('30.000');
    expect(toExactText(30_000_000, 'trieu')).toBe('30');
    expect(toExactText(1_234_567, 'trieu')).toBe('1,234567');
  });
});

describe('formatResult', () => {
  it('mặc định triệu, 1 chữ số thập phân, làm tròn nửa xa 0', () => {
    expect(formatResult(11_400_000, 'trieu').text).toBe('11,4');
    expect(formatResult(1_250_000, 'trieu').text).toBe('1,3');
    expect(formatResult(1_249_999, 'trieu').text).toBe('1,2');
    expect(formatResult(-1_250_000, 'trieu').text).toBe('-1,3');
    expect(formatResult(27_900_000, 'trieu').text).toBe('27,9');
    expect(formatResult(1_234_000_000, 'trieu').text).toBe('1.234,0');
  });

  it('nghìn và đồng', () => {
    expect(formatResult(475_000, 'nghin').text).toBe('475,0');
    expect(formatResult(1_050, 'nghin').text).toBe('1,1');
    expect(formatResult(30_000_000, 'dong').text).toBe('30.000.000');
  });

  it('số khác 0 không bao giờ thành 0,0 (U4)', () => {
    // Δ = 40.000 đ nằm dưới ngưỡng 50.000 đ: không được hiện "0,0 triệu"
    expect(formatResult(40_000, 'trieu')).toMatchObject({ text: '< 0,1', tooSmall: true });
    expect(formatResult(-40_000, 'trieu')).toMatchObject({ text: '> -0,1', tooSmall: true });
    expect(formatResult(0, 'trieu')).toMatchObject({ text: '0,0', tooSmall: false });
    expect(formatResult(-49_999, 'trieu').text).not.toContain('-0,0');
  });

  it('luôn kèm số chính xác để đối chiếu', () => {
    expect(formatResult(11_412_345, 'trieu').exact).toBe('11.412.345 đ');
  });

  it('từ chối số không phải nguyên đồng', () => {
    expect(() => formatResult(1.5, 'trieu')).toThrow(RangeError);
  });
});
