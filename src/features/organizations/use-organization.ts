import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import { useOrganizationQuery } from './organizations.queries';

/** The organization named by the route's `slug`, with its detail query (shared by the layout and every tab). */
export function useOrganization() {
  const route = useRoute();
  const slug = computed(() => String(route.params.slug));
  return { slug, query: useOrganizationQuery(slug) };
}

/** The API answers an unknown slug with a 404; that is a page state, not an error to retry. */
export const isNotFoundError = (error: unknown) =>
  error instanceof ApiError && error.status === 404;
