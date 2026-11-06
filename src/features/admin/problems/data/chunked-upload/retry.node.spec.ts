import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { withRetry } from './retry';

describe('withRetry', () => {
  it('backs off exponentially on transient failures and stops at a final refusal', async () => {
    const wait = vi.fn(() => Promise.resolve());
    const refusal = new ApiError('validation_failed', 400, 'bad');
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError('network_error', 0, 'Network error'))
      .mockRejectedValueOnce(new ApiError('http_error', 502, 'Bad gateway'))
      .mockRejectedValueOnce(refusal);
    await expect(withRetry(task, { attempts: 5, baseDelayMs: 100, wait })).rejects.toBe(refusal);
    expect(wait.mock.calls).toEqual([[100], [200]]);
  });
});
