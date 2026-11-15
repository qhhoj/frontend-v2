/** The controls Tab can reach. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside `container`: past the last control to the first, and Shift+Tab before the first to the last. */
export function trapTab(event: KeyboardEvent, container: HTMLElement) {
  const controls = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const active = document.activeElement;
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const wrapsBack = event.shiftKey && (active === first || active === container);
  const wrapsOn = !event.shiftKey && active === last;
  if (!wrapsBack && !wrapsOn) return;
  event.preventDefault();
  (wrapsBack ? last : first).focus();
}
