/**
 * The problem page's split (Workbench): the statement left, the submit pane right, 1 : 1, from `lg`; inside a contest the
 * contest's problem list sits left of both, so the split waits for `xl`. Below that the statement takes the column and
 * submitting goes through the bottom sheet (`stacked`). A signed-out viewer has no editor: the right column is a narrow card.
 * Class names are written out whole so Tailwind finds them.
 */
export const PROBLEM_LAYOUT = {
  plain: {
    grid: 'grid gap-5 lg:items-start',
    /** The two columns, by whether the viewer has an editor. */
    columns: { editor: 'lg:grid-cols-2', signIn: 'lg:grid-cols-[minmax(0,1fr)_20rem]' },
    /** Where the statement takes the whole column and the sheet replaces the pane (below `lg`). */
    stacked: '(max-width: 1023.98px)',
    left: 'lg:col-start-1',
    /**
     * Pinned under the sticky bars (`--pane-top`), so Submit and the result never scroll away; short enough (less the 48 px top
     * bar and the page's 24 px paddings) to fit whole on load too.
     */
    pane: 'lg:sticky lg:top-(--pane-top) lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100dvh-var(--pane-top)-6rem)]',
    /** A signed-out viewer's sign-in card, in the narrow right column. */
    signIn: 'lg:sticky lg:top-(--pane-top) lg:col-start-2 lg:row-start-1 lg:self-start',
    /** The facts strip under the title stays in sight while the statement scrolls, where the split is. */
    facts: 'lg:sticky lg:top-(--pane-top)',
  },
  contest: {
    grid: 'grid gap-5 xl:items-start',
    columns: { editor: 'xl:grid-cols-2', signIn: 'xl:grid-cols-[minmax(0,1fr)_20rem]' },
    stacked: '(max-width: 1279.98px)',
    left: 'xl:col-start-1',
    pane: 'xl:sticky xl:top-(--pane-top) xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:h-[calc(100dvh-var(--pane-top)-6rem)]',
    signIn: 'xl:sticky xl:top-(--pane-top) xl:col-start-2 xl:row-start-1 xl:self-start',
    facts: 'xl:sticky xl:top-(--pane-top)',
  },
} as const;
export type ProblemLayout = (typeof PROBLEM_LAYOUT)[keyof typeof PROBLEM_LAYOUT];
