import { describe, expect, it } from 'vitest';
import { mockApi, ok, takeUnmatchedRequests } from './mock-api';

describe('mockApi shell defaults', () => {
  it('answers an unrouted shell read without recording it', async () => {
    const calls = mockApi({ 'GET /problems': ok([]) });
    const response = await fetch('/api/internal/notifications/unread-count');
    expect(await response.json()).toEqual({ data: { count: 0 } });
    await fetch('/api/internal/problems');
    expect(calls.map((call) => call.path)).toEqual(['/problems']);
  });

  it('still reports any other unrouted request', async () => {
    mockApi({});
    await fetch('/api/internal/contests');
    expect(takeUnmatchedRequests()).toEqual(['GET /api/internal/contests']);
  });
});
