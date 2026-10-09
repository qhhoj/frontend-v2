/** backend `site/public/dto/site.response.ts`: one entry of the navigation bar, as the admin reads it. */
export interface NavigationItem {
  id: string;
  key: string;
  label: string;
  path: string;
  /** A JavaScript regular expression the SPA tests against the current path. */
  regex: string;
  hidden: boolean;
  order: number;
  parentId: string | null;
}

/** `GET /site`: the navigation bar and the legacy misc config (served to everyone, so never secrets). */
export interface SiteData {
  navigation: NavigationItem[];
  config: Record<string, string>;
}

/** backend `site/admin/dto/navigation-admin.dto.ts`: the create body; an update sends any subset. */
export interface NavigationBody {
  key: string;
  label: string;
  path: string;
  regex?: string;
  hidden?: boolean;
  order: number;
  parentId?: string | null;
}
