/**
 * "Về hàng của tôi": focuses the name cell of the row `[data-row-id]` under `root` (a table row's `th`, or a list row's
 * `[data-row-focus]`, both `tabindex="-1"`) and scrolls it to the middle of the screen. False when the row is not
 * rendered (another page, filtered out).
 */
export function focusTableRow(root: HTMLElement | null, rowId: string, smooth: boolean): boolean {
  const rows = [...(root?.querySelectorAll<HTMLElement>('[data-row-id]') ?? [])];
  const header = rows
    .find((row) => row.dataset.rowId === rowId)
    ?.querySelector<HTMLElement>('th, [data-row-focus]');
  if (!header) return false;
  header.focus();
  header.scrollIntoView?.({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  return true;
}
