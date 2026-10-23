/**
 * An inline link on the auth pages. On a phone or a coarse pointer its `::after` reaches 12 px past the text above and below,
 * for a 44 px hit area, so the line does not grow (a link in running text cannot take a `min-height`).
 */
export const AUTH_LINK =
  'relative font-semibold text-accent-text underline touch:after:absolute touch:after:inset-x-0 touch:after:-inset-y-3';
