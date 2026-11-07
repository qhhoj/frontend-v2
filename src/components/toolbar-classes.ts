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

/** A bare text input given the same box as a toolbar control (for forms that lay their own label out): 44 px tall, 16 px text. */
export const TOOLBAR_INPUT_CLASS =
  'h-(--qh-control) rounded-row border border-line-control bg-surface px-3.5 text-base text-content placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
