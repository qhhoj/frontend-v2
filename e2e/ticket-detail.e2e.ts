import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { profile, sessionResponse, sessionUser } from '../src/test/fixtures';
import { ticketDetail, ticketMessage } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, streamFrame, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import type { ShiftCase } from './fixtures/layout-shift';

const TICKET_ID = ticketDetail().id;
const TICKET_PATH = `/tickets/${TICKET_ID}`;
const TICKET_KEY = `GET /tickets/${TICKET_ID}`;
const STREAM_KEY = `GET /events/tickets/${TICKET_ID}`;
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone 375 px', width: 375, height: 812 },
] as const;
const STAFF_DETAIL = ticketDetail({
  creator: { id: 'x', username: 'minhthu', rating: null },
  notes: 'Test 17 sinh sai.',
  can: { editNotes: true, markGood: true, assign: true },
});

/** A signed-in account's theme outranks the browser's choice, so the audit pins the account and the browser alike. */
const pinTheme = async (page: Page, api: FakeApi, theme: (typeof THEMES)[number]) => {
  api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
  await page.emulateMedia({ colorScheme: theme.scheme });
  await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
};

const violationsOf = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
};

const VIEWS = [
  {
    name: 'creator',
    setUp: (api: FakeApi) => {
      api.routes[TICKET_KEY] = ok(ticketDetail({ messages: [ticketMessage()] }));
    },
    ready: 'Phiếu của bạn',
  },
  {
    name: 'staff',
    setUp: (api: FakeApi) => {
      api.signedIn = true;
      api.routes['GET /auth/me'] = ok(sessionResponse({ user: sessionUser({ isStaff: true }) }));
      api.routes[TICKET_KEY] = ok(STAFF_DETAIL);
    },
    ready: 'Góc nhìn quản trị viên',
  },
] as const;

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const view of VIEWS)
      test(`the ${view.name} ticket view has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        api.signedIn = true;
        view.setUp(api);
        await pinTheme(page, api, theme);
        await page.goto(TICKET_PATH);
        await expect(page.getByText(view.ready, { exact: false }).first()).toBeVisible();
        expect(await violationsOf(page)).toEqual([]);
      });

for (const viewport of VIEWPORTS)
  test(`the ticket page does not scroll sideways at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    api.signedIn = true;
    api.routes[TICKET_KEY] = ok(ticketDetail());
    await page.goto(TICKET_PATH);
    await expect(page.locator('h1')).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

test('two new messages on the open ticket refetch it once and announce one count', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  api.routes[TICKET_KEY] = ok(ticketDetail());
  api.routes[STREAM_KEY] = {
    contentType: 'text/event-stream',
    raw: `retry: 600000\n\n${streamFrame('ticket-message', { type: 'ticket-message', ticketId: TICKET_ID, messageId: 'm2', open: null })}${streamFrame('ticket-message', { type: 'ticket-message', ticketId: TICKET_ID, messageId: 'm3', open: null })}`,
  };
  await page.goto(TICKET_PATH);
  await expect(page.getByTestId('ticket-live')).toHaveText('2 tin nhắn mới');
  expect(api.requestsTo(TICKET_KEY)).toHaveLength(2);
});

/** Short text on every line: the skeleton's lines are one line each, so the loaded page must be too. */
const SHIFT_DETAIL = ticketDetail({
  title: 'Test 17 sai',
  link: { type: 'problem', id: 'p', key: 'hcmus41b', title: 'Đề A', url: '/problems/hcmus41b' },
  messages: [0, 1, 2].map((index) =>
    ticketMessage({ id: `m${index}`, bodyHtml: '<p>Đáp án in ra 1.</p>' }),
  ),
});

const SHIFT_CASES: ShiftCase[] = [
  {
    name: 'ticket header',
    path: TICKET_PATH,
    signedIn: true,
    hold: TICKET_KEY,
    answer: (api) => (api.routes[TICKET_KEY] = ok(SHIFT_DETAIL)),
    parts: (page) => ({
      'ticket header': page.locator(
        '[data-skeleton-region="ticket-header"], [data-testid="ticket-header"]',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'ticket messages',
    path: TICKET_PATH,
    signedIn: true,
    hold: TICKET_KEY,
    answer: (api) => (api.routes[TICKET_KEY] = ok(SHIFT_DETAIL)),
    parts: (page) => ({
      'ticket messages': page.locator(
        '[data-skeleton-region="message"], section[aria-label="Tin nhắn"] article',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
];

defineShiftTests(SHIFT_CASES);
