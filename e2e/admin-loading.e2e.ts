import { editableContest } from '../src/test/admin-fixtures/contests';
import { adminProblemItem } from '../src/test/admin-fixtures/index-search';
import { editableProblem, problemEditingMeta } from '../src/test/admin-fixtures/problems';
import { similarityRun } from '../src/test/admin-fixtures/similarity';
import { staffUsers } from '../src/test/admin-fixtures/users';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import type { ShiftCase } from './fixtures/layout-shift';

const ADMIN_SHIFT_CASES: ShiftCase[] = [
  {
    name: 'admin problem editor header',
    path: '/admin/problems/hcmus41c/general',
    signedIn: true,
    hold: 'GET /problems/hcmus41c',
    answer: (api) => {
      signInAsStaff(api, ['judge.edit_own_problem']);
      api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
      api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
    },
    parts: (page) => ({
      header: page
        .locator('[data-skeleton-region="problem-editor-header"]')
        .or(page.locator('#main header').first()),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'admin contest editor header',
    path: '/admin/contests/hcmus-w41/general',
    signedIn: true,
    hold: 'GET /contests/hcmus-w41',
    answer: (api) => {
      signInAsStaff(api, ['judge.edit_own_contest']);
      api.routes['GET /contests/hcmus-w41'] = adminOk(editableContest());
    },
    parts: (page) => ({
      header: page
        .locator('[data-skeleton-region="contest-editor-header"]')
        .or(page.locator('#main header').first()),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'similarity runs table',
    path: '/admin/similarity?contest=hcmus-w41',
    signedIn: true,
    hold: 'GET /similarity/runs',
    answer: (api) => {
      signInAsStaff(api, ['judge.moss_contest']);
      api.routes['GET /similarity/runs'] = adminOk([similarityRun()]);
    },
    parts: (page) => ({
      table: page.locator('[data-skeleton-region="similarity-runs"], [data-testid="runs"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'admin problems index search results',
    path: '/admin/problems?q=hcmus',
    signedIn: true,
    hold: 'GET /problems',
    answer: (api) => {
      signInAsStaff(api, ['judge.edit_own_problem']);
      api.routes['GET /problems'] = adminList(
        Array.from({ length: 3 }, (_unused, index) =>
          adminProblemItem({ code: `hcmus4${index}c` }),
        ),
      );
    },
    parts: (page) => ({
      list: page
        .locator('[data-skeleton-region="problem-search-table"]')
        .or(page.locator('#main table')),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'admin users list',
    path: '/admin/users',
    signedIn: true,
    hold: 'GET /admin/users',
    answer: (api) => {
      signInAsStaff(api, ['judge.ban_user']);
      api.routes['GET /admin/users'] = adminList(staffUsers(5));
    },
    parts: (page) => ({
      table: page.locator('[data-skeleton-region="users-list"], [data-testid="user-row"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
];

defineShiftTests(ADMIN_SHIFT_CASES);
