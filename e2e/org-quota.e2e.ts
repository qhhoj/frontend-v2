import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { installOrgUsage } from './fixtures/f4-api';
import { DESKTOP, PHONE, defineShiftTests } from './fixtures/layout-shift';
import { organizationDetail } from '../src/test/community-fixtures';
import { MIB, organizationUsage, quotaMeter } from '../src/test/f4-fixtures';
import { THEMES } from '../src/theme/registry';

const TAB = '/organizations/lhp/quota';

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the quota tab is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      installOrgUsage(api);
      await applyTheme(page, api, theme);
      await page.goto(TAB);
      await expect(page.getByText('164 / 200 tín dụng')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

test('the 80 % warning shows the sweating Bit, the blocking notice the security Bit', async ({
  page,
  api,
}) => {
  installOrgUsage(api);
  await page.goto(TAB);
  const notice = page.getByTestId('quota-notice');
  await expect(notice).toContainText('82%');
  await expect(notice.getByTestId('inline-bit')).toBeVisible();
  installOrgUsage(
    api,
    organizationUsage({
      enforcing: true,
      credits: quotaMeter(201, 200),
      storage: quotaMeter(0, MIB),
    }),
  );
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'Chế độ chặn đang bật' })).toBeVisible();
});

test('a member who is not an admin sees the forbidden state', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /organizations/lhp'] = {
    body: {
      data: organizationDetail({
        viewer: { isMember: true, canAdminister: false, pendingRequestId: null },
      }),
    },
  };
  await page.goto(TAB);
  await expect(page.locator('[data-testid="state-panel"][data-state="forbidden"]')).toBeVisible();
});

defineShiftTests([
  {
    name: 'organization quota dashboard',
    path: TAB,
    signedIn: true,
    hold: 'GET /organizations/lhp/usage',
    answer: (api) => installOrgUsage(api),
    parts: (page) => ({ dashboard: page.getByTestId('org-quota') }),
    viewports: [PHONE, DESKTOP],
  },
]);
