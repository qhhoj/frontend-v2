import { Ban, Lock, LockOpen, RotateCw, Square } from 'lucide-vue-next';

/** One icon per staff action, so every button that rejudges, rejects, aborts or locks wears the same one. */
export const STAFF_ICONS = {
  rejudge: RotateCw,
  reject: Ban,
  abort: Square,
  lock: Lock,
  unlock: LockOpen,
} as const;
