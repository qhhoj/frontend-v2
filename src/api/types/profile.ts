import type { Appearance } from '../../theme/appearance';

/** backend: users/profile/dto/profile.response.ts (ProfileOrganizationResponse) */
export interface ProfileOrganization {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  isOpen: boolean;
  /** An admin cannot leave from the profile (409). */
  isAdmin: boolean;
}

/** backend: users/profile/dto/profile.response.ts (ProfileResponse) */
export interface Profile {
  about: string;
  /** The stored `about`, rendered and sanitized by the backend. */
  aboutHtml: string;
  firstName: string;
  timezone: string;
  languageId: string | null;
  /** Not read by v2 (Decision 4); never sent. */
  aceTheme: string;
  /** A theme id, `auto` or `glass-auto` (legacy `light`/`dark` read as Clay); the backend accepts any `^[a-z][a-z0-9-]{0,31}$`. */
  siteTheme: string;
  /** backend Task 20: the user's own look, `null` for the site's. Always present; validated by `parseAppearance` before use. */
  appearance: { accent: string; glass: number; glow: number } | null;
  /** Not read by v2 (Decision 4); never sent. */
  mathEngine: string;
  userScript: string;
  /** Badge ids; names are ask A1. */
  badges: string[];
  displayBadgeId: string | null;
  /** In the viewer's order; the first one shows beside the name. */
  organizations: ProfileOrganization[];
}

/** backend: users/profile/dto/profile.dto.ts (UpdateProfileDto, the fields the SPA writes) */
export interface ProfilePatch {
  siteTheme?: string;
  appearance?: Appearance | null;
  languageId?: string;
  firstName?: string;
  about?: string;
  timezone?: string;
  /** The current memberships reordered or shortened. */
  organizations?: string[];
}
