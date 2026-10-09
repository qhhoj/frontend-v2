import { computed } from 'vue';
import type { Ref } from 'vue';
import type { DiffSideInput } from './diff-state';
import { useSubmissionQuery, useSubmissionSourceQuery } from './submissions.queries';

/** One side of the diff: the per-viewer detail (header, language, author) and source queries, read as one input. */
export function useDiffSide(id: Ref<string>) {
  const detail = useSubmissionQuery(id);
  const source = useSubmissionSourceQuery(id);
  const input = computed<DiffSideInput>(() => ({
    isPending: detail.isPending.value || source.isPending.value,
    errors: [detail.error.value, source.error.value],
    source: source.data.value?.source,
  }));
  const refetch = () => Promise.all([detail.refetch(), source.refetch()]);
  return { detail, source, input, refetch };
}
