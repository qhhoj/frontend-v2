import { defineStore } from 'pinia';
import { ref } from 'vue';

/** Rows whose target answered 403/404 in this tab, per viewer id: their title reads "Thông báo cũ" (client-side only, spec 3.1). */
export const useStaleNotificationsStore = defineStore('staleNotifications', () => {
  const idsByViewer = ref<Record<string, string[]>>({});
  const isStale = (viewer: string, id: string) => idsByViewer.value[viewer]?.includes(id) ?? false;
  function markStale(viewer: string, id: string) {
    if (isStale(viewer, id)) return;
    idsByViewer.value[viewer] = [...(idsByViewer.value[viewer] ?? []), id];
  }
  return { idsByViewer, isStale, markStale };
});
