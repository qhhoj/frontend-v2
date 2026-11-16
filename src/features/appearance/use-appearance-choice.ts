import { computed } from 'vue';
import type { ProfilePatch } from '@/api/types/profile';
import { useProfileSave } from '@/features/account/use-profile-save';
import { toWireAppearance } from '@/theme/appearance';
import type { Appearance } from '@/theme/appearance';
import { useAppearanceStore } from '@/theme/appearance.store';
import { DEFAULT_PALETTE } from '@/theme/palette';
import { usePaletteStore } from '@/theme/palette.store';
import { AUTO_THEME } from '@/theme/registry';
import { useThemeStore } from '@/theme/theme.store';

/** The one way the UI changes the look: paint at once, then save it to the account. Mode is not here (`useThemeChoice`). */
export function useAppearanceChoice() {
  const appearance = useAppearanceStore();
  const theme = useThemeStore();
  const palette = usePaletteStore();
  const saveProfile = useProfileSave();

  /** Saves what is painted to the account in one request, plus `extra`; `appearance` is always the painted look. Anonymous visitors keep it in this browser. */
  const save = (extra: Omit<ProfilePatch, 'appearance'> = {}) =>
    saveProfile({ ...extra, appearance: toWireAppearance(appearance.look) });

  /** Paints the change over what the controls show (the site's look when there is none yet) and saves the whole look. */
  const update = (patch: Partial<Appearance>) => {
    appearance.choose({ ...appearance.shown, ...patch });
    return save();
  };
  /** The site default: no look, the default palette and theme `auto`, in one request. */
  const reset = () => {
    appearance.choose(null);
    palette.choose(DEFAULT_PALETTE);
    theme.choose(AUTO_THEME);
    return save({ siteTheme: AUTO_THEME });
  };

  return { shown: computed(() => appearance.shown), update, reset };
}
