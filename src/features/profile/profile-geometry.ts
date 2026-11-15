/**
 * The rating box is the one header block whose height both the loaded page and its skeleton must reach:
 * a 20 px label, a 36 px figure and a summary of up to two 20 px lines (40 px, the rating summary wraps at 375 and 1280 px),
 * with 4 px gaps, 12 px padding and a 1 px border (130 px).
 * The skeleton and `ProfileHeader` share this class string, so the two boxes cannot drift apart.
 */
export const RATING_BOX_CLASSES =
  'flex min-h-[130px] flex-col gap-1 rounded-row border border-line px-4 py-3';
