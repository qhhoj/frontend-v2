import type { RouteLocationRaw } from 'vue-router';
import { suggestUsers } from '@/api/admin-common.api';
import { fetchContests } from '@/api/contests.api';
import { fetchProblems } from '@/api/problems.api';
import type { Locale } from '@/i18n';
import type { PaletteOption } from '@/lib/palette-list';

/** Shorter text would match most of the site; the record lookups wait for this many characters. */
export const MIN_RECORD_SEARCH = 2;
/** Hits per kind of record: the palette jumps somewhere, the lists are for browsing. */
export const RECORD_HITS = 5;
/** What `GET /user-suggestions` accepts: a username prefix. */
const USERNAME_PREFIX = /^\w{1,30}$/;

export type SearchGroupId = 'pages' | 'problems' | 'contests' | 'users';
export interface SearchEntry extends PaletteOption {
  group: SearchGroupId;
  label: string;
  /** A second line: the path, code, key or username. */
  detail: string | null;
  to: RouteLocationRaw;
}

/** A page of the site the palette lists by name: the sections, then the account's pages. */
export interface SearchPage {
  id: string;
  label: string;
  detail: string | null;
  to: RouteLocationRaw;
}

const holds = (text: string, term: string) => text.toLowerCase().includes(term.toLowerCase());

/** Pages whose name or path holds `term`; an empty term lists them all, so the palette doubles as the nav. */
export const matchPages = (pages: readonly SearchPage[], term: string): SearchEntry[] =>
  pages
    .filter((page) => !term || holds(page.label, term) || holds(page.detail ?? '', term))
    .map((page) => ({ key: `page-${page.id}`, group: 'pages', ...page }));

const entry = (
  group: SearchGroupId,
  id: string,
  label: string,
  to: RouteLocationRaw,
): SearchEntry => ({ key: `${group}-${id}`, group, label, detail: id, to });

/** One remote kind of record and how to fetch and link its hits. */
export interface RecordSource {
  group: Exclude<SearchGroupId, 'pages'>;
  /** Asked only for a signed-in viewer (the endpoint refuses a visitor). */
  needsAccount?: boolean;
  search: (term: string, lang: Locale) => Promise<SearchEntry[]>;
}

/** The same lists the site's pages search: the problem archive, the contests and (signed in) the users. */
export const RECORD_SOURCES: readonly RecordSource[] = [
  {
    group: 'problems',
    search: async (term, lang) =>
      (await fetchProblems({ q: term, pageSize: RECORD_HITS, lang })).items.map(({ code, name }) =>
        entry('problems', code, name, { name: 'problem', params: { code } }),
      ),
  },
  {
    group: 'contests',
    search: async (term) =>
      (await fetchContests({ q: term, pageSize: RECORD_HITS })).items.map(({ key, name }) =>
        entry('contests', key, name, { name: 'contest', params: { key } }),
      ),
  },
  {
    group: 'users',
    needsAccount: true,
    search: async (term) =>
      USERNAME_PREFIX.test(term)
        ? (await suggestUsers(term))
            .flatMap(({ username }) => (username ? [username] : []))
            .slice(0, RECORD_HITS)
            .map((username) =>
              entry('users', username, username, { name: 'user', params: { username } }),
            )
        : [],
  },
];

/** The palette's group order, which is also the order its options step through. */
export const SEARCH_GROUPS: readonly SearchGroupId[] = [
  'pages',
  ...RECORD_SOURCES.map((source) => source.group),
];
