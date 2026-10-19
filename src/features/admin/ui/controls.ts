import { buttonClasses } from '@/components/ui/button-classes';
import type { ButtonTone } from '@/components/ui/button-classes';
import { CARD_VARIANTS } from '@/components/ui/Card.variants';

/**
 * Admin control classes (design-system/qhhoj/pages/admin.md). Heights follow the admin density tokens from `admin-density.css`
 * (36 px on a fine pointer, 44 px on a coarse one); the fallback is the fine-pointer value. Controls are `rounded-cell`; pills
 * are only for chips, segmented filters and status. A disabled control keeps focus (`aria-disabled`) and wears muted token
 * pairs, never opacity.
 */
const CONTROL_HEIGHT = 'min-h-[var(--qa-control,2.25rem)]';

export type { ButtonTone };
export type ControlSize = 'sm' | 'md';

/** The class list of an admin button or button-styled link. Primary: one per page; danger: destructive only, outlined. */
export const buttonClass = (tone: ButtonTone = 'secondary', size: ControlSize = 'md') =>
  buttonClasses({ tone, size, shape: 'admin' });

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
export const INPUT = `${CONTROL_HEIGHT} w-full rounded-cell border border-line-control bg-surface-solid px-3 text-content aria-invalid:border-negative aria-invalid:inset-ring aria-invalid:inset-ring-negative disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-strong disabled:text-muted`;

/** A checkbox styled as a pill: language and verdict pickers. */
export const CHECK_CHIP = `inline-flex ${CONTROL_HEIGHT} items-center gap-2 rounded-pill border border-line-control px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-text`;

/** A button that stays on (`aria-pressed`): the pressed one wears the accent-soft pair. */
export const TOGGLE = `${buttonClass('secondary')} aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text`;

/** A form or table card: sections inside are split by hairlines, not by more cards. */
export const CARD = CARD_VARIANTS.flat;

/** One item of a page header's "⋯ Thêm" menu (`AdminPageHeader` #overflow). */
export const OVERFLOW_ITEM =
  'flex min-h-(--qa-control) w-full items-center gap-2 rounded-cell px-3 text-left text-sm hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60';
