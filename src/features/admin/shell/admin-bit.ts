/**
 * ADMIN-BIT-HOOK: which Bit each admin placement shows. An "admin" Bit variant is being mocked;
 * when it lands, change the kinds here (and `InlineBitKind` if it adds one). No admin file names a kind itself.
 */
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

/** What `InlineBit` accepts: the moving kinds (`staff` hard hat, `writing` quill, `community` trio, ...) and the still moods. */
export type InlineBitKind = BitKind | BitMood;
export type AdminBitPlacement =
  | 'greeting'
  | 'forbidden'
  | 'placeholder'
  | 'header'
  | 'empty'
  | 'queued'
  | 'security'
  | 'done'
  | 'refused'
  | 'composing'
  | 'people';

export const ADMIN_BIT_KINDS: Record<AdminBitPlacement, InlineBitKind> = {
  greeting: 'staff',
  forbidden: 'staff',
  placeholder: 'staff',
  header: 'staff',
  empty: 'staff',
  queued: 'judging',
  security: 'security',
  done: 'crown',
  refused: 'sweat',
  /** The quill: statements, editorial, announcement composer and static-page headers. */
  composing: 'writing',
  /** The trio: users, organizations and tickets headers. */
  people: 'community',
};
