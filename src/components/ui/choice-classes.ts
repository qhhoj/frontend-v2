/**
 * The 16 px box of `Checkbox` and the dot of `RadioGroup` / `ChoiceCards`: a native input drawn with tokens, so no browser
 * blue shows beside the brand colour. Same 1 px control border as a field; checked is the brand fill. The tick is a `Check`
 * icon over the box (`Checkbox.vue`); the dot an inset ring.
 */
const BOX =
  'size-4 shrink-0 cursor-pointer appearance-none border border-line-control bg-surface checked:border-accent checked:bg-accent disabled:cursor-not-allowed disabled:opacity-(--qh-opacity-disabled) aria-invalid:border-negative';

export const CHECKBOX_INPUT = `${BOX} peer rounded-mark`;
export const RADIO_INPUT = `${BOX} rounded-full checked:bg-surface checked:inset-ring-4 checked:inset-ring-accent`;
/** One option row: one control tall (40 px, 44 on touch), the whole row is the click target. */
export const CHOICE_ROW = 'flex min-h-(--qh-control) items-center gap-2';
