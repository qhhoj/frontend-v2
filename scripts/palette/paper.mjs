// "Paper & Ultramarine", the site's earlier palette and the base the others override (palettes.mjs): the inputs the
// generator turns into tokens. Hues and chromas are OKLCH ([hue, chroma]); grounds are fixed hex. Change a value here,
// run `npm run palette`, commit the regenerated CSS.
export const LANES = ['ac', 'wa', 'tle', 'mle', 'rte', 'ce', 'ie', 'pending'];
/** The failing verdicts whose text sits beside AC text (ranking cells, test strips): each must stay apart from AC under colour blindness. */
export const FAILING_LANES = ['wa', 'tle', 'mle', 'rte'];
/** The three partial-score steps (IOI ranking cells, partial tests): the AC tint at these strengths, under AC text. */
export const PARTIAL_ALPHAS = [0.08, 0.14, 0.2];

export const PAPER = {
  /** Tint strengths [light, dark]: the accent's soft fill, verdict lanes and tags. */
  tints: { soft: [0.12, 0.18], lane: [0.12, 0.16], tag: [0.13, 0.16] },
  light: {
    ground: '#F6F1E7',
    surface: '#FFFEFA',
    strong: '#EEE7D9',
    hover: '#E8DFCC',
    line: '#E0D6C3',
    lineStrong: '#CBBFA6',
  },
  dark: {
    ground: '#15120F',
    surface: '#1E1A16',
    strong: '#28231D',
    hover: '#312B24',
    line: '#3A332A',
    lineStrong: '#4C4338',
  },
  neutral: [85, 0.012],
  defaultAccent: 'ultramarine',
  /** Picker order; the ids are the `data-accent` values and the backend's `APPEARANCE_ACCENTS`. */
  accents: {
    ultramarine: [265, 0.22],
    teal: [212, 0.12],
    plum: [320, 0.2],
    terracotta: [42, 0.15],
    graphite: [85, 0.012],
  },
  lanes: {
    ac: [158, 0.15],
    wa: [24, 0.2],
    tle: [92, 0.15],
    mle: [58, 0.17],
    rte: [335, 0.16],
    ce: [250, 0.04],
    ie: [60, 0.01],
    pending: [85, 0.01],
  },
  tags: [
    [265, 0.2],
    [45, 0.17],
    [175, 0.13],
    [335, 0.19],
    [95, 0.15],
    [295, 0.18],
  ],
  tiers: {
    none: [85, 0.01],
    newbie: [250, 0.04],
    pupil: [150, 0.15],
    specialist: [200, 0.12],
    expert: [262, 0.18],
    'candidate-master': [305, 0.18],
    master: [55, 0.17],
    grandmaster: [25, 0.2],
  },
  /** Partial score (lime): its own colour, apart from accepted green and time-limit amber. */
  part: [125, 0.15],
  medals: { gold: [88, 0.14], silver: [240, 0.04], bronze: [50, 0.12] },
  /**
   * The plate (kit `Readout`): the one dark surface, the same in every palette and both modes; dark mode deepens the
   * ground and frames it gold-brown. Its verdict colours replace the page's inside a plate.
   */
  plate: {
    light: { bg: '#191211', line: '#4B3B2C' },
    dark: { bg: '#0B0808', line: '#6E5830' },
    fg: '#F1E9D8',
    muted: '#9C8F7D',
    track: '#3A2E2A',
    marks: {
      ac: '#5CC79A',
      wa: '#F0655A',
      tle: '#F2A23C',
      pd: '#6FA8E8',
      part: '#B4D455',
      ce: '#A69D90',
      merit: '#DDB65C',
      brand: '#C3A6F5',
    },
    /** The label on a brand fill (the plate's primary button). */
    brandFg: '#1C1026',
  },
  syntax: {
    keyword: [25, 0.17],
    type: [300, 0.16],
    number: [75, 0.14],
    string: [150, 0.14],
    comment: [85, 0.015],
    function: [225, 0.12],
  },
};
