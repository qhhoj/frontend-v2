import type { DataExportStatus } from '@/api/types/account';

export type ExportFile =
  | { kind: 'none' }
  | { kind: 'expired' }
  | { kind: 'preparing'; requestedAt: string | null }
  | { kind: 'ready'; size: number; readyAt: string; expiresAt: string };

/** What the viewer has: nothing yet, a file that was swept after 7 days, a running job, or a file to download. */
export function exportFileOf(status: DataExportStatus): ExportFile {
  if (status.state === 'preparing') return { kind: 'preparing', requestedAt: status.preparedAt };
  if (status.state === 'ready' && status.readyAt && status.expiresAt)
    return {
      kind: 'ready',
      size: status.size ?? 0,
      readyAt: status.readyAt,
      expiresAt: status.expiresAt,
    };
  return { kind: status.preparedAt ? 'expired' : 'none' };
}

export type RequestRule =
  | { kind: 'locked' }
  | { kind: 'allowed' }
  | { kind: 'preparing' }
  | { kind: 'wait'; until: string }
  | { kind: 'dailyLimit' };

/**
 * Why a request is not possible now. The backend only says `canPrepare` and the once-a-day time (Decision 11).
 * While viewing as another user the backend refuses the export (private data), so the rule is `locked` whatever the status says.
 */
export function requestRuleOf(status: DataExportStatus, impersonating = false): RequestRule {
  if (impersonating) return { kind: 'locked' };
  if (status.canPrepare) return { kind: 'allowed' };
  if (status.state === 'preparing') return { kind: 'preparing' };
  if (status.nextPrepareAt) return { kind: 'wait', until: status.nextPrepareAt };
  return { kind: 'dailyLimit' };
}

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** Rounded up, so a wait never reads "0 minutes" while it lasts; never negative. */
export function timeLeft(until: string, now: number): { hours: number; minutes: number } {
  const minutes = Math.max(0, Math.ceil((Date.parse(until) - now) / MINUTE_MS));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

export const daysLeft = (until: string, now: number) =>
  Math.max(0, Math.ceil((Date.parse(until) - now) / DAY_MS));

/** The gaps doc keeps progress indeterminate: poll while the job runs, then stop. */
export const DATA_EXPORT_POLL_MS = 5000;
export const pollInterval = (status: DataExportStatus | undefined): number | false =>
  status?.state === 'preparing' ? DATA_EXPORT_POLL_MS : false;
