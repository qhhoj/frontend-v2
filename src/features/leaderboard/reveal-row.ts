/** Brings a board row into view and focuses it, so a reader who lands on it can act on it. */
export function revealRow(rowId: string) {
  const row = document.getElementById(rowId);
  row?.scrollIntoView({ block: 'center' });
  row?.focus({ preventScroll: true });
}
