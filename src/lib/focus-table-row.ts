/**
 * "Về hàng của tôi": focuses the name cell (`th`, `tabindex="-1"`) of the row `tr[data-row-id]` under `root` and scrolls it
 * to the middle of the screen. False when the row is not rendered (another page, filtered out).
 */
export function focusTableRow(root: HTMLElement | null, rowId: string, smooth: boolean): boolean {
  const rows = [...(root?.querySelectorAll<HTMLElement>('tr[data-row-id]') ?? [])];
  const header = rows.find((row) => row.dataset.rowId === rowId)?.querySelector('th');
  if (!header) return false;
  header.focus();
  header.scrollIntoView?.({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  return true;
}
