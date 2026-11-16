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
  { token: 'text-page', use: 'Tiêu đề trang (H1 duy nhất)', size: '24' },
  { token: 'text-section', use: 'Tiêu đề mục', size: '16' },
  { token: 'text-sm', use: 'Chữ thân, hàng danh sách', size: '14' },
  { token: 'text-meta', use: 'Dòng phụ, mô tả ngắn', size: '13' },
  { token: 'text-caption', use: 'Nhãn nhỏ, chip', size: '12' },
  { token: 'text-tiny', use: 'Chú thích rất nhỏ', size: '11' },
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
  { name: 'rounded-cell', class: 'rounded-cell' },
  { name: 'rounded-row', class: 'rounded-row' },
  { name: 'rounded-card', class: 'rounded-card' },
  { name: 'rounded-pill', class: 'rounded-pill' },
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
