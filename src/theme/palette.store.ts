import { defineStore } from 'pinia';
import { ref } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { DEFAULT_PALETTE, PALETTE_STORAGE_KEY, parsePalette } from './palette';
import type { PaletteId } from './palette';

/** Each palette but the default is its own stylesheet, fetched only when it is chosen. */
const STYLESHEETS = import.meta.glob('./palette/*.css');

/** Writes the contract the CSS reads: `data-palette` on `<html>`, absent for the default palette. */
function paint(id: PaletteId) {
  const root = document.documentElement;
  if (id === DEFAULT_PALETTE) delete root.dataset.palette;
  else root.dataset.palette = id;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--qh-ground').trim());
}

/** The stylesheet first, then the attribute, so the page never shows a palette without its colours. A failed fetch (offline, a stale deploy) leaves the default. */
async function stylesheetReady(id: PaletteId): Promise<boolean> {
  if (id === DEFAULT_PALETTE) return true;
  try {
    await STYLESHEETS[`./palette/${id}.css`]?.();
    return true;
  } catch {
    return false;
  }
}

/** The visitor's palette: stored in this browser only (the backend's `appearance` has no field for it, and its API is unchanged). */
export const usePaletteStore = defineStore('palette', () => {
  const current = ref<PaletteId>(parsePalette(readStorage(PALETTE_STORAGE_KEY)) ?? DEFAULT_PALETTE);
  /** Only the latest choice may paint: a slow stylesheet from an earlier click must not land after a later one. */
  let latest = 0;
  async function load(id: PaletteId) {
    const ticket = ++latest;
    const ready = await stylesheetReady(id);
    if (ticket === latest) paint(ready ? id : DEFAULT_PALETTE);
  }

  function choose(next: PaletteId) {
    current.value = next;
    writeStorage(PALETTE_STORAGE_KEY, next);
    void load(next);
  }

  if (current.value !== DEFAULT_PALETTE) void load(current.value);
  return { current, choose };
});
