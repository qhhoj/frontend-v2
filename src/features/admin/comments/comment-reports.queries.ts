import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchCommentReports, settleCommentReports } from '@/api/comments.api';
import type { CommentReportOutcome } from '@/api/types/comments';
import { useViewerId } from '@/stores/use-viewer-id';

const REPORTS_KEY = ['admin', 'comment-reports'] as const;

export const useCommentReportsQuery = (page: MaybeRefOrGetter<number>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...REPORTS_KEY, toValue(page), viewer.value]),
    queryFn: () => fetchCommentReports(toValue(page)),
    placeholderData: keepPreviousData,
  });
};

/** Resolve or dismiss every open report of one comment; the queue is fetched again either way. */
export function useSettleReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome: CommentReportOutcome }) =>
      settleCommentReports(id, outcome),
    onSettled: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
  });
}
