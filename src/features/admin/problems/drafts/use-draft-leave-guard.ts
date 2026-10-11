import { useDirtyGuard } from '../../ui/form/use-dirty-guard';

/**
 * Deprecated alias of `useDirtyGuard` (ui/form), kept for the tabs not yet moved onto `AdminLeaveGuard`.
 * New code uses `useDirtyGuard` or `<AdminLeaveGuard :dirty-count>`; delete this folder with its last user.
 */
export const useDraftLeaveGuard = useDirtyGuard;
