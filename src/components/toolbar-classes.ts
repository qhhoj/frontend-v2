/**
 * One look for every filter control (problems, contests, submissions, users): height, radius, fill,
 * padding, font size and focus ring (a 36 px pill on the strong surface, no line). `active` marks a control that currently filters the list. The ring comes from
 * the control's focused child (`has-[:focus-visible]`), so a wrapper around a native input or select shows it too.
 */
export const toolbarControlClass = (active: boolean) =>
  `edge-high inline-flex h-(--qh-control) items-center gap-2 rounded-control px-(--qh-control-px) text-body has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
    active
      ? 'bg-accent-soft font-medium text-accent-soft-text'
      : 'bg-surface-strong text-content hover:bg-surface-hover'
  }`;

/** A bare text input given the same box as a toolbar control (for forms that lay their own label out): a 36 px pill (44 on touch), 15 px text. */
export const TOOLBAR_INPUT_CLASS =
  'edge-high h-(--qh-control) rounded-control bg-surface-strong px-(--qh-control-px) text-body text-content placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
