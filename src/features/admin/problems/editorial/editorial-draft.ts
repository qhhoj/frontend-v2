import { fromLocalInput, toLocalInput } from '../../ui/datetime';

/**
 * The `publishOn` to send: the stored instant while the box still shows its minute (a `datetime-local` box has no seconds,
 * so converting it back on every save would drop them), the box otherwise, and now for an empty box.
 */
export function publishOnToSend(box: string, stored: string | null, now: Date): string {
  if (stored !== null && box === toLocalInput(stored)) return stored;
  return fromLocalInput(box) ?? now.toISOString();
}
