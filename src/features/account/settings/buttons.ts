/**
 * Board `.btn` variants as token classes, so every settings button looks alike. A pending or not-yet-allowed primary button wears the
 * accent-soft pair, like `AuthSubmit` and the shared `ConfirmDialog` (contrast-checked, commit `12b9219`). Danger is outlined: a
 * filled red would need a new token pair in every theme.
 */
const SHAPE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-5 text-sm aria-disabled:cursor-not-allowed disabled:cursor-not-allowed';

export const BUTTON = {
  primary: `${SHAPE} bg-gradient-accent font-bold text-on-accent aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text`,
  secondary: `${SHAPE} border border-line-strong bg-surface-solid font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted`,
  danger: `${SHAPE} border border-negative bg-surface-solid font-semibold text-negative hover:bg-surface-hover aria-disabled:text-muted`,
} as const;
