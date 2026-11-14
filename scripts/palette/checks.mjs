// The contrast proof of a solved palette: every pair a screen draws, at the WCAG minimum of its level.
// Returns the failures as readable lines; an empty list is a pass.
import { contrast, over } from './color.mjs';
import { LANES, PARTIAL_ALPHAS } from './paper.mjs';

/** Minimum ratios: body text, non-text (borders, fills, rings), a label on a solid fill. */
const MINIMUMS = {
  standard: { text: 4.5, graphic: 3, label: 4.5 },
  high: { text: 7, graphic: 4.5, label: 7 },
};

/** `color-mix(in srgb, accent 14%, ground)`: the Blueprint page background's line colour. */
const gridOf = (fill, ground) => over({ hex: fill, alpha: 0.14 }, ground);

function collector(label) {
  const failures = [];
  const expect = (name, ratio, minimum) => {
    if (ratio + 1e-9 < minimum) failures.push(`${label} ${name}: ${ratio.toFixed(2)} < ${minimum}`);
  };
  const expectOn = (name, hex, backgrounds, minimum) =>
    backgrounds.forEach((background, index) =>
      expect(`${name} on ground ${index}`, contrast(hex, background), minimum),
    );
  return { failures, expect, expectOn };
}

function checkAccent({ expect, expectOn }, id, accent, neutrals, minimums) {
  const grounds = [neutrals.ground, neutrals.surface, neutrals.strong, neutrals.hover];
  const tinted = [...grounds, ...grounds.map((ground) => over(accent.soft, ground))];
  expect(`${id} on-accent`, contrast(accent.on, accent.fill), minimums.label);
  expect(`${id} on-accent on strong`, contrast(accent.on, accent.strong), minimums.label);
  expectOn(`${id} fill`, accent.fill, [neutrals.ground, neutrals.surface], minimums.graphic);
  expectOn(
    `${id} strong fill`,
    accent.strong,
    [neutrals.ground, neutrals.surface],
    minimums.graphic,
  );
  expectOn(`${id} link text`, accent.text, tinted, minimums.text);
  expectOn(`${id} soft text`, accent.softText, tinted, minimums.text);
  expectOn(`${id} focus ring`, accent.ring, grounds, minimums.graphic);
  const textLevels = [neutrals.text, neutrals.textSecondary, neutrals.textMuted];
  textLevels.forEach((hex) =>
    expectOn(
      `text ${hex} with ${id}`,
      hex,
      [...tinted, gridOf(accent.fill, neutrals.ground)],
      minimums.text,
    ),
  );
}

function checkLanes({ expect, expectOn }, set, minimums) {
  const { neutrals } = set;
  const grounds = [neutrals.ground, neutrals.surface, neutrals.strong, neutrals.hover];
  for (const lane of LANES) {
    const { text, tint, solid, on } = set.lanes[lane];
    expectOn(
      `${lane} text`,
      text,
      grounds.map((ground) => over(tint, ground)),
      minimums.text,
    );
    expect(`${lane} label`, contrast(on, solid), minimums.label);
    expectOn(`${lane} solid`, solid, [neutrals.ground, neutrals.surface], minimums.graphic);
  }
  const acTint = set.lanes.ac.tint;
  PARTIAL_ALPHAS.forEach((alpha, index) =>
    expectOn(
      `ac text on partial-bg-${index + 1}`,
      set.lanes.ac.text,
      grounds.map((ground) => over({ ...acTint, alpha }, ground)),
      minimums.text,
    ),
  );
  const { fill, on } = set.firstSolve;
  expect('first-solve vs AC tint', contrast(fill, over(set.lanes.ac.tint, neutrals.surface)), 3);
  expect('first-solve label', contrast(on, fill), 4.5);
}

/** Tokens the high-contrast overlay leaves at their standard values: checked once, at the standard minimums. */
function checkFixed({ expect, expectOn }, set) {
  const { neutrals } = set;
  const grounds = [neutrals.ground, neutrals.surface, neutrals.strong, neutrals.hover];
  set.tags.forEach(({ text, tint }, index) =>
    expectOn(
      `tag-${index + 1}`,
      text,
      grounds.map((ground) => over(tint, ground)),
      4.5,
    ),
  );
  for (const family of ['tiers', 'medals', 'syntax'])
    for (const [name, hex] of Object.entries(set[family]))
      expectOn(`${family} ${name}`, hex, grounds, 4.5);
  set.difficulty.forEach((hex, index) => expectOn(`diff-${index + 1}`, hex, grounds.slice(1), 3));
  set.coins.forEach((stops, index) =>
    stops.forEach((stop) => expect(`coin-${index + 1} ${stop}`, contrast(set.ink, stop), 4.5)),
  );
}

/** Failures of one mode at one level, for every accent. */
export function proveSet(set, mode, level) {
  const minimums = MINIMUMS[level];
  const check = collector(`${mode}/${level}`);
  const { neutrals } = set;
  check.expectOn(
    'line-control',
    neutrals.lineControl,
    [neutrals.ground, neutrals.surface],
    minimums.graphic,
  );
  for (const [id, accent] of Object.entries(set.accents))
    checkAccent(check, id, accent, neutrals, minimums);
  checkLanes(check, set, minimums);
  if (level === 'standard') checkFixed(check, set);
  return check.failures;
}
