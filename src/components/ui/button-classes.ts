/**
 * The one button recipe (docs/design-language.md): `AppButton`/`IconButton`, and `buttonClass()` in `admin/ui/controls.ts` which
 * delegates here. Corner and height come from the control tokens, so `.qh-admin` gives 12 px corners and the small height; the
 * `in-[.qh-admin]:` classes swap the public look (gradient primary, wide padding) for the admin one.
 * Disabled is `aria-disabled` plus a muted token pair, never opacity. A button with `aria-pressed` is a toggle and wears the
 * accent-soft pair while pressed. `link` is an inline text action: no box, a 44 px hit area.
 */
export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';
type BoxedTone = Exclude<ButtonTone, 'link'>;

const CURSOR = 'aria-disabled:cursor-not-allowed disabled:cursor-not-allowed';

/** Boxed tones: a pending or not-yet-allowed primary wears the accent-soft pair; danger is outlined. */
const BOXED_TONES: Record<BoxedTone, string> = {
  primary:
    'bg-gradient-accent font-bold text-on-accent aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text',
  secondary:
    'border border-line-control bg-surface-solid font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted',
  ghost:
    'border border-transparent bg-transparent font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted',
  danger:
    'border border-negative bg-surface-solid font-semibold text-negative hover:bg-surface-hover aria-disabled:text-muted',
};

/** Inside `.qh-admin`, a boxed tone takes the admin look on top of the public one. */
const ADMIN_SCOPE_TONES: Record<BoxedTone, string> = {
  primary:
    'in-[.qh-admin]:border in-[.qh-admin]:border-accent in-[.qh-admin]:bg-none in-[.qh-admin]:bg-accent in-[.qh-admin]:font-semibold in-[.qh-admin]:hover:border-accent-2 in-[.qh-admin]:hover:bg-accent-2 in-[.qh-admin]:aria-disabled:border-line in-[.qh-admin]:aria-disabled:bg-surface-strong in-[.qh-admin]:aria-disabled:text-muted',
  secondary:
    'in-[.qh-admin]:aria-disabled:border-line in-[.qh-admin]:aria-disabled:bg-surface-strong',
  ghost: '',
  danger: 'in-[.qh-admin]:aria-disabled:border-line in-[.qh-admin]:aria-disabled:bg-surface-strong',
};

/** A toggle that is on (`aria-pressed`): the accent-soft pair, whatever the hover. */
const PRESSED =
  'aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text aria-pressed:hover:bg-accent-soft';

/** A text action inside a sentence or a card: underlined accent text; `::after` stretches the hit area to 44 px. */
const LINK_CLASSES =
  "relative inline-flex items-center gap-1.5 text-accent-text underline after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] hover:text-accent-2 aria-disabled:text-muted";

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
  /** A square, icon-only button (token shape). */
  iconOnly?: boolean;
  /** Full width of its container. */
  block?: boolean;
}

function boxedClasses(tone: BoxedTone, size: ButtonSize, iconOnly: boolean) {
  const width = iconOnly ? TOKEN_ICON_WIDTHS[size] : TOKEN_PADDING[size];
  return `inline-flex ${TOKEN_HEIGHTS[size]} ${width} items-center justify-center whitespace-nowrap rounded-control text-sm in-[.qh-admin]:transition-colors ${CURSOR} ${BOXED_TONES[tone]} ${ADMIN_SCOPE_TONES[tone]} ${PRESSED}`;
}

/** The class list of a button or button-styled link. */
export function buttonClasses({
  tone = 'secondary',
  size = 'md',
  iconOnly = false,
  block = false,
}: ButtonClassOptions = {}) {
  const classes =
    tone === 'link' ? `${LINK_CLASSES} ${CURSOR}` : boxedClasses(tone, size, iconOnly);
  return block ? `${classes} w-full` : classes;
}
