import { computed, onBeforeUnmount, ref } from 'vue';
import type { Ref } from 'vue';
import type { ProblemListItem } from '@/api/types/problems';

/** A row the pointer rests on this long is peeked; a sweep across the list asks for nothing. */
const HOVER_MS = 150;

const rowOf = (event: Event) =>
  event.target instanceof Element ? event.target.closest<HTMLElement>('tr[data-code]') : null;

/**
 * Which problem the peek pane shows: the row the pointer rests on, the row whose link has focus, else the first row.
 * The handlers go on an element around the table (rows carry `data-code`). ArrowDown and ArrowUp move focus, and so the
 * peek, between the rows' links; Enter then opens the focused one, as any link.
 */
export function useProblemPeek(problems: Ref<readonly ProblemListItem[]>) {
  const chosen = ref<string | null>(null);
  const peeked = computed(
    () => problems.value.find((problem) => problem.code === chosen.value) ?? problems.value[0],
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => clearTimeout(timer);

  function onPointerOver(event: PointerEvent) {
    cancel();
    const code = rowOf(event)?.dataset.code;
    if (code && code !== chosen.value) timer = setTimeout(() => (chosen.value = code), HOVER_MS);
  }
  function onFocusIn(event: FocusEvent) {
    const code = rowOf(event)?.dataset.code;
    if (!code) return;
    cancel();
    chosen.value = code;
  }
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const row = rowOf(event);
    const next = event.key === 'ArrowDown' ? row?.nextElementSibling : row?.previousElementSibling;
    const link = next?.querySelector<HTMLElement>('a[href]');
    if (!link) return;
    event.preventDefault();
    link.focus();
  }
  onBeforeUnmount(cancel);
  return { peeked, onPointerOver, onPointerLeave: cancel, onFocusIn, onKeydown };
}
