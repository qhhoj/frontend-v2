import type { JudgeQueue } from '@/api/types/judges-admin';

/** Waiting longer than this with judges online reads as a stalled queue, not a busy one. */
export const STALE_WAIT_MS = 5 * 60_000;

export interface QueueAlert {
  kind: 'noJudge' | 'pinnedOffline' | 'stale';
  /** Language name or judge name; empty for `stale`. */
  subject: string;
  count: number;
}

/** Superseded final-contest rows wait here behind all other work; their age says nothing about a stuck queue. */
const BACKLOG_PRIORITY = 4;

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
  const urgent = queue.byPriority.filter((row) => row.priority !== BACKLOG_PRIORITY);
  const oldest = urgent.length
    ? Math.min(...urgent.map((row) => new Date(row.oldestSince).getTime()))
    : null;
  if (oldest !== null && now - oldest > STALE_WAIT_MS)
    alerts.push({
      kind: 'stale',
      subject: '',
      count: urgent.reduce((sum, row) => sum + row.count, 0),
    });
  return alerts;
}

/** Priority 0 contest … 3 batch rejudge, 4 backlog, as the i18n key part. */
export const PRIORITY_KEYS = ['contest', 'normal', 'rejudge', 'batch', 'backlog'] as const;
export const priorityKey = (priority: number) => PRIORITY_KEYS[priority] ?? 'normal';
