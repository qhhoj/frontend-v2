import type { RouteLocationRaw } from 'vue-router';
import { fetchAdminProblems } from '@/api/admin-index.api';
import {
  ADMIN_SEARCH_PAGE,
  searchAdminOrganizations,
  searchAdminUsers,
} from '@/api/admin-search.api';
import { fetchContests } from '@/api/contests.api';
import { fetchTickets } from '@/api/tickets.api';
import type { Locale } from '@/i18n';
import type { AdminAccess } from '../../admin-access';
import { ADMIN_SCREENS, adminRouteName } from '../../admin-screens';
import { highlightParts } from '../../search/index-search';
import { queueLocation } from '../../tickets/ticket-queue';
import type { AdminNavItem } from '../admin-nav';

/** Shorter text would match most of the site; the record lookups wait for this many characters. */
export const MIN_RECORD_SEARCH = 2;

export type PaletteGroupId =
  'screens' | 'problems' | 'contests' | 'tickets' | 'users' | 'organizations';
export interface PaletteEntry {
  /** Unique within the palette: the option's DOM id is built from it. */
  key: string;
  group: PaletteGroupId;
  label: string;
  /** A second line: the code, key, slug or username. */
  detail: string | null;
  to: RouteLocationRaw;
}

/** The listbox helpers live in `lib/palette-list.ts`, shared with the public site search. */
export { paletteOptionId, steppedKey } from '@/lib/palette-list';

/** A case-insensitive substring of the label (as the lists highlight it) or of the screen's path. */
export const matchesText = (text: string, term: string): boolean =>
  highlightParts(text, term).some((part) => part.isHit);

/** Screens whose title or path holds `term`; an empty term lists them all, so the palette doubles as the nav. */
export function matchScreens(
  items: readonly AdminNavItem[],
  term: string,
  labelOf: (item: AdminNavItem) => string,
): PaletteEntry[] {
  return items
    .filter((item) => !term || matchesText(labelOf(item), term) || item.path.includes(term))
    .map((item) => ({
      key: `screen-${item.id}`,
      group: 'screens',
      label: labelOf(item),
      detail: item.path,
      to: { name: item.routeName },
    }));
}

/** One remote kind of record: what opens its admin screen, and how to fetch and link its hits. */
export interface RecordSource extends AdminAccess {
  group: Exclude<PaletteGroupId, 'screens'>;
  search: (term: string, lang: Locale) => Promise<PaletteEntry[]>;
}

const entry = (
  group: RecordSource['group'],
  id: string,
  label: string,
  to: RouteLocationRaw,
): PaletteEntry => ({ key: `${group}-${id}`, group, label, detail: id, to });

/** Each kind links to the admin screen that edits it, so its permission is that screen's. */
export const RECORD_SOURCES: readonly RecordSource[] = [
  {
    group: 'problems',
    permission: ADMIN_SCREENS.problemGeneral.permission,
    search: async (term, lang) =>
      (await fetchAdminProblems({ ...ADMIN_SEARCH_PAGE, q: term, lang })).items.map(
        ({ code, name }) =>
          entry('problems', code, name, {
            name: adminRouteName('problemGeneral'),
            params: { code },
          }),
      ),
  },
  {
    group: 'contests',
    permission: ADMIN_SCREENS.contestGeneral.permission,
    search: async (term) =>
      (await fetchContests({ ...ADMIN_SEARCH_PAGE, q: term, editable: true })).items.map(
        ({ key, name }) =>
          entry('contests', key, name, { name: adminRouteName('contestGeneral'), params: { key } }),
      ),
  },
  {
    group: 'tickets',
    permission: ADMIN_SCREENS.tickets.permission,
    // Every ticket the viewer may read, open or closed, by title or creator; the hit opens beside the queue.
    search: async (term) => {
      const filters = { own: false, q: term, user: [], assignee: [], page: 1 };
      const found = await fetchTickets(filters);
      return found.items.slice(0, ADMIN_SEARCH_PAGE.pageSize).map((ticket) => ({
        ...entry('tickets', ticket.id, ticket.title, {
          name: adminRouteName('tickets'),
          query: queueLocation(filters, ticket.id),
        }),
        // Ticket ids are time-ordered UUIDs, so a short id barely differs between tickets: the sender and subject do.
        detail: `${ticket.creator.username} · ${ticket.link.title}`,
      }));
    },
  },
  {
    group: 'users',
    permission: ADMIN_SCREENS.users.permission,
    search: async (term) =>
      (await searchAdminUsers(term)).items.map(({ username, displayName }) =>
        entry('users', username, displayName || username, {
          name: adminRouteName('users'),
          query: { user: username },
        }),
      ),
  },
  {
    group: 'organizations',
    permission: ADMIN_SCREENS.organizations.permission,
    capability: ADMIN_SCREENS.organizations.capability,
    search: async (term) =>
      (await searchAdminOrganizations(term)).items.map(({ slug, name }) =>
        entry('organizations', slug, name, {
          name: adminRouteName('organizations'),
          query: { org: slug },
        }),
      ),
  },
];

/** The palette's group order, which is also the order its options step through: screens, then each record kind. */
export const PALETTE_GROUPS: readonly PaletteGroupId[] = [
  'screens',
  ...RECORD_SOURCES.map((source) => source.group),
];
