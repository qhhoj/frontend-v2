import { nextTick, watch } from 'vue';

/**
 * Keyboard focus must not fall to `<body>` when the focused control is removed (a bulk bar that closes, a row that leaves the list).
 * When `count` shrinks and nothing holds focus any more, focus moves to `target` (a container with `tabindex="-1"`).
 * Growth, the first value and a focus that is still somewhere are left alone.
 */
export function useFocusFallback(
  count: () => number | undefined,
  target: () => HTMLElement | null | undefined,
): void {
  watch(count, async (now, before) => {
    if (now === undefined || before === undefined || now >= before) return;
    await nextTick();
    const held = document.activeElement;
    if (!held || held === document.body) target()?.focus();
  });
}
