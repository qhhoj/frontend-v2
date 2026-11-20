// Colour maths for the palette generator: OKLab/OKLCH, WCAG 2.x contrast, alpha compositing and colour-blind simulation
// (Machado 2009, severity 1). Hex strings are upper-case `#RRGGBB`; a tint is `{ hex, alpha }`.
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const toLinear = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const toGamma = (channel) =>
  channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;

export const hexToRgb = (hex) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
export const rgbToHex = (rgb) =>
  '#' +
  rgb
    .map((channel) =>
      Math.round(clamp(channel) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase();

function linearToOklab([red, green, blue]) {
  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ];
}

function oklabToLinear([lightness, axisA, axisB]) {
  const long = (lightness + 0.3963377774 * axisA + 0.2158037573 * axisB) ** 3;
  const medium = (lightness - 0.1055613458 * axisA - 0.0638541728 * axisB) ** 3;
  const short = (lightness - 0.0894841775 * axisA - 1.291485548 * axisB) ** 3;
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

export const hexToOklab = (hex) => linearToOklab(hexToRgb(hex).map(toLinear));
const oklabToHex = (lab) => rgbToHex(oklabToLinear(lab).map((channel) => toGamma(clamp(channel))));
const inGamut = (linear) => linear.every((channel) => channel >= -0.0005 && channel <= 1.0005);
const labOf = (lightness, chroma, radians) => [
  lightness,
  chroma * Math.cos(radians),
  chroma * Math.sin(radians),
];

/** OKLCH to hex; the chroma shrinks until the colour fits sRGB. */
export function oklch(lightness, chroma, hue) {
  const radians = (hue * Math.PI) / 180;
  let fitted = chroma;
  for (let tries = 0; tries < 40; tries++) {
    if (inGamut(oklabToLinear(labOf(lightness, fitted, radians)))) break;
    fitted *= 0.96;
  }
  return oklabToHex(labOf(lightness, fitted, radians));
}

/** The OKLCH lightness of a hex colour. */
export const lightnessOf = (hex) => hexToOklab(hex)[0];

const luminance = (hex) => {
  const [red, green, blue] = hexToRgb(hex).map(toLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
/** WCAG 2.x contrast ratio. */
export const contrast = (first, second) => {
  const [high, low] = [luminance(first), luminance(second)].sort((one, two) => two - one);
  return (high + 0.05) / (low + 0.05);
};
/** The lowest contrast of `hex` over every background. */
export const worstContrast = (hex, backgrounds) =>
  Math.min(...backgrounds.map((background) => contrast(hex, background)));

/** A tint (`{ hex, alpha }`) or an opaque hex painted over an opaque background. */
export function over(paint, background) {
  const { hex, alpha } = typeof paint === 'string' ? { hex: paint, alpha: 1 } : paint;
  const top = hexToRgb(hex);
  const bottom = hexToRgb(background);
  return rgbToHex(top.map((channel, index) => channel * alpha + bottom[index] * (1 - alpha)));
}

const DEFICIENCIES = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
};
const simulate = (hex, matrix) => {
  const linear = hexToRgb(hex).map(toLinear);
  const seen = matrix.map((row) =>
    row.reduce((sum, weight, index) => sum + weight * linear[index], 0),
  );
  return rgbToHex(seen.map((channel) => toGamma(clamp(channel))));
};
const distance = (first, second) => {
  const [one, two] = [hexToOklab(first), hexToOklab(second)];
  return 100 * Math.hypot(one[0] - two[0], one[1] - two[1], one[2] - two[2]);
};
/** OKLab distance x100 under normal vision, deuteranopia and protanopia, whichever is smallest. */
export const separation = (first, second) =>
  Math.min(
    distance(first, second),
    ...Object.values(DEFICIENCIES).map((matrix) =>
      distance(simulate(first, matrix), simulate(second, matrix)),
    ),
  );

/** Walks the lightness from `start` by `step` (negative is darker) until `accepts(hex)` holds. */
export function solveLightness(start, chroma, hue, accepts, step) {
  for (let lightness = start, tries = 0; tries < 400 && lightness > 0 && lightness < 1; tries++) {
    const hex = oklch(lightness, chroma, hue);
    if (accepts(hex)) return hex;
    lightness += step;
  }
  throw new Error(`no lightness for chroma ${chroma}, hue ${hue}`);
}

const rounded = (value, digits) => Number(value.toFixed(digits));
/** A hex colour as a palette input: [hue, chroma, lightness] (OKLCH). A walk that starts at this lightness keeps the hex where it passes. */
export function hueChromaLightness(hex) {
  const [lightness, greenRed, blueYellow] = hexToOklab(hex);
  return [
    rounded(((Math.atan2(blueYellow, greenRed) * 180) / Math.PI + 360) % 360, 4),
    rounded(Math.hypot(greenRed, blueYellow), 5),
    rounded(lightness, 5),
  ];
}
