import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

/**
 * Where this plan's public screens show an inline Bit (spec rule: Bit wherever it fits). Page-sized states go through
 * `StatePanel` kinds (`forbidden`, `notFound`, `error`); empty lists through `EmptyState`. Change a placement here, never at a call site.
 */
export type ExtrasBitPlacement =
  | 'tagNotice'
  | 'rulesHeading'
  | 'rulesRefused'
  | 'rulesCard'
  | 'balloonsHeading'
  | 'balloonsEmpty'
  | 'balloonsAllDelivered'
  | 'balloonRefused'
  | 'printEmpty';

export const EXTRAS_BITS: Record<ExtrasBitPlacement, BitKind | BitMood> = {
  /** Unknown tag in the address, or the catalogue could not be read. */
  tagNotice: 'sweat',
  /** The quill beside the rules dialog title. */
  rulesHeading: 'writing',
  rulesRefused: 'sweat',
  rulesCard: 'writing',
  /** The contest Bit beside the balloon screen title. */
  balloonsHeading: 'contest',
  balloonsEmpty: 'asleep',
  balloonsAllDelivered: 'crown',
  balloonRefused: 'sweat',
  printEmpty: 'asleep',
};
