import { computed, inject, onBeforeUnmount, provide, reactive, watch } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/** The date fields of one form that currently hold text that is not a date. Each field adds and removes its own key. */
type UnreadableDates = Set<symbol>;
const UNREADABLE_DATES: InjectionKey<UnreadableDates> = Symbol('unreadable-dates');

/**
 * Call once in the component that owns a form's save (or confirm). Every `AdminDateTimeField` below it reports here, so the
 * form refuses to save while `hasUnreadableDate` is true: unreadable text is never dropped or replaced silently.
 */
export function provideDateValidity() {
  const unreadable: UnreadableDates = reactive(new Set<symbol>());
  provide(UNREADABLE_DATES, unreadable);
  return { hasUnreadableDate: computed(() => unreadable.size > 0) };
}

/** For `AdminDateTimeField`: reports whether its text is unreadable to the form above (a no-op without one). */
export function reportUnreadableDate(isUnreadable: Ref<boolean>) {
  const registry = inject(UNREADABLE_DATES, null);
  if (!registry) return;
  const key = Symbol('date-field');
  const sync = (flag: boolean) => (flag ? registry.add(key) : registry.delete(key));
  watch(isUnreadable, sync, { immediate: true });
  onBeforeUnmount(() => registry.delete(key));
}
