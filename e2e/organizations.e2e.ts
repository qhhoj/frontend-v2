import { organizationDetail, organizationItem } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { applyTheme, expectNoAxeViolations } from './fixtures/audit';
import { expect, list, test } from './fixtures/api';
import { PHONE, PHONE_AND_DESKTOP, DESKTOP, defineShiftTests } from './fixtures/layout-shift';

const VIEWPORTS = [
  { name: 'desktop', width: DESKTOP, height: 800 },
  { name: 'phone 375 px', width: PHONE, height: 812 },
] as const;
const LIST_NAME = 'THPT chuyên Lê Hồng Phong';
const ABOUT_TEXT = 'Câu lạc bộ Tin học.';
/** Six cards: the skeleton's six, so the loaded grid is as tall as the skeleton. */
const SIX_ORGANIZATIONS = Array.from({ length: 6 }, (_unused, index) =>
  organizationItem({ id: `org-${index}`, slug: `org-${index}`, name: `Tổ chức ${index}` }),
);

const PAGES = [
  { name: 'the list', path: '/organizations', ready: LIST_NAME },
  { name: 'an organization', path: '/organizations/lhp', ready: ABOUT_TEXT },
] as const;

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const { name, path, ready } of PAGES)
      test(`${name} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await applyTheme(page, api, theme);
        await page.goto(path);
        await expect(
          page.getByText(ready, { exact: true }).filter({ visible: true }).first(),
        ).toBeVisible();
        await expectNoAxeViolations(page);
      });

for (const viewport of VIEWPORTS)
  test(`the organization list does not scroll the page sideways at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    void api; // installs the fake API
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/organizations');
    await expect(page.getByText(LIST_NAME, { exact: true }).first()).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

test('an unknown organization shows the crying Bit and a way back to the list', async ({
  page,
  api,
}) => {
  api.routes['GET /organizations/khong-co'] = {
    status: 404,
    body: { error: { code: 'not_found', message: 'Not found' } },
  };
  await page.goto('/organizations/khong-co');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Không tìm thấy tổ chức' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Xem các tổ chức' }).click();
  await expect(page).toHaveURL(/\/organizations$/);
});

defineShiftTests([
  {
    name: 'organization list grid',
    path: '/organizations',
    signedIn: false,
    hold: 'GET /organizations',
    answer: (api) => {
      api.routes['GET /organizations'] = list(SIX_ORGANIZATIONS);
    },
    parts: (page) => ({
      'organization cards': page.locator(
        '[data-skeleton-region="organization-card"], [data-testid="organization-card"]',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'organization header card',
    path: '/organizations/lhp',
    signedIn: false,
    hold: 'GET /organizations/lhp',
    answer: (api) => {
      // A one-line name: the header skeleton's title is one line, so the loaded title must be too.
      api.routes['GET /organizations/lhp'] = {
        body: { data: organizationDetail({ name: 'Tin học LHP' }) },
      };
    },
    parts: (page) => ({
      'organization header': page.locator(
        '[data-skeleton-region="organization-header"], [data-testid="organization-header"]',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
]);
