import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { pageFromQuery } from '@/lib/paging';
import { sortFromQuery } from './leaderboard-columns';

/** The board's sort and page live in the URL (`?sort=&page=`), so every view is a link. */
export function useLeaderboardRoute() {
  const route = useRoute();
  return {
    sort: computed(() => sortFromQuery(route.query.sort)),
    page: computed(() => pageFromQuery(route.query.page)),
  };
}
