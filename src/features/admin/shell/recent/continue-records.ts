import { ApiError } from '@/api/client';
import type { RecentScreen } from './recent-screens';

/** The two kinds of record a setter comes back to: a problem or a contest, opened in one of its editor tabs. */
export type RecordKind = 'problem' | 'contest';
export interface ContinueRecord {
  kind: RecordKind;
  /** The problem code or the contest key. */
  id: string;
  /** The editor tab this account opened last, so the row reopens it. */
  path: string;
  /** Title of that tab, shown as "where you were". */
  titleKey: string;
}

/** Rows on the dashboard's "Tiếp tục". */
export const CONTINUE_LIMIT = 5;
/** An editor tab: `/admin/problems/:code/<tab>` or `/admin/contests/:key/<tab>`. Create and import pages have one segment less. */
const EDITOR_TAB = /^\/admin\/(problems|contests)\/([^/]+)\/[^/]+$/;

/** The record an editor tab belongs to, or `null` for any other page. */
export function recordOf(path: string): Pick<ContinueRecord, 'kind' | 'id'> | null {
  const match = EDITOR_TAB.exec(path);
  if (!match) return null;
  return {
    kind: match[1] === 'problems' ? 'problem' : 'contest',
    id: decodeURIComponent(match[2]!),
  };
}

/** The newest visit per record (the list is newest first), at most `limit` records: a record opened in three tabs is one row. */
export function continueRecords(
  recent: readonly RecentScreen[],
  limit: number = CONTINUE_LIMIT,
): ContinueRecord[] {
  const rows = new Map<string, ContinueRecord>();
  for (const entry of recent) {
    const record = recordOf(entry.path);
    if (!record) continue;
    const key = `${record.kind}:${record.id}`;
    if (!rows.has(key)) rows.set(key, { ...record, path: entry.path, titleKey: entry.titleKey });
  }
  return [...rows.values()].slice(0, limit);
}

/** A read that says the record does not exist (404) or is not the viewer's to open (403): its visits are not worth remembering. */
export const isRecordGone = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 404 || error.status === 403);
