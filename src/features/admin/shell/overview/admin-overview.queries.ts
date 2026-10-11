import { computed } from 'vue';
import { useTicketSummaryQuery } from '@/features/tickets/tickets.queries';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS } from '../../admin-screens';
import { useCommentReportsQuery } from '../../comments/comment-reports.queries';
import {
  ORGANIZATION_QUEUE_PERMISSION,
  useAllJoinRequestsQuery,
} from '../../organizations/join-requests.queries';
import type { AdminNavId } from '../admin-nav';

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
  return computed<Partial<Record<AdminNavId, number | null>>>(() => ({
    tickets: counts.awaitingTickets.value,
    commentReports: counts.openReports.value,
    organizations: counts.pendingRequests.value,
  }));
}
