import { describe, expect, it } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import {
  activityExportUrl,
  deleteAnonymousActivity,
  deleteUserActivity,
  fetchActivityLogs,
  fetchActivitySummary,
  fetchLiveActivity,
} from './activity-admin.api';

describe('activityExportUrl', () => {
  it('leaves empty filters out and keeps the order user, ip, path, days', () => {
    expect(activityExportUrl({ ip: '27.69', days: 30 })).toBe(
      '/api/internal/admin/user-activity/logs/export?ip=27.69&days=30',
    );
    expect(activityExportUrl({ user: '', ip: '', path: '/problems', days: 7 })).toBe(
      '/api/internal/admin/user-activity/logs/export?path=%2Fproblems&days=7',
    );
  });
});

describe('activity admin calls', () => {
  it('reads the log page with its filters and the live page', async () => {
    const calls = mockApi({
      'GET /admin/user-activity/logs': page([]),
      'GET /admin/user-activity/live': ok({}),
    });
    await fetchActivityLogs({ user: 'ann', days: 7, page: 3 });
    await fetchLiveActivity(2);
    expect(calls[0]!.path).toBe('/admin/user-activity/logs');
    expect(Object.fromEntries(calls[0]!.query)).toEqual({ user: 'ann', days: '7', page: '3' });
    expect(calls[1]!.query.get('page')).toBe('2');
  });

  it('reads a summary by encoded username and deletes user and anonymous history', async () => {
    const calls = mockApi({
      'GET /admin/user-activity/users/a%2Fb/summary': ok({}),
      'DELETE /admin/user-activity/users/a%2Fb': { status: 204 },
      'DELETE /admin/user-activity/anonymous': { status: 204 },
    });
    await fetchActivitySummary('a/b', 14);
    await deleteUserActivity('a/b');
    await deleteAnonymousActivity();
    expect(calls[0]!.query.get('days')).toBe('14');
    expect(calls.map((call) => call.method)).toEqual(['GET', 'DELETE', 'DELETE']);
    expect(calls[2]!.path).toBe('/admin/user-activity/anonymous');
  });
});
