import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { balloonsKey, isRefusal } from './contest-extras.queries';

describe('contest extras query keys and retry rule', () => {
  it("keeps the viewer id in the balloon key, so one account never reads another one's queue", () => {
    const query = { state: 'pending', page: 1, pageSize: 50 } as const;
    expect(balloonsKey('alice', 'r42', query)).not.toEqual(balloonsKey('bob', 'r42', query));
    expect(balloonsKey('alice', 'r42', query)[2]).toBe('alice');
  });

  it('treats 403 and 404 as answers, never retried; other failures are retried', () => {
    expect(isRefusal(new ApiError('forbidden', 403, 'x'))).toBe(true);
    expect(isRefusal(new ApiError('not_found', 404, 'x'))).toBe(true);
    expect(isRefusal(new ApiError('generic', 500, 'x'))).toBe(false);
    expect(isRefusal(new Error('network'))).toBe(false);
  });
});
