import { mount } from '@vue/test-utils';
import BitLoop from '@/components/BitLoop.vue';
import type { BitKind } from '@/mascot/bit-frames';

/** The drawn pixels of a Bit, so a placement can be told apart by its kind without knowing its markup. */
export const pixelsOf = (element: Element) => element.querySelector('.grid')?.innerHTML;

/** The pixels a loop of this kind draws on its first frame. */
export const pixelsOfKind = (kind: BitKind) => {
  const reference = mount(BitLoop, { props: { kind } });
  const html = pixelsOf(reference.element)!;
  reference.unmount();
  return html;
};
