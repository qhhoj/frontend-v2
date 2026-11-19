/**
 * One look for every filter control (problems, contests, submissions, users): height, border, radius, background,
 * padding, font size and focus ring. `active` marks a control that currently filters the list. The ring comes from
 * the control's focused child (`has-[:focus-visible]`), so a wrapper around a native input or select shows it too.
 */
export const toolbarControlClass = (active: boolean) =>
  `inline-flex h-(--qh-control) items-center gap-1.5 rounded-row border px-3.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
    active
      ? 'border-accent bg-accent-soft font-medium text-accent-soft-text'
      : 'border-line-strong bg-surface text-content hover:bg-surface-hover'
  }`;

