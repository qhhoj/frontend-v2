/**
 * The one button recipe ("Sơn mài" controls, DESIGN.md): `AppButton`/`IconButton`, and `buttonClass()` in `admin/ui/controls.ts` which
 * delegates here. A button is a rounded rectangle (`rounded-control`, 4 px) with a 1 px border, in exactly three kinds and two heights:
 *
 * - `primary`: the brand fill. The one main action of a page.
 * - `secondary`: the surface with the control border. Every other action.
 * - `quiet`: brand text, no border. A small action in a row or a panel header.
 * - `danger`: the secondary shape with red text and a red icon (`negative`, the wrong-answer red). Red is one family: wrong, error,
 *   destructive. It marks the button that removes or blocks something; its hover is the secondary's.
 * - Icon-only (`iconOnly`, `IconButton`): a quiet square in neutral ink (`secondary` text), never brand: an icon alone is a small tool,
 *   not the page's action. It must carry an `aria-label` and a `title` (the tooltip); `IconButton` sets both from its `label`.
 * - `md` 40 px (`--qh-control`) and `sm` 32 px (`--qh-control-sm`, inside a table or a panel header); both are 44 px on touch.
 *
 * Inside a `Readout` the same primary and secondary take the plate's colours by themselves (the `readout` utility re-points the tokens).
 * One set of states for all: hover is the raised ground (primary: the darker brand), focus the 2 px brand ring (styles.css), disabled
 * 45 % opacity (`aria-disabled`, with a reason beside it), pending a spinner in place of the icon. A button with `aria-pressed` is a
 * toggle and takes the filter-toggle "on" look while pressed.
 *
 * Old names keep working: `ghost` is `quiet`, `lg` is `md`. `link` is a text link (brand text, underline on hover, a 44 px hit area), `row` a full-width secondary whose
 * text is left aligned and may wrap, `plain` a control its container draws.
 */
export type ButtonTone =
  'primary' | 'secondary' | 'quiet' | 'ghost' | 'danger' | 'link' | 'row' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonKind = 'primary' | 'secondary' | 'quiet' | 'danger' | 'icon';
type BoxedTone = Exclude<ButtonTone, 'link' | 'row' | 'plain'>;

const KIND_OF_TONE: Record<BoxedTone, ButtonKind> = {
  primary: 'primary',
  secondary: 'secondary',
  quiet: 'quiet',
  ghost: 'quiet',
  danger: 'danger',
};

/** The states every kind shares: the colour step, the disabled look, and an icon drawn at the control icon size. */
const STATES =
  'pressable cursor-pointer aria-disabled:cursor-not-allowed aria-disabled:opacity-(--qh-opacity-disabled) disabled:cursor-not-allowed disabled:opacity-(--qh-opacity-disabled) [&_svg:not([class*=size-])]:size-(--qh-control-icon) [&_svg]:shrink-0';

/** Hover never moves a disabled button: every hover class carries `not-aria-disabled:not-disabled:` (whole names, so Tailwind finds them). */
const KINDS: Record<ButtonKind, string> = {
  primary: `border border-accent bg-accent font-semibold text-on-accent not-aria-disabled:not-disabled:hover:border-accent-strong not-aria-disabled:not-disabled:hover:bg-accent-strong`,
  secondary: `border border-line-control bg-surface font-semibold text-content not-aria-disabled:not-disabled:hover:bg-surface-strong`,
  quiet: `border border-transparent bg-transparent font-semibold text-accent-text not-aria-disabled:not-disabled:hover:bg-accent-soft`,
  danger: `border border-line-control bg-surface font-semibold text-negative not-aria-disabled:not-disabled:hover:bg-surface-strong`,
  icon: `border border-transparent bg-transparent text-secondary not-aria-disabled:not-disabled:hover:bg-surface-strong not-aria-disabled:not-disabled:hover:text-content`,
};

/**
 * "On" (`aria-pressed`, `aria-current`): the soft brand ground, the brand border and brand text. The one look of a filter toggle
 * that is on, a pressed toggle button and the current item of a side menu; it never looks like the primary button.
 */
export const TOGGLE_ON = 'border-accent bg-accent-soft text-accent-soft-text';
const PRESSED =
  'aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text';

/**
 * A filter toggle (was "chip"): a 32 px rounded rectangle on the surface with the control border; `TOGGLE_ON` while it is on.
 * `Chip` (when it can be clicked), `SegmentedControl` and the toolbar selects all draw it from here.
 */
export const TOGGLE_BASE =
  'inline-flex min-h-(--qh-control-sm) shrink-0 items-center gap-2 rounded-control border px-(--qh-control-px-sm) text-meta font-semibold whitespace-nowrap transition-colors';
export const TOGGLE_OFF =
  'border-line-control bg-surface text-secondary hover:bg-surface-strong hover:text-content';

/** `row`: a button that is a whole line of a list or form (a closed composer, a folded comment, a version in a history). */
const ROW_CLASSES = `flex min-h-(--qh-control) w-full items-center justify-start gap-2 rounded-control border border-line-control bg-surface px-(--qh-control-px-sm) py-2 text-left text-body font-normal text-secondary not-aria-disabled:not-disabled:hover:bg-surface-strong`;

/** A text link: brand text, underline on hover; `::after` stretches the hit area to 44 px. */
const LINK_CLASSES =
  "relative inline-flex items-center gap-1 font-semibold text-accent-text underline-offset-2 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] hover:underline aria-disabled:cursor-not-allowed aria-disabled:no-underline aria-disabled:opacity-(--qh-opacity-disabled)";

const md = 'min-h-(--qh-control) gap-2 text-body';
const HEIGHTS: Record<ButtonSize, string> = {
  sm: 'min-h-(--qh-control-sm) gap-2 text-meta',
  md,
  lg: md,
};

/** Side padding: 16 in a 40 px button, 12 in a 32 px one; a quiet button has 8, so its text lines up with the row it sits in. */
const BOXED_PADDING: Record<ButtonSize, string> = {
  sm: 'px-(--qh-control-px-sm)',
  md: 'px-(--qh-control-px)',
  lg: 'px-(--qh-control-px)',
};
const QUIET_PADDING: Record<ButtonSize, string> = { sm: 'px-2', md: 'px-2', lg: 'px-2' };
const PADDING: Record<ButtonKind, Record<ButtonSize, string>> = {
  primary: BOXED_PADDING,
  secondary: BOXED_PADDING,
  danger: BOXED_PADDING,
  quiet: QUIET_PADDING,
  icon: QUIET_PADDING,
};

/** Icon-only buttons are square: as wide as they are tall, no side padding. */
const ICON_WIDTHS: Record<ButtonSize, string> = {
  sm: 'min-w-(--qh-control-sm) px-0',
  md: 'min-w-(--qh-control) px-0',
  lg: 'min-w-(--qh-control) px-0',
};

export interface ButtonClassOptions {
  tone?: ButtonTone;
  size?: ButtonSize;
  /** A square, icon-only button. */
  iconOnly?: boolean;
  /** Full width of its container. */
  block?: boolean;
}

function boxedClasses(tone: BoxedTone, size: ButtonSize, iconOnly: boolean) {
  const toneKind = KIND_OF_TONE[tone];
  // An icon alone is neutral ink: the quiet kind's brand text is for a worded action.
  const kind = iconOnly && toneKind === 'quiet' ? 'icon' : toneKind;
  const width = iconOnly ? ICON_WIDTHS[size] : PADDING[kind][size];
  return `inline-flex ${HEIGHTS[size]} ${width} items-center justify-center whitespace-nowrap rounded-control ${STATES} ${KINDS[kind]} ${PRESSED}`;
}

/** The class list of a button or button-styled link. */
export function buttonClasses({
  tone = 'secondary',
  size = 'md',
  iconOnly = false,
  block = false,
}: ButtonClassOptions = {}) {
  if (tone === 'row') return `${ROW_CLASSES} ${STATES} ${PRESSED}`;
  // `plain`: a control its container draws (the rail's search and account row, a phone tab): the caller's classes are its look.
  if (tone === 'plain') {
    const cursor = 'aria-disabled:cursor-not-allowed disabled:cursor-not-allowed';
    return block ? `${cursor} w-full` : cursor;
  }
  const classes = tone === 'link' ? LINK_CLASSES : boxedClasses(tone, size, iconOnly);
  return block ? `${classes} w-full` : classes;
}
