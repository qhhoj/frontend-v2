import { BUTTON } from '@/features/account/settings/buttons';

export const ADMIN_INPUT_CLASS =
  'min-h-11 w-full rounded-row border border-line-strong bg-surface-solid px-3 text-content';
export const ADMIN_BUTTON_CLASS = BUTTON.secondary;
export const ADMIN_PRIMARY_CLASS = BUTTON.primary;
export const ADMIN_DANGER_CLASS = BUTTON.danger;
/** A checkbox styled as a pill: language and verdict pickers. */
export const ADMIN_CHECK_CHIP_CLASS =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft';
/** A button that stays on (`aria-pressed`): sort and state toggles; the pressed one wears the accent-soft pair. */
export const ADMIN_TOGGLE_CLASS = `${BUTTON.secondary} aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text`;
