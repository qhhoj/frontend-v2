/** A positive whole number from a query value (`?lp=3`); anything else is page 1. */
export function positivePageOf(value: unknown): number {
  const number = Number(typeof value === 'string' ? value : NaN);
  return Number.isInteger(number) && number > 0 ? number : 1;
}
