// "Sơn mài" (Huế lacquer: eggshell page, black plaque, gold = merit, the purple of Huế = brand), the site's default
// palette since 2026-11-20.
// The colours are fixed hexes of the redesign mock (.batch/redesign/PORT.md), given as [hue, chroma, lightness]
// (`official` lightness). `exact` makes the solver start every walk there, so a colour stays the mock's hex where it
// passes its contrast floor and moves along the same hue and chroma only where it fails.
import { hueChromaLightness as official } from './color.mjs';
import { PAPER } from './paper.mjs';

/** The mock's `:root` (light) and `[data-qmode="dark"]` values. */
const MOCK = {
  light: {
    ink: ['#1B1513', '#574E46', '#7C7166'],
    brand: '#5B2A8F',
    lanes: { ac: '#12754F', wa: '#BF3029', tle: '#AD5F08', ce: '#6B645C', pending: '#2767B2' },
    part: '#557A12',
    merit: '#96700F',
    tiers: {
      none: '#7C7166',
      pupil: '#1E7A4A',
      expert: '#1C62B0',
      'candidate-master': '#7A3FB0',
      master: '#B0780A',
    },
  },
  dark: {
    ink: ['#F1E9D8', '#BBAF9C', '#8E8272'],
    brand: '#B797F0',
    lanes: { ac: '#5CC79A', wa: '#F0655A', tle: '#F2A23C', ce: '#A69D90', pending: '#6FA8E8' },
    part: '#B4D455',
    merit: '#DDB65C',
    tiers: {
      none: '#A89C8A',
      pupil: '#5CC79A',
      expert: '#6FA8E8',
      'candidate-master': '#B58BE8',
      master: '#E0B050',
    },
  },
};

const officials = (hexes) =>
  Object.fromEntries(Object.entries(hexes).map(([name, hex]) => [name, official(hex)]));

function modeInputs({ ink, brand, lanes, part, merit, tiers }) {
  const [text, textSecondary, textMuted] = ink.map(official);
  return {
    neutral: text.slice(0, 2),
    /** The three text levels, each on its own hue and chroma. */
    neutralText: { text, textSecondary, textMuted },
    // Plum is the brand, the purple of Huế: the primary button, links, the focus ring, the current menu item and tab.
    accents: { ...PAPER.accents, plum: official(brand) },
    lanes: { ...PAPER.lanes, ...officials(lanes) },
    part: official(part),
    tiers: { ...PAPER.tiers, ...officials(tiers) },
    medals: { ...PAPER.medals, gold: official(merit) },
  };
}

export const SONMAI = {
  exact: true,
  /** One colour, one meaning: memory and runtime failures are the time-limit amber, a system outcome is the compile-error grey. */
  laneAlias: { mle: 'tle', rte: 'tle', ie: 'ce' },
  tints: { soft: [0.1, 0.14], lane: [0.1, 0.11] },
  modes: { light: modeInputs(MOCK.light), dark: modeInputs(MOCK.dark) },
  // Mock tokens: page, surface, raised, (hover: a step under raised), line-soft, line.
  light: {
    ground: '#F5F2EA',
    surface: '#FFFDF8',
    strong: '#EDE8DC',
    hover: '#E9E4D7',
    line: '#E6E0D2',
    lineStrong: '#D6CEBD',
  },
  dark: {
    ground: '#141010',
    surface: '#1B1514',
    strong: '#251D1B',
    hover: '#2B2320',
    line: '#2A2220',
    lineStrong: '#3B2F2B',
  },
  defaultAccent: 'plum',
};
