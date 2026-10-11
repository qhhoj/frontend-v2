import { useQuery } from '@tanstack/vue-query';
import { fetchExternalJudgeStatus } from '@/api/external-judge.api';

export const externalJudgeStatusKey = ['external-judge', 'status'] as const;

/** Public and cached on the server for a minute, so the card refreshes at the same pace. */
export const useExternalJudgeStatusQuery = () =>
  useQuery({
    queryKey: externalJudgeStatusKey,
    queryFn: fetchExternalJudgeStatus,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
