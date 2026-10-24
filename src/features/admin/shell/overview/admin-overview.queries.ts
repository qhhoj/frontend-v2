import { useQuery } from '@tanstack/vue-query';
import { computed, onScopeDispose } from 'vue';
import { fetchAdminProblems } from '@/api/admin-index.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { PROBLEM_INDEX_KEY } from '../../problems/problem-editing.queries';
import { useSubmissionStatsQuery } from '@/features/submissions/submissions.queries';
import { TICKET_SUMMARY_POLL_MS, useTicketSummaryQuery } from '@/features/tickets/tickets.queries';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS, CONTEST_EDIT_OWN, PROBLEM_EDIT, TICKET_STAFF } from '../../admin-screens';
import { useCommentReportsQuery } from '../../comments/comment-reports.queries';
import {
  ORGANIZATION_QUEUE_PERMISSION,
  useAllJoinRequestsQuery,
} from '../../organizations/join-requests.queries';
import type { AdminNavId } from '../admin-nav';

/**
 * The report and join-request badges share their screens' first-page queries, which do not poll themselves; refresh them
 * on the ticket count's interval while the tab is visible (a hidden tab waits, as `refetchInterval` does).
 */
function pollWhileVisible(refresh: () => void) {
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') refresh();
  }, TICKET_SUMMARY_POLL_MS);
  onScopeDispose(() => clearInterval(timer));
}

/** Whoever makes problems or contests has tickets about them (the summary's `aboutMineOpen`) and the maker tiles. */
export const isMakerOf = (can: (permission: string) => boolean) =>
  can(PROBLEM_EDIT) || can(CONTEST_EDIT_OWN);

/**
 * What waits for staff: `null` where the viewer cannot act on it (or the count has not arrived), never a 0 they cannot use.
 * Each count is the first page its own screen reads (same query, same cache), so acting there updates the badge too.
 */
export function useAdminCounts() {
  const { can, canAny } = usePermissions();
  const canTickets = computed(() => can(TICKET_STAFF));
  const isMaker = computed(() => isMakerOf(can));
  const canQueue = computed(() => canAny(ADMIN_SCREENS.submissions.permission));
  const canReports = computed(() => can(ADMIN_SCREENS.commentReports.permission));
  const canRequests = computed(() => can(ORGANIZATION_QUEUE_PERMISSION));
  const tickets = useTicketSummaryQuery();
  const reports = useCommentReportsQuery(1, canReports);
  const requests = useAllJoinRequestsQuery('P', 1);
  const stats = useSubmissionStatsQuery(canQueue);
  return {
    refreshQueues: () => {
      if (canReports.value) void reports.refetch();
      if (canRequests.value) void requests.refetch();
    },
    awaitingTickets: computed(() =>
      canTickets.value ? (tickets.data.value?.awaitingStaff ?? null) : null,
    ),
    /** Open tickets about the viewer's problems and contests (the setter tile, and the badge for makers without the ticket right). */
    aboutMineTickets: computed(() =>
      isMaker.value ? (tickets.data.value?.aboutMineOpen ?? null) : null,
    ),
    openReports: computed(() =>
      canReports.value ? (reports.data.value?.meta.total ?? null) : null,
    ),
    pendingRequests: computed(() =>
      canRequests.value ? (requests.data.value?.meta.total ?? null) : null,
    ),
    /** Submissions waiting for or under judging (the public strip's count, polled on its own). */
    queuedSubmissions: computed(() =>
      canQueue.value ? (stats.data.value?.queueLength ?? null) : null,
    ),
  };
}

/** A nav badge: the count, and whether it waits for staff (attention colour) or only informs (the judge queue drains by itself). */
export interface NavCount {
  value: number | null;
  needsAction: boolean;
}

/** The nav items that carry a count badge, and which count: every queue item. */
export function useNavCounts() {
  const counts = useAdminCounts();
  // The shell mounts once per admin visit, so this is the one poll.
  pollWhileVisible(counts.refreshQueues);
  const waiting = (value: number | null): NavCount => ({ value, needsAction: true });
  return computed<Partial<Record<AdminNavId, NavCount>>>(() => ({
    submissions: { value: counts.queuedSubmissions.value, needsAction: false },
    // Ticket staff answer whatever waits; a setter only the tickets about their problems.
    tickets: waiting(counts.awaitingTickets.value ?? counts.aboutMineTickets.value),
    commentReports: waiting(counts.openReports.value),
    organizations: waiting(counts.pendingRequests.value),
  }));
}

/** How many problems the viewer may edit are public and how many are not (the setter tiles); `isEnabled` for problem editors. */
export function useEditableProblemCounts(isEnabled: () => boolean) {
  const viewer = useViewerId();
  const countOf = (visibility: 'public' | 'private') =>
    useQuery({
      // Under the problem index's key, so every problem write that refreshes the index refreshes these counts too.
      queryKey: computed(() => [...PROBLEM_INDEX_KEY, 'counts', visibility, viewer.value]),
      queryFn: () => fetchAdminProblems({ visibility, pageSize: 1 }),
      enabled: computed(isEnabled),
    });
  const unpublished = countOf('private');
  const published = countOf('public');
  /** The count, `—` when the request failed (the tile still links to the list), null while loading. */
  const totalOf = (query: typeof unpublished) =>
    computed(() => {
      if (query.isError.value) return '—';
      const meta = query.data.value?.meta;
      return meta && 'total' in meta ? meta.total : null;
    });
  return { unpublished: totalOf(unpublished), published: totalOf(published) };
}
