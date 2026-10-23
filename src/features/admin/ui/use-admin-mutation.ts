import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { ApiError } from '@/api/client';
import { readRefusal } from './admin-errors';
import type { FieldErrors, ReadOptions } from './admin-errors';
import { useAdminToast } from './feedback/use-admin-toast';

/** The public features whose caches an admin write may refresh (their query keys start with these roots). */
export type PublicQueryRoot = 'problems' | 'contests' | 'flatpages' | 'submissions' | 'comments';

/** Every key an admin write invalidates: an admin key (`'admin'`, then the viewer id) or a public feature's prefix. */
export type AdminQueryKey = readonly ['admin' | PublicQueryRoot, ...unknown[]];

interface AdminMutationOptions<Vars, Result> {
  mutate: (vars: Vars) => Promise<Result>;
  invalidates?: (vars: Vars) => AdminQueryKey[];
  /** Runs the moment the write succeeds, before the cache refresh (a one-time secret must not wait for a refetch). */
  onSuccess?: (result: Result, vars: Vars) => void;
  /** Runs after the cache refresh. */
  onDone?: (result: Result, vars: Vars) => void;
  /** A success toast ("Đã lưu bài hcmus41c"), shown the moment the write succeeds. Omitted: no toast. */
  successText?: string | ((result: Result, vars: Vars) => string);
  /** What the caller renders; default nothing (every reason goes to the line). */
  rendered?: MaybeRefOrGetter<ReadOptions>;
}

/** Every path a refusal names: all of them count as rendered for the legacy `fieldErrors`. */
const namedPaths = (error: ApiError): string[] =>
  error.issues.length > 0 ? error.issues.map((issue) => issue.field) : Object.keys(error.fields);

/** One admin write: pending flag, the failure and its `refusal` (field texts for the rendered paths, the page line for the rest), and cache invalidation. */
export function useAdminMutation<Vars, Result>(options: AdminMutationOptions<Vars, Result>) {
  const queryClient = useQueryClient();
  const isPending = ref(false);
  const isDone = ref(false);
  const fieldErrors = ref<FieldErrors>({});
  const failure = ref<ApiError | null>(null);
  const refusal = computed(() =>
    failure.value ? readRefusal(failure.value, toValue(options.rendered)) : null,
  );
  const toast = options.successText === undefined ? null : useAdminToast();

  function reset() {
    isDone.value = false;
    fieldErrors.value = {};
    failure.value = null;
  }

  async function settle(result: Result, vars: Vars) {
    isDone.value = true;
    options.onSuccess?.(result, vars);
    const { successText } = options;
    if (toast && successText !== undefined)
      toast.show({
        text: typeof successText === 'function' ? successText(result, vars) : successText,
      });
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
      fieldErrors.value = readRefusal(error, { paths: namedPaths(error) }).fields;
      failure.value = error;
      return undefined;
    } finally {
      isPending.value = false;
    }
  }

  return { run, isPending, isDone, fieldErrors, failure, reset, refusal };
}
