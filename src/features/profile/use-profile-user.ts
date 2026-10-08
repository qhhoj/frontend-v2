import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserPageQuery } from '@/features/users/users.queries';

/** The profile being shown: the route's username and its (shared, cached) page query. */
export function useProfileUser() {
  const route = useRoute();
  const username = computed(() => String(route.params.username ?? ''));
  return { username, query: useUserPageQuery(username) };
}
