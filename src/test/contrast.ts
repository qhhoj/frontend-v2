/** Channels in 0..1, alpha last. */
export type Rgba = readonly [number, number, number, number];

/** Theme colours are 6-digit hex or the comma-separated rgb/rgb-alpha function; anything else is a theme authoring error. */
export function parseColour(value: string): Rgba {
  const text = value.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(text)?.[1];
  if (hex)
    return [0, 2, 4]
      .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .concat(1) as unknown as Rgba;
  const parts = /^rgba?\(([^)]+)\)$/i
    .exec(text)?.[1]
    ?.split(',')
    .map((part) => Number(part.trim()));
  if (parts && (parts.length === 3 || parts.length === 4) && parts.every(Number.isFinite)) {
    const [red, green, blue, alpha = 1] = parts as [number, number, number, number?];
    return [red / 255, green / 255, blue / 255, alpha];
  }
  throw new Error(`Unsupported colour: ${value}`);
}

/** `top` painted over an opaque `bottom`. */
export const over = (top: Rgba, bottom: Rgba): Rgba => [
  top[0] * top[3] + bottom[0] * (1 - top[3]),
  top[1] * top[3] + bottom[1] * (1 - top[3]),
  top[2] * top[3] + bottom[2] * (1 - top[3]),
  1,
];

const linear = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const luminance = ([red, green, blue]: Rgba) =>
  0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);

/** WCAG 2 contrast ratio of two opaque colours. */
export function contrastRatio(first: Rgba, second: Rgba): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (left, right) => right - left,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * `top` mixed into `bottom` at `weight` (0-1 of `top`), premultiplied like CSS `color-mix(in srgb, top weight%, bottom)`.
 * Both sides fully transparent give a transparent result: the colour channels are divided by the alpha, so it is guarded.
 */
export function mixPremultiplied(top: Rgba, bottom: Rgba, weight: number): Rgba {
  const alpha = top[3] * weight + bottom[3] * (1 - weight);
  if (alpha === 0) return [0, 0, 0, 0];
  const channel = (topValue: number, bottomValue: number) =>
    (topValue * top[3] * weight + bottomValue * bottom[3] * (1 - weight)) / alpha;
  return [
    channel(top[0], bottom[0]),
    channel(top[1], bottom[1]),
    channel(top[2], bottom[2]),
    alpha,
  ];
}
