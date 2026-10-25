import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchIntegrationClients } from '@/api/integration-clients.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';

export const INTEGRATION_PAGE_SIZE = 50;
/** The base of the list key; the viewer id and the page follow, as for every admin key. */
export const integrationClientsKey = ['admin', 'integrationClients'] as const;

export function useIntegrationClientsQuery(page: Ref<number>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...integrationClientsKey, viewer.value, page.value] as const),
    queryFn: () => fetchIntegrationClients({ page: page.value, pageSize: INTEGRATION_PAGE_SIZE }),
    placeholderData: computed(() => keepPreviousForSameViewer(2, viewer.value)),
  });
}
