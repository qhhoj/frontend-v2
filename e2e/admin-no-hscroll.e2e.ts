import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { stretch } from './fixtures/long-values';
import { activityLog, liveActivity } from '../src/test/admin-fixtures/activity';
import { flatpageItem } from '../src/test/admin-fixtures/flatpages';
import { adminContestItem, adminProblemItem } from '../src/test/admin-fixtures/index-search';
import { judge } from '../src/test/admin-fixtures/judges';
import { languageAdmin } from '../src/test/admin-fixtures/languages';
import { similarityRun } from '../src/test/admin-fixtures/similarity';
import { staffUser } from '../src/test/admin-fixtures/users';
import {
  cannedReply,
  organizationItem,
  postItem,
  ticketItem,
} from '../src/test/community-fixtures';
import { submissionItem } from '../src/test/fixtures';
import { contestTag } from '../src/test/contest-extras-fixtures';
import { integrationClient, shortLink } from '../src/test/f5-fixtures';

/**
 * No admin list screen scrolls sideways at desktop widths, even with the longest values production holds (long handles,
 * IPv6 addresses, paths, problem names). Rows are cards below 768 px (390 is checked too). A table frame (`ScrollRegion`) scrolling
 * sideways means a column was too wide and needs stacking or truncation, not a wider table; a tab strip may scroll.
 */
interface Screen {
  name: string;
  path: string;
  permissions: string[];
  mock: (api: FakeApi) => void;
  /** Text that proves the data rendered (not an empty state). */
  seen: string | RegExp;
}

const rows = <T>(make: (index: number) => T, count = 6) =>
  Array.from({ length: count }, (_unused, index) => stretch(make(index)));

/** A screen whose one list endpoint answers with `make(index)` rows. */
function list(
  name: string,
  path: string,
  permission: string,
  route: string,
  make: (index: number) => unknown,
  seen = /nguyen_van|ngắn nhất|very-long/,
): Screen {
  return {
    name,
    path,
    permissions: [permission],
    seen,
    mock: (api) => {
      api.routes[route] = adminList(rows(make));
      if (route === 'GET /admin/posts') api.routes['GET /posts'] = adminList(rows(make));
      if (route === 'GET /judges')
        api.routes['GET /judges/queue'] = adminOk({
          byLanguage: [],
          byPriority: [],
          grading: 0,
          queued: 0,
          oldestQueuedAt: null,
        });
    },
  };
}

const SCREENS: Screen[] = [
  {
    name: 'activity',
    path: '/admin/activity',
    permissions: ['judge.can_see_user_activity'],
    seen: /nguyen_van/,
    mock: (api) => {
      api.routes['GET /admin/user-activity/logs'] = adminList(
        rows((index) =>
          activityLog({
            id: `l-${index}`,
            at: `2026-10-${index < 3 ? '11' : '10'}T0${index}:26:57.000Z`,
          }),
        ),
        { hasMore: true },
      );
      api.routes['GET /admin/user-activity/live'] = adminOk(stretch(liveActivity()));
    },
  },
  list('users', '/admin/users', 'judge.ban_user', 'GET /admin/users', (index) =>
    staffUser({ id: `u-${index}` }),
  ),
  list(
    'organizations',
    '/admin/organizations',
    'judge.edit_all_organization',
    'GET /organizations',
    (index) => organizationItem({ id: `o-${index}` }),
  ),
  list('posts', '/admin/posts', 'judge.edit_all_post', 'GET /admin/posts', (index) =>
    postItem({ id: `p-${index}` }),
  ),
  list('judges', '/admin/judges', 'judge.change_judge', 'GET /judges', (index) =>
    judge({ id: `j-${index}`, name: `judge-${index}` }),
  ),
  list('languages', '/admin/languages', 'judge.change_language', 'GET /admin/languages', (index) =>
    languageAdmin({ id: `l-${index}`, key: `LANG${index}` }),
  ),
  list(
    'short links',
    '/admin/short-links',
    'judge.manage_short_link',
    'GET /short-links',
    (index) => shortLink({ code: `code${index}` }),
  ),
  list(
    'integrations',
    '/admin/integrations',
    'judge.manage_integration',
    'GET /integration-clients',
    (index) => integrationClient({ id: `n-${index}` }),
  ),
  list(
    'canned replies',
    '/admin/tickets/canned',
    'judge.change_ticket',
    'GET /ticket-canned-replies',
    (index) => cannedReply({ id: `c-${index}` }),
  ),
  list('tickets', '/admin/tickets', 'judge.change_ticket', 'GET /tickets', (index) =>
    ticketItem({ id: `t-${index}` }),
  ),
  list('problems', '/admin/problems', 'judge.add_problem', 'GET /problems', (index) =>
    adminProblemItem({ code: `p${index}` }),
  ),
  list('contests', '/admin/contests', 'judge.add_contest', 'GET /contests', (index) =>
    adminContestItem({ key: `c${index}` }),
  ),
  list('pages', '/admin/pages', 'flatpages.change_flatpage', 'GET /admin/site/pages', (index) =>
    flatpageItem({ id: `f${index}` }),
  ),
  list(
    'similarity runs',
    '/admin/similarity?contest=hcmus-w41',
    'judge.moss_contest',
    'GET /similarity/runs',
    (index) => similarityRun({ id: `r${index}` }),
    /nguyen_van|ngắn nhất|very-long|Chưa|Kiểm tra/,
  ),
  list(
    'contest tags',
    '/admin/contest-tags',
    'judge.change_contest_tag',
    'GET /contest-tags',
    (index) => contestTag({ slug: `tag${index}`, name: `Tag ${index}` }),
  ),
  list(
    'deleted problems',
    '/admin/problems/deleted',
    'judge.delete_problem',
    'GET /problems/deleted',
    (index) => ({
      code: `del${index}`,
      name: 'Bài đã xoá',
      daysLeft: 20,
      deletedAt: '2026-10-01T00:00:00Z',
      deletedBy: { id: 'u', rating: null, username: 'minhthu' },
      isPurged: false,
    }),
  ),
  list(
    'org quotas',
    '/admin/organizations/quotas',
    'judge.edit_all_organization',
    'GET /organizations/usage',
    (index) => ({
      creditsLimit: 100,
      creditsUsed: 40,
      month: '2026-10',
      name: 'Trường THPT',
      slug: `org${index}`,
      storageLimit: 1000,
      storageUsed: 100,
      unlimited: false,
    }),
  ),
  list(
    'comment reports',
    '/admin/comments/reports',
    'judge.change_comment',
    'GET /comments/reports',
    (index) => ({
      comment: {
        author: { id: 'u', rating: null, username: 'linhnt' },
        deleted: false,
        excerpt: 'Nội dung bình luận bị báo cáo',
        hidden: false,
        id: `cm${index}`,
      },
      lastReportedAt: '2026-10-08T10:00:00Z',
      lastSettledAt: null,
      page: { key: 'hcmus41a', title: 'Dãy số đẹp', type: 'problem' },
      reporterCount: 1,
      reports: [
        {
          createdAt: '2026-10-08T10:00:00Z',
          note: 'spam',
          reason: 'spam',
          reporter: { id: 'r', rating: null, username: 'reporter' },
          settledAt: null,
          settledBy: null,
          status: 'open',
        },
      ],
    }),
  ),
  list(
    'comment locks',
    '/admin/comments/locks',
    'judge.change_comment',
    'GET /comments/locks',
    (index) => ({ key: `hcmus${index}`, title: 'Dãy số đẹp', type: 'problem', url: '/problems/x' }),
  ),
  list(
    'all comments',
    '/admin/comments',
    'judge.change_comment',
    'GET /admin/comments',
    (index) => ({
      comment: {
        author: { id: 'u', rating: null, username: 'linhnt' },
        deleted: false,
        excerpt: 'Nội dung bình luận',
        hidden: false,
        id: `cm${index}`,
      },
      hiddenBy: null,
      page: { key: 'hcmus41a', title: 'Dãy số đẹp', type: 'problem' },
      pageNumber: 1,
      createdAt: '2026-10-08T10:00:00Z',
    }),
  ),
  list(
    'submissions',
    '/admin/submissions',
    'judge.rejudge_submission',
    'GET /submissions',
    (index) => submissionItem({ id: `sub-${index}` }),
  ),
];

const WIDTHS = [390, 1280, 1440];

/** Every element that scrolls sideways (a scroller whose content is wider than its box) plus the page itself. */
async function sidewaysScrollers(page: Page) {
  return page.evaluate(() => {
    const found: string[] = [];
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? el.className.toString().slice(0, 60)}] ${el.scrollWidth}>${el.clientWidth}`;
    for (const el of [document.documentElement, ...document.querySelectorAll('#main *')]) {
      const overflowX = getComputedStyle(el).overflowX;
      const scrolls =
        el === document.documentElement ||
        ((overflowX === 'auto' || overflowX === 'scroll') && !el.closest('nav'));
      if (scrolls && el.scrollWidth > el.clientWidth + 1) found.push(describe(el));
    }
    if (found.length > 0)
      for (const el of [...document.querySelectorAll('#main td, #main th')].slice(0, 400))
        if (el.getBoundingClientRect().right > innerWidth + 1 && found.length < 4)
          found.push(
            `past the edge: ${el.tagName.toLowerCase()} ${el.textContent?.trim().slice(0, 40)}`,
          );
    return found;
  });
}

for (const screen of SCREENS)
  for (const width of WIDTHS)
    test(`${screen.name} does not scroll sideways at ${width}px`, async ({ page, api }) => {
      await page.setViewportSize({ width, height: 900 });
      signInAsStaff(api, screen.permissions);
      screen.mock(api);
      await page.goto(screen.path);
      await expect(page.locator('#main')).toContainText(screen.seen);
      const shots = process.env.SHOTS_DIR;
      if (shots)
        await page.screenshot({ path: `${shots}/${screen.name}-${width}.png`, fullPage: true });
      expect(await sidewaysScrollers(page)).toEqual([]);
    });
