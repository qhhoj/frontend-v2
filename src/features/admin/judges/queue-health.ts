import type { JudgeQueue } from '@/api/types/judges-admin';

/** Waiting longer than this with judges online reads as a stalled queue, not a busy one. */
export const STALE_WAIT_MS = 5 * 60_000;

export interface QueueAlert {
  kind: 'noJudge' | 'pinnedOffline' | 'stale';
  /** Language name or judge name; empty for `stale`. */
  subject: string;
  count: number;
}

/** What needs a human: a queued language no usable judge runs, rows pinned to a judge that is away, and a long oldest wait. */
export function queueAlerts(queue: JudgeQueue, now: number): QueueAlert[] {
  const alerts: QueueAlert[] = [
    ...queue.byLanguage
      .filter((language) => language.onlineJudges === 0)
      .map((language) => ({
        kind: 'noJudge' as const,
        subject: language.name ?? language.id,
        count: language.count,
      })),
    ...queue.pinned
      .filter((pin) => !pin.online)
      .map((pin) => ({ kind: 'pinnedOffline' as const, subject: pin.judge, count: pin.count })),
  ];
  const oldest = queue.oldestQueuedSince ? new Date(queue.oldestQueuedSince).getTime() : null;
  if (oldest !== null && now - oldest > STALE_WAIT_MS)
    alerts.push({ kind: 'stale', subject: '', count: queue.queued });
  return alerts;
}

/** Priority 0 contest … 3 batch rejudge, as the i18n key part. */
export const PRIORITY_KEYS = ['contest', 'normal', 'rejudge', 'batch'] as const;
export const priorityKey = (priority: number) => PRIORITY_KEYS[priority] ?? 'normal';
