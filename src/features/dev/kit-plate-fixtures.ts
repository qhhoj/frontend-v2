import type { TimelineEvent, TimelineTick } from '@/components/ui/ContestTimeline.vue';
import type { TestSquare } from '@/components/ui/TestSquares.vue';
import type { VerdictCode, VerdictTone } from '@/lib/verdicts';

/** Fixtures of the gallery's plate parts (Lamp, VerdictChip, TestSquares, Gauge, Readout, ContestTimeline). */

/** Headings that must keep their Vietnamese marks in the display font. */
export const DISPLAY_SAMPLES = [
  'Đại Sảnh Lục Giác',
  'Kỳ thi',
  'Bảng xếp hạng',
  'Quá thời gian ở test 8',
] as const;

export const LAMP_TONES: readonly { tone: VerdictTone | 'none'; label: string }[] = [
  { tone: 'ac', label: 'Đúng' },
  { tone: 'pc', label: 'Một phần' },
  { tone: 'wa', label: 'Sai' },
  { tone: 'tle', label: 'Quá thời gian, bộ nhớ' },
  { tone: 'rte', label: 'Lỗi khi chạy' },
  { tone: 'ce', label: 'Lỗi biên dịch' },
  { tone: 'pending', label: 'Đang chấm' },
  { tone: 'none', label: 'Chưa làm' },
];

export const VERDICT_SAMPLES: readonly VerdictCode[] = [
  'AC',
  'PC',
  'WA',
  'TLE',
  'MLE',
  'RTE',
  'CE',
  'IE',
  'QU',
];

const JUDGED_TONES: readonly VerdictTone[] = [
  'ac',
  'ac',
  'ac',
  'ac',
  'ac',
  'pc',
  'ac',
  'tle',
  'wa',
  'tle',
];
const TONE_WORDS: Record<VerdictTone, string> = {
  ac: 'đúng',
  pc: 'một phần',
  wa: 'sai',
  tle: 'quá thời gian',
  rte: 'lỗi khi chạy',
  ce: 'lỗi biên dịch',
  pending: 'đang chấm',
};
export const JUDGED_TESTS: readonly TestSquare[] = JUDGED_TONES.map((tone, index): TestSquare => ({
  tone,
  label: `Test ${index + 1}: ${TONE_WORDS[tone]}`,
}));
const REACHED_TESTS = 4;
export const JUDGING_TESTS: readonly TestSquare[] = [...JUDGED_TONES.keys()].map(
  (index): TestSquare =>
    index < REACHED_TESTS
      ? { tone: 'ac', label: `Test ${index + 1}: đúng` }
      : { tone: 'waiting', label: `Test ${index + 1}: chưa chấm` },
);

const MINUTE = 60_000;
const START = Date.UTC(2026, 10, 20, 7, 0);
const tickAt = (minutes: number, label: string): TimelineTick => ({
  at: START + minutes * MINUTE,
  label,
});
const eventAt = (minutes: number, tone: VerdictTone, label: string): TimelineEvent => ({
  at: START + minutes * MINUTE,
  tone,
  label,
});
/** A three-hour contest, 1:45 in, frozen for the last half hour. */
export const TIMELINE = {
  start: START,
  end: START + 180 * MINUTE,
  now: START + 105 * MINUTE,
  freezeAt: START + 150 * MINUTE,
  ticks: [
    tickAt(0, '0:00'),
    tickAt(60, '1:00'),
    tickAt(120, '2:00'),
    tickAt(150, '2:30'),
    tickAt(180, '3:00'),
  ],
  events: [
    eventAt(12, 'ac', '0:12 Bài A: đúng'),
    eventAt(41, 'wa', '0:41 Bài B: sai'),
    eventAt(58, 'ac', '0:58 Bài B: đúng'),
    eventAt(96, 'pc', '1:36 Bài C: một phần'),
  ],
};
