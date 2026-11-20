// Catppuccin (MIT, see LICENSE; values of @catppuccin/palette 1.8.0 in palette.json) as palette inputs: Latte in light mode,
// Mocha or Frappé in dark mode. Each role is [hue, chroma, lightness] of its official colour. The solver starts every
// walk at that lightness, so a colour stays the official hex where it passes its contrast floor and moves darker (Latte)
// or lighter (dark flavours) along the same hue and chroma only where it fails.
import { readFileSync } from 'node:fs';
import { hueChromaLightness } from '../color.mjs';

const FLAVOURS = JSON.parse(readFileSync(new URL('./palette.json', import.meta.url), 'utf8'));
/**
 * QHHOJ role -> Catppuccin colour name. Catppuccin has 14 colours, so cues, tag 1 and the default accent get one each,
 * and tags, tiers, medals and code share the rest (as the paper palette already does).
 */
const ROLES = {
  accents: {
    ultramarine: 'blue',
    teal: 'teal',
    plum: 'mauve',
    terracotta: 'peach',
    graphite: 'overlay2',
  },
  lanes: {
    ac: 'green',
    wa: 'red',
    tle: 'peach',
    mle: 'yellow',
    rte: 'pink',
    ce: 'overlay2',
    ie: 'overlay1',
    pending: 'overlay0',
  },
  tags: ['sky', 'yellow', 'teal', 'pink', 'blue', 'lavender'],
  tiers: {
    none: 'overlay0',
    newbie: 'overlay2',
    pupil: 'green',
    specialist: 'teal',
    expert: 'blue',
    'candidate-master': 'lavender',
    master: 'peach',
    grandmaster: 'red',
  },
  medals: { gold: 'yellow', silver: 'overlay1', bronze: 'rosewater' },
  syntax: {
    keyword: 'mauve',
    type: 'yellow',
    number: 'peach',
    string: 'green',
    comment: 'overlay2',
    function: 'blue',
  },
};

const mixHex = (one, two) => {
  const channels = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const [first, second] = [channels(one), channels(two)];
  return `#${first
    .map((value, index) =>
      Math.round((value + second[index]) / 2)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase();
};

/** Page, cards (mantle, as Catppuccin's side panes), strong cards, hover, hairlines. */
const grounds = (flavour, hover) => {
  const flavourColours = FLAVOURS[flavour];
  return Object.fromEntries(
    Object.entries({
      ground: flavourColours.base,
      surface: flavourColours.mantle,
      strong:
        flavour === 'latte'
          ? mixHex(flavourColours.mantle, flavourColours.crust)
          : flavourColours.crust,
      hover: hover(flavourColours),
      line: flavourColours.surface1,
      lineStrong: flavourColours.overlay0,
    }).map(([name, hex]) => [name, hex.toUpperCase()]),
  );
};

function modeInputs(flavour) {
  const flavourColours = FLAVOURS[flavour];
  const named = (roles) =>
    Object.fromEntries(
      Object.entries(roles).map(([role, name]) => [role, hueChromaLightness(flavourColours[name])]),
    );
  return {
    neutral: hueChromaLightness(flavourColours.text).slice(0, 2),
    accents: named(ROLES.accents),
    lanes: named(ROLES.lanes),
    tags: ROLES.tags.map((name) => hueChromaLightness(flavourColours[name])),
    tiers: named(ROLES.tiers),
    medals: named(ROLES.medals),
    syntax: named(ROLES.syntax),
  };
}

/** Hover: Latte crust, Mocha surface0; Frappé base (white on its surface0 is 9.5:1, under the dark text floor of 11). */
const HOVER = {
  latte: (flavourColours) => flavourColours.crust,
  mocha: (flavourColours) => flavourColours.surface0,
  frappe: (flavourColours) => flavourColours.base,
};

/** The palette overrides for Latte + a dark flavour. Tints are a little weaker in dark mode: the dark colours are pastels. */
export const catppuccin = (dark) => ({
  tints: { soft: [0.12, 0.12], lane: [0.16, 0.12] },
  modes: { light: modeInputs('latte'), dark: modeInputs(dark) },
  light: grounds('latte', HOVER.latte),
  dark: grounds(dark, HOVER[dark]),
  defaultAccent: 'plum',
});
