/**
 * The problem page (Workbench): the statement takes the whole column. "Nộp bài" opens the submit pane on its right, the pane's width is `--pane-submit`,
 * from `lg`; inside a contest the contest's problem list sits left of both, so the split waits for `xl`. Below that submitting
 * goes through the bottom sheet (`stacked`).
 * Class names are written out whole so Tailwind finds them.
 */
export const PROBLEM_LAYOUT = {
  plain: {
    grid: 'grid gap-5 lg:items-start',
    /** The columns while the pane is open. */
    columns: {
      editor: 'lg:grid-cols-[minmax(0,1fr)_var(--pane-submit)]',
    },
    /** Where the statement takes the whole column and the sheet replaces the pane (below `lg`). */
    stacked: '(max-width: 1023.98px)',
    /** Hides the header's submit entry wherever the sheet's bar is the entry (same range as `stacked`). */
    hideWhenSheet: 'max-lg:hidden',
    left: 'lg:col-start-1',
    /**
     * Pinned under the sticky bars (`--pane-top`), so Submit and the result never scroll away; short enough (less the page's
     * bottom padding and a gap, one `--space-page-top` each) to fit whole on load too.
     */
    pane: 'lg:sticky lg:top-(--pane-top) lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100dvh-var(--pane-top)-2*var(--space-page-top))]',
  },
  contest: {
    grid: 'grid gap-5 xl:items-start',
    columns: {
      editor: 'xl:grid-cols-[minmax(0,1fr)_var(--pane-submit)]',
    },
    stacked: '(max-width: 1279.98px)',
    hideWhenSheet: 'max-xl:hidden',
    left: 'xl:col-start-1',
    pane: 'xl:sticky xl:top-(--pane-top) xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:h-[calc(100dvh-var(--pane-top)-2*var(--space-page-top))]',
  },
} as const;
export type ProblemLayout = (typeof PROBLEM_LAYOUT)[keyof typeof PROBLEM_LAYOUT];
