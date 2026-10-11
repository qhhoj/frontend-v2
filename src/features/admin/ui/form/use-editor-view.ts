import { computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FieldErrors } from '../admin-errors';
import { VIEW_QUERY_KEY, viewOfQuery, viewsWithErrors, viewToReveal } from './editor-view';
import type { EditorView } from './editor-view';

/** The query that shows `view`: the other query keys stay, Basic drops `view`. */
export function viewQuery(query: Record<string, unknown>, view: EditorView) {
  const next = { ...query, [VIEW_QUERY_KEY]: view === 'advanced' ? 'advanced' : undefined };
  return next as Record<string, string | undefined>;
}

/** Moves focus to the first invalid control once the view has rendered. */
async function focusFirstInvalid() {
  await nextTick();
  document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

/**
 * The Basic/Advanced view of an editor form, kept in the URL (`?view=advanced`) so a link or a reload opens the same view.
 * `revealErrors()` (call it after a save attempt) switches to the view that holds the errors when the current one holds none.
 */
export function useEditorView(errors: () => FieldErrors, basicFields: readonly string[]) {
  const route = useRoute();
  const router = useRouter();
  const view = computed(() => viewOfQuery(route.query[VIEW_QUERY_KEY]));
  const errorViews = computed(() => viewsWithErrors(errors(), basicFields));

  async function showView(next: EditorView) {
    if (next !== view.value) await router.replace({ query: viewQuery(route.query, next) });
  }

  async function revealErrors() {
    const next = viewToReveal(view.value, errorViews.value);
    if (next === view.value) return;
    await showView(next);
    await focusFirstInvalid();
  }

  return { view, errorViews, showView, revealErrors };
}
