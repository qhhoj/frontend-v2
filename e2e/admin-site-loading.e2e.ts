import { activityLog, liveActivity } from '../src/test/admin-fixtures/activity';
import { JUDGE_FLEET } from '../src/test/admin-fixtures/judges';
import { ALL_SETTINGS } from '../src/test/admin-fixtures/settings';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import type { ShiftCase } from './fixtures/layout-shift';

const SITE_SHIFT_CASES: ShiftCase[] = [
  {
    name: 'judges list',
    path: '/admin/judges',
    signedIn: true,
    hold: 'GET /judges',
    answer: (api) => {
      signInAsStaff(api, ['judge.change_judge']);
      api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
    },
    parts: (page) => ({
      stats: page
        .locator('[data-skeleton-region="judge-stats"]')
        .or(page.getByTestId('judge-stats')),
      rows: page.locator('[data-skeleton-region="judge-row"]').or(page.getByTestId('judge-row')),
    }),
    placed: ['rows'],
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'site settings first block',
    path: '/admin/settings',
    signedIn: true,
    hold: 'GET /admin/settings',
    answer: (api) => {
      signInAsStaff(api, ['judge.change_settings']);
      api.routes['GET /admin/settings'] = adminOk(ALL_SETTINGS);
    },
    parts: (page) => ({
      block: page
        .locator('[data-skeleton-region="settings-block"]')
        .or(page.locator('[data-block]').first()),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'activity table',
    path: '/admin/activity',
    signedIn: true,
    hold: 'GET /admin/user-activity/logs',
    answer: (api) => {
      signInAsStaff(api, ['judge.can_see_user_activity']);
      api.routes['GET /admin/user-activity/logs'] = adminList(
        Array.from({ length: 3 }, (_unused, index) => activityLog({ id: `l-${index}` })),
        { hasMore: true },
      );
      api.routes['GET /admin/user-activity/live'] = adminOk(liveActivity());
    },
    parts: (page) => ({
      table: page
        .locator('[data-skeleton-region="activity-table"]')
        .or(page.getByTestId('activity-table').locator('[role="region"]')),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
];

defineShiftTests(SITE_SHIFT_CASES);
