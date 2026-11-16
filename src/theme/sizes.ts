/** Size tokens for script code: reads CSS variables (tokens.css) in pixels, so a script names a size and never writes a number (DESIGN.md, "No hard-coded values"). */
const FALLBACK_PX = { control: 28, controlSm: 24, controlLg: 36, adminRow: 40 };

const VARIABLE = {
  control: '--qh-control',
  controlSm: '--qh-control-sm',
  controlLg: '--qh-control-lg',
  adminRow: '--qa-row',
} as const;

export type SizeToken = keyof typeof VARIABLE;

/** One rem in pixels, as the page sets it. */
const remPx = (): number =>
  Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/** The size token in pixels at the current breakpoint (the touch sizes apply on phones); the fallback where there is no DOM. */
export function sizePx(name: SizeToken): number {
  if (typeof document === 'undefined') return FALLBACK_PX[name];
  const raw = getComputedStyle(document.documentElement).getPropertyValue(VARIABLE[name]).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return FALLBACK_PX[name];
  return raw.endsWith('rem') ? value * remPx() : value;
}
