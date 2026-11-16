// The palettes a visitor can choose (Appearance page, "Bảng màu"), each as overrides of PAPER (paper.mjs). The first is
// the site's default; `paper` is the look before palettes existed. Hues and chromas are OKLCH ([hue, chroma]); grounds
// are fixed hex. Optional inputs the solver reads: `tints`, `modes` (per-mode inputs, Catppuccin), `inkLabel` (the default
// accent is a bright fill with a dark label in light mode) and `inkFill` (the default accent's buttons are ink).
import { catppuccin } from './catppuccin/roles.mjs';
import { PAPER } from './paper.mjs';

/** Round 2 "lively": white pages, vivid verdict hues, stronger tints. */
const LIVELY = {
  lanes: { ac: [158, 0.19], wa: [24, 0.23], tle: [92, 0.18], mle: [58, 0.2] },
  tints: { soft: [0.16, 0.18], lane: [0.2, 0.2], tag: [0.2, 0.2] },
};
const brightTags = (tagOneHue) => [
  [tagOneHue, 0.22],
  [45, 0.19],
  [175, 0.15],
  [335, 0.22],
  [95, 0.17],
  [295, 0.21],
];
/** Round 3: the upcoming cue (tag 1) leaves the accent's blue for sky; tint strength 0.16. */
const SKY = {
  tints: { soft: [0.16, 0.18], lane: [0.16, 0.16], tag: [0.16, 0.16] },
  tags: [
    [220, 0.14],
    [45, 0.17],
    [175, 0.13],
    [335, 0.19],
    [95, 0.15],
    [295, 0.18],
  ],
};

const OVERRIDES = {
  'catppuccin-mocha': catppuccin('mocha'),
  'catppuccin-frappe': catppuccin('frappe'),
  palletism: {
    // palletism.com page and cobalt; dark from aprilzhu's warm brown-greys
    ...SKY,
    light: {
      ground: '#FBF9F4',
      surface: '#FFFFFF',
      strong: '#F3EFE6',
      hover: '#ECE7DE',
      line: '#E6E1D6',
      lineStrong: '#CFC8BA',
    },
    dark: {
      ground: '#1A1511',
      surface: '#27211B',
      strong: '#2F2923',
      hover: '#37312B',
      line: '#3F3933',
      lineStrong: '#57514B',
    },
    neutral: [95, 0.007],
    accents: { ultramarine: [260, 0.14] },
  },
  wonderlist: {
    // wonderlist.design cool white and azure; dark from mebius
    ...SKY,
    light: {
      ground: '#F4F5F7',
      surface: '#FFFFFF',
      strong: '#ECEEF1',
      hover: '#E4E7EB',
      line: '#E2E4E9',
      lineStrong: '#C9CDD4',
    },
    dark: {
      ground: '#0E0E12',
      surface: '#1B1B20',
      strong: '#222228',
      hover: '#27272E',
      line: '#2C2C33',
      lineStrong: '#3F3F48',
    },
    neutral: [265, 0.004],
    accents: { ultramarine: [260, 0.22] },
  },
  motionin: {
    // motion.in white page, grey cards, black pill buttons; dark from tuffui; blue only on links
    ...SKY,
    inkFill: true,
    light: {
      ground: '#FFFFFF',
      surface: '#F4F4F4',
      strong: '#EBEBEB',
      hover: '#E4E4E4',
      line: '#E3E3E3',
      lineStrong: '#C8C8C8',
    },
    dark: {
      ground: '#101010',
      surface: '#191919',
      strong: '#202020',
      hover: '#262626',
      line: '#2A2A2A',
      lineStrong: '#3D3D3D',
    },
    neutral: [90, 0],
    accents: { ultramarine: [254, 0.19] },
  },
  iris: {
    ...LIVELY,
    light: {
      ground: '#F8F8FD',
      surface: '#FFFFFF',
      strong: '#F0F0FA',
      hover: '#E8E7F6',
      line: '#E3E2F0',
      lineStrong: '#C8C6DE',
    },
    dark: {
      ground: '#110F1D',
      surface: '#1A1729',
      strong: '#231F37',
      hover: '#2C2742',
      line: '#36304F',
      lineStrong: '#4B4469',
    },
    neutral: [285, 0.016],
    accents: { ultramarine: [292, 0.24] },
    tags: brightTags(250).map((tag, index) => (index === 5 ? [318, 0.2] : tag)),
  },
  lagoon: {
    ...LIVELY,
    inkLabel: true,
    light: {
      ground: '#F4FAFB',
      surface: '#FFFFFF',
      strong: '#EAF4F6',
      hover: '#DFEEF1',
      line: '#D8E7EA',
      lineStrong: '#B9D0D5',
    },
    dark: {
      ground: '#09161A',
      surface: '#0F2127',
      strong: '#162B32',
      hover: '#1D353D',
      line: '#25414A',
      lineStrong: '#34555F',
    },
    neutral: [210, 0.014],
    defaultAccent: 'teal',
    accents: { teal: [222, 0.17] },
    tags: brightTags(265),
  },
  lotus: {
    ...LIVELY,
    lanes: { ...LIVELY.lanes, rte: [315, 0.18] },
    light: {
      ground: '#FAF9FA',
      surface: '#FFFFFF',
      strong: '#F3F1F2',
      hover: '#ECE9EB',
      line: '#E7E3E5',
      lineStrong: '#CEC8CB',
    },
    dark: {
      ground: '#1A0E15',
      surface: '#24151E',
      strong: '#2E1C27',
      hover: '#382330',
      line: '#432A3A',
      lineStrong: '#5A3A4E',
    },
    neutral: [350, 0.008],
    defaultAccent: 'plum',
    accents: { plum: [348, 0.22] },
    tags: brightTags(265).map((tag, index) => (index === 3 ? [315, 0.21] : tag)),
  },
  ink: {
    light: {
      ground: '#F5F5F3',
      surface: '#FFFFFF',
      strong: '#EDEDEA',
      hover: '#E6E6E2',
      line: '#E1E1DC',
      lineStrong: '#C8C8C1',
    },
    dark: {
      ground: '#131313',
      surface: '#1B1B1B',
      strong: '#242424',
      hover: '#2C2C2C',
      line: '#353535',
      lineStrong: '#474747',
    },
    neutral: [90, 0.004],
    defaultAccent: 'graphite',
    accents: { graphite: [90, 0.006] },
  },
  plum: {
    defaultAccent: 'plum',
    accents: { plum: [318, 0.16] },
  },
  petrol: {
    light: {
      ground: '#F3F5F7',
      surface: '#FFFFFF',
      strong: '#EAEEF2',
      hover: '#E2E7EC',
      line: '#DCE2E8',
      lineStrong: '#C2CBD4',
    },
    dark: {
      ground: '#0F1317',
      surface: '#161B20',
      strong: '#1E242A',
      hover: '#262D34',
      line: '#2F373F',
      lineStrong: '#404B56',
    },
    neutral: [240, 0.01],
    defaultAccent: 'teal',
    accents: { teal: [218, 0.11] },
  },
  paper: {},
};

const merge = (id, over) => ({
  ...PAPER,
  ...over,
  id,
  tints: { ...PAPER.tints, ...over.tints },
  light: { ...PAPER.light, ...over.light },
  dark: { ...PAPER.dark, ...over.dark },
  accents: { ...PAPER.accents, ...over.accents },
  lanes: { ...PAPER.lanes, ...over.lanes },
});

/** In picker order. The first is the site's default: its CSS has no `data-palette` scope. */
export const PALETTES = Object.entries(OVERRIDES).map(([id, over]) => merge(id, over));
