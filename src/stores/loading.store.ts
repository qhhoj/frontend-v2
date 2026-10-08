import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

/** Held by the router while a navigation is in flight. */
export const NAVIGATION_SOURCE = Symbol('navigation');

/** Client state only: which parts of the app are waiting on their first data right now. */
export const useLoadingStore = defineStore('loading', () => {
  const sources = reactive(new Set<symbol>());
  const isWaiting = computed(() => sources.size > 0);
  const begin = (source: symbol) => void sources.add(source);
  const end = (source: symbol) => void sources.delete(source);
  return { isWaiting, begin, end };
});
