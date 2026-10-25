// Arbitrary values that bypass the named tokens (docs/design-language.md): `text-[13px]`, `rounded-[3px]`, `z-[1200]`.
// Also `z-50` (the overlay step is z-overlay), `accent-[var(--qh-accent)]` (accent-accent) and `h-[var(--qa-...)]` (min-h-(--qa-...)): the same value through a named token.
// Use the steps instead: text-tiny|caption|meta|sm|base|title|subtitle|section|display|page|stat|hero, rounded-cell|row|card|pill|control, z-sticky|savebar|header|bit|overlay|toast.
import { classTokens, utilityOf } from './class-tokens.mjs';

const ARBITRARY =
  /^(?:text-\[[\d.]+(?:px|r?em)\](?:\/\S+)?|rounded(?:-[a-z]{1,2})?-\[[^\]]+\]|z-\[[^\]]+\]|z-50|accent-\[var\([^\]]+\)\]|(?:min-)?h-\[var\(--qa-[^\]]+\)\])$/;

/**
 * Known exceptions, by file (path under src/) and class. Display sizes off the scale wait for the PageHeader and
 * StatGrid redesigns (phase 3, P8/P11); the tiny radii are marks too small for a role radius.
 */
export const ALLOWED = {
  'features/home/LiveContestCard.vue': ['text-[32px]'],
  'features/contests/ContestProblemsTable.vue': ['text-[22px]'],
  'features/auth/LoginBrandPanel.vue': ['text-[34px]'],
  'features/appearance/AppearancePreview.vue': ['text-[22px]'],
  'components/CryingBit.vue': ['rounded-[50%]'],
  'features/runtimes/JudgeCard.vue': ['rounded-[2px]'],
  'features/submissions/list/TestStrip.vue': ['rounded-[2px]', 'rounded-[3px]'],
  'features/problems/ProblemTierMark.vue': ['rounded-[3px]'],
  'features/submissions/VerdictDistributionBar.vue': ['rounded-[3px]'],
  'features/not-found/NotFoundPage.vue': ['rounded-[4px]'],
};

/** The arbitrary size, radius and z-index classes in the string literals of one source line, as written; comment lines are ignored. */
export const arbitraryUtilities = (line) =>
  classTokens(line).filter((token) => ARBITRARY.test(utilityOf(token)));
