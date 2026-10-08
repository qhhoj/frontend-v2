import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { similarityRun } from '../src/test/admin-fixtures/similarity';

const PERMISSIONS = ['judge.moss_contest'];

for (const viewport of AUDIT_VIEWPORTS)
  test(`similarity runs with a summary are accessible and fit at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, PERMISSIONS);
    api.routes['GET /similarity/runs'] = adminList([similarityRun()]);
    api.routes['GET /similarity/runs/run-9f02'] = adminOk(similarityRun());
    await page.goto('/admin/similarity?contest=hcmus-w41&run=run-9f02');
    await expect(page.getByRole('heading', { name: 'Kiểm tra tương đồng' })).toBeVisible();
    await expect(page.getByTestId('run-summary')).toContainText('Có nhóm bị cắt bớt.');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('starting a run shows it queued and the list follows', async ({ page, api }) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /similarity/runs'] = adminList([]);
  api.routes['POST /similarity/runs'] = { status: 202, body: { data: { runId: 'new' } } };
  await page.goto('/admin/similarity?contest=hcmus-w41');
  await page.getByRole('button', { name: 'Chạy kiểm tra tương đồng' }).click();
  await expect(page.locator('#main [role="status"]')).toContainText(
    'Lượt chạy mới đã vào hàng đợi.',
  );
  expect(api.requests.some((request) => request.key === 'POST /similarity/runs')).toBe(true);
});
