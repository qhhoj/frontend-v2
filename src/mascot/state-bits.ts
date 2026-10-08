import type { BitKind } from './bit-frames';
import type { BitMood } from './bit-moods';

export type StateKind =
  | 'empty'
  | 'communityEmpty'
  | 'error'
  | 'signIn'
  | 'forbidden'
  | 'notFound'
  | 'success'
  | 'sent'
  | 'staff';

/** The Bit drawn for a state: a still mood, an approved moving kind, or the crying 404 Bit. */
export type BitVariant = BitMood | BitKind | 'crying';

/**
 * REPLACEABLE HOOK: which Bit each page state shows (user ruling 2026-10-08, "Bit in more places").
 * A state names a variant; `StateBit.vue` alone knows how a variant is drawn. A new variant replaces an entry here, never a call site.
 */
export const STATE_BITS: Record<StateKind, { variant: BitVariant; labelKey: string }> = {
  empty: { variant: 'asleep', labelKey: 'bit.asleep' },
  communityEmpty: { variant: 'community', labelKey: 'bit.community' },
  error: { variant: 'sweat', labelKey: 'bit.rejected' },
  signIn: { variant: 'security', labelKey: 'bit.security' },
  forbidden: { variant: 'security', labelKey: 'bit.security' },
  notFound: { variant: 'crying', labelKey: 'notFound.bitLabel' },
  success: { variant: 'crown', labelKey: 'bit.accepted' },
  sent: { variant: 'envelope', labelKey: 'bit.envelope' },
  staff: { variant: 'staff', labelKey: 'bit.staff' },
};
