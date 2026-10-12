// Arbitrary values that bypass the named tokens (docs/design-language.md): `text-[13px]`, `rounded-[3px]`, `z-[1200]`.
// Use the steps instead: text-tiny|caption|meta|sm|base|title|page|stat|hero, rounded-cell|row|card|pill|control, z-sticky|savebar|header|bit|overlay|toast.
const ARBITRARY =
  /^(?:text-\[[\d.]+(?:px|r?em)\]|rounded(?:-[a-z]{1,2})?-\[[^\]]+\]|z-\[[^\]]+\])$/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const QUOTED = /(['"`])((?:(?!\1).)*)\1/g;

/**
 * Known exceptions, by file (path under src/) and class. Display sizes off the scale wait for the PageHeader and
 * StatGrid redesigns (phase 3, P8/P11); the tiny radii are marks too small for a role radius.
 */
export const ALLOWED = {
  'features/tickets/TicketsPage.vue': ['sm:text-[44px]'],
  'features/submissions/SubmissionSummary.vue': ['text-[56px]'],
  'features/submissions/SubmissionSummarySkeleton.vue': ['text-[56px]'],
  'features/home/LiveContestCard.vue': ['text-[32px]'],
  'features/contests/ContestRankingPage.vue': ['sm:text-[40px]'],
  'features/contests/replay/ContestReplayPage.vue': ['sm:text-[40px]'],
  'features/contests/RankingPodium.vue': ['text-[22px]'],
  'features/contests/ContestProblemsTable.vue': ['text-[22px]'],
  'features/auth/AuthBrand.vue': ['text-[22px]', 'lg:text-[28px]'],
  'features/auth/LoginBrandPanel.vue': ['text-[34px]'],
  'features/appearance/AppearancePreview.vue': ['text-[22px]'],
  'features/account/settings/SettingsLayout.vue': ['text-[28px]', 'sm:text-[34px]'],
  'components/CryingBit.vue': ['rounded-[50%]'],
  'features/runtimes/JudgeCard.vue': ['rounded-[2px]'],
  'features/submissions/list/TestStrip.vue': ['rounded-[2px]', 'rounded-[3px]'],
  'features/problems/ProblemTable.vue': ['rounded-[3px]'],
  'features/submissions/VerdictDistributionBar.vue': ['rounded-[3px]'],
  'features/not-found/NotFoundPage.vue': ['rounded-[4px]'],
  'features/admin/ui/AdminFilterTabs.vue': ['rounded-[1.125rem]'],
};

/** The arbitrary size, radius and z-index classes in the string literals of one source line; comment lines are ignored. */
export const arbitraryUtilities = (line) =>
  COMMENT_LINE.test(line)
    ? []
    : [...line.matchAll(QUOTED)]
        .flatMap(([, , text]) => text.split(/\s+/))
        .filter((token) => ARBITRARY.test(token.replace(/^.*:/, '').replace(/^[!-]/, '')));
