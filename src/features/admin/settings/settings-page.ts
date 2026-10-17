import { SETTING_TABS } from './setting-blocks';
import type { SettingBlockSpec, SettingTab } from './setting-blocks';

/** The tab a `?tab=` value opens: a known tab, else the first. */
export const tabFromQuery = (value: unknown): SettingTab =>
  SETTING_TABS.find((tab) => tab === value) ?? SETTING_TABS[0];

/** Unsaved keys per tab, from the blocks' own counts (a block not reported yet counts 0). */
export function dirtyByTab(
  blocks: readonly SettingBlockSpec[],
  dirtyByBlock: Readonly<Record<string, number>>,
): Record<SettingTab, number> {
  const counts = Object.fromEntries(SETTING_TABS.map((tab) => [tab, 0])) as Record<
    SettingTab,
    number
  >;
  for (const block of blocks) counts[block.tab] += dirtyByBlock[block.id] ?? 0;
  return counts;
}

/** What one block's save did: wrote at least one key, was refused (the block shows why), or had nothing to send. */
export type BlockSaveOutcome = 'saved' | 'refused' | 'unchanged';

/**
 * The save bar's "Lưu": every block with changes, one after another in page order. Blocks are independent units, so a
 * refused block does not stop the next one; each refusal stays on its own block.
 */
export async function saveDirtyBlocks(
  blockIds: readonly string[],
  dirtyByBlock: Readonly<Record<string, number>>,
  saveBlock: (id: string) => Promise<BlockSaveOutcome>,
): Promise<{ saved: string[]; refused: string[] }> {
  const saved: string[] = [];
  const refused: string[] = [];
  for (const id of blockIds) {
    if (!dirtyByBlock[id]) continue;
    const outcome = await saveBlock(id);
    if (outcome === 'saved') saved.push(id);
    if (outcome === 'refused') refused.push(id);
  }
  return { saved, refused };
}
