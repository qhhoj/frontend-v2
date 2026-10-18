import { onScopeDispose, watch } from 'vue';
import { useLoadingStore } from './loading.store';

/**
 * Counts as "waiting on first data" while `isWaiting()` is true; `QueryState` passes its `loading` (`isPending`), never
 * `isFetching`. The end of a wait means the caller now shows its content (or its error): the page has painted.
 */
export function useWaitingWhile(isWaiting: () => boolean) {
  const loading = useLoadingStore();
  const source = Symbol('waiting');
  watch(isWaiting, (waiting) => (waiting ? loading.begin(source) : loading.paint(source)), {
    immediate: true,
    flush: 'sync',
  });
  onScopeDispose(() => loading.end(source));
}
