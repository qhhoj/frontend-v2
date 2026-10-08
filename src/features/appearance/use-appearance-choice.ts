import { computed } from 'vue';
import type { ProfilePatch } from '@/api/types/profile';
import { useProfileSave } from '@/features/account/use-profile-save';
import { siteLook } from '@/theme/appearance';
import type { Appearance } from '@/theme/appearance';
import { useAppearanceStore } from '@/theme/appearance.store';
import { AUTO_THEME } from '@/theme/registry';
import { useThemeStore } from '@/theme/theme.store';

/** Compares looks by their values: the store and the backend write the same fields in different key orders. */
const lookKey = (look: Appearance | null) =>
  JSON.stringify(look && [look.accent, look.glass, look.glow]);

/** The look the latest save sent (as `lookKey`); its answer is the one that may arrive while the user keeps choosing. */
let latestSentKey: string | undefined;

/**
 * True when `answer` is the look the latest save sent but the user has painted another look since: re-adopting the
 * answer would snap the controls back to a look the user already left.
 */
export function isSupersededAnswer(answer: Appearance | null, painted: Appearance | null): boolean {
  const answerKey = lookKey(answer);
  return answerKey === latestSentKey && lookKey(painted) !== answerKey;
}

/** Forgets the last sent look, so a later account's own look is never mistaken for a superseded answer. */
export function forgetSentLook() {
  latestSentKey = undefined;
}

/** The one way the UI changes the look: paint at once, then save it to the account. Mode is not here (`useThemeChoice`). */
export function useAppearanceChoice() {
  const appearance = useAppearanceStore();
  const theme = useThemeStore();
  const saveProfile = useProfileSave();

  /** What the controls show: the look when on, else the active theme as designed (its own preset). */
  const shown = computed(() => appearance.look ?? siteLook(theme.theme.accent));

  /** Paints part of the look in this browser; from the site look it turns the look on with nothing visibly changed. Sends nothing. */
  const apply = (patch: Partial<Appearance>) => appearance.choose({ ...shown.value, ...patch });

  /** Saves what is painted to the account in one request, plus `extra`; `appearance` is always the painted look. Anonymous visitors keep it in this browser. */
  const save = (extra: Omit<ProfilePatch, 'appearance'> = {}) => {
    latestSentKey = lookKey(appearance.look);
    return saveProfile({ ...extra, appearance: appearance.look });
  };

  /** Paints the change and saves the whole look. */
  const update = (patch: Partial<Appearance>) => {
    apply(patch);
    return save();
  };
  /** Paints the site's own look again (no personal look) and saves that. */
  const turnOff = () => {
    appearance.choose(null);
    return save();
  };
  /** The site default: look off and theme `auto`, in one request. */
  const reset = () => {
    appearance.choose(null);
    theme.choose(AUTO_THEME);
    return save({ siteTheme: AUTO_THEME });
  };

  return { shown, apply, save, update, turnOff, reset };
}
