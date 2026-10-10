import { ref } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchRandomProblem } from '@/api/problems.api';
import { ApiError } from '@/api/client';
import { toApiFilters } from './use-problem-filters';
import type { ProblemFilters } from './use-problem-filters';

/** "Bài ngẫu nhiên": asks for one problem under the current filters and opens it. `missing` is set when none match. */
export function useRandomProblem(filters: Ref<ProblemFilters>) {
  const router = useRouter();
  const pending = ref(false);
  const missing = ref(false);
  const failed = ref(false);
  async function open() {
    pending.value = true;
    missing.value = false;
    failed.value = false;
    try {
      const { code } = await fetchRandomProblem(toApiFilters(filters.value));
      await router.push({ name: 'problem', params: { code } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) missing.value = true;
      else failed.value = true;
    } finally {
      pending.value = false;
    }
  }
  return { open, pending, missing, failed };
}
