/** One option of a search palette's listbox: `key` is unique within the palette (its DOM id is built from it). */
export interface PaletteOption {
  key: string;
}

/** Options carry DOM ids so the input can point at the active one (`aria-activedescendant`). */
export const paletteOptionId = (listboxId: string, key: string) => `${listboxId}-${key}`;

/** The option after (`step` 1) or before (`step` -1) the active one, wrapping around; the first one when none is active. */
export function steppedKey(
  entries: readonly PaletteOption[],
  activeKey: string | null,
  step: 1 | -1,
): string | null {
  if (entries.length === 0) return null;
  const index = entries.findIndex((candidate) => candidate.key === activeKey);
  if (index === -1) return entries[step === 1 ? 0 : entries.length - 1]!.key;
  return entries[(index + step + entries.length) % entries.length]!.key;
}
