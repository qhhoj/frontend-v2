import type { BitVariant } from '@/mascot/state-bits';

/** Every replay state that shows a panel instead of the board. */
export type ReplayPanelState =
  'building' | 'notReady' | 'notEnded' | 'unsupported' | 'frozen' | 'forbidden' | 'error' | 'empty';

/**
 * REPLACEABLE HOOK: which Bit each replay state shows (user rule: Bit wherever it fits). Drawn only by `ReplayStatePanel`
 * through `StateBit`; a new variant changes a line here, never a component.
 */
export const REPLAY_BITS: Record<ReplayPanelState, { variant: BitVariant; labelKey: string }> = {
  building: { variant: 'judging', labelKey: 'replay.bits.judging' },
  notReady: { variant: 'asleep', labelKey: 'bit.asleep' },
  notEnded: { variant: 'contest', labelKey: 'replay.bits.contest' },
  unsupported: { variant: 'sweat', labelKey: 'bit.rejected' },
  frozen: { variant: 'security', labelKey: 'bit.security' },
  forbidden: { variant: 'security', labelKey: 'bit.security' },
  error: { variant: 'sweat', labelKey: 'bit.rejected' },
  empty: { variant: 'asleep', labelKey: 'bit.asleep' },
};
