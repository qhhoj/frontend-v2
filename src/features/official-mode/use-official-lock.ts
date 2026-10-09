import { computed, useId } from 'vue';
import { useOfficialMode } from './official-mode.queries';

/**
 * One locked control group: `lockAttrs` disables (`aria-disabled`, full-contrast text) and points at the reason note.
 * Call once per component, in setup.
 */
export function useOfficialLock() {
  const mode = useOfficialMode();
  const noteId = useId();
  const lockAttrs = computed(() => {
    const attrs: Record<string, string> = mode.isLocked.value
      ? { 'aria-disabled': 'true', 'aria-describedby': noteId }
      : {};
    return attrs;
  });
  return { isLocked: mode.isLocked, noteId, lockAttrs };
}
