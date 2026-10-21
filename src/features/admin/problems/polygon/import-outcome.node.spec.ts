import { describe, expect, it } from 'vitest';
import type { Schemas } from '@/api/schemas';
import { importJob } from '@/test/admin-fixtures/polygon';
import {
  outcomeActionOf,
  outcomeKindOf,
  queueLinesOf,
  runningLineOf,
  summaryRowsOf,
} from './import-outcome';

const result = (attention: Schemas['ImportResultResponse']['attention'] = null) => ({
  problemId: 'p-1',
  code: 'kminmax',
  summary: null,
  attention,
});
const summary = (
  overrides: Partial<Schemas['ImportSummaryResponse']> = {},
): Schemas['ImportSummaryResponse'] => ({
  checker: 'bridged',
  polygonChecker: 'std::wcmp.cpp',
  interactive: false,
  checkerIgnored: false,
  tests: 42,
  cases: 42,
  batches: 4,
  timeLimit: { polygon: 1, applied: 1 },
  memoryLimit: { polygon: 1048576, applied: 524288 },
  ...overrides,
});

describe('outcomeKindOf', () => {
  it('leads with the phase of the job', () => {
    const job = importJob();
    expect(outcomeKindOf(null, null, null)).toBe('waiting');
    expect(outcomeKindOf('queued', job, null)).toBe('queued');
    expect(outcomeKindOf('running', job, null)).toBe('running');
    expect(outcomeKindOf('failed', job, null)).toBe('failed');
    expect(outcomeKindOf('done', importJob({ result: result() }), null)).toBe('done');
  });

  it('reads a completed job that carries attention as imported but needing a look', () => {
    const attention = { code: 'imported_needs_attention' as const, params: {}, message: 'x' };
    expect(outcomeKindOf('done', importJob({ result: result(attention) }), null)).toBe('attention');
  });

  it('puts a stop first: given up can be checked again, the others cannot be followed', () => {
    const job = importJob({ state: 'active' });
    expect(outcomeKindOf('running', job, 'gaveUp')).toBe('lost');
    expect(outcomeKindOf('running', job, 'notFound')).toBe('gone');
    expect(outcomeKindOf(null, null, 'forbidden')).toBe('gone');
  });
});

describe('queueLinesOf', () => {
  it('names the place and how many jobs are ahead', () => {
    expect(queueLinesOf(1)).toEqual({
      place: 'Thứ 1 trong hàng đợi',
      ahead: 'Trước bạn: không còn lượt nào.',
    });
    expect(queueLinesOf(3).ahead).toBe('Trước bạn: 2 lượt.');
    expect(queueLinesOf(null)).toEqual({ place: 'Đang chờ trong hàng đợi', ahead: '' });
  });
});

describe('runningLineOf', () => {
  it('counts the generated tests or the downloaded bytes when reported', () => {
    const generating = (done: number | null, total: number | null) =>
      importJob({
        state: 'active',
        step: 'generating',
        progress: { step: 'generating', done, total },
      });
    expect(runningLineOf(generating(18, 42))).toBe('Đang sinh test 18/42');
    expect(runningLineOf(generating(null, null))).toBe('Đang sinh test');
    expect(runningLineOf(importJob({ state: 'active', step: 'statements' }))).toBe('Chuyển đề bài');
    const downloading = importJob({
      state: 'active',
      step: 'downloading',
      progress: { step: 'downloading', done: 2 * 1048576, total: 8 * 1048576 },
    });
    expect(runningLineOf(downloading)).toBe('Tải gói từ Polygon 2.0 MB / 8.0 MB');
  });
});

describe('summaryRowsOf', () => {
  it('maps the checker, counts the tests and notes a clamped limit beside its value', () => {
    expect(summaryRowsOf(summary())).toEqual([
      { key: 'checker', value: 'std::wcmp.cpp → Checker riêng của bài', note: null },
      { key: 'tests', value: '42 test · 4 nhóm', note: null },
      { key: 'time', value: '1.0s', note: null },
      { key: 'memory', value: '512MB', note: 'Polygon: 1024MB, hạ theo mức tối đa' },
    ]);
  });

  it('counts the judged cases apart when dependencies copy tests', () => {
    expect(summaryRowsOf(summary({ cases: 50, batches: 0 }))[1]!.value).toBe(
      '42 test · 50 lượt chấm',
    );
  });

  it('says an interactive problem is judged by its interactor, and a checker left out', () => {
    const rows = summaryRowsOf(
      summary({ interactive: true, checkerIgnored: true, timeLimit: { polygon: 0.5, applied: 1 } }),
    );
    expect(rows[0]).toEqual({
      key: 'checker',
      value: 'Bài tương tác: interactor chấm',
      note: 'Checker của gói không chạy',
    });
    expect(rows[2]!.note).toBe('Polygon: 0.5s, nâng theo mức tối thiểu');
  });

  it('names a site checker by its data-tab label', () => {
    expect(summaryRowsOf(summary({ checker: 'standard', polygonChecker: null }))[0]!.value).toBe(
      'So khớp đáp án (bỏ qua khoảng trắng thừa)',
    );
  });
});

describe('outcomeActionOf', () => {
  const all = { retry: true, edit: true, sync: true };
  const failure = (retryable: boolean, kind: 'options' | 'target' | 'transient' | 'other') => ({
    retryable,
    kind,
  });

  it('retries only a failure that may pass by itself, and only with the body it was sent with', () => {
    expect(outcomeActionOf('failed', failure(true, 'transient'), all)).toBe('retry');
    expect(
      outcomeActionOf('failed', failure(true, 'transient'), { ...all, retry: false }),
    ).toBeNull();
  });

  it('sends a failure the options or the code caused back to the options, when the form is still here', () => {
    expect(outcomeActionOf('failed', failure(false, 'options'), all)).toBe('edit');
    expect(outcomeActionOf('failed', failure(false, 'target'), all)).toBe('edit');
    expect(
      outcomeActionOf('failed', failure(false, 'options'), { ...all, edit: false }),
    ).toBeNull();
    expect(outcomeActionOf('failed', failure(false, 'other'), all)).toBeNull();
  });

  it('repairs an imported problem with a sync, or opens it without the sync right', () => {
    const none = failure(false, 'other');
    expect(outcomeActionOf('attention', none, all)).toBe('resync');
    expect(outcomeActionOf('attention', none, { ...all, sync: false })).toBe('open');
    expect(outcomeActionOf('done', none, all)).toBe('open');
  });

  it('checks again after polling gave up, and offers nothing while the job runs', () => {
    const none = failure(false, 'other');
    expect(outcomeActionOf('lost', none, all)).toBe('recheck');
    expect(
      ['waiting', 'queued', 'running', 'gone'].map((kind) =>
        outcomeActionOf(kind as never, none, all),
      ),
    ).toEqual([null, null, null, null]);
  });
});
