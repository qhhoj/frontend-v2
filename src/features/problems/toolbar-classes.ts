/** One look for every toolbar control; `active` marks a control that currently filters the list. */
export const toolbarControlClass = (active: boolean) =>
  `inline-flex h-10 items-center gap-1.5 rounded-row border px-3.5 text-sm ${
    active
      ? 'border-accent bg-accent-soft font-medium text-accent-soft-text'
      : 'border-line-strong bg-surface text-content hover:bg-surface-hover'
  }`;
