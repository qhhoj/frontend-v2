import { computed, inject, onBeforeUnmount, provide, reactive, ref, watch } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/** What a form shares with the date fields below it: the ones holding unreadable text, and a counter that resets them. */
interface DateRegistry {
  unreadable: Set<symbol>;
  resetCount: Ref<number>;
}
const DATE_REGISTRY: InjectionKey<DateRegistry> = Symbol('date-registry');

/**
 * Call once in the component that owns a form's save (or confirm). Every `AdminDateTimeField` below it reports here, so the
 * form refuses to save while `hasUnreadableDate` is true: unreadable text is never dropped or replaced silently.
 * `resetDates()` makes every box show its model again with no error: call it when the form discards or resets, since a model
 * that did not change would otherwise leave the typed text in the box.
 */
export function provideDateValidity() {
  const registry: DateRegistry = { unreadable: reactive(new Set<symbol>()), resetCount: ref(0) };
  provide(DATE_REGISTRY, registry);
  return {
    hasUnreadableDate: computed(() => registry.unreadable.size > 0),
    resetDates: () => registry.resetCount.value++,
  };
}

/** For a child of a form that changes date models itself (quick durations): `resetDates` of the form above, or a no-op. */
export function useDateReset(): () => void {
  const registry = inject(DATE_REGISTRY, null);
  return () => {
    if (registry) registry.resetCount.value++;
  };
}

/** For `AdminDateTimeField`: reports whether its text is unreadable to the form above, and runs `onReset` when the form resets. */
export function reportUnreadableDate(isUnreadable: Ref<boolean>, onReset: () => void) {
  const registry = inject(DATE_REGISTRY, null);
  if (!registry) return;
  const key = Symbol('date-field');
  const sync = (flag: boolean) =>
    flag ? registry.unreadable.add(key) : registry.unreadable.delete(key);
  watch(isUnreadable, sync, { immediate: true });
  // After the render, so the box reads the model the form has just reset (a prop reaches the field with the parent's patch).
  watch(registry.resetCount, onReset, { flush: 'post' });
  onBeforeUnmount(() => registry.unreadable.delete(key));
}
