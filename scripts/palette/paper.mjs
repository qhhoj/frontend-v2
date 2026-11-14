// Palette A, "Paper & Ultramarine": the inputs the generator turns into tokens. Hues and chromas are OKLCH
// ([hue, chroma]); grounds are fixed hex. Change a value here, run `npm run palette`, commit the regenerated CSS.
export const LANES = ['ac', 'wa', 'tle', 'mle', 'rte', 'ce', 'ie', 'pending'];
/** The failing verdicts whose text sits beside AC text (ranking cells, test strips): each must stay apart from AC under colour blindness. */
export const FAILING_LANES = ['wa', 'tle', 'mle', 'rte'];
/** The three partial-score steps (IOI ranking cells, partial tests): the AC tint at these strengths, under AC text. */
export const PARTIAL_ALPHAS = [0.08, 0.14, 0.2];

export const PAPER = {
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
  medals: { gold: [88, 0.14], silver: [250, 0.02], bronze: [50, 0.12] },
  syntax: {
    keyword: [25, 0.17],
    type: [300, 0.16],
    number: [75, 0.14],
    string: [150, 0.14],
    comment: [85, 0.015],
    function: [225, 0.12],
  },
};
