import { expect, test } from './fixtures/api';
import { installOrgUsage } from './fixtures/f4-api';
import { organizationDetail } from '../src/test/community-fixtures';
import { MIB, organizationUsage, quotaMeter } from '../src/test/f4-fixtures';

const TAB = '/organizations/lhp/quota';

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
        viewer: {
          isMember: true,
          canAdminister: false,
          canCreateProblem: false,
          canCreateContest: false,
          pendingRequestId: null,
        },
      }),
    },
  };
  await page.goto(TAB);
  await expect(page.locator('[data-testid="state-panel"][data-state="forbidden"]')).toBeVisible();
});
