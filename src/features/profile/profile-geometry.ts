/**
 * The rating box sizes to its content in both directions: no fixed height or width, and `self-start` /
 * `w-fit` so a grid or flex row never stretches it into an empty band. It is capped at 16rem on wide screens.
 * The skeleton and `ProfileHeader` share this class string, so the two boxes cannot drift apart.
 */
export const RATING_BOX_CLASSES =
  'flex w-fit max-w-full flex-col gap-2 self-start rounded-tile border border-line p-5 md:max-w-64';
