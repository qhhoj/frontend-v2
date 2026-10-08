import { onScopeDispose, ref, watchEffect } from 'vue';

/** What the page on screen calls itself (a problem's name); null: the router titles the document from the route. */
export const pageTitle = ref<string | null>(null);

/** A page with a title of its own (known only once its data loads) names the document while it is on screen. */
export function usePageTitle(title: () => string | null | undefined) {
  let ownTitle: string | null = null;
  watchEffect(() => {
    ownTitle = title() ?? null;
    pageTitle.value = ownTitle;
  });
  // The next page may already have set its own title when this one is torn down.
  onScopeDispose(() => {
    if (pageTitle.value === ownTitle) pageTitle.value = null;
  });
}
