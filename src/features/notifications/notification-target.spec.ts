import { describe, expect, it } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import { isTargetGone, probeOf } from './notification-target';

describe('notification targets', () => {
  it('reads the ticket, contest or organization of a path and calls 403/404 gone', async () => {
    const calls = mockApi({
      'GET /tickets/t-9': fail(404, 'not_found'),
      'GET /contests/r42': ok({}),
      'GET /organizations/lhp': fail(403, 'forbidden'),
    });
    expect(await isTargetGone('/tickets/t-9')).toBe(true);
    expect(await isTargetGone('/contests/r42/ranking?virtual=1')).toBe(false);
    expect(await isTargetGone('/organizations/lhp#members')).toBe(true);
    expect(calls.map((call) => call.path)).toEqual([
      '/tickets/t-9',
      '/contests/r42',
      '/organizations/lhp',
    ]);
  });

  it('treats any other failure as open: the target page shows its own error', async () => {
    mockApi({ 'GET /tickets/t-9': fail(503, 'network_error') });
    expect(await isTargetGone('/tickets/t-9')).toBe(false);
  });

  it('probes nothing for other paths and for a malformed segment', async () => {
    const calls = mockApi({});
    expect(probeOf('/blog/new')).toBeNull();
    expect(probeOf('/tickets')).toBeNull();
    expect(probeOf('/tickets/%E0%A4%A')).toBeNull();
    expect(await isTargetGone('/problems/aplusb')).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
