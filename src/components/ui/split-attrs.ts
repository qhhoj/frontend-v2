import { computed, useAttrs } from 'vue';

/**
 * For a part whose root is a frame around an input (`inheritAttrs: false`): `class` and `style` belong to the frame
 * (width, margins), every other attribute (`type`, `maxlength`, `@keydown`) to the input inside it.
 */
export function useSplitAttrs() {
  const attrs = useAttrs();
  const frame = computed(() => ({ class: attrs.class, style: attrs.style }));
  const input = computed(() => {
    const rest = { ...attrs };
    delete rest.class;
    delete rest.style;
    return rest;
  });
  return { frame, input };
}
