import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchSubmission, fetchSubmissionSource } from '@/api/submissions.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** One submission row per viewer: what a viewer may see of it (cases, source) depends on who asks. */
export const useSubmissionQuery = (id: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'detail', viewerId.value, id.value]),
    queryFn: () => fetchSubmission(id.value),
  });
};

/** The source of one submission per viewer. Mounted only once the detail is known (its 403 would repeat). */
export const useSubmissionSourceQuery = (id: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'source', viewerId.value, id.value]),
    queryFn: () => fetchSubmissionSource(id.value),
  });
};
