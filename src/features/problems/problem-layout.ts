/**
 * The problem page (redesign "Sơn mài"): the statement, capped at the reading measure (`--qh-measure`), beside a sticky side
 * panel of fixed width (`--qh-sidebar-width`) from 1100 px (`rail-wide`); inside a contest the contest's problem list sits
 * left of both, so the two columns wait for `xl`. Below that the page is one column (`stacked`): the top of the panel (the
 * limits) goes above the statement, the rest under it, and submitting goes through the bottom sheet.
 * Class names are written out whole so Tailwind finds them.
 */
export const PROBLEM_LAYOUT = {
  plain: {
    grid: 'flex flex-col gap-6 rail-wide:grid rail-wide:grid-cols-[minmax(0,var(--qh-measure))_var(--qh-sidebar-width)] rail-wide:items-start rail-wide:gap-x-12',
    /** Where the page is one column and the sheet replaces the in-place editor. */
    stacked: '(max-width: 1099.98px)',
    /** The panel: a sticky column, or (one column) no box of its own, so its two halves order around the statement. */
    panel:
      'max-rail-wide:contents rail-wide:sticky rail-wide:top-[calc(var(--pane-top)+var(--space-page-top))] rail-wide:col-start-2 rail-wide:flex rail-wide:flex-col rail-wide:gap-4',
    panelTop: 'max-rail-wide:order-first',
    panelRest: 'max-rail-wide:order-last',
    /** The limits: rows across the card in the panel; two facts a line where the panel lies above the statement. */
    facts:
      'max-rail-wide:grid-cols-2 max-rail-wide:gap-x-2 rail-wide:-mx-(--qh-pad-surface) rail-wide:*:px-(--qh-pad-surface)',
    /** A file-name fact keeps a little amber around its text where it does not reach the card's edges. */
    factFile: 'max-rail-wide:-mx-1 max-rail-wide:px-1',
    /** The second part of a value ("· từng phần", "· 80 người") has no room two facts a line. */
    factExtra: 'max-rail-wide:hidden',
  },
  contest: {
    grid: 'flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,var(--qh-measure))_var(--qh-sidebar-width)] xl:items-start xl:gap-x-12',
    stacked: '(max-width: 1279.98px)',
    panel:
      'max-xl:contents xl:sticky xl:top-[calc(var(--pane-top)+var(--space-page-top))] xl:col-start-2 xl:flex xl:flex-col xl:gap-4',
    panelTop: 'max-xl:order-first',
    panelRest: 'max-xl:order-last',
    facts: 'max-xl:grid-cols-2 max-xl:gap-x-2 xl:-mx-(--qh-pad-surface) xl:*:px-(--qh-pad-surface)',
    factFile: 'max-xl:-mx-1 max-xl:px-1',
    factExtra: 'max-xl:hidden',
  },
} as const;
export type ProblemLayout = (typeof PROBLEM_LAYOUT)[keyof typeof PROBLEM_LAYOUT];
