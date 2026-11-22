/**
 * Nhập và hiển thị số tiền VND theo đơn vị.
 *
 * Ranh giới: module này thuộc tầng UI. Lõi tính (src/lib/core) chỉ nhận và trả
 * số nguyên đồng (ADR-004). Đơn vị KHÔNG bao giờ đi vào lõi.
 *
 * Bất biến:
 *  U1. Parse không dùng phép nhân số thực: "1,005" nghìn = 1.005 đ, chính xác.
 *  U2. Đổi đơn vị của một ô là đổi cách HIỂN THỊ cùng một số đồng, không đọc lại
 *      con số theo đơn vị mới (30.000 nghìn -> 30 triệu, không thành 30.000 triệu).
 *  U3. Làm tròn chỉ ở bước hiển thị, từng số độc lập; tổng luôn tính từ đồng chính xác.
 *  U4. Số khác 0 không bao giờ hiển thị thành "0,0".
 */

export type Unit = 'dong' | 'nghin' | 'trieu';

export const UNIT_FACTOR: Record<Unit, bigint> = {
  dong: 1n,
  nghin: 1_000n,
  trieu: 1_000_000n
};

/** Số chữ số thập phân tối đa khi NHẬP: đủ để biểu diễn tới từng đồng. */
const MAX_INPUT_DECIMALS: Record<Unit, number> = { dong: 0, nghin: 3, trieu: 6 };

/** Số chữ số thập phân khi HIỂN THỊ kết quả. */
export const DISPLAY_DECIMALS: Record<Unit, number> = { dong: 0, nghin: 1, trieu: 1 };

export const UNIT_LABEL: Record<Unit, string> = {
  dong: 'đ',
  nghin: 'nghìn đ',
  trieu: 'triệu đ'
};

export type ParseResult =
  | { ok: true; dong: number }
  | { ok: false; reason: 'empty' | 'invalid' | 'negative' | 'too_precise' | 'too_large'; message: string };

const GROUPED = /^\d{1,3}(\.\d{3})+$/;

/**
 * Quy ước nhập kiểu Việt Nam: dấu phẩy là thập phân, dấu chấm phân cách hàng nghìn.
 *  - Có dấu phẩy: mọi dấu chấm là phân cách hàng nghìn, và phải đúng nhóm 3 chữ số.
 *  - Không có dấu phẩy: "1.500.000" là phân cách nghìn; "12.5" (một dấu chấm, không
 *    đúng nhóm 3) được hiểu là thập phân. Trường hợp "1.500" luôn được hiểu là 1500.
 *    UI phải hiện ngay "= … đ" cạnh ô nhập để người dùng thấy cách app đã hiểu (A5).
 */
export function parseAmount(text: string, unit: Unit): ParseResult {
  let s = text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s ]/g, '')
    .replace(/(vnđ|vnd|đồng|đ)$/u, '');

  if (s === '') return { ok: false, reason: 'empty', message: '' };
  if (s.startsWith('-')) return { ok: false, reason: 'negative', message: 'Số tiền không được âm.' };

  let intPart: string;
  let fracPart = '';

  if (s.includes(',')) {
    const [i, f, ...rest] = s.split(',');
    if (rest.length > 0) return invalid();
    if (i.includes('.') && !GROUPED.test(i)) return invalid();
    intPart = i.replace(/\./g, '');
    fracPart = f;
  } else if (GROUPED.test(s)) {
    intPart = s.replace(/\./g, '');
  } else if ((s.match(/\./g) ?? []).length === 1) {
    [intPart, fracPart] = s.split('.');
  } else {
    intPart = s;
  }

  if (intPart === '') intPart = '0';
  if (!/^\d+$/.test(intPart) || !/^\d*$/.test(fracPart)) return invalid();

  fracPart = fracPart.replace(/0+$/, '');
  const maxDec = MAX_INPUT_DECIMALS[unit];
  if (fracPart.length > maxDec) {
    return {
      ok: false,
      reason: 'too_precise',
      message:
        maxDec === 0
          ? 'Đơn vị đồng không có phần lẻ.'
          : `Với đơn vị ${UNIT_LABEL[unit]}, tối đa ${maxDec} chữ số sau dấu phẩy (tới 1 đồng).`
    };
  }

  const factor = UNIT_FACTOR[unit];
  const fracScaled = fracPart === '' ? 0n : (BigInt(fracPart) * factor) / 10n ** BigInt(fracPart.length);
  const dong = BigInt(intPart) * factor + fracScaled;

  if (dong > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, reason: 'too_large', message: 'Số quá lớn.' };
  }
  return { ok: true, dong: Number(dong) };
}

function invalid(): ParseResult {
  return {
    ok: false,
    reason: 'invalid',
    message: 'Chưa đọc được số này. Ví dụ: 30.000 hoặc 30,5'
  };
}

const groupFmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0, useGrouping: true });

function group(n: bigint): string {
  // Intl nhận bigint, nên định dạng phần nguyên không qua số thực.
  return groupFmt.format(n);
}

/**
 * Biểu diễn CHÍNH XÁC một số đồng theo đơn vị, không làm tròn. Dùng khi người dùng
 * đổi đơn vị của ô nhập (U2), hoặc trong tooltip "số chính xác".
 */
export function toExactText(dong: number, unit: Unit): string {
  assertDong(dong);
  const d = BigInt(dong);
  const neg = d < 0n;
  const abs = neg ? -d : d;
  const factor = UNIT_FACTOR[unit];
  const int = abs / factor;
  const frac = abs % factor;
  let out = group(int);
  if (frac !== 0n) {
    const width = MAX_INPUT_DECIMALS[unit];
    out += ',' + frac.toString().padStart(width, '0').replace(/0+$/, '');
  }
  return (neg ? '-' : '') + out;
}

/**
 * Hiển thị kết quả: làm tròn nửa xa số 0 (half away from zero), đối xứng cho số âm.
 * Làm tròn hoàn toàn bằng số nguyên, không qua số thực.
 *
 * U4: nếu số khác 0 mà làm tròn ra 0, trả "< 0,1" (hoặc "> -0,1"), không trả "0,0".
 * Hàm gọi có thể dùng `tooSmall` để tự chuyển sang đơn vị nhỏ hơn cho dòng đó.
 */
export function formatResult(
  dong: number,
  unit: Unit,
  decimals: number = DISPLAY_DECIMALS[unit]
): { text: string; tooSmall: boolean; exact: string } {
  assertDong(dong);
  const d = BigInt(dong);
  const neg = d < 0n;
  const abs = neg ? -d : d;
  const scale = 10n ** BigInt(decimals);
  const step = UNIT_FACTOR[unit] / scale; // đồng ứng với một đơn vị của chữ số cuối
  if (step === 0n) throw new RangeError('Số chữ số thập phân vượt độ chính xác của đơn vị');

  const q = (abs + step / 2n) / step; // làm tròn nửa xa số 0 trên |x|
  const exact = toExactText(dong, 'dong') + ' đ';

  if (q === 0n && abs !== 0n) {
    const minText = decimals === 0 ? '1' : '0,' + '0'.repeat(decimals - 1) + '1';
    return { text: (neg ? '> -' : '< ') + minText, tooSmall: true, exact };
  }

  const int = q / scale;
  const frac = q % scale;
  let text = group(int);
  if (decimals > 0) text += ',' + frac.toString().padStart(decimals, '0');
  return { text: (neg && q !== 0n ? '-' : '') + text, tooSmall: false, exact };
}

function assertDong(dong: number): void {
  if (!Number.isSafeInteger(dong)) {
    throw new RangeError(`Số tiền phải là số nguyên đồng an toàn, nhận ${dong}`);
  }
}
