import type { Appearance } from '../../theme/appearance';

/** backend: apps/api/src/modules/users/profile/dto/profile.response.ts (fields the SPA reads) */
export interface Profile {
  firstName: string;
  timezone: string;
  languageId: string | null;
  aceTheme: string;
  /** A theme id, `auto` or `glass-auto` (legacy `light`/`dark` read as Clay); the backend accepts any `^[a-z][a-z0-9-]{0,31}$`. */
  siteTheme: string;
  /** backend Task 20: the user's own look, `null` for the site's. Always present; validated by `parseAppearance` before use. */
  appearance: { accent: string; glass: number; glow: number } | null;
  mathEngine: string;
}

/** backend: users/profile/dto/profile.dto.ts (UpdateProfileDto, the fields the SPA writes) */
export interface ProfilePatch {
  siteTheme?: string;
  languageId?: string;
  appearance?: Appearance | null;
}
