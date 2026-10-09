import { ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import type { QueryKey } from '@tanstack/vue-query';
import { ApiError } from '@/api/client';
import { fieldErrorsOf } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';

interface OrganizationWriteOptions<Vars, Result> {
  mutate: (vars: Vars) => Promise<Result>;
  /** Organization writes refresh the public 8e keys (`['organizations', …]`), which `useAdminMutation` does not accept. */
  invalidates: (vars: Vars) => QueryKey[];
  onDone?: (result: Result, vars: Vars) => void;
}

/**
 * One organization write: a pending flag that blocks a second call while the first is in flight, the failure and its field
 * texts, and the refresh of the public organization queries. Resolves to whether the write succeeded.
 */
export function useOrganizationWrite<Vars, Result>(
  options: OrganizationWriteOptions<Vars, Result>,
) {
  const queryClient = useQueryClient();
  const isPending = ref(false);
  const failure = ref<ApiError | null>(null);
  const fieldErrors = ref<FieldErrors>({});

  async function settle(result: Result, vars: Vars) {
    await Promise.all(
      options.invalidates(vars).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
    options.onDone?.(result, vars);
  }

  async function run(vars: Vars): Promise<boolean> {
    if (isPending.value) return false;
    failure.value = null;
    fieldErrors.value = {};
    isPending.value = true;
    try {
      const result = await options.mutate(vars);
      await settle(result, vars);
      return true;
    } catch (error) {
      // A programming error (not an ApiError) must surface, not turn into a page line.
      if (!(error instanceof ApiError)) throw error;
      failure.value = error;
      fieldErrors.value = fieldErrorsOf(error);
      return false;
    } finally {
      isPending.value = false;
    }
  }

  return { run, isPending, failure, fieldErrors };
}
