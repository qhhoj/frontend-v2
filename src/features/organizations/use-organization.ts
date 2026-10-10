import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import { useOrganizationQuery, useOrganizationsQuery } from './organizations.queries';
import { rankByPoints } from './org-visuals';

/** The organization named by the route's `slug`, with its detail query (shared by the layout and every tab). */
export function useOrganization() {
  const route = useRoute();
  const slug = computed(() => String(route.params.slug));
  return { slug, query: useOrganizationQuery(slug) };
}

/** The API answers an unknown slug with a 404; that is a page state, not an error to retry. */
export const isNotFoundError = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

/** The organization's place by performance points among the first list page; null until it loads or when it is not listed. */
export function useOrganizationRank(
  slug: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const list = useOrganizationsQuery(1, undefined, enabled);
  return computed(
    () =>
      rankByPoints(list.data.value?.items ?? []).find(({ item }) => item.slug === toValue(slug))
        ?.rank ?? null,
  );
}
