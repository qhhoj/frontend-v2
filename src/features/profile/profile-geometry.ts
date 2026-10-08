/**
 * The rating box is the one header block whose height both the loaded page and its skeleton must reach:
 * a 20 px label, a 40 px figure and a summary of up to two 20 px lines (40 px, the rating summary wraps at 375 and 1280 px),
 * with 8 px gaps, 20 px padding and a 1 px border (158 px).
 * The skeleton and `ProfileHeader` share this class string, so the two boxes cannot drift apart.
 */
export const RATING_BOX_CLASSES =
  'flex min-h-[158px] flex-col gap-2 rounded-tile border border-line p-5';
