import { computed, onScopeDispose } from 'vue';
import { TICKET_SUMMARY_POLL_MS, useTicketSummaryQuery } from '@/features/tickets/tickets.queries';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS } from '../../admin-screens';
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

/**
 * What waits for staff: `null` where the viewer cannot act on it (or the count has not arrived), never a 0 they cannot use.
 * Each count is the first page its own screen reads (same query, same cache), so acting there updates the badge too.
 */
export function useAdminCounts() {
  const { can } = usePermissions();
  const canTickets = computed(() => can(ADMIN_SCREENS.tickets.permission));
  const canReports = computed(() => can(ADMIN_SCREENS.commentReports.permission));
  const canRequests = computed(() => can(ORGANIZATION_QUEUE_PERMISSION));
  const tickets = useTicketSummaryQuery();
  const reports = useCommentReportsQuery(1, canReports);
  const requests = useAllJoinRequestsQuery('P', 1);
  return {
    refreshQueues: () => {
      if (canReports.value) void reports.refetch();
      if (canRequests.value) void requests.refetch();
    },
    awaitingTickets: computed(() =>
      canTickets.value ? (tickets.data.value?.awaitingStaff ?? null) : null,
    ),
    openReports: computed(() =>
      canReports.value ? (reports.data.value?.meta.total ?? null) : null,
    ),
    pendingRequests: computed(() =>
      canRequests.value ? (requests.data.value?.meta.total ?? null) : null,
    ),
  };
}

/** The nav items that carry a count badge, and which count. */
export function useNavCounts() {
  const counts = useAdminCounts();
  // The shell mounts once per admin visit, so this is the one poll.
  pollWhileVisible(counts.refreshQueues);
  return computed<Partial<Record<AdminNavId, number | null>>>(() => ({
    tickets: counts.awaitingTickets.value,
    commentReports: counts.openReports.value,
    organizations: counts.pendingRequests.value,
  }));
}
