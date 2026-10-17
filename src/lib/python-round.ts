/**
 * Python 3 `round(value, digits)`, as the backend stores points (backend-v2 libs/judging scoring.ts `pythonRound`):
 * the nearest decimal of the exact binary value; only exact ties (0.125, 2.5) go to the even neighbour, where
 * `toFixed` rounds away from zero.
 */
export function pythonRound(value: number, digits: number): number {
  const rounded = Number(value.toFixed(digits));
  // Scaling by a power of two is exact: a tie is an odd number of half-units.
  const halves = value * 2 ** (digits + 1);
  if (!Number.isInteger(halves) || halves % 2 === 0) return rounded;
  // The tie's decimal expansion has digits + 1 decimals; dropping the trailing 5 rounds toward zero.
  const towardZero = value.toFixed(digits + 1).slice(0, -1);
  const lastDigit = towardZero.endsWith('.') ? towardZero.at(-2) : towardZero.at(-1);
  return Number(lastDigit) % 2 === 0 ? Number(towardZero) : rounded;
}
