/**
 * The one button recipe (docs/design-language.md): `AppButton`/`IconButton`, and `buttonClass()` in `admin/ui/controls.ts` which
 * delegates here. Kit 2 (.batch/kit2/spec.md §5): a pill with no border. Height and padding come from the control tokens (32 inside a
 * table, 36, 40 for a page's primary action; 44 on touch). Variants change only the fill: primary is the accent, secondary the strong
 * surface (L2), ghost has none until hover, danger a red tint. Boxed buttons press with the `pressable` scale (motion notes 1).
 * Disabled is `aria-disabled` plus the strong surface with muted text, never opacity. A button with `aria-pressed` is a toggle and wears the
 * accent-soft pair while pressed. `link` is an inline text action: no box, a 44 px hit area.
 */
export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'row' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg';
type BoxedTone = Exclude<ButtonTone, 'link' | 'row' | 'plain'>;

const CURSOR = 'aria-disabled:cursor-not-allowed disabled:cursor-not-allowed';

/** Boxed tones: the fill changes, the shape never. Hover on a disabled button stays put. */
const BOXED_TONES: Record<BoxedTone, string> = {
  primary:
    'edge-high bg-accent font-semibold text-on-accent hover:bg-accent-2 aria-disabled:bg-surface-strong aria-disabled:text-muted aria-disabled:hover:bg-surface-strong',
  secondary:
    'edge-high bg-surface-strong font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted aria-disabled:hover:bg-surface-strong disabled:text-muted',
  ghost:
    'edge-high bg-transparent font-semibold text-content hover:bg-surface-hover aria-disabled:text-muted aria-disabled:hover:bg-transparent disabled:text-muted',
  danger:
    'edge-high bg-negative-bg font-semibold text-negative hover:bg-surface-hover aria-disabled:bg-surface-strong aria-disabled:text-muted aria-disabled:hover:bg-surface-strong',
};

/**
 * `row`: a button that is a whole line of a list or form (a closed composer, a folded comment, a version in a history): full
 * width, left aligned, regular muted text that wraps, on a surface-radius strong-surface row. `pressed` takes the accent-soft pair.
 */
const ROW_CLASSES =
  'inline-flex min-h-(--qh-row) w-full items-center justify-start gap-2 rounded-card bg-surface-strong px-(--qh-pad-surface) py-2 text-left text-body font-normal text-muted hover:bg-surface-hover aria-disabled:text-muted';

/** A toggle that is on (`aria-pressed`): the accent-soft pair, whatever the hover. */
const PRESSED =
  'aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text aria-pressed:hover:bg-accent-soft';

/** A text action inside a sentence or a card: underlined accent text; `::after` stretches the hit area to 44 px. */
const LINK_CLASSES =
  "relative inline-flex items-center gap-1.5 text-accent-text underline after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] hover:text-accent-2 aria-disabled:text-muted";

const TOKEN_HEIGHTS: Record<ButtonSize, string> = {
  sm: 'min-h-(--qh-control-sm) gap-1.5 text-meta',
  md: 'min-h-(--qh-control) gap-2 text-body',
  lg: 'min-h-(--qh-control-lg) gap-2 text-body',
};

const TOKEN_PADDING: Record<ButtonSize, string> = {
  sm: 'px-(--qh-control-px-sm)',
  md: 'px-(--qh-control-px)',
  lg: 'px-(--qh-control-px-lg)',
};

/** Round icon-only buttons: as wide as they are tall (a pill that is square is a circle), no side padding. */
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
  return `inline-flex ${TOKEN_HEIGHTS[size]} ${width} items-center justify-center whitespace-nowrap rounded-control pressable ${CURSOR} ${BOXED_TONES[tone]} ${PRESSED}`;
}

/** The class list of a button or button-styled link. */
export function buttonClasses({
  tone = 'secondary',
  size = 'md',
  iconOnly = false,
  block = false,
}: ButtonClassOptions = {}) {
  if (tone === 'row') return `${ROW_CLASSES} ${CURSOR} ${PRESSED}`;
  // `plain`: a control its container draws (the rail's search and account row, a phone tab): the caller's classes are its look.
  if (tone === 'plain') return block ? `${CURSOR} w-full` : CURSOR;
  const classes =
    tone === 'link' ? `${LINK_CLASSES} ${CURSOR}` : boxedClasses(tone, size, iconOnly);
  return block ? `${classes} w-full` : classes;
}
