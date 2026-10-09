import { describe, expect, it } from 'vitest';
import { activityExportUrl } from './activity-admin.api';

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
