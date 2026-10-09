import type { Setting, SettingKey } from '@/api/types/settings-admin';
import { checkDraft, valueToSend } from './setting-values';
import type { SettingDraft } from './setting-values';

export type Drafts = Partial<Record<SettingKey, SettingDraft>>;
export type SendOutcome =
  { saved: SettingKey[] } | { saved: SettingKey[]; failedKey: SettingKey; error: unknown };

/** The first client-side problem of any key in the block; nothing is sent while there is one. */
export function checkBlock(
  settings: Setting[],
  drafts: Drafts,
): { key: SettingKey; problem: string } | null {
  for (const setting of settings) {
    const problem = checkDraft(setting, drafts[setting.key]!);
    if (problem) return { key: setting.key, problem };
  }
  return null;
}

/**
 * One PATCH per changed key, in block order, stopping at the first refusal (the backend reports one `value` issue per
 * key, so the keys after a refused one are not sent).
 */
export async function sendKeysInOrder(
  settings: Setting[],
  drafts: Drafts,
  send: (key: SettingKey, value: unknown) => Promise<Setting>,
): Promise<SendOutcome> {
  const saved: SettingKey[] = [];
  for (const setting of settings) {
    const change = valueToSend(setting, drafts[setting.key]!);
    if (change === null) continue;
    try {
      await send(setting.key, change.value);
      saved.push(setting.key);
    } catch (error) {
      return { saved, failedKey: setting.key, error };
    }
  }
  return { saved };
}
