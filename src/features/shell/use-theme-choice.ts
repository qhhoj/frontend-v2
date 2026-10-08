import { useProfileSave } from '@/features/account/use-profile-save';
import { useThemeStore } from '@/theme/theme.store';

/** Applies a theme at once and, when signed in, saves it as the account's `siteTheme` (`preference` is a theme id, `auto` or `glass-auto`). Never touches the personal look. */
export function useThemeChoice() {
  const theme = useThemeStore();
  const saveProfile = useProfileSave();
  return (preference: string) => {
    theme.choose(preference);
    return saveProfile({ siteTheme: preference });
  };
}
