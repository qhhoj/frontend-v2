import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchShortLinks } from '@/api/short-links.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForViewer } from '@/features/contests/keep-previous-for-viewer';

export const ADMIN_SHORT_LINK_PAGE_SIZE = 50;
/** The base of the staff list key; the viewer id and the page follow, as for every admin key. */
export const shortLinksKey = ['admin', 'shortLinks'] as const;

export function useAdminShortLinksQuery(page: Ref<number>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...shortLinksKey, viewer.value, page.value] as const),
    queryFn: () =>
      fetchShortLinks({ scope: 'all', page: page.value, pageSize: ADMIN_SHORT_LINK_PAGE_SIZE }),
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
  });
}
