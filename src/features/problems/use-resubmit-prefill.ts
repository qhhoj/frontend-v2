import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchSubmission, fetchSubmissionSource } from '@/api/submissions.api';

export interface ResubmitPrefill {
  languageId: string | null;
  source: string;
}

/**
 * `?resubmit=<id>`: fetches the earlier submission once and hands its language and source to `apply`. The query
 * parameter is dropped first, so a reload (or a failed fetch) never prefills again.
 */
export function useResubmitPrefill(
  resubmitId: Ref<string | null>,
  apply: (prefill: ResubmitPrefill) => void,
) {
  const route = useRoute();
  const router = useRouter();
  const resubmitUnavailable = ref(false);

  async function load(id: string) {
    try {
      const [submission, { source }] = await Promise.all([
        fetchSubmission(id),
        fetchSubmissionSource(id),
      ]);
      apply({ languageId: submission.language?.id ?? null, source });
    } catch {
      // 401, 403 and 404 all mean the same to the viewer: this submission cannot be reused.
      resubmitUnavailable.value = true;
    }
  }
  watch(
    resubmitId,
    (id) => {
      if (id === null) return;
      void router.replace({ query: { ...route.query, resubmit: undefined } });
      void load(id);
    },
    { immediate: true },
  );
  return { resubmitUnavailable };
}
