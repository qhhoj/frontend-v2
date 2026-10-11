import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { RECENT_LIMIT, parseRecent, visitOf, withVisit } from './recent-screens';
import type { RecentScreen } from './recent-screens';

const visit = (path: string, detail: string | null = null): RecentScreen => ({
  path,
  titleKey: 'admin.shell.screens.problems',
  detail,
});
const routeOf = (fields: Partial<RouteLocationNormalizedLoaded>) =>
  ({ params: {}, meta: {}, ...fields }) as RouteLocationNormalizedLoaded;

describe('withVisit', () => {
  it('puts the visit first and moves an earlier visit to the same path up', () => {
    const list = [visit('/admin/a'), visit('/admin/b')];
    expect(withVisit(list, visit('/admin/b')).map((entry) => entry.path)).toEqual([
      '/admin/b',
      '/admin/a',
    ]);
  });

  it('keeps at most the limit, dropping the oldest', () => {
    const full = Array.from({ length: RECENT_LIMIT }, (_unused, index) => visit(`/admin/${index}`));
    const next = withVisit(full, visit('/admin/new'));
    expect(next).toHaveLength(RECENT_LIMIT);
    expect(next.at(-1)?.path).toBe(`/admin/${RECENT_LIMIT - 2}`);
  });
});

describe('parseRecent', () => {
  it('drops malformed entries and survives broken JSON', () => {
    const stored = JSON.stringify([visit('/admin/a'), { path: 3 }, null, 'x']);
    expect(parseRecent(stored)).toEqual([visit('/admin/a')]);
    expect(parseRecent('{not json')).toEqual([]);
    expect(parseRecent('{"path":"/admin"}')).toEqual([]);
    expect(parseRecent(null)).toEqual([]);
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
