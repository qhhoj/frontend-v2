import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { fetchRuntimes } from '@/api/runtimes.api';

export const RUNTIMES_REFRESH_MS = 5000;

/** Public and polled: a failed poll keeps the last numbers on screen. */
export const useRuntimesQuery = () =>
  useQuery({
    queryKey: ['runtimes'],
    queryFn: fetchRuntimes,
    refetchInterval: RUNTIMES_REFRESH_MS,
    placeholderData: keepPreviousData,
  });
