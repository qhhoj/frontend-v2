// Turns the palette inputs (paper.mjs) into token values for one mode and contrast. Every value is solved against
// contrast floors, not picked: the floors are the `standard` and `high` columns of FLOORS.
import {
  contrast,
  lightnessOf,
  oklch,
  over,
  separation,
  solveLightness,
  worstContrast,
} from './color.mjs';
import { FAILING_LANES, LANES, PARTIAL_ALPHAS } from './paper.mjs';

export const WHITE = '#FFFFFF';
/** Closest a verdict text may come to AC text, OKLab x100 under normal, deuteranopic and protanopic vision. */
export const MIN_VERDICT_SEPARATION = 5;
/** Smallest luminance ratio between adjacent text levels (text, secondary, muted), so the three stay distinct. */
export const MIN_TEXT_STEP = 1.1;

/** Contrast floors (WCAG ratios), standard and high contrast; a pair is [light mode, dark mode]. */
const FLOORS = {
  standard: {
    text: [13, 11],
    secondary: [8, 7.5],
    muted: 5.2,
    control: 3.1,
    fill: 3.1,
    onFill: 4.6,
    link: 4.6,
    softText: 6.5,
    ring: 3.1,
    laneText: 4.6,
    onTint: 4.6,
  },
  high: {
    text: [15, 12],
    secondary: [10, 9],
    muted: 7.5,
    control: 4.6,
    fill: 4.6,
    onFill: 7,
    link: 7.5,
    softText: 9,
    ring: 4.6,
    laneText: 7.5,
    onTint: 7.1,
  },
};

const isLight = (mode) => mode === 'light';
/** The ink of the dark ground: the label colour on light fills in every mode. */
const inkOf = (palette) => palette.dark.ground;
const labelOn = (palette, fill) =>
  contrast(WHITE, fill) >= contrast(inkOf(palette), fill) ? WHITE : inkOf(palette);
const groundsOf = (palette, mode) => {
  const { ground, surface, strong, hover } = palette[mode];
  return [ground, surface, strong, hover];
};
/** One step of the lightness walk: darker on light grounds, lighter on dark ones. */
const stepOf = (mode) => (isLight(mode) ? -0.004 : 0.004);

/** Where body text also sits: each accent's soft tint over the grounds, and each Blueprint grid line. */
function tintedBackgrounds(palette, mode, accents) {
  const grounds = groundsOf(palette, mode);
  return Object.values(accents).flatMap(({ soft, fill }) => [
    ...grounds.map((ground) => over(soft, ground)),
    over({ hex: fill, alpha: 0.14 }, palette[mode].ground),
  ]);
}

/** The three text levels (their own floor on the grounds, the body-text minimum on every tint) and the control border. */
function neutrals(palette, mode, floors, accents) {
  const grounds = groundsOf(palette, mode);
  const tinted = tintedBackgrounds(palette, mode, accents);
  const [hue, chroma] = palette.neutral;
  const pick = (light, dark) => (isLight(mode) ? light : dark);
  const readable = (floor) => (hex) =>
    worstContrast(hex, grounds) >= floor && worstContrast(hex, tinted) >= floors.onTint;
  const solve = (start, floor) => solveLightness(start, chroma, hue, readable(floor), stepOf(mode));
  const { ground, surface } = palette[mode];
  const bordered = (hex) => worstContrast(hex, [ground, surface]) >= floors.control;
  const text = solve(pick(0.4, 0.8), pick(...floors.text));
  const textMuted = solve(pick(0.65, 0.62), floors.muted);
  // Secondary sits between text and muted: where its own floor lands on muted's (the tint floor rules both), it moves
  // toward text until it is a step from each.
  const between = (hex) =>
    contrast(hex, textMuted) >= MIN_TEXT_STEP && contrast(hex, text) >= MIN_TEXT_STEP;
  const ownSecondary = solve(pick(0.55, 0.72), pick(...floors.secondary));
  const textSecondary = between(ownSecondary)
    ? ownSecondary
    : solveLightness(lightnessOf(textMuted), chroma, hue, between, stepOf(mode) / 4);
  return {
    ...palette[mode],
    text,
    textSecondary,
    textMuted,
    lineControl: solveLightness(pick(0.8, 0.35), chroma, hue, bordered, stepOf(mode)),
  };
}

/** Light mode: the lightest fill that carries white; ink only where the hue cannot carry white at a usable lightness. Dark mode: the darkest fill that carries ink. */
function accentFill(palette, mode, [hue, chroma], floors) {
  const { ground, surface } = palette[mode];
  const isNeutral = chroma < 0.02;
  const standsOut = (hex) =>
    contrast(hex, ground) >= floors.fill && contrast(hex, surface) >= floors.fill;
  const carries = (label) => (hex) => contrast(label, hex) >= floors.onFill && standsOut(hex);
  if (!isLight(mode))
    return solveLightness(isNeutral ? 0.86 : 0.45, chroma, hue, carries(inkOf(palette)), 0.005);
  let fill = null;
  try {
    fill = solveLightness(isNeutral ? 0.34 : 0.7, chroma, hue, carries(WHITE), -0.005);
  } catch {
    fill = null;
  }
  if (fill && (isNeutral || lightnessOf(fill) >= 0.42)) return fill;
  return solveLightness(0.7, chroma, hue, carries(inkOf(palette)), -0.005);
}

function accentTokens(palette, mode, id, floors) {
  const [hue, chroma] = palette.accents[id];
  const fill = accentFill(palette, mode, [hue, chroma], floors);
  const soft = { hex: fill, alpha: chroma < 0.02 ? 0.1 : isLight(mode) ? 0.12 : 0.18 };
  const grounds = groundsOf(palette, mode);
  const tinted = [...grounds, ...grounds.map((ground) => over(soft, ground))];
  const solve = (start, floor, backgrounds) =>
    solveLightness(
      start,
      chroma,
      hue,
      (hex) => worstContrast(hex, backgrounds) >= floor,
      stepOf(mode),
    );
  const pick = (light, dark) => (isLight(mode) ? light : dark);
  return {
    fill,
    strong: oklch(lightnessOf(fill) + pick(-0.06, 0.06), chroma, hue),
    on: labelOn(palette, fill),
    text: solve(pick(0.75, 0.5), floors.link, tinted),
    soft,
    softText: solve(pick(0.7, 0.55), floors.softText, tinted),
    ring: solve(pick(0.75, 0.5), floors.ring, grounds),
  };
}

/** Each lane's solid fills that pass the contrast floors, from dark to light. */
function laneCandidates(palette, mode, floors, highContrast) {
  const { ground, surface } = palette[mode];
  return Object.fromEntries(
    LANES.map((lane) => {
      const [hue, chroma] = palette.lanes[lane];
      const vivid = ['ac', 'wa', 'tle', 'rte'].includes(lane) && !highContrast;
      const [from, to] = isLight(mode) ? [vivid ? 0.42 : 0.3, 0.64] : [0.62, 0.9];
      const found = [];
      for (let lightness = from; lightness <= to; lightness += 0.02) {
        const hex = oklch(lightness, chroma, hue);
        const passes =
          contrast(labelOn(palette, hex), hex) >= floors.onFill &&
          contrast(hex, ground) >= floors.fill &&
          contrast(hex, surface) >= floors.fill;
        if (passes) found.push(hex);
      }
      if (!found.length) throw new Error(`no solid for ${lane} ${mode}`);
      return [lane, found];
    }),
  );
}

/** The closest pair under every vision type: lanes against each other, and (weighted 1.3x) against the accent fills. */
function closestPair(pick, accentFills) {
  let closest = 99;
  LANES.forEach((lane, index) => {
    for (const other of LANES.slice(index + 1))
      closest = Math.min(closest, separation(pick[lane], pick[other]));
    for (const fill of accentFills) closest = Math.min(closest, 1.3 * separation(pick[lane], fill));
  });
  return closest;
}

/** Lane solids: coordinate ascent over each lane's valid lightnesses, maximising the closest pair. */
function laneSolids(palette, mode, floors, highContrast, accentFills) {
  const candidates = laneCandidates(palette, mode, floors, highContrast);
  const pick = Object.fromEntries(
    LANES.map((lane) => [lane, candidates[lane][Math.floor(candidates[lane].length / 2)]]),
  );
  for (let round = 0; round < 8; round++)
    for (const lane of LANES) {
      let [best, bestScore] = [pick[lane], closestPair(pick, accentFills)];
      for (const hex of candidates[lane]) {
        pick[lane] = hex;
        const score = closestPair(pick, accentFills);
        if (score > bestScore + 1e-9) [best, bestScore] = [hex, score];
      }
      pick[lane] = best;
    }
  return pick;
}

/** Text on a tint of the same hue, solved over the tint (and any `extraAlphas` of it) on every ground. */
function tintedText(palette, mode, [hue, chroma], alpha, floor, extraAlphas = []) {
  const tint = { hex: oklch(isLight(mode) ? 0.62 : 0.7, chroma, hue), alpha };
  const tinted = [alpha, ...extraAlphas].flatMap((strength) =>
    groundsOf(palette, mode).map((ground) => over({ ...tint, alpha: strength }, ground)),
  );
  const text = solveLightness(
    0.7,
    chroma,
    hue,
    (hex) => worstContrast(hex, tinted) >= floor,
    stepOf(mode),
  );
  return { text, tint };
}

/** AC text a step further from its ground (more contrast) until every failing verdict's text is far enough from it. */
function separateAccepted(palette, mode, texts) {
  const [hue, chroma] = palette.lanes.ac;
  const apart = (hex) =>
    FAILING_LANES.every((lane) => separation(hex, texts[lane]) >= MIN_VERDICT_SEPARATION);
  return solveLightness(lightnessOf(texts.ac), chroma, hue, apart, stepOf(mode));
}

function lanes(palette, mode, floors, highContrast, accentFills) {
  const solids = laneSolids(palette, mode, floors, highContrast, accentFills);
  const alpha = isLight(mode) ? 0.12 : 0.16;
  const solved = Object.fromEntries(
    LANES.map((lane) => {
      const partials = lane === 'ac' ? PARTIAL_ALPHAS : [];
      const { text, tint } = tintedText(
        palette,
        mode,
        palette.lanes[lane],
        alpha,
        floors.laneText,
        partials,
      );
      return [lane, { text, tint, solid: solids[lane], on: labelOn(palette, solids[lane]) }];
    }),
  );
  const texts = Object.fromEntries(LANES.map((lane) => [lane, solved[lane].text]));
  return { ...solved, ac: { ...solved.ac, text: separateAccepted(palette, mode, texts) } };
}

/** The first-solve cell: a stronger green than the AC tint (3:1 against it) that carries its label. */
function firstSolve(palette, mode, accepted) {
  const [hue, chroma] = palette.lanes.ac;
  const tintOnCard = over(accepted.tint, palette[mode].surface);
  const fill = solveLightness(
    lightnessOf(accepted.solid) + (isLight(mode) ? -0.06 : 0.05),
    chroma,
    hue,
    (hex) => contrast(hex, tintOnCard) >= 3 && contrast(labelOn(palette, hex), hex) >= 4.6,
    stepOf(mode),
  );
  return { fill, on: labelOn(palette, fill) };
}

/**
 * Text colours on the bare grounds and on every accent's soft tint (the viewer's own row is tinted with the accent).
 * They do not change with the contrast level, so they are solved over the tints of both levels.
 */
function textFamily(palette, mode, family) {
  const grounds = groundsOf(palette, mode);
  const softs = Object.values(FLOORS).flatMap((floors) =>
    Object.keys(palette.accents).map((id) => accentTokens(palette, mode, id, floors).soft),
  );
  const tinted = [
    ...grounds,
    ...softs.flatMap((soft) => grounds.map((ground) => over(soft, ground))),
  ];
  return Object.fromEntries(
    Object.entries(family).map(([name, [hue, chroma]]) => [
      name,
      solveLightness(0.7, chroma, hue, (hex) => worstContrast(hex, tinted) >= 4.6, stepOf(mode)),
    ]),
  );
}

/** Six tags: text on its own tint, and a dot (alternating dark and light, so they separate when hue is lost). */
function tags(palette, mode) {
  const alpha = isLight(mode) ? 0.13 : 0.16;
  return palette.tags.map(([hue, chroma], index) => {
    const { text, tint } = tintedText(palette, mode, [hue, chroma], alpha, 4.6);
    const dotLightness = isLight(mode) ? (index % 2 ? 0.68 : 0.5) : index % 2 ? 0.64 : 0.8;
    return { text, tint, dot: oklch(dotLightness, chroma, hue) };
  });
}

/** Coins: a light gradient per tag hue that carries ink text in every mode. */
const coins = (palette) =>
  palette.tags.map(([hue, chroma]) => [oklch(0.86, chroma, hue), oklch(0.76, chroma, hue)]);

/** The difficulty ramp: four evenly spaced steps of the default accent's hue, the faintest 3:1 on every card row (plain, inset or hovered). */
function difficulty(palette, mode) {
  const [hue, chroma] = palette.accents[palette.defaultAccent];
  const rows = groundsOf(palette, mode).slice(1);
  const [start, end, step] = isLight(mode) ? [0.7, 0.4, -0.005] : [0.55, 0.85, 0.005];
  const faintest = solveLightness(
    start,
    chroma,
    hue,
    (hex) => worstContrast(hex, rows) >= 3.1,
    step,
  );
  const from = lightnessOf(faintest);
  return [0, 1, 2, 3].map((index) => oklch(from + ((end - from) * index) / 3, chroma, hue));
}

/** Every token value for one mode and contrast level. */
export function solvePalette(palette, mode, level) {
  const floors = FLOORS[level];
  const highContrast = level === 'high';
  const accents = Object.fromEntries(
    Object.keys(palette.accents).map((id) => [id, accentTokens(palette, mode, id, floors)]),
  );
  const coloured = Object.entries(accents).filter(([id]) => palette.accents[id][1] >= 0.02);
  const laneSet = lanes(
    palette,
    mode,
    floors,
    highContrast,
    coloured.map(([, accent]) => accent.fill),
  );
  return {
    neutrals: neutrals(palette, mode, floors, accents),
    accents,
    lanes: laneSet,
    firstSolve: firstSolve(palette, mode, laneSet.ac),
    tags: tags(palette, mode),
    tiers: textFamily(palette, mode, palette.tiers),
    medals: textFamily(palette, mode, palette.medals),
    syntax: textFamily(palette, mode, palette.syntax),
    difficulty: difficulty(palette, mode),
    coins: coins(palette),
    ink: inkOf(palette),
  };
}
