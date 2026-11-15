/**
 * The problem page (Workbench): the statement takes the whole column. "Nộp bài" opens the submit pane on its right, 5 : 4,
 * from `lg`; inside a contest the contest's problem list sits left of both, so the split waits for `xl`. Below that submitting
 * goes through the bottom sheet (`stacked`).
 * Class names are written out whole so Tailwind finds them.
 */
export const PROBLEM_LAYOUT = {
  plain: {
    grid: 'grid gap-5 lg:items-start',
    /** The columns while the pane is open. */
    columns: {
      editor: 'lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]',
    },
    /** Where the statement takes the whole column and the sheet replaces the pane (below `lg`). */
    stacked: '(max-width: 1023.98px)',
    left: 'lg:col-start-1',
    /**
     * Pinned under the sticky bars (`--pane-top`), so Submit and the result never scroll away; short enough (less the 48 px top
     * bar and the page's 24 px paddings) to fit whole on load too.
     */
    pane: 'lg:sticky lg:top-(--pane-top) lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100dvh-var(--pane-top)-6rem)]',
    /** The facts strip under the title stays in sight while the statement scrolls, where the split is. */
    facts: 'lg:sticky lg:top-(--pane-top)',
  },
  contest: {
    grid: 'grid gap-5 xl:items-start',
    columns: {
      editor: 'xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]',
    },
    stacked: '(max-width: 1279.98px)',
    left: 'xl:col-start-1',
    pane: 'xl:sticky xl:top-(--pane-top) xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:h-[calc(100dvh-var(--pane-top)-6rem)]',
    facts: 'xl:sticky xl:top-(--pane-top)',
  },
} as const;
export type ProblemLayout = (typeof PROBLEM_LAYOUT)[keyof typeof PROBLEM_LAYOUT];
