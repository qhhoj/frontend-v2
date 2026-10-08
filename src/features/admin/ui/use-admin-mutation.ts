import { ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { ApiError } from '@/api/client';
import { fieldErrorsOf } from './admin-errors';
import type { FieldErrors } from './admin-errors';

/** Every admin query key starts with `'admin'` (the viewer id follows), so a write can only touch admin data. */
export type AdminQueryKey = readonly ['admin', ...unknown[]];

interface AdminMutationOptions<Vars, Result> {
  mutate: (vars: Vars) => Promise<Result>;
  invalidates?: (vars: Vars) => AdminQueryKey[];
  onDone?: (result: Result, vars: Vars) => void;
}

/** One admin write: pending flag, per-field texts from `issues[]`, the failure for the page line, and cache invalidation. */
export function useAdminMutation<Vars, Result>(options: AdminMutationOptions<Vars, Result>) {
  const queryClient = useQueryClient();
  const isPending = ref(false);
  const isDone = ref(false);
  const fieldErrors = ref<FieldErrors>({});
  const failure = ref<ApiError | null>(null);

  function reset() {
    isDone.value = false;
    fieldErrors.value = {};
    failure.value = null;
  }

  async function settle(result: Result, vars: Vars) {
    isDone.value = true;
    await Promise.all(
      (options.invalidates?.(vars) ?? []).map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
    options.onDone?.(result, vars);
  }

  /** A second call while one write is in flight sends nothing: a double click must not run the write twice. */
  async function run(vars: Vars): Promise<Result | undefined> {
    if (isPending.value) return undefined;
    reset();
    isPending.value = true;
    try {
      const result = await options.mutate(vars);
      await settle(result, vars);
      return result;
    } catch (error) {
      // A programming error (not an ApiError) must surface, not turn into a page line.
      if (!(error instanceof ApiError)) throw error;
      failure.value = error;
      fieldErrors.value = fieldErrorsOf(error);
      return undefined;
    } finally {
      isPending.value = false;
    }
  }

  return { run, isPending, isDone, fieldErrors, failure, reset };
}
