/** Motion tokens for script code: reads the `--qh-duration-*` variables of tokens.css so a script names a duration and never writes a number (DESIGN.md, "No hard-coded values"). Reduced motion and low power zero the variables, so these read 0 then. */
const FALLBACK_MS = { instant: 80, fast: 150, base: 200, emphasis: 320, highlightDecay: 1200 };

const VARIABLE = {
  instant: '--qh-duration-instant',
  fast: '--qh-duration-fast',
  base: '--qh-duration',
  emphasis: '--qh-duration-emphasis',
  highlightDecay: '--qh-highlight-decay',
} as const;

export type MotionDuration = keyof typeof VARIABLE;

/** The duration token in milliseconds, as the page currently resolves it (the fallback where there is no DOM, as in specs). */
export function durationMs(name: MotionDuration): number {
  if (typeof document === 'undefined') return FALLBACK_MS[name];
  const raw = getComputedStyle(document.documentElement).getPropertyValue(VARIABLE[name]).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return FALLBACK_MS[name];
  return raw.endsWith('ms') ? value : value * 1000;
}

/** The easing curve token, for `Element.animate({ easing })`. */
export const easing = (name: 'ease' | 'ease-exit' | 'ease-move' | 'ease-spring'): string =>
  `var(--qh-${name})`;
