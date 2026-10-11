/**
 * Mock data that stresses a table's widths: `stretch` lengthens the free-text fields of a fixture (names, handles, paths,
 * addresses) to what the production data holds. Enums, ids and dates are left alone so the screen still renders them.
 */
const IPV6 = '2405:4802:6efc:f980:2e0:4cff:fe36:5677';
const LONG_PATH =
  '/api/internal/admin/problems/very-long-problem-code-2026/testcases/archive/download?token=abcdef0123456789';
const LONG_WORDS = 'Bài toán đường đi ngắn nhất trên đồ thị có trọng số âm với truy vấn cập nhật';
const UNBROKEN = 'nguyen_van_thanh_binh_phuong_2009_hcmus_chuyen_tin';

const HANDLE_KEYS =
  /^(username|handle|code|key|slug|short[A-Za-z]*|owner|author|creator|host|name)$/;
const PHRASE_KEYS =
  /^(title|displayName|fullName|description|reason|subject|note|label|message|text|about|summary|banReason|problemName|contestName)$/;

function stretchString(key: string, value: string): string {
  if (key === 'ip') return IPV6;
  if (!value || /^\d/.test(value) || value.length > 120) return value;
  if (key === 'path' || key === 'url') return LONG_PATH;
  if (key === 'name' && value.includes(' ')) return `${value} ${LONG_WORDS}`;
  if (HANDLE_KEYS.test(key)) return `${value}_${UNBROKEN}`;
  if (PHRASE_KEYS.test(key)) return `${value} ${LONG_WORDS}`;
  return value;
}

/** A deep copy of `value` with its stress-able strings lengthened. */
export function stretch<T>(value: T, key = ''): T {
  if (typeof value === 'string') return stretchString(key, value) as T;
  if (Array.isArray(value)) return value.map((item) => stretch(item, key)) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, stretch(item, name)]),
    ) as T;
  return value;
}
