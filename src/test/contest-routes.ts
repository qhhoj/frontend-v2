import type {
  Announcement,
  ContestDetail,
  ContestListItem,
  ContestPhase,
} from '@/api/types/contests';
import { contestDetail } from './fixtures';
import { ok, page } from './mock-api';
import type { ApiCall, MockHandler } from './mock-api';

/** A contest page: its detail and the announcement list every contest tab reads through ContestTabs. */
export const contestPageRoutes = (
  detail: ContestDetail = contestDetail(),
  announcements: Announcement[] = [],
): Record<string, MockHandler> => ({
  [`GET /contests/${encodeURIComponent(detail.key)}`]: ok(detail),
  [`GET /contests/${encodeURIComponent(detail.key)}/announcements`]: page(announcements),
});

/** `GET /contests` answering each phase group with its own rows (no `phase`: every row). */
export const contestListRoutes = (
  groups: Partial<Record<ContestPhase, ContestListItem[]>>,
): Record<string, MockHandler> => ({
  'GET /contests': (call: ApiCall) => {
    const phase = call.query.get('phase') as ContestPhase | null;
    const rows = phase ? (groups[phase] ?? []) : Object.values(groups).flat();
    return page(rows, { pageSize: Number(call.query.get('pageSize') ?? 50), total: rows.length });
  },
});
