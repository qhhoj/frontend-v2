import { useQuery } from '@tanstack/vue-query';
import { fetchProblemMeta } from '@/api/problems.api';

/** Types, groups and languages change rarely. */
export const useProblemMetaQuery = () =>
  useQuery({ queryKey: ['problems', 'meta'], queryFn: fetchProblemMeta, staleTime: 10 * 60_000 });
