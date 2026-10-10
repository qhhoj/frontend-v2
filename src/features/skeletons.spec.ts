import { describe, expect, it, vi } from 'vitest';
import { staffViewer } from '@/test/admin-routes';
import { contestEditorRoutes, editableContest } from '@/test/admin-fixtures/contests';
import { problemEditorial, signedIn, signedOut } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { settingsRoutes } from '@/test/account-routes';
import { hangRequestsExcept, mockApi, ok, page } from '@/test/mock-api';
import { deletedListRoutes, orgProblemRoutes, orgUsageRoutes } from '@/test/f4-routes';
import { usageRow } from '@/test/f4-fixtures';
import { mountApp } from '@/test/mount';
import {
  anonymousViewer,
  problemPageRoutes,
  signedInViewer,
  submissionListRoutes,
  submissionPageRoutes,
} from '@/test/problem-routes';
import { endedContest } from '@/test/replay-fixtures';

const regionsIn = (root: ParentNode, region: string) =>
  root.querySelectorAll(`[data-skeleton-region="${region}"]`).length;
/** Skeletons are decoration: no text to read, nothing to focus or click. */
const expectInert = (root: Element, label: string) => {
  expect(root.textContent?.trim(), label).toBe('');
  expect(
    root.querySelectorAll('a, button, input, textarea, select, [tabindex]'),
    label,
  ).toHaveLength(0);
};
/** Holds only the announcement list, so its skeletons stay on screen. */
function holdAnnouncements() {
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    String(input).includes('/announcements')
      ? new Promise<Response>(() => {})
      : answer(input, init),
  );
}
const blocksIn = (root: ParentNode) => root.querySelectorAll('[data-skeleton]').length;

describe('loading screens show blocks shaped like their content', () => {
  it('the signed-in home page fills every card with blocks, announces nothing itself and shows no loading text', async () => {
    mockApi({ 'GET /auth/me': signedIn() });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/');
    const dom = wrapper.element;
    for (const testId of ['rating-hero', 'recent-submissions', 'live-contest', 'top-users']) {
      const card = dom.querySelector(`[data-testid="${testId}"]`)!;
      expect(blocksIn(card), testId).toBeGreaterThan(0);
      expect(card.textContent?.includes('Đang tải'), testId).toBe(false);
      expect(card.querySelector('[role="status"]'), testId).toBeNull(); // the shell announces loading once
    }
    const regionCounts: Record<string, Record<string, number>> = {
      'rating-hero': { greeting: 1, rating: 1, tier: 1, chart: 1, tile: 3 },
      'live-contest': { label: 1, name: 1, countdown: 1, enter: 1 },
    };
    for (const [testId, regions] of Object.entries(regionCounts)) {
      const card = dom.querySelector(`[data-testid="${testId}"]`)!;
      for (const [region, count] of Object.entries(regions))
        expect(regionsIn(card, region), `${testId} ${region}`).toBe(count);
    }
    for (const skeleton of dom.querySelectorAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton, 'skeleton');
    // The lists show the page-size number of rows.
    expect(dom.querySelectorAll('[data-testid="top-users"] li')).toHaveLength(3);
    expect(dom.querySelectorAll('[data-testid="recent-submissions"] li')).toHaveLength(4);
  });

  it('the problems page shows a table skeleton with the real header cells and 8 rows, hidden from assistive tech', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/problems');
    const skeleton = wrapper.get('[data-testid="query-skeleton"]');
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(skeleton.findAll('tbody tr')).toHaveLength(8);
    expect(skeleton.findAll('thead th')).toHaveLength(6);
    expectInert(skeleton.element, 'problem table skeleton');
    expect(wrapper.findAll('table[aria-hidden="true"] [data-skeleton]').length).toBeGreaterThan(8);
  });

  it('the ranking page shows skeletons for the contest header and the board', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.findAll('[data-testid="query-skeleton"]').length).toBeGreaterThanOrEqual(1);
    expect(blocksIn(wrapper.element)).toBeGreaterThan(0);
    for (const region of ['nav', 'title', 'controls'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    expect(regionsIn(wrapper.element, 'row')).toBe(0); // the board mounts once the contest is known
  });

  it('the ranking board skeleton has the podium, the table header and 10 rows once the contest is known', async () => {
    mockApi({ 'GET /auth/me': signedOut, ...contestPageRoutes() });
    // Hold only the ranking request; the contest answers.
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/ranking') ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const board = wrapper.findAll('[data-testid="query-skeleton"]').at(-1)!.element;
    expect(regionsIn(board, 'podium')).toBe(1);
    expect(regionsIn(board, 'podium-card')).toBe(3);
    expect(regionsIn(board, 'table-header')).toBe(1);
    expect(regionsIn(board, 'row')).toBe(10);
    expectInert(board, 'ranking board skeleton');
  });

  it('the problem page shows the header and statement skeletons, inert and hidden from assistive tech', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/problems/duongdi');
    for (const region of ['meta', 'title', 'tabs', 'limits', 'statement'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    expect(regionsIn(wrapper.element, 'limit')).toBe(5);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
      expect(skeleton.attributes('aria-hidden')).toBe('true');
      expectInert(skeleton.element, 'problem skeleton');
    }
    expect(blocksIn(wrapper.element)).toBeGreaterThan(5);
  });
});

describe('the contest list shows blocks shaped like its groups', () => {
  it('fills the running cards, the upcoming rows and the ended table while the groups load, inert', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests');
    const dom = wrapper.element;
    expect(regionsIn(dom, 'running-card')).toBe(2);
    expect(regionsIn(dom, 'upcoming-row')).toBe(3);
    expect(regionsIn(dom, 'ended-header')).toBe(1);
    expect(regionsIn(dom, 'ended-row')).toBe(5);
    for (const skeleton of dom.querySelectorAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton, 'contest list skeleton');
  });
});

describe('the contest detail, announcements and stats load with skeletons shaped like their cards', () => {
  it('the contest header, countdown, tabs, problems and rules show blocks, inert, while the contest is on its way', async () => {
    mockApi({ 'GET /auth/me': signedIn() });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests/r42');
    for (const region of ['contest-header', 'countdown', 'tabs', 'problems', 'rules'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton.element, 'contest detail skeleton');
  });

  it('the announcements tab shows three inert rows while the list is on its way', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests/r42/announcements');
    const rows = wrapper.findAll('[data-skeleton-region="announcement"]');
    expect(rows).toHaveLength(3);
    for (const row of rows) expectInert(row.element, 'announcement skeleton');
    expect(wrapper.get('main').text()).not.toContain('Chưa có thông báo');
  });

  it('the stats tab shows four tiles and the results block, inert, while the stats are on its way', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests/r42/stats');
    expect(regionsIn(wrapper.element, 'stats-tile')).toBe(4);
    expect(regionsIn(wrapper.element, 'problem-results')).toBe(1);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton.element, 'contest stats skeleton');
  });
});

describe('the editorial tab loads with a statement-shaped skeleton', () => {
  it('shows the statement blocks inside its own panel, inert, while the editorial is on its way', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(),
      'GET /problems/duongdi/editorial': ok(problemEditorial()),
    });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/editorial') ? new Promise<Response>(() => {}) : served(input, init),
    );
    const { wrapper } = await mountApp('/problems/duongdi?tab=editorial');
    const panel = wrapper.get('#problem-panel-editorial');
    await vi.waitFor(() =>
      expect(panel.find('[data-skeleton-region="statement"]').exists()).toBe(true),
    );
    expectInert(panel.get('[data-testid="query-skeleton"]').element, 'editorial skeleton');
  });
});

describe('the submission page loads with skeletons shaped like its cards', () => {
  it('shows the ring, score, line, facts and case rows inert while the detail is on its way', async () => {
    mockApi({ ...signedInViewer() });
    hangRequestsExcept(['/auth/me', '/profile']);
    const { wrapper } = await mountApp('/submissions/sub-1');
    for (const region of ['ring', 'score', 'line', 'facts'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    expect(regionsIn(wrapper.element, 'fact')).toBe(6);
    expect(regionsIn(wrapper.element, 'case-row')).toBe(6);
    expect(wrapper.findAll('table[aria-hidden="true"] thead th')).toHaveLength(5);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
      expect(skeleton.attributes('aria-hidden')).toBe('true');
      expectInert(skeleton.element, 'submission skeleton');
    }
  });

  it('shows only the source lines while the source is on its way', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(), ...problemPageRoutes() });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/source') ? new Promise<Response>(() => {}) : served(input, init),
    );
    const { wrapper } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(regionsIn(wrapper.element, 'source-line')).toBe(10));
    expect(regionsIn(wrapper.element, 'ring')).toBe(0);
    expect(wrapper.find('[data-testid="score"]').exists()).toBe(true);
    const skeletons = wrapper.findAll('[data-testid="query-skeleton"]');
    expect(skeletons).toHaveLength(1);
    expectInert(skeletons[0]!.element, 'source skeleton');
  });
});

describe('the submission list page loads its stats strip and table as independent cards', () => {
  it('shows four tiles and a table skeleton with the 7 real header cells and 10 rows, all inert', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/submissions');
    const strip = wrapper.get('[data-testid="stats-strip"]').element;
    expect(regionsIn(strip, 'tile')).toBe(4);
    expect(regionsIn(strip, 'value')).toBe(4);
    expect(regionsIn(strip, 'label')).toBe(4);
    const card = wrapper.get('[data-testid="submission-table-card"]');
    expect(card.findAll('thead th')).toHaveLength(7);
    expect(regionsIn(card.element, 'row')).toBe(10);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
      expect(skeleton.attributes('aria-hidden')).toBe('true');
      expectInert(skeleton.element, 'submission list skeleton');
    }
  });

  it('shows the rows while only the stats are still loading', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/submissions/stats')
        ? new Promise<Response>(() => {})
        : served(input, init),
    );
    const { wrapper } = await mountApp('/submissions');
    await vi.waitFor(() => expect(wrapper.find('tbody tr[data-id="sub-1"]').exists()).toBe(true));
    expect(regionsIn(wrapper.get('[data-testid="stats-strip"]').element, 'tile')).toBe(4);
  });

  it('the announcements page and the contest rail show inert rows while the list loads', async () => {
    mockApi({ 'GET /auth/me': signedOut, ...contestPageRoutes() });
    holdAnnouncements();
    const { wrapper } = await mountApp('/contests/r42/announcements');
    const rows = wrapper.findAll('[data-skeleton-region="announcement"]');
    expect(rows).toHaveLength(3);
    for (const row of rows) expectInert(row.element, 'announcement skeleton');
    expect(wrapper.get('main').text()).not.toContain('Chưa có thông báo');
  });

  it('the contest rail shows one inert skeleton, not the empty text, while the list loads', async () => {
    mockApi({ 'GET /auth/me': signedOut, ...contestPageRoutes() });
    holdAnnouncements();
    const { wrapper } = await mountApp('/contests/r42');
    const rail = wrapper.get('[data-skeleton-region="announcement-rail"]');
    expect(regionsIn(wrapper.element, 'announcement-rail')).toBe(1);
    expectInert(rail.element, 'rail skeleton');
    expect(wrapper.get('aside').text()).not.toContain('Chưa có thông báo.');
  });
});

describe('the data settings page shows blocks shaped like its card', () => {
  it('fills the card with inert blocks while the export status loads', async () => {
    mockApi(settingsRoutes());
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/settings/data');
    const skeleton = wrapper.get('#main [data-testid="query-skeleton"]');
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(blocksIn(skeleton.element)).toBeGreaterThan(0);
    expectInert(skeleton.element, 'data skeleton');
  });
});

describe('the profile settings page shows blocks shaped like its first card', () => {
  it('fills the card with inert blocks while the profile loads', async () => {
    mockApi(settingsRoutes());
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/settings');
    const skeleton = wrapper.get('#main [data-testid="query-skeleton"]');
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(blocksIn(skeleton.element)).toBeGreaterThan(0);
    expectInert(skeleton.element, 'profile skeleton');
  });
});

describe('the notifications page shows rows shaped like the inbox', () => {
  it('fills the card with six inert rows while the list loads', async () => {
    mockApi({ ...signedInViewer() });
    hangRequestsExcept(['/auth/me', '/profile']);
    const { wrapper } = await mountApp('/notifications');
    const card = wrapper.get('[data-testid="notifications-card"]').element;
    expect(regionsIn(card, 'notification-row')).toBe(6);
    expect(regionsIn(card, 'notification-day')).toBe(1);
    for (const skeleton of card.querySelectorAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton, 'notification skeleton');
  });

  it('the replay page shows the player, board rows and feed skeletons while the replay loads', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(endedContest()) });
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/replay') ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper } = await mountApp('/contests/r41/replay');
    const skeleton = [...wrapper.element.querySelectorAll('[data-testid="query-skeleton"]')].at(
      -1,
    )!;
    expect(['player', 'board-row', 'feed'].map((region) => regionsIn(skeleton, region))).toEqual([
      1, 8, 1,
    ]);
    expectInert(skeleton, 'replay');
  });
});

/** Holds every request whose URL contains one of `fragments`; the rest answer from the mock. */
function holdRequestsWith(fragments: string[]) {
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    fragments.some((fragment) => String(input).includes(fragment))
      ? new Promise<Response>(() => {})
      : answer(input, init),
  );
}

describe('F3 contest extras load with blocks shaped like their content', () => {
  it('the contest list draws five inert tag chips while the catalogue loads', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests');
    expect(regionsIn(wrapper.element, 'tag-chip')).toBe(5);
    expect(wrapper.get('[data-testid="tag-filter"]').findAll('button')).toHaveLength(0);
  });

  it('the balloon screen draws six inert rows and the print sheet ten', async () => {
    mockApi({ ...signedInViewer(), ...contestPageRoutes() });
    holdRequestsWith(['/balloons']);
    const screen = await mountApp('/contests/r42/balloons');
    expect(regionsIn(screen.wrapper.element, 'balloon-row')).toBe(6);
    for (const skeleton of screen.wrapper.findAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton.element, 'balloon skeleton');
    screen.wrapper.unmount();
    mockApi({ ...signedInViewer(), ...contestPageRoutes() });
    holdRequestsWith(['/balloons']);
    const sheet = await mountApp('/contests/r42/balloons/print');
    expect(regionsIn(sheet.wrapper.element, 'print-row')).toBe(10);
  });

  it('the admin tag catalogue draws four inert rows', async () => {
    mockApi({ ...staffViewer(['judge.change_contest_tag']) });
    holdRequestsWith(['/contest-tags']);
    const { wrapper } = await mountApp('/admin/contest-tags');
    await vi.waitFor(() => expect(regionsIn(wrapper.element, 'tag-row')).toBe(4), {
      timeout: 5000,
    });
  });

  it('the contest Data tab draws the export and feed blocks while both load', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_contest']),
      ...contestEditorRoutes(editableContest({ phase: 'ended' })),
    });
    holdRequestsWith(['/feed-key', '/export']);
    const { wrapper } = await mountApp('/admin/contests/hcmus-w41/data');
    await vi.waitFor(
      () => {
        expect(regionsIn(wrapper.element, 'feed-status')).toBe(1);
        expect(regionsIn(wrapper.element, 'export-status')).toBe(1);
      },
      { timeout: 5000 },
    );
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton.element, 'data tab skeleton');
  });
});

describe('VNOI F4 screens show inert skeletons shaped like their content', () => {
  it.each([
    {
      name: 'deleted problems',
      path: '/admin/problems/deleted',
      routes: () => ({ ...staffViewer(['judge.delete_problem']), ...deletedListRoutes() }),
      hold: '/problems/deleted',
      region: 'deleted-table',
    },
    {
      name: 'organization problems',
      path: '/organizations/lhp/problems',
      routes: () => ({ ...signedInViewer(), ...orgProblemRoutes() }),
      hold: '/organizations/lhp/problems?',
      region: 'org-problem-table',
    },
    {
      name: 'organization quota',
      path: '/organizations/lhp/quota',
      routes: () => ({ ...signedInViewer(), ...orgUsageRoutes() }),
      hold: '/organizations/lhp/usage',
      region: 'quota-meters',
    },
    {
      name: 'staff quota overview',
      path: '/admin/organizations/quotas',
      routes: () => ({
        ...staffViewer(['judge.edit_all_organization']),
        'GET /organizations/usage': page([usageRow()]),
      }),
      hold: '/organizations/usage',
      region: 'quota-table',
    },
  ])('$name', async ({ path, routes, hold, region }) => {
    mockApi(routes());
    holdRequestsWith([hold]);
    const { wrapper } = await mountApp(path);
    await vi.waitFor(() => expect(regionsIn(wrapper.element, region)).toBe(1), { timeout: 5000 });
    for (const skeleton of wrapper.element.querySelectorAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton, region);
  });
});

describe('the F5 screens show inert blocks shaped like their content', () => {
  const LEFT = '0192a000-0000-7000-8000-00000000d001';
  const RIGHT = '0192a000-0000-7000-8000-00000000d002';
  const cases = [
    {
      name: 'submission diff',
      path: `/submissions/diff?left=${LEFT}&right=${RIGHT}`,
      routes: signedInViewer(),
      regions: { 'diff-summary': 1, 'diff-line': 12 },
    },
    {
      name: 'staff short links',
      path: '/admin/short-links',
      routes: staffViewer(['judge.manage_short_link']),
      regions: { 'short-link-row': 6 },
    },
    {
      name: 'integration clients',
      path: '/admin/integrations',
      routes: staffViewer(['judge.manage_integration']),
      regions: { 'integration-row': 3 },
    },
  ];

  for (const { name, path, routes, regions } of cases)
    it(`the ${name} screen`, async () => {
      mockApi(routes);
      hangRequestsExcept(['/auth/me', '/profile']);
      const { wrapper } = await mountApp(path);
      await vi.waitFor(() =>
        expect(wrapper.find('[data-testid="query-skeleton"]').exists()).toBe(true),
      );
      const skeleton = wrapper.get('[data-testid="query-skeleton"]');
      for (const [region, count] of Object.entries(regions))
        expect(regionsIn(skeleton.element, region), `${name} ${region}`).toBe(count);
      expectInert(skeleton.element, name);
    });
});
