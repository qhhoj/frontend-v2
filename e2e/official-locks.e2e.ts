import type { Page } from '@playwright/test';
import { organizationDetail } from '../src/test/community-fixtures';
import { profile, profileOrganization } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { ok } from './fixtures/reply';

const LHP = organizationDetail({
  viewer: { isMember: false, canAdminister: false, pendingRequestId: null },
});
const SCREENS = [
  { name: 'organization', path: `/organizations/${LHP.slug}` },
  { name: 'profile settings', path: '/settings' },
] as const;
const TWO_ORGANIZATIONS = [
  profileOrganization(),
  profileOrganization({
    id: '0192a000-0000-7000-8000-0000000001a2',
    slug: 'clb',
    name: 'CLB Tin học',
    shortName: 'CLB',
  }),
];
const lockedSite = (api: FakeApi) => {
  api.signedIn = true;
  api.routes['GET /site'] = ok({ navigation: [], config: {}, officialMode: true });
  api.routes[`GET /organizations/${LHP.slug}`] = ok(LHP);
};
/** The account in settings belongs to two organizations, so the order buttons show; call after `applyTheme` (it keeps the theme). */
const withTwoOrganizations = (api: FakeApi, siteTheme = profile().siteTheme) => {
  api.routes['GET /profile'] = ok(profile({ siteTheme, organizations: TWO_ORGANIZATIONS }));
};
const lockNote = (page: Page) => page.getByTestId('official-lock-note').first();

test('joining is locked with the padlock Bit and the reason, and nothing is sent', async ({
  page,
  api,
}) => {
  lockedSite(api);
  await page.goto(`/organizations/${LHP.slug}`);
  const join = page.getByTestId('membership-panel').getByRole('button').first();
  await expect(join).toHaveAttribute('aria-disabled', 'true');
  await expect(lockNote(page)).toContainText('Bị khóa trong kỳ thi chính thức.');
  await expect(lockNote(page).locator('[data-testid="inline-bit"]')).toBeVisible();
  await join.click({ force: true });
  expect(api.requestsTo(`POST /organizations/${LHP.slug}/join`)).toHaveLength(0);
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    for (const screen of SCREENS)
      test(`the locked ${screen.name} screen has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        lockedSite(api);
        await applyTheme(page, api, theme);
        if (screen.name === 'profile settings') withTwoOrganizations(api, theme.id);
        await page.goto(screen.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        await expect(lockNote(page)).toBeVisible();
        expect(await axeViolationsIn(page)).toEqual([]);
      });

for (const screen of SCREENS)
  test(`the locked ${screen.name} screen does not scroll sideways at 375 px`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    lockedSite(api);
    if (screen.name === 'profile settings') withTwoOrganizations(api);
    await page.goto(screen.path);
    await expect(lockNote(page)).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
