import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { PostFeed } from '@/api/types/blog';
import { pageFromQuery } from '@/lib/paging';

/** `?feed=all` lists every personal post; anything else is the newsfeed. */
export function useBlogRoute() {
  const route = useRoute();
  return {
    feed: computed<PostFeed>(() => (route.query.feed === 'all' ? 'all' : 'global')),
    page: computed(() => pageFromQuery(route.query.page)),
  };
}
