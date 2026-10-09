import { ref } from 'vue';
import type { Ref } from 'vue';

/** The low-power contract (src/theme/low-power.store.ts writes it, index.html paints it first): present = low-power on. */
export const LOW_POWER_ATTRIBUTE = 'data-low-power';

export const isLowPowerPainted = (): boolean =>
  typeof document !== 'undefined' && document.documentElement.hasAttribute(LOW_POWER_ATTRIBUTE);

let shared: Ref<boolean> | undefined;

/**
 * Low-power as a ref, read from the attribute, never from the store: Bit components are mounted without Pinia.
 * One ref and one MutationObserver for the whole page, kept for its life.
 */
export function useLowPowerPainted(): Readonly<Ref<boolean>> {
  if (shared) return shared;
  const painted = ref(isLowPowerPainted());
  shared = painted;
  if (typeof MutationObserver === 'function' && typeof document !== 'undefined')
    new MutationObserver(() => (painted.value = isLowPowerPainted())).observe(
      document.documentElement,
      { attributes: true, attributeFilter: [LOW_POWER_ATTRIBUTE] },
    );
  return painted;
}
