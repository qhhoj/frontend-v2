/**
 * The problem page's grid: statement left, rail right from `lg`; inside a contest the contest's own rail sits left of both,
 * so the two columns wait for `xl`. Below that the rail stacks under the title (first child), before the statement.
 * Class names are written out whole so Tailwind finds them.
 */
export const PROBLEM_LAYOUT = {
  plain: {
    grid: 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]',
    left: 'lg:col-start-1',
    /** Sticky below the header; scrolls on its own when taller than what the dock leaves of the viewport. */
    rail: 'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100dvh-6rem-var(--dock-height,0px))] lg:overflow-y-auto',
  },
  contest: {
    grid: 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]',
    left: 'xl:col-start-1',
    rail: 'xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:sticky xl:top-20 xl:self-start xl:max-h-[calc(100dvh-6rem-var(--dock-height,0px))] xl:overflow-y-auto',
  },
} as const;
