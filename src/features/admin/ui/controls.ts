import { TOGGLE_CHECKABLE, buttonClasses } from '@/components/ui/button-classes';
import type { ButtonTone } from '@/components/ui/button-classes';
import { CARD_VARIANTS } from '@/components/ui/Card.variants';
import { CONTROL_FRAME } from '@/components/ui/FormField.control';

/**
 * Admin control classes: thin aliases of the kit's recipes ("Sơn mài" controls, DESIGN.md), kept for a classed element that cannot
 * be the kit component. There is one look for the whole site: a control is a 4 px rounded rectangle, 40 px tall (32 px for a
 * toggle; 44 px on touch), with the control border. Nothing here draws a pill: a pill is a status tag and cannot be clicked.
 */
export type { ButtonTone };
export type ControlSize = 'sm' | 'md';

/**
 * The class list of a button or button-styled link: the kit's recipe (`components/ui/button-classes.ts`), the one source of sizes
 * and tones. Prefer `AppButton`; this is for a classed element the component cannot be. Primary: one per page; danger: destructive
 * only, outlined.
 */
export const buttonClass = (tone: ButtonTone = 'secondary', size: ControlSize = 'md') =>
  buttonClasses({ tone, size });

/** A square icon-only button; give it an `aria-label` and a `title`. */
export const iconButtonClass = (tone: ButtonTone = 'ghost', size: ControlSize = 'md') =>
  buttonClasses({ tone, size, iconOnly: true });

export const BUTTON = {
  primary: buttonClass('primary'),
  secondary: buttonClass('secondary'),
  ghost: buttonClass('ghost'),
  danger: buttonClass('danger'),
} as const;

/** Text inputs, selects and textareas: the kit's field frame (`CONTROL_FRAME`), at least one control tall. Prefer `TextInput`, `SelectField`, `TextArea`. */
export const INPUT = `${CONTROL_FRAME} min-h-(--qh-control)`;

/** A label around a checkbox or radio, drawn as a filter toggle that is on while checked: language and verdict pickers. */
export const CHECK_CHIP = TOGGLE_CHECKABLE;

/** A button that stays on (`aria-pressed`): the kit's secondary button, which takes the toggle's "on" look while pressed. */
export const TOGGLE = buttonClass('secondary');

/** A form or table card: sections inside are split by hairlines, not by more cards. */
export const CARD = CARD_VARIANTS.flat;

/** One item of a page header's "⋯ Thêm" menu (`AdminPageHeader` #overflow). */
export const OVERFLOW_ITEM =
  'flex min-h-(--qa-control) w-full items-center gap-2 rounded-cell px-3 text-left text-sm hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60';
