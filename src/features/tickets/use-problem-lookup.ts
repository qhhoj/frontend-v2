import { computed, onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ApiError } from '@/api/client';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';
import { useLocaleStore } from '@/stores/locale.store';

/** The name of the problem a typed code names, looked up once typing pauses; `isMissing` when the server has no such problem. */
export function useProblemLookup(typedCode: Ref<string>) {
  const locale = useLocaleStore();
  const lookupCode = ref(typedCode.value.trim());
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(typedCode, (text) => {
    clearTimeout(timer);
    timer = setTimeout(() => (lookupCode.value = text.trim()), TEXT_DEBOUNCE_MS);
  });
  onScopeDispose(() => clearTimeout(timer));

  const { data, error } = useProblemQuery(
    lookupCode,
    computed(() => locale.locale),
    computed(() => lookupCode.value !== ''),
  );
  return {
    name: computed(() => data.value?.name ?? null),
    isMissing: computed(() => error.value instanceof ApiError && error.value.status === 404),
  };
}
