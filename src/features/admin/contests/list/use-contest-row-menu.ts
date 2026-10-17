import { TrendingUp, Trophy } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { ContestListItem } from '@/api/types/contests';
import { usePermissions } from '@/stores/use-permissions';
import { standardRowMenu } from '../../ui/table/standard-row-menu';
import type { RowMenuItem } from '../../ui/table/AdminRowMenu.vue';
import { deleteBlockedBy } from '../lifecycle/contest-delete';

/**
 * A contest row's "⋯" items, by the admin row contract: Xem · Nhân bản… · (ranking, and the Actions tab where rating runs
 * once a rated contest has ended) · Xoá…, the delete disabled with its reason while the contest is visible.
 */
export function useContestRowMenu(open: {
  clone: (contest: ContestListItem) => void;
  remove: (contest: ContestListItem) => void;
}) {
  const { t } = useI18n();
  const { can } = usePermissions();
  return (contest: ContestListItem): RowMenuItem[] => {
    const params = { key: contest.key };
    const extra: RowMenuItem[] = [
      {
        label: t('admin.contests.list.ranking'),
        icon: Trophy,
        to: { name: 'contest-ranking', params },
      },
    ];
    if (contest.isRated && contest.phase === 'ended')
      extra.push({
        label: t('admin.contests.list.rate'),
        icon: TrendingUp,
        to: { name: 'admin-contestActions', params },
      });
    return standardRowMenu({
      view: { name: 'contest', params },
      clone: can('judge.clone_contest') ? () => open.clone(contest) : undefined,
      extra,
      // The backend lets a contest's editors delete it; the list's editor block is there only for them.
      remove: contest.editor
        ? { run: () => open.remove(contest), blockedBy: deleteBlockedBy(contest.editor.isVisible) }
        : undefined,
    });
  };
}
