const pad = (value: number) => String(value).padStart(2, '0');

/** An API instant as the value of `<input type="datetime-local">`, in the viewer's zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The box's wall clock as an ISO instant with `Z` (the backend's `IsTimestamp` accepts it); empty is null. */
export const fromLocalInput = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;
