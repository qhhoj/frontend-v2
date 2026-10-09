// Relative imports only: the e2e TypeScript project has no `@` alias and imports this file.
import type { ActivityLog, ActivitySummary, LiveActivity } from '../../api/types/activity-admin';

export const activityLog = (overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  id: 'l-1',
  at: '2026-10-08T08:41:08.000Z',
  username: 'ngocanh',
  ip: '113.161.40.7',
  path: '/api/internal/problems/hcmus41a/submit',
  method: 'POST',
  statusCode: 200,
  userAgent: 'Mozilla/5.0',
  referer: '',
  ...overrides,
});

export const liveActivity = (overrides: Partial<LiveActivity> = {}): LiveActivity => ({
  windowMinutes: 15,
  authenticatedUsers: 84,
  anonymousVisitors: 312,
  bots: 47,
  users: [
    { user: { id: 'id-ngocanh', username: 'ngocanh' }, lastSeenAt: '2026-10-08T08:40:55.000Z' },
  ],
  hasMore: false,
  ...overrides,
});

/** Thirty UTC days ending on 2026-10-08. */
const thirtyDays = () =>
  Array.from({ length: 30 }, (_day, index) => ({
    day: new Date(Date.UTC(2026, 8, 9 + index)).toISOString().slice(0, 10),
    count: index % 5 === 0 ? 0 : 900 + index * 37,
  }));

export const activitySummary = (overrides: Partial<ActivitySummary> = {}): ActivitySummary => ({
  username: 'tuan_k',
  total: 3482,
  daily: thirtyDays(),
  topIps: [
    { value: '27.69.12.3', count: 2910 },
    { value: '113.161.40.7', count: 412 },
  ],
  topPaths: [
    { value: '/submissions', count: 840 },
    { value: '/problems/hcmus41a', count: 310 },
  ],
  sessions: [
    {
      id: 's-1',
      ip: '27.69.12.3',
      userAgent: 'Mozilla/5.0 (iPhone)',
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      createdAt: '2026-10-07T13:02:00.000Z',
      lastActivityAt: '2026-10-08T08:10:00.000Z',
    },
    {
      id: 's-2',
      ip: '113.161.40.7',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      deviceType: 'desktop',
      browser: 'Firefox',
      os: 'Linux',
      createdAt: '2026-10-01T09:00:00.000Z',
      lastActivityAt: '2026-10-02T17:45:00.000Z',
    },
  ],
  ...overrides,
});
