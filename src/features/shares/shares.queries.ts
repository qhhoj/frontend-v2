import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  createPasteShare,
  createSubmissionShare,
  deleteShare,
  editShare,
  fetchShare,
  fetchShareReports,
  fetchShares,
  reportShare,
  restoreShare,
  settleShareReports,
  takedownShare,
} from '@/api/shares.api';
import type { ShareReportOutcome, ShareReportQueue } from '@/api/types/shares';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';
import { ANONYMOUS_VIEWER, useViewerId } from '@/stores/use-viewer-id';

/** Every share query starts here, so one `invalidateQueries` refreshes the page, the lists and the dialog. */
export const SHARES_KEY = ['shares'] as const;
const MY_SHARES_PAGE_SIZE = 20;

/** The page of `/c/<code>`; the viewer id is in the key because owner and staff read more than a visitor. */
export const useShareQuery = (code: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...SHARES_KEY, 'view', toValue(code).toLowerCase(), viewer.value]),
    queryFn: () => fetchShare(toValue(code)),
  });
};

/** The viewer's own shares, newest first. */
export const useMySharesQuery = (page: MaybeRefOrGetter<number>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...SHARES_KEY, 'mine', toValue(page), viewer.value]),
    queryFn: () =>
      fetchShares({ scope: 'mine', page: toValue(page), pageSize: MY_SHARES_PAGE_SIZE }),
    enabled: computed(() => viewer.value !== ANONYMOUS_VIEWER),
    placeholderData: computed(() => keepPreviousForSameViewer(3, viewer.value)),
  });
};

/** The copies the viewer already made of one submission: the dialog's "already shared". Asked only when the dialog opens. */
export const useSubmissionSharesQuery = (
  submissionId: MaybeRefOrGetter<string>,
  isEnabled: MaybeRefOrGetter<boolean>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...SHARES_KEY, 'submission', toValue(submissionId), viewer.value]),
    queryFn: () => fetchShares({ scope: 'mine', submissionId: toValue(submissionId) }),
    enabled: computed(() => toValue(isEnabled) && viewer.value !== ANONYMOUS_VIEWER),
  });
};

/** A mutation that refreshes every share query when it settles. */
function useSharesMutation<Variables, Result>(
  mutationFn: (variables: Variables) => Promise<Result>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: SHARES_KEY }),
  });
}

export const useCreateSubmissionShare = () => useSharesMutation(createSubmissionShare);
export const useCreatePasteShare = () => useSharesMutation(createPasteShare);
export const useEditShare = () =>
  useSharesMutation(({ code, ...body }: { code: string } & Parameters<typeof editShare>[1]) =>
    editShare(code, body),
  );
export const useDeleteShare = () => useSharesMutation(deleteShare);
export const useTakedownShare = () =>
  useSharesMutation(({ code, reason }: { code: string; reason: string }) =>
    takedownShare(code, reason),
  );
export const useRestoreShare = () => useSharesMutation(restoreShare);
export const useReportShare = () =>
  useMutation({
    mutationFn: ({
      code,
      reason,
      note,
    }: {
      code: string;
      reason: Parameters<typeof reportShare>[1];
      note: string;
    }) => reportShare(code, reason, note),
  });

/** The staff queue (`judge.manage_share`); `isEnabled` false keeps it idle. */
export const useShareReportsQuery = (
  page: MaybeRefOrGetter<number>,
  status: MaybeRefOrGetter<ShareReportQueue>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      ...SHARES_KEY,
      'reports',
      toValue(status),
      toValue(page),
      viewer.value,
    ]),
    queryFn: () => fetchShareReports(toValue(page), toValue(status)),
    placeholderData: computed(() => keepPreviousForSameViewer(4, viewer.value)),
  });
};

export const useSettleShareReports = () =>
  useSharesMutation(({ code, outcome }: { code: string; outcome: ShareReportOutcome }) =>
    settleShareReports(code, outcome),
  );
