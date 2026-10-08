import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { profile } from '../src/test/fixtures';
import { ticketDetail, ticketItem } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';
import type { Reply } from './fixtures/reply';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import type { ShiftCase } from './fixtures/layout-shift';

const PROBLEM_TICKETS = '/problems/hcmus41b/tickets';
const SAVED_TICKET_PATH = `/tickets/${ticketDetail().id}`;
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone 375 px', width: 375, height: 812 },
] as const;
const SERVER_ERROR: Reply = {
  status: 503,
  body: { error: { code: 'network_error', message: 'network_error' } },
};

/** A signed-in account's theme outranks the browser's choice, so the audit pins the account and the browser alike. */
const pinTheme = async (page: Page, api: FakeApi, theme: (typeof THEMES)[number]) => {
  api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
  await page.emulateMedia({ colorScheme: theme.scheme });
  await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
};

const eightTickets = () =>
  Array.from({ length: 8 }, (_row, index) =>
    ticketItem({
      id: ticketItem().id.replace(/801$/, String(900 + index)),
      title: `Phiếu ${index + 1}`,
    }),
  );

const AUDITED_STATES = [
  {
    name: 'own tickets',
    path: '/tickets',
    ready: 'Test 17 của bài Trò chơi trên cây có vẻ sai',
    setUp: (api: FakeApi) => {
      api.routes['GET /tickets'] = list([ticketItem()]);
    },
  },
  {
    name: 'empty list',
    path: '/tickets',
    ready: 'Bạn chưa tạo phiếu nào',
    setUp: (api: FakeApi) => {
      api.routes['GET /tickets'] = list([]);
    },
  },
  {
    name: 'failed load',
    path: '/tickets',
    ready: 'Không tải được phiếu',
    setUp: (api: FakeApi) => {
      api.routes['GET /tickets'] = SERVER_ERROR;
    },
  },
] as const;

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const state of AUDITED_STATES)
      test(`the ${state.name} tickets page has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        api.signedIn = true;
        state.setUp(api);
        await pinTheme(page, api, theme);
        await page.goto(state.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        await expect(
          page.getByText(state.ready, { exact: true }).filter({ visible: true }).first(),
        ).toBeVisible();
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          violations.map(
            (violation) =>
              `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
          ),
        ).toEqual([]);
      });

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    test(`the new-ticket form with its field errors has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      api.signedIn = true;
      await pinTheme(page, api, theme);
      await page.goto('/tickets/new');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await page.getByRole('button', { name: 'Gửi phiếu' }).click();
      await expect(page.getByText('Nhập tiêu đề.', { exact: true })).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([]);
    });

test('a ticket filed from the problem link lands on the new ticket', async ({ page, api }) => {
  api.signedIn = true;
  api.routes[`POST ${PROBLEM_TICKETS}`] = ok(ticketDetail());
  await page.goto('/tickets/new?problem=hcmus41b');
  await expect(page.getByText('Bài: Đường đi ngắn nhất')).toBeVisible();
  await page.getByLabel('Tiêu đề (tối đa 100 ký tự)').fill(' Test 17 sai ');
  await page.getByLabel('Nội dung (tối đa 8192 ký tự)').fill('Đáp án mẫu in ra 1.');
  await page.getByRole('button', { name: 'Gửi phiếu' }).click();
  await expect(page).toHaveURL(new RegExp(`${SAVED_TICKET_PATH}$`));
  expect(api.requestsTo(`POST ${PROBLEM_TICKETS}`)).toHaveLength(1);
});

for (const path of ['/tickets', '/tickets/new'])
  test(`${path} does not scroll sideways at 375 px`, async ({ page, api }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    api.signedIn = true;
    api.routes['GET /tickets'] = list(eightTickets());
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

const SHIFT_CASES: ShiftCase[] = [
  {
    name: 'ticket table',
    path: '/tickets',
    signedIn: true,
    hold: 'GET /tickets',
    answer: (api) => (api.routes['GET /tickets'] = list(eightTickets())),
    parts: (page) => ({ table: page.locator('table') }),
    viewports: PHONE_AND_DESKTOP,
  },
];

defineShiftTests(SHIFT_CASES);
