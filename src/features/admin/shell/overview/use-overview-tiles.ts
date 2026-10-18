import { Eye, EyeOff, Flag, Hourglass, LifeBuoy, Server, UserPlus } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSubmissionStatsQuery } from '@/features/submissions/submissions.queries';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS, PROBLEM_EDIT, adminRouteName } from '../../admin-screens';
import { ORGANIZATION_QUEUE_PERMISSION } from '../../organizations/join-requests.queries';
import { useAdminCounts, useEditableProblemCounts } from './admin-overview.queries';
import { attentionFirst } from './overview-tiles';
import type { OverviewTileSpec } from './overview-tiles';

/** Who sees the queue and judge figures: the staff who can act on judging. */
export const JUDGING_STAFF = ['judge.change_judge', 'judge.rejudge_submission'];
const LABEL = 'admin.shell.overview';

/**
 * The dashboard's figures for this viewer (P-33), the ones that need attention first. Each tile links to its filtered
 * list; a figure the viewer cannot act on is left out, and its query never runs.
 */
export function useOverviewTiles() {
  const judging = useJudgingTiles();
  const queues = useQueueTiles();
  const setter = useSetterTiles();
  return computed(() => attentionFirst([...judging.value, ...queues.value, ...setter.value]));
}

/** The public submission strip's numbers (the queue counts what a signed-out viewer may see). */
function useJudgingTiles() {
  const { t } = useI18n();
  const { can, canAny } = usePermissions();
  const isShown = computed(() => canAny(JUDGING_STAFF));
  const stats = useSubmissionStatsQuery(isShown);
  return computed<OverviewTileSpec[]>(() => {
    if (!isShown.value) return [];
    const data = stats.data.value;
    return [
      {
        key: 'queue',
        icon: Hourglass,
        label: t(`${LABEL}.queue`),
        value: data?.queueLength ?? null,
        detail: t(`${LABEL}.queueDetail`),
        // Staff who can open the admin list see the queued rows there; the others get the public list.
        to: canAny(ADMIN_SCREENS.submissions.permission)
          ? { name: adminRouteName('submissions'), query: { status: 'QU' } }
          : { name: 'submissions' },
        needsAttention: (data?.queueLength ?? 0) > 0,
        linkText: t(`${LABEL}.links.queue`),
      },
      {
        key: 'judges',
        icon: Server,
        label: t(`${LABEL}.judges`),
        value: data ? `${data.judgesOnline}/${data.judgesTotal}` : null,
        detail: t(`${LABEL}.judgesDetail`),
        to: { name: adminRouteName(can('judge.change_judge') ? 'judges' : 'rejudge') },
        needsAttention: data?.judgesOnline === 0,
        linkText: t(`${LABEL}.links.judges`),
      },
    ];
  });
}

/** What waits for staff: tickets, reported comments, join requests; each where the viewer may answer it. */
function useQueueTiles() {
  const { t } = useI18n();
  const { can } = usePermissions();
  const counts = useAdminCounts();
  const waiting = (key: string, icon: OverviewTileSpec['icon'], value: number | null) => ({
    key,
    icon,
    label: t(`${LABEL}.${key}`),
    value,
    detail: t(`${LABEL}.${key}Detail`),
    needsAttention: !!value,
    linkText: t(`${LABEL}.links.${key}`, value ?? 0),
  });
  return computed<OverviewTileSpec[]>(() => [
    ...(can(ADMIN_SCREENS.tickets.permission)
      ? [
          {
            ...waiting('tickets', LifeBuoy, counts.awaitingTickets.value),
            to: { name: adminRouteName('tickets') },
          },
        ]
      : []),
    ...(can(ADMIN_SCREENS.commentReports.permission)
      ? [
          {
            ...waiting('reports', Flag, counts.openReports.value),
            to: { name: adminRouteName('commentReports') },
          },
        ]
      : []),
    ...(can(ORGANIZATION_QUEUE_PERMISSION)
      ? [
          {
            ...waiting('requests', UserPlus, counts.pendingRequests.value),
            to: { name: adminRouteName('organizations'), query: { view: 'requests' } },
          },
        ]
      : []),
  ]);
}

/** The problem setter's figures: the problems they may edit, not yet public and public, each opening that list. */
function useSetterTiles() {
  const { t } = useI18n();
  const { can } = usePermissions();
  const isShown = () => can(PROBLEM_EDIT);
  const counts = useEditableProblemCounts(isShown);
  /** The plural of the link line needs a number; a failed or loading count shows the tile's generic line anyway. */
  const numberOf = (value: number | string | null) => (typeof value === 'number' ? value : 0);
  const problems = (key: 'unpublished' | 'published', value: number | string | null) => ({
    key,
    icon: key === 'unpublished' ? EyeOff : Eye,
    label: t(`${LABEL}.${key}`),
    value,
    detail: t(`${LABEL}.${key}Detail`),
    to: {
      name: adminRouteName('problems'),
      query: { status: key === 'unpublished' ? 'private' : 'public' },
    },
    linkText: t(`${LABEL}.links.problems`, numberOf(value)),
  });
  return computed<OverviewTileSpec[]>(() =>
    isShown()
      ? [
          problems('unpublished', counts.unpublished.value),
          problems('published', counts.published.value),
        ]
      : [],
  );
}
