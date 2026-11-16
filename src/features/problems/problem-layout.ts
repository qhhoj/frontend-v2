/**
 * The problem page's grid: statement left, rail right from `lg` (the rail scrolls with the page: no inner scroll bar); inside a contest the contest's own rail sits left of both,
 * so the two columns wait for `xl`. Below that the rail stacks under the statement, the title gains the limit strip
 * and submitting goes through the bottom sheet's bar, not the rail's card far under the statement (`stacked`).
 * Class names are written out whole so Tailwind finds them.
 */
export const PROBLEM_LAYOUT = {
  plain: {
    grid: 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]',
    /** Where the rail stacks under the statement (below `lg`). */
    stacked: '(max-width: 1023.98px)',
    left: 'lg:col-start-1',
    /** Sticky below the header; scrolls on its own when taller than what the dock leaves of the viewport. */
    rail: 'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start',
    /** The limit strip under the title, where the rail is not beside the statement. */
    strip: 'lg:hidden',
    /** What the strip already says (the facts card's limits) shows only beside the statement; the types keep their card. */
    facts: { limits: 'max-lg:hidden', typesDivider: 'border-line lg:mt-3.5 lg:border-t lg:pt-3' },
  },
  contest: {
    grid: 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]',
    stacked: '(max-width: 1279.98px)',
    left: 'xl:col-start-1',
    rail: 'xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start',
    strip: 'xl:hidden',
    facts: { limits: 'max-xl:hidden', typesDivider: 'border-line xl:mt-3.5 xl:border-t xl:pt-3' },
  },
} as const;
