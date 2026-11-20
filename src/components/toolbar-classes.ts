import { CONTROL_FRAME, FIELD_FRAME } from './ui/FormField.control';
import { TOGGLE_ON } from './ui/button-classes';

/**
 * One look for every filter control of a toolbar (problems, contests, submissions, users): the kit's field frame (40 px, the control
 * border and radius, the brand focus; `ui/FormField.control.ts`). `active` marks a control that currently filters the list: it takes
 * the "on" look of a filter toggle.
 */
export const toolbarControlClass = (active: boolean) =>
  active ? `${FIELD_FRAME} ${TOGGLE_ON} font-semibold` : `${FIELD_FRAME} hover:bg-surface-strong`;

/** A bare text input given the same box as a toolbar control (for forms that lay their own label out). */
export const TOOLBAR_INPUT_CLASS = `${CONTROL_FRAME} h-(--qh-control)`;
