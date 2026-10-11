import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { rejudgeSubmissions } from '@/api/submission-actions.api';
import type { RejudgeBody, RejudgeResult } from '@/api/types/submission-actions';
import { canConfirmRejudge, useRejudgeCount } from './use-rejudge-count';
import type { RejudgeCountState } from './use-rejudge-count';

vi.mock('@/api/submission-actions.api', () => ({ rejudgeSubmissions: vi.fn() }));

const BODY: RejudgeBody = { problem: 'hcmus41c', results: ['WA'] };
const NOW = new Date('2026-10-09T07:52:31.000Z');
const answer = (count: number, allowed = true): RejudgeResult => ({
  count,
  dryRun: true,
  allowed,
  sample: [],
});
/** A request the spec settles by hand, so two counts can overlap. */
function deferred() {
  let resolve!: (value: RejudgeResult) => void;
  const promise = new Promise<RejudgeResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const useCount = () => useRejudgeCount(() => NOW);

beforeEach(() => vi.mocked(rejudgeSubmissions).mockReset());

describe('useRejudgeCount', () => {
  it('asks with dryRun on, leaves the caller body alone and keeps count, permission and the time', async () => {
    vi.mocked(rejudgeSubmissions).mockResolvedValueOnce(answer(128));
    const { state, count } = useCount();
    await count(BODY);
    expect(rejudgeSubmissions).toHaveBeenCalledWith({ ...BODY, dryRun: true });
    expect(BODY).toEqual({ problem: 'hcmus41c', results: ['WA'] });
    expect(state.value).toEqual({
      kind: 'ready',
      count: 128,
      allowed: true,
      countedAt: NOW.toISOString(),
      sample: [],
    });
  });

  it('words a refused count and a wait as text, never as a count', async () => {
    vi.mocked(rejudgeSubmissions).mockRejectedValueOnce(new ApiError('forbidden', 403, 'x'));
    const { state, count } = useCount();
    await count(BODY);
    expect(state.value).toEqual({ kind: 'failed', text: 'Bạn không có quyền làm việc này.' });

    vi.mocked(rejudgeSubmissions).mockRejectedValueOnce(
      new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 30 }),
    );
    await count(BODY);
    expect(state.value.kind === 'failed' && state.value.text).toContain('Thử lại sau 30 giây.');
  });

  it('leaves "counting" for a failed state on an unexpected error, and still rethrows it', async () => {
    vi.mocked(rejudgeSubmissions).mockRejectedValueOnce(new TypeError('boom'));
    const { state, count } = useRejudgeCount();
    await expect(count(BODY)).rejects.toThrow('boom');
    expect(state.value.kind).toBe('failed');
  });

  it('shows the newest count when an older one answers late', async () => {
    const older = deferred();
    vi.mocked(rejudgeSubmissions)
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce(answer(6));
    const { state, count } = useCount();
    const first = count(BODY);
    await count(BODY);
    older.resolve(answer(5));
    await first;
    expect(state.value).toMatchObject({ kind: 'ready', count: 6 });
  });
});

describe('canConfirmRejudge', () => {
  const ready = (count: number, allowed: boolean): RejudgeCountState => ({
    kind: 'ready',
    count,
    allowed,
    countedAt: NOW.toISOString(),
    sample: [],
  });
  it.each<[RejudgeCountState, boolean]>([
    [{ kind: 'idle' }, false],
    [{ kind: 'counting' }, false],
    [{ kind: 'failed', text: 'x' }, false],
    [ready(128, true), true],
    [ready(0, true), false],
    [ready(1340, false), false],
  ])('%j -> %s', (state, expected) => {
    expect(canConfirmRejudge(state)).toBe(expected);
  });
});
