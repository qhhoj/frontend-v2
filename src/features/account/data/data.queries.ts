import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchDataExportStatus } from '@/api/account.api';
import { useSessionStore } from '@/stores/session.store';
import { pollInterval } from './data-export';

export const DATA_EXPORT_KEY = ['account', 'data-export'] as const;

/**
 * The viewer's export status; polls while a job runs. Errors use the app's default retry rule (`shouldRetry`: 4xx is final),
 * so a 404 (export off, muted account) reaches the page at once and is shown as "not available".
 * Never asked while viewing as another user: the backend refuses private data to staff (Decision 17).
 */
export function useDataExportQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => [...DATA_EXPORT_KEY, session.user?.id] as const),
    queryFn: fetchDataExportStatus,
    enabled: computed(() => session.status === 'authenticated' && !session.impersonatorId),
    refetchInterval: (query) => pollInterval(query.state.data),
  });
}
