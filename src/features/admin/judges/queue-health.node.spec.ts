import { describe, expect, it } from 'vitest';
import type { JudgeQueue } from '@/api/types/judges-admin';
import { STALE_WAIT_MS, queueAlerts } from './queue-health';

const NOW = new Date('2026-10-11T10:00:00Z').getTime();
const queue = (overrides: Partial<JudgeQueue> = {}): JudgeQueue => ({
  queued: 3,
  processing: 0,
  grading: 0,
  oldestQueuedSince: new Date(NOW - 1000).toISOString(),
  byPriority: [],
  byLanguage: [],
  pinned: [],
  ...overrides,
});

describe('queueAlerts', () => {
  it('flags a queued language with no usable online judge, and only that one', () => {
    const alerts = queueAlerts(
      queue({
        byLanguage: [
          { id: 'l1', key: 'CPP17', name: 'C++17', count: 2, onlineJudges: 3 },
          { id: 'l2', key: 'PY3', name: 'Python 3', count: 1, onlineJudges: 0 },
        ],
      }),
      NOW,
    );
    expect(alerts).toEqual([{ kind: 'noJudge', subject: 'Python 3', count: 1 }]);
  });

  it('flags rows pinned to an offline judge and a wait past the stale limit', () => {
    const alerts = queueAlerts(
      queue({
        oldestQueuedSince: new Date(NOW - STALE_WAIT_MS - 1).toISOString(),
        pinned: [
          { judge: 'alpha', count: 4, online: false },
          { judge: 'beta', count: 1, online: true },
        ],
      }),
      NOW,
    );
    expect(alerts.map((alert) => alert.kind)).toEqual(['pinnedOffline', 'stale']);
    expect(alerts[0]).toMatchObject({ subject: 'alpha', count: 4 });
  });

  it('is quiet for an empty queue', () => {
    expect(queueAlerts(queue({ queued: 0, oldestQueuedSince: null }), NOW)).toEqual([]);
  });
});
