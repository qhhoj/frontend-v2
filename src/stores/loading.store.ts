import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

/**
 * Client state only: which parts of the app are waiting on their first data right now. Once the page has painted content
 * (`paint`), a wait that begins later (a section below it, a query that needs the first answer) is not counted, so the
 * mascots never stay over content: that section shows its own skeleton. Each navigation starts a new page (`beginPage`),
 * whose first waits count again.
 */
export const useLoadingStore = defineStore('loading', () => {
  const sources = reactive(new Set<symbol>());
  let isPainted = false;
  const isWaiting = computed(() => sources.size > 0);

  const begin = (source: symbol) => void (isPainted || sources.add(source));
  /** The source stops waiting without showing anything (its component went, its navigation ended). */
  const end = (source: symbol) => void sources.delete(source);
  /** The source's content (or its error) is on screen: if it was counted, the page has painted. */
  const paint = (source: symbol) => {
    if (sources.delete(source)) isPainted = true;
  };
  /** A navigation is a waiting source of its own, and nothing of the page it opens has painted yet. */
  const beginPage = (source: symbol) => {
    isPainted = false;
    begin(source);
  };
  return { isWaiting, begin, end, paint, beginPage };
});
