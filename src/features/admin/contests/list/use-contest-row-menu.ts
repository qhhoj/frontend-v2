import { ExternalLink, TrendingUp, Trophy } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { ContestListItem } from '@/api/types/contests';
import type { RowMenuItem } from '../../ui/table/AdminRowMenu.vue';

/** A contest row's "⋯" items: the public page and ranking, and the Actions tab (where rating runs) once a rated contest has ended. */
export function useContestRowMenu() {
  const { t } = useI18n();
  return (contest: ContestListItem): RowMenuItem[] => {
    const params = { key: contest.key };
    const items: RowMenuItem[] = [
      { label: t('admin.contests.list.view'), icon: ExternalLink, to: { name: 'contest', params } },
      {
        label: t('admin.contests.list.ranking'),
        icon: Trophy,
        to: { name: 'contest-ranking', params },
      },
    ];
    if (contest.isRated && contest.phase === 'ended') {
      items.push({
        label: t('admin.contests.list.rate'),
        icon: TrendingUp,
        to: { name: 'admin-contestActions', params },
      });
    }
    return items;
  };
}
