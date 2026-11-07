/**
 * The 20 px box of `Checkbox` and the dot of `RadioGroup` / `ChoiceCards`: a native input drawn with tokens, so no browser
 * blue shows beside the accent. The tick is a `Check` icon over the box (`Checkbox.vue`); the dot an inset ring.
 */
const BOX =
  'size-5 shrink-0 cursor-pointer appearance-none border border-line-control bg-surface-solid checked:border-accent checked:bg-accent disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-negative';

export const CHECKBOX_INPUT = `${BOX} peer rounded-control`;

export const RADIO_INPUT = `${BOX} mt-0.5 touch:mt-0 rounded-full checked:bg-surface-solid checked:inset-ring-[5px] checked:inset-ring-accent`;

/** One option row: 44 px tall on a coarse pointer, the whole row is the click target. */
export const CHOICE_ROW = 'flex items-start gap-3 touch:min-h-11 touch:items-center';
