import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import {
  RECENT_LIMIT,
  SHORTCUT_LIMIT,
  parseRecent,
  shortcutsOf,
  visitOf,
  withVisit,
} from './recent-screens';
import type { RecentScreen, RecentVisit } from './recent-screens';

const visit = (path: string, detail: string | null = null): RecentVisit => ({
  path,
  titleKey: 'admin.shell.screens.problems',
  detail,
});
const seen = (path: string, visits = 1): RecentScreen => ({ ...visit(path), visits });
const pathsOf = (list: RecentScreen[]) => list.map((entry) => entry.path);
const routeOf = (fields: Partial<RouteLocationNormalizedLoaded>) =>
  ({ params: {}, meta: {}, ...fields }) as RouteLocationNormalizedLoaded;

describe('withVisit', () => {
  it('puts the visit first, moves an earlier visit to the same path up and counts it', () => {
    const next = withVisit([seen('/admin/a'), seen('/admin/b', 2)], visit('/admin/b'));
    expect(pathsOf(next)).toEqual(['/admin/b', '/admin/a']);
    expect(next[0]?.visits).toBe(3);
    expect(withVisit([], visit('/admin/c'))[0]?.visits).toBe(1);
  });

  it('keeps at most the limit, dropping the oldest', () => {
    const full = Array.from({ length: RECENT_LIMIT }, (_unused, index) => seen(`/admin/${index}`));
    const next = withVisit(full, visit('/admin/new'));
    expect(next).toHaveLength(RECENT_LIMIT);
    expect(next.at(-1)?.path).toBe(`/admin/${RECENT_LIMIT - 2}`);
  });
});

describe('shortcutsOf', () => {
  it('lists the most-opened pages first, the more recent first between equal counts', () => {
    const list = [
      seen('/admin/new'),
      seen('/admin/often', 5),
      seen('/admin/old'),
      seen('/admin/mid', 2),
    ];
    expect(pathsOf(shortcutsOf(list))).toEqual([
      '/admin/often',
      '/admin/mid',
      '/admin/new',
      '/admin/old',
    ]);
  });

  it('offers at most the shortcut limit', () => {
    const list = Array.from({ length: SHORTCUT_LIMIT + 3 }, (_unused, index) =>
      seen(`/admin/${index}`),
    );
    expect(shortcutsOf(list)).toHaveLength(SHORTCUT_LIMIT);
  });
});

describe('parseRecent', () => {
  it('drops malformed entries and survives broken JSON', () => {
    const stored = JSON.stringify([seen('/admin/a', 4), { path: 3 }, null, 'x']);
    expect(parseRecent(stored)).toEqual([seen('/admin/a', 4)]);
    expect(parseRecent('{not json')).toEqual([]);
    expect(parseRecent('{"path":"/admin"}')).toEqual([]);
    expect(parseRecent(null)).toEqual([]);
  });

  it('counts an entry stored without a visit count as one visit', () => {
    expect(parseRecent(JSON.stringify([visit('/admin/a')]))).toEqual([seen('/admin/a')]);
  });
});

describe('visitOf', () => {
  it('remembers a screen with the record it is about', () => {
    const route = routeOf({
      name: 'admin-problemData',
      path: '/admin/problems/aplusb/data',
      params: { code: 'aplusb' },
      meta: { titleKey: 'admin.shell.screens.problemData' },
    });
    expect(visitOf(route)).toEqual({
      path: '/admin/problems/aplusb/data',
      titleKey: 'admin.shell.screens.problemData',
      detail: 'aplusb',
    });
  });

  it('skips the dashboard and unknown admin paths', () => {
    const meta = { titleKey: 'admin.shell.screens.dashboard' };
    expect(visitOf(routeOf({ name: 'admin-dashboard', path: '/admin', meta }))).toBeNull();
    expect(visitOf(routeOf({ name: 'admin-unknown', path: '/admin/x', meta }))).toBeNull();
  });
});
