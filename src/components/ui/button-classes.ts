/**
 * The one button recipe (docs/design-language.md). Three shapes share it:
 * - `token`: `AppButton`/`IconButton`. Corner and height come from the control tokens, so `.qh-admin` gives 12 px corners and the
 *   small height; the `in-[.qh-admin]:` classes swap the public look (gradient primary, wide padding) for the admin one.
 * - `admin`: `buttonClass()` in `admin/ui/controls.ts`, also used outside the admin shell, so its corner and heights are literal.
 * - `pill`: `settings/buttons.ts`, the board `.btn` look.
 * Disabled is `aria-disabled` plus a muted token pair, never opacity.
 */
export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'token' | 'admin' | 'pill';

const CURSOR = 'aria-disabled:cursor-not-allowed disabled:cursor-not-allowed';
const ADMIN_DISABLED =
  'aria-disabled:border-line aria-disabled:bg-surface-strong aria-disabled:text-muted disabled:border-line disabled:bg-surface-strong disabled:text-muted';

/** Admin tones, as `controls.ts` has always drawn them. */
const ADMIN_TONES: Record<ButtonTone, string> = {
  primary: `border-accent bg-accent text-on-accent hover:border-accent-2 hover:bg-accent-2 ${ADMIN_DISABLED}`,
  secondary: `border-line-control bg-surface-solid text-content hover:bg-surface-hover ${ADMIN_DISABLED}`,
  ghost:
    'border-transparent bg-transparent text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted',
  danger: `border-negative bg-surface-solid text-negative hover:bg-surface-hover ${ADMIN_DISABLED}`,
};

/** Public tones: a pending or not-yet-allowed primary wears the accent-soft pair; danger is outlined. */
const PILL_TONES: Record<ButtonTone, string> = {
  primary:
    'bg-gradient-accent font-bold text-on-accent aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text',
  secondary:
    'border border-line-control bg-surface-solid font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted',
  ghost:
    'border border-transparent bg-transparent font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted',
  danger:
    'border border-negative bg-surface-solid font-semibold text-negative hover:bg-surface-hover aria-disabled:text-muted',
};

/** Inside `.qh-admin`, the token shape takes the admin tone on top of the public one. */
const ADMIN_SCOPE_TONES: Record<ButtonTone, string> = {
  primary:
    'in-[.qh-admin]:border in-[.qh-admin]:border-accent in-[.qh-admin]:bg-none in-[.qh-admin]:bg-accent in-[.qh-admin]:font-semibold in-[.qh-admin]:hover:border-accent-2 in-[.qh-admin]:hover:bg-accent-2 in-[.qh-admin]:aria-disabled:border-line in-[.qh-admin]:aria-disabled:bg-surface-strong in-[.qh-admin]:aria-disabled:text-muted',
  secondary:
    'in-[.qh-admin]:aria-disabled:border-line in-[.qh-admin]:aria-disabled:bg-surface-strong',
  ghost: '',
  danger: 'in-[.qh-admin]:aria-disabled:border-line in-[.qh-admin]:aria-disabled:bg-surface-strong',
};

const ADMIN_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-8 touch:min-h-11 gap-1.5 px-2.5',
  md: 'min-h-(--qh-control) gap-2 px-3.5',
  lg: 'min-h-(--qh-control) gap-2 px-3.5',
};

const TOKEN_HEIGHTS: Record<ButtonSize, string> = {
  sm: 'min-h-(--qh-control-sm) gap-1.5',
  md: 'min-h-(--qh-control) gap-2',
  lg: 'min-h-(--qh-control-lg) gap-2',
};

const TOKEN_PADDING: Record<ButtonSize, string> = {
  sm: 'px-4 in-[.qh-admin]:px-2.5',
  md: 'px-5 in-[.qh-admin]:px-3.5',
  lg: 'px-6 in-[.qh-admin]:px-3.5',
};

/** Square icon-only buttons: as wide as they are tall, no side padding. */
const TOKEN_ICON_WIDTHS: Record<ButtonSize, string> = {
  sm: 'min-w-(--qh-control-sm) px-0',
  md: 'min-w-(--qh-control) px-0',
  lg: 'min-w-(--qh-control-lg) px-0',
};

export interface ButtonClassOptions {
  tone?: ButtonTone;
  size?: ButtonSize;
  shape?: ButtonShape;
  /** A square, icon-only button (token shape). */
  iconOnly?: boolean;
  /** Full width of its container. */
  block?: boolean;
}

function tokenClasses(tone: ButtonTone, size: ButtonSize, iconOnly: boolean) {
  const width = iconOnly ? TOKEN_ICON_WIDTHS[size] : TOKEN_PADDING[size];
  return `inline-flex ${TOKEN_HEIGHTS[size]} ${width} items-center justify-center whitespace-nowrap rounded-control text-sm in-[.qh-admin]:transition-colors ${CURSOR} ${PILL_TONES[tone]} ${ADMIN_SCOPE_TONES[tone]}`;
}

function shapeClasses(tone: ButtonTone, size: ButtonSize, shape: ButtonShape, iconOnly: boolean) {
  if (shape === 'admin')
    return `inline-flex ${ADMIN_SIZES[size]} items-center justify-center whitespace-nowrap rounded-cell border text-sm font-semibold transition-colors ${CURSOR} ${ADMIN_TONES[tone]}`;
  if (shape === 'pill')
    return `inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-5 text-sm ${CURSOR} ${PILL_TONES[tone]}`;
  return tokenClasses(tone, size, iconOnly);
}

/** The class list of a button or button-styled link. */
export function buttonClasses({
  tone = 'secondary',
  size = 'md',
  shape = 'token',
  iconOnly = false,
  block = false,
}: ButtonClassOptions = {}) {
  const classes = shapeClasses(tone, size, shape, iconOnly);
  return block ? `${classes} w-full` : classes;
}
