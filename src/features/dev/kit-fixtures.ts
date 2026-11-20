import { CUE_TONES } from '@/components/ui/cue-tones';
import type { CueTone } from '@/components/ui/cue-tones';

/** What each cue means, in the words of the colour cue map (DESIGN.md). */
export const CUE_MEANING: Record<CueTone, { label: string; meaning: string; token: string }> = {
  live: {
    label: 'Đang diễn ra',
    meaning: 'Đang chạy: kỳ thi đang mở, chấm bài đang chạy.',
    token: 'cue-live',
  },
  upcoming: { label: 'Sắp diễn ra', meaning: 'Chưa bắt đầu.', token: 'cue-upcoming' },
  ended: { label: 'Đã kết thúc', meaning: 'Đã xong hoặc không còn hoạt động.', token: 'cue-ended' },
  full: { label: 'Đủ điểm', meaning: 'Bài đạt trọn điểm (đã giải).', token: 'cue-full' },
  partial: { label: 'Một phần', meaning: 'Có điểm nhưng chưa đủ.', token: 'cue-partial' },
  zero: {
    label: '0 điểm',
    meaning: 'Đã nộp mà sai; bài chưa thử thì để trống.',
    token: 'cue-zero',
  },
  attention: {
    label: 'Cần chú ý',
    meaning: 'Cần hành động hoặc cảnh báo (mã truy cập).',
    token: 'cue-attention',
  },
};

/** Whole class names, so Tailwind finds them: the text, tint and border swatches of each cue. */
const SWATCHES: Record<CueTone, { text: string; tint: string; border: string }> = {
  live: { text: 'bg-cue-live', tint: 'bg-cue-live-bg', border: 'border-cue-live-border' },
  upcoming: {
    text: 'bg-cue-upcoming',
    tint: 'bg-cue-upcoming-bg',
    border: 'border-cue-upcoming-border',
  },
  ended: { text: 'bg-cue-ended', tint: 'bg-cue-ended-bg', border: 'border-cue-ended-border' },
  full: { text: 'bg-cue-full', tint: 'bg-cue-full-bg', border: 'border-cue-full-border' },
  partial: {
    text: 'bg-cue-partial',
    tint: 'bg-cue-partial-bg',
    border: 'border-cue-partial-border',
  },
  zero: { text: 'bg-cue-zero', tint: 'bg-cue-zero-bg', border: 'border-cue-zero-border' },
  attention: {
    text: 'bg-cue-attention',
    tint: 'bg-cue-attention-bg',
    border: 'border-cue-attention-border',
  },
};

export const CUES = CUE_TONES.map((tone) => ({
  tone,
  ...CUE_MEANING[tone],
  swatch: SWATCHES[tone],
}));

export const TYPE_ROLES = [
  { token: 'text-page', use: 'Tiêu đề trang (H1 duy nhất), 28/32', size: '28' },
  { token: 'text-heading', use: 'Tiêu đề thẻ, hộp thoại, mục, 18/26', size: '18' },
  { token: 'text-long', use: 'Văn bản dài: đề bài, bài viết, 16/26', size: '16' },
  { token: 'text-body', use: 'Chữ thân: ô bảng, hàng, nút, ô nhập, 15/22', size: '15' },
  { token: 'text-meta', use: 'Dòng phụ, nhãn biểu mẫu, đếm, 14/21', size: '14' },
  { token: 'text-small', use: 'Đầu bảng, mã bài, chip, 13/20', size: '13' },
] as const;

/** The height scale (spec §1): each token draws as a bar of that height. */
export const HEIGHTS = [
  {
    token: '--qh-control-sm',
    class: 'h-(--qh-control-sm)',
    px: '32',
    use: 'Trong bảng và đầu khung: nút hàng, bộ lọc, phân trang',
  },
  {
    token: '--qh-control',
    class: 'h-(--qh-control)',
    px: '40',
    use: 'Mọi nút, ô nhập, chọn, thanh công cụ, tab',
  },
  {
    token: '--qh-control-lg',
    class: 'h-(--qh-control-lg)',
    px: '40',
    use: 'Tên cũ của --qh-control',
  },
  { token: '--qh-chip', class: 'h-(--qh-chip)', px: '24', use: 'Chip, trạng thái, kết quả' },
  { token: '--qh-row', class: 'h-(--qh-row)', px: '44', use: 'Hàng danh sách một dòng, đầu bảng' },
  {
    token: '--qh-row-dense',
    class: 'h-(--qh-row-dense)',
    px: '44',
    use: 'Tên cũ của --qh-row',
  },
  {
    token: '--qh-touch',
    class: 'h-(--qh-touch)',
    px: '44',
    use: 'Cảm ứng: mọi điều khiển và hàng',
  },
] as const;

export const SPACES = [
  { token: '--space-page-top', class: 'h-(--space-page-top)', use: 'Đầu trang tới tiêu đề' },
  { token: '--space-header', class: 'h-(--space-header)', use: 'Tiêu đề tới thanh công cụ' },
  { token: '--space-toolbar', class: 'h-(--space-toolbar)', use: 'Thanh công cụ tới nội dung' },
  { token: '--space-section', class: 'h-(--space-section)', use: 'Giữa các mục' },
  {
    token: '--space-section-title',
    class: 'h-(--space-section-title)',
    use: 'Tiêu đề mục tới nội dung',
  },
  { token: '--space-stack', class: 'h-(--space-stack)', use: 'Khoảng cách dọc trong khối' },
] as const;

export const WIDTHS = [
  { token: '--page-wide', rem: '80 rem', use: 'Danh sách, trang thường' },
  { token: '--page-split', rem: '120 rem', use: 'Hai cột: đề bài và nộp bài' },
  { token: '--page-read', rem: '46 rem', use: 'Bài đọc dài, biểu mẫu' },
] as const;

export const RADII = [
  { name: 'rounded-control', class: 'rounded-control', use: 'Nút, ô nhập, tab, chip: viên thuốc' },
  { name: 'rounded-card', class: 'rounded-card', use: 'Thẻ, bảng, hộp thoại: 12' },
  { name: 'rounded-row', class: 'rounded-row', use: 'Hộp nằm trong thẻ: 8' },
  { name: 'rounded-cell', class: 'rounded-cell', use: 'Dấu vuông nhỏ: 6' },
] as const;

/** The base palette roles a page may use besides the cues. */
export const BASE_COLOURS = [
  { name: 'ground', class: 'bg-ground' },
  { name: 'surface', class: 'bg-surface' },
  { name: 'surface-strong', class: 'bg-surface-strong' },
  { name: 'line', class: 'bg-line' },
  { name: 'accent', class: 'bg-accent' },
  { name: 'accent-soft', class: 'bg-accent-soft' },
  { name: 'content', class: 'bg-content' },
  { name: 'muted', class: 'bg-muted' },
] as const;

export interface FixtureRow {
  code: string;
  name: string;
  points: string;
  length: string;
  date: string;
}
export const TABLE_ROWS: FixtureRow[] = [
  { code: 'sum', name: 'Tổng hai số', points: '100', length: '1:30', date: '16/11/2026' },
  { code: 'tree', name: 'Cây khung nhỏ nhất', points: '2.600', length: '2:00', date: '15/11/2026' },
  {
    code: 'dp1',
    name: 'Quy hoạch động cơ bản',
    points: '1.250',
    length: '0:45',
    date: '12/11/2026',
  },
];
