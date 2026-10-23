import { describe, expect, it } from 'vitest';
import type { Schemas } from '@/api/schemas';
import { importJob } from '@/test/admin-fixtures/polygon';
import {
  outcomeActionOf,
  readImportJob,
  outcomeKindOf,
  queueLinesOf,
  runningLineOf,
} from './import-reading';

const result = (attention: Schemas['ImportResultResponse']['attention'] = null) => ({
  problemId: 'p-1',
  code: 'kminmax',
  summary: null,
  attention,
  localEdits: null,
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

describe('outcomeActionOf', () => {
  const all = { retry: true, edit: true, sync: true };
  const failure = (
    retryable: boolean,
    kind: 'options' | 'target' | 'transient' | 'other',
    isSync = false,
  ) => ({ retryable, kind, isSync });

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

  it('runs a failed sync again as a sync, never with an import body or form, and sends its options to the link', () => {
    expect(outcomeActionOf('failed', failure(true, 'transient', true), all)).toBe('resync');
    expect(outcomeActionOf('failed', failure(false, 'options', true), all)).toBe('syncOptions');
    expect(outcomeActionOf('failed', failure(false, 'target', true), all)).toBeNull();
    expect(
      outcomeActionOf('failed', failure(true, 'transient', true), { ...all, sync: false }),
    ).toBeNull();
    expect(
      outcomeActionOf('failed', failure(false, 'options', true), { ...all, sync: false }),
    ).toBeNull();
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

describe('readImportJob', () => {
  const can = { retry: true, edit: true, sync: true };
  const base = { code: 'kminmax', lastSeenAt: '2026-10-21T03:05:00Z', locale: 'vi' as const, can };
  const read = (
    job: ReturnType<typeof importJob> | null,
    phase: Parameters<typeof readImportJob>[0]['phase'],
    over: Partial<Parameters<typeof readImportJob>[0]> = {},
  ) => readImportJob({ ...base, source: 'polygon', job, phase, stop: null, ...over });
  const failedJob = (over = {}) =>
    importJob({ state: 'failed', step: 'failed', failedStep: 'statements', ...over });

  it('maps a failed job to its cause, fix, failed-step line and action for every source', () => {
    const job = failedJob({ errorCode: 'polygon_unavailable', retryable: true });
    for (const source of ['zip', 'polygon'] as const) {
      const reading = read(job, 'failed', { source });
      expect(reading.kind).toBe('failed');
      expect(reading.cause).not.toBe('');
      expect(reading.line).toContain('Dừng ở bước');
    }
    expect(read(job, 'failed').action).toBe('retry');
  });

  it('titles a zip import by how it ended, never "Đang nhập" after a failure', () => {
    const title = (job: Parameters<typeof read>[0], phase: Parameters<typeof read>[1]) =>
      read(job, phase, { source: 'zip' }).title;
    expect(title(importJob({ state: 'active', step: 'statements' }), 'running')).toBe(
      'Đang nhập kminmax',
    );
    expect(title(failedJob(), 'failed')).toBe('Không nhập được kminmax');
    expect(title(importJob({ state: 'completed', result: result() }), 'done')).toBe(
      'Đã nhập kminmax',
    );
  });

  it('titles a sync as a sync, and an unnamed job before any answer without a code', () => {
    const sync = importJob({ purpose: 'sync', state: 'active' });
    expect(read(sync, 'running').title).toBe('Đang đồng bộ kminmax');
    expect(read(null, null, { code: '' }).title).toBe('Đang hỏi trạng thái lượt nhập');
  });

  it('shows the converter words only when the code names nothing specific', () => {
    const other = failedJob({ errorCode: 'checker_unsupported', error: 'wcmp failed' });
    expect(read(other, 'failed').detail).toBe('wcmp failed');
    const generic = failedJob({ errorCode: 'import_failed', error: 'boom' });
    expect(read(generic, 'failed').detail).toBe('');
    expect(read(failedJob({ errorCode: 'problem_code_taken', error: 'x' }), 'failed').detail).toBe(
      '',
    );
  });

  it('says a failed job with no code gives no reason, never "null"', () => {
    const reading = read(failedJob({ error: null }), 'failed', { source: 'zip' });
    expect(reading.cause + reading.fix + reading.detail).not.toContain('null');
    expect(reading.fix).toContain('Hệ thống không cho biết thêm lý do');
  });

  it('reads a stop as its own line: the zip view has no "check again"', () => {
    const job = importJob({ state: 'active' });
    expect(read(job, 'running', { source: 'zip', stop: 'gaveUp' }).line).toContain('Tải lại trang');
    expect(read(job, 'running', { stop: 'notFound' }).line).toContain(
      'Không tìm thấy lượt nhập này',
    );
    expect(read(job, 'running', { stop: 'gaveUp' }).line).toContain('Lần cuối thấy');
  });
});
