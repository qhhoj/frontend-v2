import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { submitFailureOf } from './ticket-submit';

describe('submit failure', () => {
  it('shows a muted account its own panel, whatever the ticket kind', () => {
    const failure = submitFailureOf(new ApiError('forbidden', 403, 'forbidden'), 'general');
    expect(failure).toEqual({
      kind: 'panel',
      titleKey: 'tickets.new.mutedTitle',
      bodyKey: 'tickets.new.mutedBody',
    });
  });
  it('points at the problem code when the server does not know it', () => {
    expect(submitFailureOf(new ApiError('not_found', 404, 'nope'), 'problem')).toEqual({
      kind: 'field',
      issue: { field: 'problemCode', key: 'tickets.new.problemMissing' },
    });
  });
  it('does not blame the problem code for a 404 on a general issue', () => {
    expect(submitFailureOf(new ApiError('not_found', 404, 'nope'), 'general').kind).toBe('panel');
  });
});

describe('submit failure: rate limits', () => {
  it('tells a rate-limited viewer how long to wait, from the Retry-After the server sent', () => {
    expect(
      submitFailureOf(
        new ApiError('rate_limited', 429, 'slow', { retryAfterSeconds: 42 }),
        'problem',
      ),
    ).toEqual({
      kind: 'panel',
      titleKey: 'tickets.new.failedTitle',
      bodyKey: 'tickets.new.rateLimitedWait',
      bodyParams: { seconds: 42 },
    });
  });
});
