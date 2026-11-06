import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { withRetry } from './retry';

describe('withRetry', () => {
  it('backs off exponentially, waits out a short Retry-After, retries a busy lock and stops at a final refusal', async () => {
    const wait = vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve());
    const refusal = new ApiError('validation_failed', 400, 'bad');
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError('network_error', 0, 'Network error'))
      .mockRejectedValueOnce(new ApiError('http_error', 502, 'Bad gateway'))
      .mockRejectedValueOnce(
        new ApiError('rate_limited', 429, 'slow down', { retryAfterSeconds: 30 }),
      )
      .mockRejectedValueOnce(
        new ApiError('conflict', 409, 'busy', {
          issues: [{ field: 'lock', code: 'busy', message: 'busy' }],
        }),
      )
      .mockRejectedValueOnce(refusal);
    await expect(withRetry(task, { attempts: 9, baseDelayMs: 100, wait })).rejects.toBe(refusal);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([100, 200, 30_000, 800]);
  });
});
