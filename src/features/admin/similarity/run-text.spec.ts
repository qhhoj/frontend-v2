import { describe, expect, it } from 'vitest';
import { similarityRun } from '@/test/admin-fixtures/similarity';
import { runDurationText } from './run-text';

const STARTED = '2026-10-08T07:10:00.000Z';

describe('run duration wording', () => {
  it('shows seconds under a minute and minutes with seconds after it', () => {
    expect(
      runDurationText(
        similarityRun({ startedAt: STARTED, finishedAt: '2026-10-08T07:10:05.000Z' }),
      ),
    ).toBe('5 giây');
    expect(
      runDurationText(
        similarityRun({ startedAt: STARTED, finishedAt: '2026-10-08T07:11:05.000Z' }),
      ),
    ).toBe('1 phút 5 giây');
  });

  it('never says not started for a failed run that has a start time', () => {
    const failed = similarityRun({
      status: 'failed',
      error: 'deadline',
      startedAt: STARTED,
      finishedAt: null,
    });
    expect(runDurationText(failed)).toBe('—');
  });

  it('says running while a run runs, and not started only while it waits in the queue', () => {
    expect(
      runDurationText(similarityRun({ status: 'running', startedAt: STARTED, finishedAt: null })),
    ).toBe('đang chạy');
    expect(
      runDurationText(similarityRun({ status: 'queued', startedAt: null, finishedAt: null })),
    ).toBe('chưa bắt đầu');
  });
});
