/**
 * What a clearable number box holds: null when empty (the PATCH meaning of "unset"), NaN when it holds text the browser
 * cannot parse (`validity.badInput` reads as an empty value), else the number. The form check refuses the NaN, so
 * unreadable text is never saved as a cleared field.
 */
export function numberBoxValue(event: Event): number | null {
  const box = event.target as HTMLInputElement;
  if (box.validity.badInput) return Number.NaN;
  return box.value.trim() === '' ? null : Number(box.value);
}
