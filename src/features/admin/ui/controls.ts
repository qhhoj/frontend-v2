import { CARD_VARIANTS } from '@/components/ui/Card.variants';

/**
 * Admin control classes (design-system/qhhoj/pages/admin.md). Heights follow the admin density tokens from `admin-density.css`
 * (36 px on a fine pointer, 44 px on a coarse one); the fallback is the fine-pointer value. Controls are `rounded-cell`; pills
 * are only for chips, segmented filters and status. A disabled control keeps focus (`aria-disabled`) and wears muted token
 * pairs, never opacity.
 */
const CONTROL_HEIGHT = 'min-h-[var(--qa-control,2.25rem)]';

const BUTTON_BASE = `inline-flex ${CONTROL_HEIGHT} items-center justify-center gap-2 whitespace-nowrap rounded-cell border px-3.5 text-sm font-semibold transition-colors aria-disabled:cursor-not-allowed disabled:cursor-not-allowed`;
/** Small: toolbar and row actions. A coarse pointer still gets the full control height. */
const BUTTON_SMALL = `inline-flex min-h-8 pointer-coarse:min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-cell border px-2.5 text-sm font-semibold transition-colors aria-disabled:cursor-not-allowed disabled:cursor-not-allowed`;
const DISABLED_LOOK =
  'aria-disabled:border-line aria-disabled:bg-surface-strong aria-disabled:text-muted disabled:border-line disabled:bg-surface-strong disabled:text-muted';

const TONES = {
  /** One per page: the action the page exists for. */
  primary: `border-accent bg-accent text-on-accent hover:border-accent-2 hover:bg-accent-2 ${DISABLED_LOOK}`,
  /** Outline: every other action. */
  secondary: `border-line-strong bg-surface-solid text-content hover:bg-surface-hover ${DISABLED_LOOK}`,
  /** No frame: discard, cancel, icon actions inside rows. */
  ghost:
    'border-transparent bg-transparent text-content hover:bg-surface-hover aria-disabled:text-muted disabled:text-muted',
  /** Destructive only (delete, ban, disable); outlined, never filled. */
  danger: `border-negative bg-surface-solid text-negative hover:bg-surface-hover ${DISABLED_LOOK}`,
} as const;

export type ButtonTone = keyof typeof TONES;
export type ControlSize = 'sm' | 'md';

/** The class list of an admin button or button-styled link. */
export const buttonClass = (tone: ButtonTone = 'secondary', size: ControlSize = 'md') =>
  `${size === 'sm' ? BUTTON_SMALL : BUTTON_BASE} ${TONES[tone]}`;

/** A square icon-only button; give it an `aria-label` and a `title`. */
export const iconButtonClass = (tone: ButtonTone = 'ghost', size: ControlSize = 'md') =>
  `${buttonClass(tone, size)} ${size === 'sm' ? 'min-w-8 px-0 pointer-coarse:min-w-11' : 'min-w-[var(--qa-control,2.25rem)] px-0'}`;

export const BUTTON = {
  primary: buttonClass('primary'),
  secondary: buttonClass('secondary'),
  ghost: buttonClass('ghost'),
  danger: buttonClass('danger'),
} as const;

/** Text inputs, selects and textareas. Text stays at the inherited 16 px, so iOS does not zoom. Disabled: muted pair, no opacity. */
export const INPUT = `${CONTROL_HEIGHT} w-full rounded-cell border border-line-strong bg-surface-solid px-3 text-content aria-invalid:border-negative aria-invalid:inset-ring aria-invalid:inset-ring-negative disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-strong disabled:text-muted`;

/** A checkbox styled as a pill: language and verdict pickers. */
export const CHECK_CHIP = `inline-flex ${CONTROL_HEIGHT} items-center gap-2 rounded-pill border border-line px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-text`;

/** A button that stays on (`aria-pressed`): the pressed one wears the accent-soft pair. */
export const TOGGLE = `${buttonClass('secondary')} aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text`;

/** A form or table card: sections inside are split by hairlines, not by more cards. */
export const CARD = CARD_VARIANTS.flat;
